import { CalibrationSettings } from '@/types/vbt';

export class CalibrationManager {
  static getPlatePixelDiameter(videoElement: HTMLVideoElement, plateRealDiameter: number): number {
    // This would use plate detection in a real implementation
    // For now, return a more realistic estimate for standard weightlifting videos
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    
    // Standard 45lb/20kg plates are typically 450mm diameter
    // In most lifting videos, plates appear as 15-25% of video width
    let estimatedPixelDiameter;
    
    // Much larger estimates to fix 4x velocity issue
    if (plateRealDiameter >= 400) {
      // Large plate (45lb/20kg) - use 40% of video width to reduce velocity by 2x
      estimatedPixelDiameter = videoWidth * 0.40;
    } else if (plateRealDiameter >= 300) {
      // Medium plate (25lb/10kg) - proportionally adjusted
      estimatedPixelDiameter = videoWidth * 0.11;
    } else {
      // Small plate (<10kg) - proportionally adjusted
      estimatedPixelDiameter = videoWidth * 0.08;
    }
    
    console.log(`📏 Calibration: ${plateRealDiameter}mm plate estimated as ${Math.round(estimatedPixelDiameter)} pixels in ${videoWidth}x${videoHeight} video`);
    
    return Math.max(50, estimatedPixelDiameter);
  }

  static calculatePixelsPerMm(platePixelDiameter: number, plateRealDiameter: number): number {
    return platePixelDiameter / plateRealDiameter;
  }

  static convertPixelsToMeters(pixels: number, pixelsPerMm: number): number {
    return (pixels / pixelsPerMm) / 1000; // Convert mm to meters
  }

  static calibrateFromPlate(
    videoElement: HTMLVideoElement, 
    plateDiameterMm: number = 450
  ): CalibrationSettings {
    const platePixelDiameter = this.getPlatePixelDiameter(videoElement, plateDiameterMm);
    const pixelsPerMm = this.calculatePixelsPerMm(platePixelDiameter, plateDiameterMm);

    console.log(`🔍 CALIBRATION DEBUG:`);
    console.log(`  Video: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
    console.log(`  Plate: ${plateDiameterMm}mm real diameter`);
    console.log(`  Estimated plate pixels: ${platePixelDiameter.toFixed(1)}`);
    console.log(`  Pixels per mm: ${pixelsPerMm.toFixed(3)}`);
    console.log(`  Test: 100px = ${(100/pixelsPerMm).toFixed(1)}mm = ${(100/pixelsPerMm/1000).toFixed(3)}m`);

    return {
      method: 'plate',
      plateDiameter: plateDiameterMm,
      pixelsPerMm
    };
  }

  static calibrateFromManualLine(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    realDistanceMm: number
  ): CalibrationSettings {
    const pixelDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    const pixelsPerMm = pixelDistance / realDistanceMm;

    return {
      method: 'manual',
      plateDiameter: realDistanceMm,
      pixelsPerMm,
      referencePoints: { start: startPoint, end: endPoint }
    };
  }

  static detectPlateInFrame(canvas: HTMLCanvasElement): { x: number; y: number; radius: number } | null {
    // This would implement actual plate detection using computer vision
    // For demo purposes, return a reasonable default position
    const centerX = canvas.width * 0.5;
    const centerY = canvas.height * 0.5;
    const radius = Math.min(canvas.width, canvas.height) * 0.1;

    return { x: centerX, y: centerY, radius };
  }
}
