import { CalibrationSettings } from '@shared/schema';

export interface CalibrationResult {
  pixelsPerMm: number;
  method: string;
  confidence?: number;
}

export class CalibrationManager {
  static calibrateFromPlate(video: HTMLVideoElement, plateDiameterMm: number): CalibrationResult {
    // Simple calibration based on standard plate diameter
    // This is a placeholder implementation - in real use, you'd detect the plate in the video
    
    // Assume a typical barbell plate takes up roughly 1/8th of video width
    const estimatedPlateDiameterPixels = video.videoWidth / 8;
    const pixelsPerMm = estimatedPlateDiameterPixels / plateDiameterMm;
    
    console.log(`🔧 CALIBRATION: Using plate method`);
    console.log(`  Plate diameter: ${plateDiameterMm}mm`);
    console.log(`  Estimated pixels: ${estimatedPlateDiameterPixels.toFixed(1)}px`);
    console.log(`  Calculated scale: ${pixelsPerMm.toFixed(3)} pixels/mm`);
    
    return {
      pixelsPerMm,
      method: 'plate',
      confidence: 0.7
    };
  }

  static calibrateFromReference(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    knownDistanceMm: number
  ): CalibrationResult {
    const pixelDistance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    const pixelsPerMm = pixelDistance / knownDistanceMm;
    
    console.log(`🔧 CALIBRATION: Using reference points`);
    console.log(`  Reference distance: ${knownDistanceMm}mm`);
    console.log(`  Pixel distance: ${pixelDistance.toFixed(1)}px`);
    console.log(`  Calculated scale: ${pixelsPerMm.toFixed(3)} pixels/mm`);
    
    return {
      pixelsPerMm,
      method: 'reference',
      confidence: 0.9
    };
  }

  static calibrateManual(pixelsPerMm: number): CalibrationResult {
    console.log(`🔧 CALIBRATION: Using manual scale: ${pixelsPerMm.toFixed(3)} pixels/mm`);
    
    return {
      pixelsPerMm,
      method: 'manual',
      confidence: 1.0
    };
  }

  static validateCalibration(pixelsPerMm: number): boolean {
    // Sanity checks for reasonable calibration values
    // Typical range: 0.5-5.0 pixels/mm for most camera setups
    return pixelsPerMm > 0.1 && pixelsPerMm < 10.0;
  }
}