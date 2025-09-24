// AI-powered pose estimation for context-aware barbell tracking

interface PoseKeypoint {
  x: number;
  y: number;
  confidence: number;
  name: string;
}

interface PoseDetectionResult {
  found: boolean;
  keypoints?: PoseKeypoint[];
  mainPersonBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
  description?: string;
}

export class AIPoseDetector {
  /**
   * Detect human pose in a video frame to identify the main subject
   * @param imageData Canvas ImageData from video frame
   * @returns Pose detection result with keypoints and bounds
   */
  async detectPose(imageData: ImageData): Promise<PoseDetectionResult> {
    try {
      // Convert ImageData to base64 for API transmission
      const base64Image = await this.imageDataToBase64(imageData);

      const response = await fetch('/api/detect-pose', {
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
        keypoints: result.keypoints || [],
        mainPersonBounds: result.mainPersonBounds ? {
          x: Math.max(0, Math.min(imageData.width, Number(result.mainPersonBounds.x) || 0)),
          y: Math.max(0, Math.min(imageData.height, Number(result.mainPersonBounds.y) || 0)),
          width: Math.max(0, Math.min(imageData.width, Number(result.mainPersonBounds.width) || 0)),
          height: Math.max(0, Math.min(imageData.height, Number(result.mainPersonBounds.height) || 0))
        } : undefined,
        confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0)),
        description: result.description || 'No description'
      };

    } catch (error) {
      console.error('AI pose detection failed:', error);
      return {
        found: false,
        description: 'Pose detection failed: ' + (error instanceof Error ? error.message : 'Unknown error')
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
   * Determine likely barbell region based on pose keypoints
   * @param poseResult Pose detection result with keypoints
   * @param imageWidth Frame width
   * @param imageHeight Frame height
   * @returns Estimated barbell region based on person's position and arm placement
   */
  estimateBarbellRegionFromPose(
    poseResult: PoseDetectionResult, 
    imageWidth: number, 
    imageHeight: number
  ): { x: number; y: number; width: number; height: number } | null {
    if (!poseResult.found || !poseResult.keypoints || poseResult.keypoints.length === 0) {
      return null;
    }

    const keypoints = poseResult.keypoints;
    
    // Find key body parts for barbell positioning
    const shoulders = keypoints.filter(kp => 
      kp.name.includes('shoulder') && kp.confidence > 0.3
    );
    const wrists = keypoints.filter(kp => 
      kp.name.includes('wrist') && kp.confidence > 0.3
    );
    const elbows = keypoints.filter(kp => 
      kp.name.includes('elbow') && kp.confidence > 0.3
    );

    if (shoulders.length === 0) {
      // Fallback to person bounds if available
      return poseResult.mainPersonBounds || null;
    }

    // Calculate shoulder center
    const shoulderCenterX = shoulders.reduce((sum, kp) => sum + kp.x, 0) / shoulders.length;
    const shoulderCenterY = shoulders.reduce((sum, kp) => sum + kp.y, 0) / shoulders.length;

    // Estimate barbell position based on arm configuration
    let barbellCenterX = shoulderCenterX;
    let barbellCenterY = shoulderCenterY;
    
    if (wrists.length >= 2) {
      // Use wrist positions to estimate barbell location
      const wristCenterX = wrists.reduce((sum, kp) => sum + kp.x, 0) / wrists.length;
      const wristCenterY = wrists.reduce((sum, kp) => sum + kp.y, 0) / wrists.length;
      
      // Barbell is typically between wrists and slightly forward
      barbellCenterX = wristCenterX;
      barbellCenterY = wristCenterY;
      
    } else if (elbows.length >= 2) {
      // Use elbow positions as fallback
      const elbowCenterX = elbows.reduce((sum, kp) => sum + kp.x, 0) / elbows.length;
      const elbowCenterY = elbows.reduce((sum, kp) => sum + kp.y, 0) / elbows.length;
      
      barbellCenterX = elbowCenterX;
      barbellCenterY = elbowCenterY;
    }

    // Create barbell region estimate
    const shoulderWidth = shoulders.length >= 2 ? 
      Math.abs(shoulders[0].x - shoulders[1].x) : 
      Math.min(imageWidth * 0.2, 150); // Default shoulder width
    
    const regionWidth = Math.max(shoulderWidth * 1.5, 100); // Barbell is wider than shoulders
    const regionHeight = Math.max(shoulderWidth * 0.3, 50); // Barbell height estimate
    
    return {
      x: Math.max(0, barbellCenterX - regionWidth / 2),
      y: Math.max(0, barbellCenterY - regionHeight / 2),
      width: Math.min(imageWidth, regionWidth),
      height: Math.min(imageHeight, regionHeight)
    };
  }

  /**
   * Check if pose detection is available by pinging the server
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
export const aiPoseDetector = new AIPoseDetector();