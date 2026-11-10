/**
 * Client-side Image Resizing and Compression Utility
 * Prevents memory bloat and localStorage quota exceeded errors.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImageFile(
  file: File,
  options: ResizeOptions = {}
): Promise<string> {
  const { maxWidth = 1080, maxHeight = 1080, quality = 0.82 } = options;

  // Non-image files: if video or document, return dataUrl or objectUrl
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      // For large video files over 15MB, guard with error
      if (file.size > 20 * 1024 * 1024) {
        reject(new Error('Video file size exceeds 20MB limit. Please upload a shorter clip.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed reading media file'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Corrupt or unsupported image file format'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Downscale proportionally if larger than maximum limits
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed JPEG or WebP
          const mimeType = file.type === 'image/png' && file.size < 500 * 1024 ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('[compressImageFile] Canvas processing failed, falling back to raw data:', canvasErr);
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64/dataURL or captures frame from video element
 */
export function captureAndCompressVideoFrame(
  video: HTMLVideoElement,
  options: { facingMode?: 'user' | 'environment'; maxWidth?: number; maxHeight?: number; quality?: number } = {}
): string {
  const { facingMode = 'user', maxWidth = 960, maxHeight = 720, quality = 0.85 } = options;

  let width = video.videoWidth || 640;
  let height = video.videoHeight || 480;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (facingMode === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Synchronously converts a base64 Data URL to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid or missing data URL');
  }
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('Malformed data URL');
  }
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Synchronously converts a base64 Data URL to a File
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], fileName, { type: blob.type });
}

