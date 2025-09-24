import { TrackingPoint, TrackingSettings } from '@/types/vbt';

export interface KLTTrackerOptions {
  maxCorners: number;
  qualityLevel: number;
  minDistance: number;
  blockSize: number;
  useHarrisDetector: boolean;
  k: number;
}

export class KLTTracker {
  private worker: Worker | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      console.log('Initializing OpenCV worker...');
      this.worker = new Worker(new URL('../workers/cv-worker.ts', import.meta.url));
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      // Set timeout for worker initialization
      setTimeout(() => {
        if (!this.isInitialized) {
          console.error('OpenCV worker initialization timeout');
          this.onError?.('OpenCV worker failed to initialize within 10 seconds. Please check your internet connection and try again.');
        }
      }, 10000);
    } catch (error) {
      console.error('Failed to initialize OpenCV worker:', error);
      this.onError?.(`Failed to create OpenCV worker: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, payload } = event.data;
    
    console.log('Worker message:', type, payload);
    
    switch (type) {
      case 'initialized':
        console.log('OpenCV worker initialized successfully');
        this.isInitialized = true;
        break;
      case 'tracking_result':
        this.onTrackingResult?.(payload);
        break;
      case 'error':
        console.error('Worker error:', payload);
        this.onError?.(payload);
        break;
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('OpenCV worker error event:', error);
    this.onError?.(`OpenCV worker error: ${error.message || 'Unknown worker error'}`);
  }

  public onTrackingResult?: (points: TrackingPoint[]) => void;
  public onError?: (error: string) => void;

  async waitForInitialization(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('OpenCV worker initialization timeout'));
      }, 15000);

      const checkInitialized = () => {
        if (this.isInitialized) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkInitialized, 100);
        }
      };

      checkInitialized();
    });
  }

  async initializeTracking(
    videoElement: HTMLVideoElement,
    settings: TrackingSettings
  ): Promise<void> {
    // Wait for worker to be ready
    await this.waitForInitialization();
    
    if (!this.worker || !this.isInitialized) {
      throw new Error('OpenCV worker not initialized');
    }

    // Extract first frame for initial corner detection
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    this.worker.postMessage({
      type: 'initialize_tracking',
      payload: {
        imageData,
        settings: {
          maxCorners: settings.trackingPoints,
          qualityLevel: settings.qualityLevel,
          minDistance: settings.minDistance,
          blockSize: 3,
          useHarrisDetector: false,
          k: 0.04
        }
      }
    });
  }

  async initializeTrackingWithRegion(
    videoElement: HTMLVideoElement,
    settings: TrackingSettings,
    region: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    // Wait for worker to be ready
    await this.waitForInitialization();
    
    if (!this.worker || !this.isInitialized) {
      throw new Error('OpenCV worker not initialized');
    }

    // Extract first frame for initial corner detection
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    console.log(`🎯 Using AI-detected barbell region: (${Math.round(region.x)}, ${Math.round(region.y)}) ${Math.round(region.width)}x${Math.round(region.height)}`);

    this.worker.postMessage({
      type: 'initialize_tracking',
      payload: {
        imageData,
        settings: {
          maxCorners: settings.trackingPoints,
          qualityLevel: settings.qualityLevel,
          minDistance: settings.minDistance,
          blockSize: 3,
          useHarrisDetector: false,
          k: 0.04
        },
        aiRegion: region // Pass AI-detected region to worker
      }
    });
  }

  processFrame(
    imageData: ImageData,
    frameNumber: number,
    timestamp: number
  ): void {
    if (!this.worker || !this.isInitialized) return;

    this.worker.postMessage({
      type: 'process_frame',
      payload: {
        imageData,
        frameNumber,
        timestamp
      }
    });
  }

  selectBarbellRegion(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (!this.worker || !this.isInitialized) return;

    this.worker.postMessage({
      type: 'select_region',
      payload: { x, y, width, height }
    });
  }

  reset(): void {
    if (!this.worker) return;

    this.worker.postMessage({
      type: 'reset'
    });
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isInitialized = false;
  }

  // Calculate barbell path from scattered tracking points
  static calculateBarbellPath(allTrackingPoints: TrackingPoint[]): TrackingPoint[] {
    if (allTrackingPoints.length === 0) return [];

    // Group points by frame
    const pointsByFrame = new Map<number, TrackingPoint[]>();
    allTrackingPoints.forEach(point => {
      if (!pointsByFrame.has(point.frame)) {
        pointsByFrame.set(point.frame, []);
      }
      pointsByFrame.get(point.frame)!.push(point);
    });

    const barbellPath: TrackingPoint[] = [];
    let previousCenter: { x: number; y: number } | null = null;

    // Calculate the main cluster center for each frame
    pointsByFrame.forEach((points, frame) => {
      if (points.length === 0) return;
      
      // Find the main cluster of points (for barbell tracking)
      let bestCluster = points;
      
      if (points.length > 5) {
        // Advanced clustering for gym environment - prioritize main subject's barbell
        const clusters: TrackingPoint[][] = [];
        const clusterThreshold = 60; // Tighter clustering for gym settings
        
        points.forEach(point => {
          let addedToCluster = false;
          for (const cluster of clusters) {
            if (cluster.length === 0) continue;
            
            const avgClusterX = cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length;
            const avgClusterY = cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;
            
            const distance = Math.sqrt(
              Math.pow(point.x - avgClusterX, 2) + Math.pow(point.y - avgClusterY, 2)
            );
            
            if (distance < clusterThreshold) {
              cluster.push(point);
              addedToCluster = true;
              break;
            }
          }
          
          if (!addedToCluster) {
            clusters.push([point]);
          }
        });
        
        // Smart cluster selection for gym - prioritize foreground/center clusters
        let bestScore = -1;
        bestCluster = clusters[0] || [];
        
        // Get frame dimensions from points (approximate)
        const allX = points.map(p => p.x);
        const allY = points.map(p => p.y);
        const estimatedWidth = Math.max(...allX) - Math.min(...allX) + 200; // Add buffer
        const estimatedHeight = Math.max(...allY) - Math.min(...allY) + 200;
        const frameCenter = { x: estimatedWidth / 2, y: estimatedHeight / 2 };
        
        for (const cluster of clusters) {
          if (cluster.length < 3) continue; // Skip tiny clusters
          
          // Calculate cluster center
          const clusterCenter = {
            x: cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length,
            y: cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length
          };
          
          // Score based on: size + proximity to center + vertical movement + foreground detection
          const sizeScore = cluster.length / points.length; // Normalize by total points
          const centerDistance = Math.sqrt(
            Math.pow(clusterCenter.x - frameCenter.x, 2) + 
            Math.pow(clusterCenter.y - frameCenter.y, 2)
          );
          const maxDistance = Math.sqrt(estimatedWidth * estimatedWidth + estimatedHeight * estimatedHeight) / 2;
          const centerScore = 1 - (centerDistance / maxDistance);
          
          // Vertical movement pattern score (barbells move more vertically than horizontally)
          const ySpread = Math.max(...cluster.map(p => p.y)) - Math.min(...cluster.map(p => p.y));
          const xSpread = Math.max(...cluster.map(p => p.x)) - Math.min(...cluster.map(p => p.x));
          const verticalScore = ySpread > 0 ? Math.min(1, ySpread / Math.max(xSpread, 1)) : 0;
          
          // Foreground detection - larger movement ranges suggest closer objects (main subject's barbell)
          const movementRange = Math.sqrt(ySpread * ySpread + xSpread * xSpread);
          const maxMovement = Math.max(...clusters.map(c => {
            const cYSpread = Math.max(...c.map(p => p.y)) - Math.min(...c.map(p => p.y));
            const cXSpread = Math.max(...c.map(p => p.x)) - Math.min(...c.map(p => p.x));
            return Math.sqrt(cYSpread * cYSpread + cXSpread * cXSpread);
          }));
          const foregroundScore = maxMovement > 0 ? movementRange / maxMovement : 0;
          
          // Combined score: size + center proximity + vertical movement + foreground detection
          const combinedScore = (sizeScore * 0.3) + (centerScore * 0.3) + (verticalScore * 0.2) + (foregroundScore * 0.2);
          
          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestCluster = cluster;
          }
        }

        console.log(`Frame ${frame}: Smart clustering - ${points.length} total points -> ${bestCluster.length} in selected cluster (score: ${bestScore.toFixed(3)})`);
      }
      
      if (bestCluster.length === 0) return;
      
      // Calculate center of the main cluster
      const clusterX = bestCluster.reduce((sum, p) => sum + p.x, 0) / bestCluster.length;
      const clusterY = bestCluster.reduce((sum, p) => sum + p.y, 0) / bestCluster.length;
      
      // Smooth movement by considering previous position
      let finalX = clusterX;
      let finalY = clusterY;
      
      if (previousCenter) {
        // If movement is too large between frames, use smoothing
        const movement = Math.sqrt(
          Math.pow(clusterX - previousCenter.x, 2) + Math.pow(clusterY - previousCenter.y, 2)
        );
        
        if (movement > 150) {
          // Large jump - apply smoothing
          finalX = previousCenter.x + (clusterX - previousCenter.x) * 0.7;
          finalY = previousCenter.y + (clusterY - previousCenter.y) * 0.7;
          console.log(`Frame ${frame}: Large movement detected (${Math.round(movement)}px), applying smoothing`);
        }
      }
      
      previousCenter = { x: finalX, y: finalY };
      
      barbellPath.push({
        x: finalX,
        y: finalY,
        frame,
        timestamp: points[0].timestamp
      });
    });

    console.log(`📊 Barbell path: ${pointsByFrame.size} frames -> ${barbellPath.length} path points`);
    return barbellPath.sort((a, b) => a.frame - b.frame);
  }

  static extractFrames(
    videoElement: HTMLVideoElement,
    onFrame: (imageData: ImageData, timestamp: number, frameNumber: number, totalFrames: number) => void,
    fps: number = 15 // Reduce to 15fps for faster processing
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Add error handling for the video element
      if (!videoElement.videoWidth || !videoElement.videoHeight) {
        console.error('❌ Video has no dimensions, cannot extract frames');
        reject(new Error('Video has no dimensions'));
        return;
      }

      const canvas = document.createElement('canvas');
      
      // Standardize canvas size to prevent dimension mismatches
      const maxWidth = 720;
      const maxHeight = 540;
      
      const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
      
      if (aspectRatio > maxWidth / maxHeight) {
        // Video is wider - fit to max width
        canvas.width = maxWidth;
        canvas.height = Math.round(maxWidth / aspectRatio);
      } else {
        // Video is taller - fit to max height
        canvas.height = maxHeight;
        canvas.width = Math.round(maxHeight * aspectRatio);
      }
      
      console.log(`📐 Standardized canvas: ${videoElement.videoWidth}x${videoElement.videoHeight} -> ${canvas.width}x${canvas.height}`);
      
      const ctx = canvas.getContext('2d')!;

      const frameInterval = 1000 / fps; // milliseconds per frame
      let totalFrames = Math.ceil(videoElement.duration * fps); // Calculate total frames more accurately
      
      // Handle videos with invalid duration (common with recorded videos)
      if (!videoElement.duration || videoElement.duration <= 0 || !isFinite(videoElement.duration)) {
        console.warn('⚠️ Video has invalid duration, using frame-based extraction for recorded video');
        totalFrames = 30; // Default to ~2 seconds at 15fps for recorded videos
        console.log('🎯 Using fallback frame count for recorded video:', totalFrames);
      }
      
      console.log(`🎬 Frame extraction: ${totalFrames} frames at ${fps}fps from ${videoElement.duration}s video`);
      let frameCount = 0;
      let failureCount = 0;
      
      const extractFrame = () => {
        // Check if we've processed all frames or reached video end
        if (frameCount >= totalFrames || (videoElement.duration > 0 && videoElement.currentTime >= videoElement.duration)) {
          console.log(`✅ Frame extraction complete: ${frameCount} frames processed`);
          resolve();
          return;
        }
        
        console.log(`🎞️ Processing frame ${frameCount + 1}/${totalFrames} at ${videoElement.currentTime.toFixed(2)}s`);

        // Scale down for faster processing (max 720p width)
        const maxWidth = 720;
        const scale = Math.min(1, maxWidth / canvas.width);
        const scaledWidth = Math.floor(canvas.width * scale);
        const scaledHeight = Math.floor(canvas.height * scale);
        
        // Draw scaled down frame for processing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoElement, 0, 0, scaledWidth, scaledHeight);
        const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
        
        onFrame(imageData, videoElement.currentTime * 1000, frameCount, totalFrames);
        
        frameCount++;
        
        // Set time for next frame
        const nextTargetTime = (frameCount * frameInterval) / 1000;
        
        // For recorded videos with no duration, use a simpler approach
        if (videoElement.duration <= 0 || !isFinite(videoElement.duration)) {
          // For recorded videos, just advance frame by frame with short delays
          setTimeout(() => {
            // Try to advance by a small amount 
            const currentTime = videoElement.currentTime;
            videoElement.currentTime = currentTime + 0.1; // 100ms increments
            
            // Use a timeout to continue processing
            setTimeout(() => {
              extractFrame();
            }, 50);
          }, 10);
          
        } else if (nextTargetTime < videoElement.duration) {
          videoElement.currentTime = nextTargetTime;
          // Wait for video to seek to new position
          videoElement.addEventListener('seeked', extractFrame, { once: true });
        } else {
          // We've reached the end
          console.log(`✅ Frame extraction complete: ${frameCount} frames processed`);
          resolve();
        }
      };

      videoElement.currentTime = 0;
      videoElement.addEventListener('seeked', extractFrame, { once: true });
    });
  }
}
