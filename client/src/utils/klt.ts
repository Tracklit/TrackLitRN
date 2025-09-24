import { TrackingPoint, TrackingSettings } from '@shared/schema';

export interface KLTTrackerOptions {
  maxCorners: number;
  qualityLevel: number;
  minDistance: number;
  blockSize: number;
  useHarrisDetector: boolean;
  k: number;
}

export class KLTTracker {
  private initialized = false;
  private trackingRegion: { x: number; y: number; width: number; height: number } | null = null;
  
  constructor() {
    console.log('🔧 KLT Tracker initialized (simplified version)');
  }

  public onTrackingResult?: (points: TrackingPoint[]) => void;
  public onError?: (error: string) => void;

  async initializeTracking(video: HTMLVideoElement, settings: TrackingSettings): Promise<void> {
    console.log('🎯 Initializing KLT tracking with settings:', settings);
    
    // Set default tracking region to center of video
    this.trackingRegion = {
      x: video.videoWidth * 0.25,
      y: video.videoHeight * 0.25,
      width: video.videoWidth * 0.5,
      height: video.videoHeight * 0.5
    };
    
    this.initialized = true;
    console.log('✅ KLT tracking initialized');
  }

  async initializeTrackingWithRegion(
    video: HTMLVideoElement, 
    settings: TrackingSettings, 
    region: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    console.log('🎯 Initializing KLT tracking with custom region:', region);
    this.trackingRegion = region;
    this.initialized = true;
    console.log('✅ KLT tracking initialized with custom region');
  }

  processFrame(imageData: ImageData, frameNumber: number, timestamp: number): void {
    if (!this.initialized || !this.trackingRegion) {
      console.warn('⚠️ KLT tracker not initialized');
      return;
    }

    // Simplified tracking: generate tracking points in the region
    const numPoints = 15; // Generate fewer points for demo
    const points: TrackingPoint[] = [];
    
    const region = this.trackingRegion;
    
    for (let i = 0; i < numPoints; i++) {
      // Create points along a vertical line to simulate barbell movement
      const x = region.x + region.width * 0.5 + (Math.random() - 0.5) * 20; // Small horizontal variation
      const y = region.y + (region.height / numPoints) * i + (Math.random() - 0.5) * 10; // Vertical distribution
      
      points.push({
        x,
        y,
        frame: frameNumber,
        timestamp
      });
    }
    
    // Call the callback with tracking results
    this.onTrackingResult?.(points);
  }

  static async extractFrames(
    video: HTMLVideoElement,
    onFrame: (imageData: ImageData, timestamp: number, frameNumber: number, totalFrames: number) => void
  ): Promise<void> {
    console.log('🎬 Starting frame extraction...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const frameRate = 15; // Extract at 15 FPS for processing
    const totalDuration = video.duration;
    const frameInterval = 1 / frameRate;
    const totalFrames = Math.floor(totalDuration * frameRate);

    let frameNumber = 0;
    
    for (let time = 0; time < totalDuration; time += frameInterval) {
      // Seek to specific time
      video.currentTime = time;
      
      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Call frame callback
      onFrame(imageData, time * 1000, frameNumber, totalFrames);
      
      frameNumber++;
    }
    
    console.log(`✅ Frame extraction complete: ${frameNumber} frames processed`);
  }

  static calculateBarbellPath(trackingPoints: TrackingPoint[]): TrackingPoint[] {
    if (trackingPoints.length === 0) return [];
    
    // Group points by frame
    const frameGroups = new Map<number, TrackingPoint[]>();
    
    trackingPoints.forEach(point => {
      if (!frameGroups.has(point.frame)) {
        frameGroups.set(point.frame, []);
      }
      frameGroups.get(point.frame)!.push(point);
    });
    
    // Calculate centroid for each frame
    const barbellPath: TrackingPoint[] = [];
    
    frameGroups.forEach((points, frame) => {
      if (points.length > 0) {
        const centroidX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centroidY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        const avgTimestamp = points.reduce((sum, p) => sum + p.timestamp, 0) / points.length;
        
        barbellPath.push({
          x: centroidX,
          y: centroidY,
          frame,
          timestamp: avgTimestamp
        });
      }
    });
    
    // Sort by frame number
    barbellPath.sort((a, b) => a.frame - b.frame);
    
    console.log(`🎯 Calculated barbell path: ${barbellPath.length} points from ${trackingPoints.length} tracking points`);
    
    return barbellPath;
  }

  destroy(): void {
    this.initialized = false;
    this.trackingRegion = null;
    console.log('🗑️ KLT tracker destroyed');
  }
}