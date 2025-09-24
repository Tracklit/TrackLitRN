// AI-powered learning-based calibration for automatic scale detection

interface CalibrationResult {
  found: boolean;
  pixelsPerMm?: number;
  confidence?: number;
  referenceObjects?: Array<{
    type: string;
    realWorldSize: number; // in mm
    detectedPixelSize: number;
    confidence: number;
  }>;
  method?: string;
  description?: string;
}

export class AICalibrationDetector {
  /**
   * Automatically calibrate video scale using AI scene analysis
   * @param imageData Canvas ImageData from video frame
   * @returns Calibration result with pixels-per-mm ratio
   */
  async detectCalibration(imageData: ImageData): Promise<CalibrationResult> {
    try {
      // Convert ImageData to base64 for API transmission
      const base64Image = await this.imageDataToBase64(imageData);

      const response = await fetch('/api/detect-calibration', {
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
        pixelsPerMm: result.pixelsPerMm ? Number(result.pixelsPerMm) : undefined,
        confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
        referenceObjects: result.referenceObjects || [],
        method: result.method || 'unknown',
        description: result.description || 'No description'
      };

    } catch (error) {
      console.error('AI calibration detection failed:', error);
      return {
        found: false,
        description: 'Calibration detection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
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
        
        // Convert to base64 PNG
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
   * Get fallback calibration values based on common scenarios
   */
  getFallbackCalibration(): CalibrationResult {
    return {
      found: true,
      pixelsPerMm: 2.0, // Conservative estimate for typical gym videos
      confidence: 0.3, // Low confidence fallback
      method: 'fallback',
      description: 'Using fallback calibration - results may be less accurate'
    };
  }

  /**
   * Check if calibration detection is available by pinging the server
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
export const aiCalibrationDetector = new AICalibrationDetector();