/**
 * Image compression and optimization utilities
 */

interface CompressImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export const compressImage = async (
  file: File,
  options: CompressImageOptions
): Promise<File> => {
  const { maxWidth, maxHeight, quality = 0.8, format = 'webp' } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Preset compression options for different use cases
export const COMPRESSION_PRESETS = {
  avatar: {
    maxWidth: 96,
    maxHeight: 96,
    quality: 0.9,
    format: 'webp' as const,
  },
  channelList: {
    maxWidth: 48,
    maxHeight: 48,
    quality: 0.8,
    format: 'webp' as const,
  },
  channelBanner: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    format: 'webp' as const,
  },
} as const;

export type CompressionPreset = keyof typeof COMPRESSION_PRESETS;

export const compressImageWithPreset = async (
  file: File,
  preset: CompressionPreset
): Promise<File> => {
  return compressImage(file, COMPRESSION_PRESETS[preset]);
};