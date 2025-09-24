// AI-powered barbell detection service using server-side OpenAI integration

interface DetectionResult {
  found: boolean;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
  description?: string;
}

export class AIBarbellDetector {
  /**
   * Detect barbell in a video frame using server-side OpenAI vision
   * @param imageData Canvas ImageData from video frame
   * @returns Detection result with bounding box if found
   */
  async detectBarbell(imageData: ImageData): Promise<DetectionResult> {
    try {
      // Convert ImageData to base64 for API transmission
      const base64Image = await this.imageDataToBase64(imageData);

      const response = await fetch('/api/detect-barbell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          width: imageData.width,
          height: imageData.height
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      // Validate and normalize the response
      return {
        found: Boolean(result.found),
        boundingBox: result.boundingBox ? {
          x: Math.max(0, Math.min(imageData.width, Number(result.boundingBox.x) || 0)),
          y: Math.max(0, Math.min(imageData.height, Number(result.boundingBox.y) || 0)),
          width: Math.max(0, Math.min(imageData.width, Number(result.boundingBox.width) || 0)),
          height: Math.max(0, Math.min(imageData.height, Number(result.boundingBox.height) || 0))
        } : undefined,
        confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
        description: result.description || 'No description'
      };

    } catch (error) {
      console.error('AI barbell detection failed:', error);
      return {
        found: false,
        description: 'Detection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }

  /**
   * Convert ImageData to base64 PNG for API transmission
   */
  private async imageDataToBase64(imageData: ImageData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas and draw ImageData
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Cannot create canvas context'));
          return;
        }

        ctx.putImageData(imageData, 0, 0);
        
        // Convert to base64 PNG (smaller than JPEG for video frames)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsDataURL(blob);
        }, 'image/png', 0.8);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a focused tracking mask based on AI detection result
   * @param detectionResult AI detection result with bounding box
   * @param imageWidth Frame width
   * @param imageHeight Frame height
   * @returns Mask data for OpenCV feature detection
   */
  createTrackingMask(
    detectionResult: DetectionResult, 
    imageWidth: number, 
    imageHeight: number
  ): Uint8ClampedArray | null {
    if (!detectionResult.found || !detectionResult.boundingBox) {
      return null;
    }

    const { x, y, width, height } = detectionResult.boundingBox;
    const mask = new Uint8ClampedArray(imageWidth * imageHeight);
    
    // Expand bounding box slightly for better tracking
    const padding = 20;
    const expandedX = Math.max(0, x - padding);
    const expandedY = Math.max(0, y - padding);
    const expandedWidth = Math.min(imageWidth - expandedX, width + padding * 2);
    const expandedHeight = Math.min(imageHeight - expandedY, height + padding * 2);

    // Create mask with smooth falloff from center
    for (let py = 0; py < imageHeight; py++) {
      for (let px = 0; px < imageWidth; px++) {
        const idx = py * imageWidth + px;
        
        // Check if point is within expanded bounding box
        if (px >= expandedX && px < expandedX + expandedWidth &&
            py >= expandedY && py < expandedY + expandedHeight) {
          
          // Calculate distance from center of bounding box
          const centerX = expandedX + expandedWidth / 2;
          const centerY = expandedY + expandedHeight / 2;
          const distX = (px - centerX) / (expandedWidth / 2);
          const distY = (py - centerY) / (expandedHeight / 2);
          const distance = Math.sqrt(distX * distX + distY * distY);
          
          // Create smooth falloff - highest at center, fade to edges
          if (distance <= 1.0) {
            mask[idx] = Math.floor(255 * (1.0 - distance * 0.3)); // Keep 70% strength at edges
          } else {
            mask[idx] = 0;
          }
        } else {
          mask[idx] = 0;
        }
      }
    }

    return mask;
  }

  /**
   * Check if API is available by pinging the server
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/ai-status');
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const aiBarbellDetector = new AIBarbellDetector();