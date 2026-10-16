import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { SignatureConfig } from '../types/pdf';

// Configure PDF.js worker with matching version
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  viewportRatio: number; // height / width
}

/**
 * Loads a PDF from bytes and retrieves page information
 */
export async function getPdfInfo(pdfBytes: Uint8Array): Promise<{
  numPages: number;
  pages: PageInfo[];
}> {
  // Use a copy to prevent transferring or detaching ArrayBuffer
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  const pages: PageInfo[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      viewportRatio: viewport.height / viewport.width,
    });
  }

  return { numPages, pages };
}

/**
 * Renders a specific page of a PDF onto an HTML canvas
 */
export async function renderPdfPageToCanvas(
  pdfBytes: Uint8Array,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  desiredWidth: number
): Promise<{ width: number; height: number; scale: number }> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageNumber);

  const initialViewport = page.getViewport({ scale: 1.0 });
  const scale = desiredWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });

  // Output device scale factor for retina crispness
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D del canvas');

  ctx.save();
  ctx.scale(pixelRatio, pixelRatio);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  ctx.restore();

  return {
    width: viewport.width,
    height: viewport.height,
    scale,
  };
}

/**
 * Returns the image at the given size with its white paper background made
 * transparent (scans saved without transparency, e.g. a photographed seal)
 */
function withoutWhiteBackground(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  // Fully transparent from 245 up, fading in below it so edges stay smooth
  const SOLID = 215;
  const CLEAR = 245;
  for (let i = 0; i < px.length; i += 4) {
    const lightest = Math.min(px[i], px[i + 1], px[i + 2]);
    if (lightest >= CLEAR) px[i + 3] = 0;
    else if (lightest > SOLID) {
      px[i + 3] = Math.round(
        (px[i + 3] * (CLEAR - lightest)) / (CLEAR - SOLID)
      );
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/**
 * Generates a unified high-resolution PNG representing the signature
 * (including handwritten/drawn/typed stroke plus optional signatory card info)
 */
export async function renderCompositeSignaturePng(
  sig: SignatureConfig
): Promise<{ dataUrl: string; width: number; height: number; aspectRatio: number }> {
  // Setup offscreen canvas
  const canvas = document.createElement('canvas');
  const baseWidth = 480;
  // Compute height based on whether signatory details are included
  const hasDetails = sig.signatory.showDetails && (sig.signatory.name || sig.signatory.role || sig.signatory.date);

  let img: HTMLImageElement | null = null;
  if (sig.dataUrl) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img!.onload = () => resolve();
      img!.onerror = () => reject(new Error('Error cargando imagen de firma'));
      img!.src = sig.dataUrl!;
    });
  }

  // An image-only stamp (e.g. a scanned seal) takes the image's own
  // proportions so it fills the stamp width instead of a fixed 3:1 box
  const baseHeight = hasDetails
    ? 240
    : img
      ? Math.round(Math.min(Math.max(baseWidth / (img.width / img.height), 80), 480))
      : 160;

  // Render at 3x so small text in scanned seals stays legible in the PDF
  const RENDER_SCALE = 3;
  canvas.width = baseWidth * RENDER_SCALE;
  canvas.height = baseHeight * RENDER_SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Error al crear canvas de firma');
  ctx.scale(RENDER_SCALE, RENDER_SCALE);
  ctx.imageSmoothingQuality = 'high';

  // Transparent background: the document shows through around the strokes

  // 1. Render the signature graphic or text
  if (img) {
    const sigAreaHeight = hasDetails ? 140 : baseHeight;
    // Fit image preserving aspect ratio (image-only stamps use almost all of it)
    const fill = hasDetails ? 0.85 : 0.96;
    const imgRatio = img.width / img.height;
    let drawW = baseWidth * fill;
    let drawH = drawW / imgRatio;
    if (drawH > sigAreaHeight * fill) {
      drawH = sigAreaHeight * fill;
      drawW = drawH * imgRatio;
    }
    const drawX = (baseWidth - drawW) / 2;
    const drawY = (sigAreaHeight - drawH) / 2;

    ctx.drawImage(
      withoutWhiteBackground(img, drawW * RENDER_SCALE, drawH * RENDER_SCALE),
      drawX,
      drawY,
      drawW,
      drawH
    );
  } else if (sig.textValue) {
    // Render typed cursive signature
    const sigAreaHeight = hasDetails ? 140 : baseHeight;
    ctx.fillStyle = sig.color || '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `64px "${sig.fontFamily || 'Dancing Script'}", cursive`;
    ctx.fillText(sig.textValue, baseWidth / 2, sigAreaHeight / 2);
  } else {
    // Fallback placeholder stroke
    const sigAreaHeight = hasDetails ? 140 : baseHeight;
    ctx.strokeStyle = sig.color || '#0f172a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, sigAreaHeight / 2 + 10);
    ctx.bezierCurveTo(120, sigAreaHeight / 2 - 40, 200, sigAreaHeight / 2 + 30, 260, sigAreaHeight / 2 - 20);
    ctx.bezierCurveTo(320, sigAreaHeight / 2 - 40, 360, sigAreaHeight / 2 + 20, 420, sigAreaHeight / 2);
    ctx.stroke();
  }

  // 2. Render signature underline and signatory text if enabled
  if (hasDetails) {
    // Underline
    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 148);
    ctx.lineTo(baseWidth - 40, 148);
    ctx.stroke();

    // Text block
    let currentY = 172;
    if (sig.signatory.name) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sig.signatory.name, baseWidth / 2, currentY);
      currentY += 19;
    }

    if (sig.signatory.role) {
      ctx.fillStyle = '#475569';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sig.signatory.role, baseWidth / 2, currentY);
      currentY += 17;
    }

    const extraLineParts: string[] = [];
    if (sig.signatory.date) extraLineParts.push(`Fecha: ${sig.signatory.date}`);

    if (extraLineParts.length > 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(extraLineParts.join(' · '), baseWidth / 2, currentY);
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  const aspectRatio = baseWidth / baseHeight;

  return {
    dataUrl,
    width: baseWidth,
    height: baseHeight,
    aspectRatio,
  };
}

/**
 * Embeds the 3 signatures into the PDF document at exact coordinates
 * and returns the signed PDF as a Uint8Array.
 */
export async function stampSignaturesToPdf(
  originalPdfBytes: Uint8Array,
  signatures: SignatureConfig[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const totalPages = pdfDoc.getPageCount();

  for (const sig of signatures) {
    // Target page (clamp to valid page)
    const pageIndex = Math.min(Math.max(sig.pageNumber - 1, 0), totalPages - 1);
    const page = pdfDoc.getPage(pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Render composite PNG for high quality
    const composite = await renderCompositeSignaturePng(sig);
    const pngImageBytes = await fetch(composite.dataUrl).then((res) => res.arrayBuffer());
    const embeddedImage = await pdfDoc.embedPng(pngImageBytes);

    // Calculate dimensions in PDF points
    const widthPts = (sig.widthPercent / 100) * pageWidth;
    const heightPts = widthPts / composite.aspectRatio;

    // Calculate X and Y coordinates (PDF origin is bottom-left)
    const xPts = (sig.xPercent / 100) * pageWidth;
    const yTopPts = (sig.yPercent / 100) * pageHeight;
    const yPts = pageHeight - yTopPts - heightPts;

    // Draw the signature
    page.drawImage(embeddedImage, {
      x: xPts,
      y: yPts,
      width: widthPts,
      height: heightPts,
    });
  }

  return await pdfDoc.save();
}

/**
 * Helper to download a Uint8Array as a file in the browser
 */
export function triggerFileDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
