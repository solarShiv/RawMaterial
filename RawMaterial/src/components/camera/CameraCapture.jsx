import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Circle, RefreshCw, Square, SwitchCamera, X, Check, RotateCcw } from "lucide-react";
import { pickMimeType } from "../../utils/compressVideo";

// In-page camera: the photo or video comes only from the live camera, never from the gallery.
// mode: "photo" | "video". onCapture(file) receives a File; onClose() closes without one.

const VIDEO_BPS = 600_000; // low bitrate so a recording stays small
const AUDIO_BPS = 64_000;
const PHOTO_MAX_SIDE = 1600; // px; keeps photos small without losing detail
const PHOTO_QUALITY = 0.85;

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const fmtSize = (b) => (b >= 1024 * 1024 ? `${(b / (1024 * 1024)).toFixed(2)} MB` : `${(b / 1024).toFixed(0)} KB`);

const cameraErrorText = (err) => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return "Camera is not available. Open this page over HTTPS in Chrome or Safari.";
  }
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was denied. Allow camera access for this site in your browser settings, then try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is being used by another app. Close it and try again.";
    default:
      return err?.message || "Could not start the camera.";
  }
};

const CameraCapture = ({ open, mode = "photo", onCapture, onClose, maxBytes = 5 * 1024 * 1024, maxSeconds = 60 }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const bytesRef = useRef(0);
  const timerRef = useRef(null);

  const [facing, setFacing] = useState("environment");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recordedBytes, setRecordedBytes] = useState(0);
  const [result, setResult] = useState(null); // { file, url }

  const isVideo = mode === "video";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startCamera = useCallback(async () => {
    stopStream();
    setError("");
    setStarting(true);
    const video = { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } };
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: isVideo });
      } catch (err) {
        if (!isVideo) throw err;
        // Microphone refused or missing: still record video without sound
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        } catch {
          throw err;
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setError(cameraErrorText(err));
    } finally {
      setStarting(false);
    }
  }, [facing, isVideo, stopStream]);

  // Open / close / switch camera
  useEffect(() => {
    if (!open || result) return undefined;
    startCamera();
    return () => stopStream();
  }, [open, facing, result, startCamera, stopStream]);

  // Full reset when the dialog closes
  useEffect(() => {
    if (open) return;
    clearTimer();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopStream();
    setRecording(false);
    setSeconds(0);
    setRecordedBytes(0);
    setError("");
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, [open, stopStream]);

  useEffect(() => () => {
    clearTimer();
    stopStream();
  }, [stopStream]);

  const showResult = (file) => {
    stopStream();
    setResult({ file, url: URL.createObjectURL(file) });
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not take the photo. Please try again.");
          return;
        }
        showResult(new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      PHOTO_QUALITY
    );
  };

  const stopRecording = () => {
    clearTimer();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    if (typeof MediaRecorder === "undefined") {
      setError("This browser cannot record video. Please use Chrome or Safari.");
      return;
    }
    const mimeType = pickMimeType();
    const hasAudio = stream.getAudioTracks().length > 0;
    let recorder;
    try {
      recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: VIDEO_BPS,
        ...(hasAudio ? { audioBitsPerSecond: AUDIO_BPS } : {}),
      });
    } catch (err) {
      setError(err?.message || "Could not start recording.");
      return;
    }

    chunksRef.current = [];
    bytesRef.current = 0;
    setRecordedBytes(0);
    setSeconds(0);

    recorder.ondataavailable = (e) => {
      if (!e.data?.size) return;
      chunksRef.current.push(e.data);
      bytesRef.current += e.data.size;
      setRecordedBytes(bytesRef.current);
      // Stop before the size limit (leave room for the last chunk)
      if (bytesRef.current >= maxBytes * 0.9) stopRecording();
    };
    recorder.onstop = () => {
      setRecording(false);
      const type = (recorder.mimeType || mimeType || "video/webm").split(";")[0];
      const ext = type.includes("mp4") ? "mp4" : "webm";
      if (bytesRef.current === 0) {
        setError("Nothing was recorded. Please try again.");
        return;
      }
      showResult(new File(chunksRef.current, `video_${Date.now()}.${ext}`, { type }));
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    setRecording(true);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  // Stop automatically at the time limit
  useEffect(() => {
    if (recording && seconds >= maxSeconds) stopRecording();
  }, [recording, seconds, maxSeconds]);

  const retake = () => {
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    }); // the effect restarts the camera
    setSeconds(0);
    setRecordedBytes(0);
  };

  const useResult = () => {
    if (!result) return;
    const { file } = result;
    onCapture(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label={isVideo ? "Record video" : "Take photo"}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">{isVideo ? "Record video" : "Take photo"}</span>
        {recording && (
          <span className="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold tabular-nums">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {fmtTime(seconds)} / {fmtTime(maxSeconds)} · {fmtSize(recordedBytes)}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          disabled={recording}
          aria-label="Close camera"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preview */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {result ? (
          isVideo ? (
            <video src={result.url} controls playsInline className="max-h-full max-w-full" />
          ) : (
            <img src={result.url} alt="Captured" className="max-h-full max-w-full object-contain" />
          )
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="max-h-full max-w-full" />
        )}

        {starting && !result && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Starting camera…
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 top-4 rounded-lg bg-red-600 px-4 py-3 text-sm text-white">
            {error}
            {!result && (
              <button type="button" onClick={startCamera} className="ml-2 font-semibold underline">
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-around gap-4 px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {result ? (
          <>
            <button
              type="button"
              onClick={retake}
              className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
            <button
              type="button"
              onClick={useResult}
              className="flex items-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-semibold text-ink-950 hover:bg-brand-300"
            >
              <Check className="h-4 w-4" /> Use {isVideo ? "video" : "photo"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              disabled={recording || starting}
              aria-label="Switch camera"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>

            {isVideo ? (
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={starting || !!error}
                aria-label={recording ? "Stop recording" : "Start recording"}
                className="flex items-center justify-center rounded-full border-4 border-white p-1 disabled:opacity-40"
                style={{ height: 72, width: 72 }}
              >
                {recording ? (
                  <Square className="h-7 w-7 fill-red-600 text-red-600" />
                ) : (
                  <Circle className="h-full w-full fill-red-600 text-red-600" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={takePhoto}
                disabled={starting || !!error}
                aria-label="Take photo"
                className="flex items-center justify-center rounded-full border-4 border-white bg-white/90 text-ink-950 disabled:opacity-40"
                style={{ height: 72, width: 72 }}
              >
                <Camera className="h-7 w-7" />
              </button>
            )}

            {/* Spacer keeps the shutter centred */}
            <span className="h-12 w-12" />
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
