export interface TrackingPoint {
  x: number;
  y: number;
  frame: number;
  timestamp: number;
}

export interface VelocityData {
  current: number;
  mean: number;
  peak: number;
  instant: number[];
  timestamps: number[];
}

export interface AnalysisResult {
  meanVelocity: number;
  peakVelocity: number;
  repDuration: number;
  concentricDuration: number;
  pathDeviation: number;
  rangeOfMotion: number;
  trackingPoints: TrackingPoint[];
  velocityData: VelocityData;
  powerZone: 'strength' | 'power' | 'speed';
}

export interface SavedVideo {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  analysisResult: AnalysisResult;
  videoBlob: Blob;
  thumbnailBlob?: Blob;
}

export interface CalibrationSettings {
  method: 'plate' | 'manual' | 'known';
  plateDiameter: number; // in mm
  pixelsPerMm: number;
  referencePoints?: { start: { x: number; y: number }, end: { x: number; y: number } };
}

export interface TrackingSettings {
  algorithm: 'klt' | 'roboflow';
  trackingPoints: number;
  maxCorners: number;
  qualityLevel: number;
  minDistance: number;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}
