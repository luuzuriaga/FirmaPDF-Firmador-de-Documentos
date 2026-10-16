/** Max width kept for signature images, so they fit in the browser's storage */
export const MAX_SIGNATURE_WIDTH = 1200;

/**
 * Loads an image (URL or data URL) and returns it as a PNG data URL,
 * downscaled to maxWidth when it is wider
 */
export function loadImageAsDataUrl(
  src: string,
  maxWidth = MAX_SIGNATURE_WIDTH
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen'));
        return;
      }
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen ${src}`));
    img.src = src;
  });
}
