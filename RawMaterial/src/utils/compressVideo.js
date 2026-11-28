// Client-side video compression using <video> + <canvas> + MediaRecorder.
// No external dependency. The video is re-encoded in real time, so a
// 60-second clip takes about 60 seconds to compress.

export const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5 MB

const AUDIO_BPS = 64_000;
const LOW_AUDIO_BPS = 32_000; // used when the size budget is tight
const MIN_VIDEO_BPS = 100_000;
const SAFETY = 0.8; // aim below the limit; MediaRecorder bitrate is approximate

// Each retry gets smaller and smoother to encode, so the result reliably lands under the limit
const HEIGHT_STEPS = [720, 480, 360, 240];
const FPS_STEPS = [30, 24, 20, 15];

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export const pickMimeType = () =>
  typeof MediaRecorder !== "undefined"
    ? MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) || ""
    : "";

export const canCompressVideo = () =>
  typeof MediaRecorder !== "undefined" &&
  typeof HTMLCanvasElement !== "undefined" &&
  typeof HTMLCanvasElement.prototype.captureStream === "function";

const loadVideo = (url) =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.playsInline = true;
    video.src = url;
    // Keep it in the DOM (off-screen) so every browser keeps decoding frames
    Object.assign(video.style, {
      position: "fixed",
      left: "-9999px",
      top: "0",
      width: "1px",
      height: "1px",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(video);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("This video format cannot be read by the browser"));
  });

const encodeOnce = async (file, { videoBps, audioBps, maxHeight, fps }, onProgress) => {
  const url = URL.createObjectURL(file);
  let video;
  let audioCtx;
  try {
    video = await loadVideo(url);
    const { duration, videoWidth, videoHeight } = video;
    if (!isFinite(duration) || duration <= 0) {
      throw new Error("Could not read the video duration");
    }

    // Scale down, keeping aspect ratio; dimensions must be even for encoders
    const scale = Math.min(1, maxHeight / Math.min(videoWidth, videoHeight));
    const width = Math.round((videoWidth * scale) / 2) * 2;
    const height = Math.round((videoHeight * scale) / 2) * 2;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const stream = canvas.captureStream(fps);

    // Route audio through Web Audio so it works in Safari too (no video.captureStream there)
    let hasAudio = false;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      await audioCtx.resume();
      const source = audioCtx.createMediaElementSource(video);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest); // not connected to speakers -> silent playback
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      hasAudio = dest.stream.getAudioTracks().length > 0;
    } catch {
      hasAudio = false;
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: Math.round(videoBps),
      ...(hasAudio ? { audioBitsPerSecond: audioBps } : {}),
    });

    const chunks = [];
    recorder.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
    const stopped = new Promise((resolve) => (recorder.onstop = resolve));

    let done = false;
    const draw = () => {
      if (done) return;
      ctx.drawImage(video, 0, 0, width, height);
      onProgress?.(Math.min(99, Math.round((video.currentTime / duration) * 100)));
      if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(draw);
      else requestAnimationFrame(draw);
    };

    const ended = new Promise((resolve) => (video.onended = resolve));

    video.currentTime = 0;
    try {
      await video.play();
    } catch {
      // Autoplay with sound blocked -> continue muted (no audio in output)
      video.muted = true;
      await video.play();
    }
    recorder.start(1000);
    draw();

    await ended;
    done = true;
    recorder.stop();
    await stopped;

    const type = (recorder.mimeType || mimeType || "video/webm").split(";")[0];
    const ext = type.includes("mp4") ? "mp4" : "webm";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "video";
    return new File(chunks, `${baseName}_compressed.${ext}`, { type });
  } finally {
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
    }
    if (audioCtx) audioCtx.close().catch(() => {});
    URL.revokeObjectURL(url);
  }
};

/**
 * Returns the original file if it is already <= maxBytes, otherwise a
 * re-encoded File that fits under maxBytes. Throws a user-readable Error
 * if the video is too long to fit or the browser cannot compress it.
 */
export const compressVideo = async (file, { maxBytes = MAX_VIDEO_BYTES, onProgress } = {}) => {
  if (file.size <= maxBytes) return file;
  if (!canCompressVideo()) {
    throw new Error("This browser cannot compress videos. Please upload a video under 5 MB.");
  }

  // Read duration first to compute the bitrate budget
  const url = URL.createObjectURL(file);
  let duration;
  try {
    const v = await loadVideo(url);
    duration = v.duration;
    v.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
  if (!isFinite(duration) || duration <= 0) {
    throw new Error("Could not read the video duration");
  }

  // Bitrate budget from the duration: total bits allowed / seconds
  const budgetBps = (maxBytes * 8 * SAFETY) / duration;
  const audioBps = budgetBps > 600_000 ? AUDIO_BPS : LOW_AUDIO_BPS;
  let videoBps = budgetBps - audioBps;
  if (videoBps < MIN_VIDEO_BPS) {
    const maxSeconds = Math.floor((maxBytes * 8 * SAFETY) / (MIN_VIDEO_BPS + LOW_AUDIO_BPS));
    throw new Error(`Video is too long to fit in 5 MB. Please record a clip shorter than ${maxSeconds} seconds.`);
  }

  // Start resolution from the budget: a small budget starts lower
  let step = videoBps > 1_500_000 ? 0 : videoBps > 600_000 ? 1 : videoBps > 300_000 ? 2 : 3;

  for (let attempt = 0; attempt < HEIGHT_STEPS.length; attempt++) {
    const settings = {
      videoBps,
      audioBps,
      maxHeight: HEIGHT_STEPS[step],
      fps: FPS_STEPS[Math.min(attempt, FPS_STEPS.length - 1)],
    };
    const out = await encodeOnce(file, settings, onProgress);
    if (out.size <= maxBytes) {
      onProgress?.(100);
      return out;
    }
    // Encoder overshot: shrink the bitrate in proportion, and drop resolution and frame rate
    videoBps = Math.max(MIN_VIDEO_BPS, videoBps * (maxBytes / out.size) * 0.8);
    step = Math.min(step + 1, HEIGHT_STEPS.length - 1);
  }
  throw new Error("Could not compress the video below 5 MB. Please record a shorter clip.");
};
