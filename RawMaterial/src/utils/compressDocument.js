// Compress an image or PDF in the browser so it is at most `maxBytes`.
// - Images are re-encoded as JPEG, lowering quality and then resolution.
// - PDFs larger than the limit are rendered page-by-page (pdfjs-dist) to JPEG
//   and rebuilt into a new image-only PDF.
// Throws an Error if the file cannot be brought under the limit.

export const ONE_MB = 1024 * 1024;

const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
const SCALE_STEPS = [1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.25];

const canvasToJpeg = (canvas, quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      "image/jpeg",
      quality
    )
  );

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });

const drawScaled = (source, width, height, scale) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // transparent PNG areas become white, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
};

const renameTo = (name, ext) => name.replace(/\.[^.]+$/, "") + ext;

const compressImage = async (file, maxBytes) => {
  const img = await loadImage(file);
  // Cap very large photos first; documents stay readable at ~2500px.
  const baseScale = Math.min(1, 2500 / Math.max(img.naturalWidth, img.naturalHeight));

  for (const s of SCALE_STEPS) {
    const canvas = drawScaled(img, img.naturalWidth, img.naturalHeight, baseScale * s);
    for (const q of QUALITY_STEPS) {
      const blob = await canvasToJpeg(canvas, q);
      if (blob.size <= maxBytes) {
        return new File([blob], renameTo(file.name, ".jpg"), { type: "image/jpeg" });
      }
    }
  }
  throw new Error("Image could not be compressed under the size limit");
};

// Build a minimal PDF where every page is a single JPEG image.
const buildPdfFromJpegs = async (pages) => {
  const enc = new TextEncoder();
  const parts = [];
  const offsets = [];
  let length = 0;
  const push = (chunk) => {
    const bytes = typeof chunk === "string" ? enc.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  const pageCount = pages.length;
  // Object numbering: 1 catalog, 2 pages, then per page: page, image, content.
  const pageObj = (i) => 3 + i * 3;
  const imageObj = (i) => 4 + i * 3;
  const contentObj = (i) => 5 + i * 3;
  const startObj = (n) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
  };

  startObj(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObj(2);
  const kids = pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ");
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>\nendobj\n`);

  for (let i = 0; i < pageCount; i++) {
    const { jpeg, width, height, pageWidth, pageHeight } = pages[i];
    const data = new Uint8Array(await jpeg.arrayBuffer());

    startObj(pageObj(i));
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
        `/Resources << /XObject << /Im0 ${imageObj(i)} 0 R >> >> /Contents ${contentObj(i)} 0 R >>\nendobj\n`
    );

    startObj(imageObj(i));
    push(
      `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${data.length} >>\nstream\n`
    );
    push(data);
    push("\nendstream\nendobj\n");

    const content = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;
    startObj(contentObj(i));
    push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  }

  const totalObjs = 2 + pageCount * 3;
  const xrefStart = length;
  let xref = `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= totalObjs; n++) {
    xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return new Blob(parts, { type: "application/pdf" });
};

let pdfjsPromise = null;
const loadPdfjs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.js?url"),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });
  }
  return pdfjsPromise;
};

const compressPdf = async (file, maxBytes) => {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;

  try {
    // Render each page once at ~150 DPI; later attempts only downscale/re-encode.
    const rendered = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const base = page.getViewport({ scale: 1 }); // 72 DPI, in PDF points
      const viewport = page.getViewport({ scale: 150 / 72 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      rendered.push({ canvas, pageWidth: base.width, pageHeight: base.height });
      page.cleanup();
    }

    for (const s of SCALE_STEPS) {
      const scaled = rendered.map((r) => ({
        ...r,
        canvas: s === 1 ? r.canvas : drawScaled(r.canvas, r.canvas.width, r.canvas.height, s),
      }));
      for (const q of QUALITY_STEPS) {
        const pages = await Promise.all(
          scaled.map(async (r) => ({
            jpeg: await canvasToJpeg(r.canvas, q),
            width: r.canvas.width,
            height: r.canvas.height,
            pageWidth: r.pageWidth,
            pageHeight: r.pageHeight,
          }))
        );
        const blob = await buildPdfFromJpegs(pages);
        if (blob.size <= maxBytes) {
          return new File([blob], renameTo(file.name, ".pdf"), { type: "application/pdf" });
        }
      }
    }
  } finally {
    pdf.destroy();
  }
  throw new Error("PDF could not be compressed under the size limit");
};

export const compressDocument = async (file, maxBytes = ONE_MB) => {
  if (file.size <= maxBytes) return file;
  if (file.type === "application/pdf") return compressPdf(file, maxBytes);
  if (file.type.startsWith("image/")) return compressImage(file, maxBytes);
  throw new Error("Only images or PDF files can be compressed");
};
