// OpenCV.js worker for KLT optical flow tracking

// Declare worker globals
declare function importScripts(...urls: string[]): void;

interface OpenCVGlobal {
  Mat: any;
  goodFeaturesToTrack: any;
  calcOpticalFlowPyrLK: any;
  cvtColor: any;
  equalizeHist: any;
  circle: any;
  Point: any;
  COLOR_RGBA2GRAY: any;
  TermCriteria: any;
  TERM_CRITERIA_EPS: any;
  TERM_CRITERIA_COUNT: any;
  Point2fVector: any;
  UCharVector: any;
  MatVector: any;
  matFromImageData: any;
  matFromArray: any;
  Size: any;
  Rect: any;
  Scalar: any;
  CV_32FC2: any;
  CV_8UC1: any;
  onRuntimeInitialized: () => void;
}

declare const cv: OpenCVGlobal;

// Load OpenCV.js with error handling
let isOpenCVReady = false;
let prevGray: any = null;
let corners: any = null;
let trackingSettings: any = null;

try {
  console.log('Loading OpenCV.js...');
  // Try primary CDN first, fallback to alternative CDNs if it fails
  try {
    importScripts('https://docs.opencv.org/4.8.0/opencv.js');
  } catch (primaryError) {
    console.warn('Primary OpenCV CDN failed, trying alternative...', primaryError);
    try {
      importScripts('https://cdn.jsdelivr.net/npm/opencv.js@4.8.0/opencv.js');
    } catch (secondaryError) {
      console.warn('Secondary OpenCV CDN failed, trying unpkg...', secondaryError);
      importScripts('https://unpkg.com/opencv.js@4.8.0/opencv.js');
    }
  }
  
  // Initialize OpenCV
  if (typeof cv !== 'undefined') {
    cv.onRuntimeInitialized = () => {
      console.log('OpenCV.js initialized successfully');
      isOpenCVReady = true;
      self.postMessage({ type: 'initialized' });
    };
  } else {
    throw new Error('OpenCV.js failed to load');
  }
} catch (error) {
  console.error('Failed to load OpenCV.js:', error);
  self.postMessage({ 
    type: 'error', 
    payload: `Failed to load OpenCV.js from all CDNs: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection.` 
  });
}

self.onmessage = function(event) {
  const { type, payload } = event.data;

  if (!isOpenCVReady && type !== 'initialize_tracking') {
    self.postMessage({
      type: 'error',
      payload: 'OpenCV not ready'
    });
    return;
  }

  try {
    switch (type) {
      case 'initialize_tracking':
        initializeTracking(payload);
        break;
      case 'process_frame':
        processFrame(payload);
        break;
      case 'select_region':
        selectRegion(payload);
        break;
      case 'reset':
        resetTracking();
        break;
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: `OpenCV error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
};

function initializeTracking(payload: any) {
  const { imageData, settings, aiRegion } = payload;
  
  // Validate inputs
  if (!imageData || !imageData.data || imageData.width <= 0 || imageData.height <= 0) {
    self.postMessage({
      type: 'error',
      payload: 'Invalid image data for tracking initialization'
    });
    return;
  }

  trackingSettings = settings;
  let src: any, mask: any;

  try {
    // Step 1: Convert to OpenCV Mat with validation
    try {
      src = cv.matFromImageData(imageData);
      if (!src || src.empty()) {
        throw new Error('Failed to create matrix from image data');
      }
    } catch (e) {
      throw new Error(`Image conversion failed: ${e}`);
    }

    // Step 2: Convert to grayscale
    try {
      if (prevGray) prevGray.delete(); // Clean up any existing
      prevGray = new cv.Mat();
      cv.cvtColor(src, prevGray, cv.COLOR_RGBA2GRAY);
      
      if (prevGray.empty()) {
        throw new Error('Grayscale conversion failed');
      }
    } catch (e) {
      throw new Error(`Grayscale conversion failed: ${e}`);
    }

    // Step 3: Simple feature detection (no enhancement to avoid errors)
    try {
      if (corners) corners.delete(); // Clean up any existing
      corners = new cv.Mat();
      mask = new cv.Mat();
      
      const smartMask = cv.Mat.zeros(prevGray.rows, prevGray.cols, cv.CV_8UC1);
      
      if (aiRegion) {
        // Use AI-detected barbell region for precise targeting
        console.log(`🤖 Using AI-detected barbell region for tracking initialization`);
        
        const expandedX = Math.max(0, aiRegion.x - 20);
        const expandedY = Math.max(0, aiRegion.y - 20);
        const expandedWidth = Math.min(prevGray.cols - expandedX, aiRegion.width + 40);
        const expandedHeight = Math.min(prevGray.rows - expandedY, aiRegion.height + 40);
        
        // Create focused mask based on AI detection
        for (let y = expandedY; y < expandedY + expandedHeight; y++) {
          for (let x = expandedX; x < expandedX + expandedWidth; x++) {
            if (y >= 0 && y < prevGray.rows && x >= 0 && x < prevGray.cols) {
              // High confidence in AI region, moderate falloff at edges
              const centerX = aiRegion.x + aiRegion.width / 2;
              const centerY = aiRegion.y + aiRegion.height / 2;
              const dx = (x - centerX) / (aiRegion.width / 2);
              const dy = (y - centerY) / (aiRegion.height / 2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              const weight = Math.max(0, 255 * Math.max(0.3, 1.0 - distance * 0.5)); // Strong signal, gentle falloff
              smartMask.ucharPtr(y, x)[0] = Math.floor(weight);
            }
          }
        }
        
        console.log(`🎯 AI region mask created: center(${aiRegion.x + aiRegion.width/2}, ${aiRegion.y + aiRegion.height/2}), size(${aiRegion.width}x${aiRegion.height})`);
        
      } else {
        // Fallback to smart barbell detection for gym environments
        // Focus on foreground region (larger plates = closer to camera = main subject)
        console.log(`🔍 Using traditional smart detection for tracking initialization`);
        
        const centerX = prevGray.cols / 2;
        const centerY = prevGray.rows / 2;
        
        // Foreground focus region - where the main subject's barbell should be
        // Smaller center region (40% instead of 60%) to avoid background gym equipment
        const fgWidth = prevGray.cols * 0.4;  
        const fgHeight = prevGray.rows * 0.5; 
        
        // Weighted elliptical region - strongest in center, fading to edges
        for (let y = 0; y < prevGray.rows; y++) {
          for (let x = 0; x < prevGray.cols; x++) {
            const dx = (x - centerX) / (fgWidth / 2);
            const dy = (y - centerY) / (fgHeight / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Create elliptical weight - highest at center, fade to zero
            if (distance <= 1.0) {
              const weight = Math.max(0, 255 * (1.0 - distance * distance));
              smartMask.ucharPtr(y, x)[0] = Math.floor(weight);
            }
          }
        }
      }
      
      // Detect with focus on quality over quantity for gym environments
      cv.goodFeaturesToTrack(
        prevGray,
        corners,
        12, // Even fewer points but higher quality
        0.12, // Very high quality threshold - only strongest features
        40, // More spacing to avoid feature clusters
        smartMask,
        9, // Larger block size for more stable detection
        false,
        0.04
      );
      
      smartMask.delete();
      
      console.log(`Detected ${corners.rows} high-quality features for tracking`);

      if (corners.rows < 5) {
        // Single retry with more lenient settings
        corners.delete();
        corners = new cv.Mat();
        cv.goodFeaturesToTrack(
          prevGray,
          corners,
          100,
          0.005,
          5,
          mask,
          3,
          false,
          0.04
        );
      }

    } catch (e) {
      throw new Error(`Feature detection failed: ${e}`);
    }

    // Validate results with more helpful messaging
    if (!corners || corners.rows === 0) {
      throw new Error('No trackable features detected - video needs more visual detail or better lighting');
    }
    
    console.log(`Successfully initialized tracking with ${corners.rows} feature points`);
    
    // Debug: Log the initial corner positions
    if (corners.data32F) {
      const cornerPositions = [];
      for (let i = 0; i < Math.min(corners.rows, 10); i++) {
        const x = corners.data32F[i * 2];
        const y = corners.data32F[i * 2 + 1];
        cornerPositions.push(`(${Math.round(x)}, ${Math.round(y)})`);
      }
      console.log('Initial tracking points:', cornerPositions.join(', '));
    }

    self.postMessage({
      type: 'tracking_initialized',
      payload: {
        cornersCount: corners.rows
      }
    });

  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: `Tracking initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  } finally {
    // Defensive cleanup
    try { if (src) src.delete(); } catch (e) {}
    try { if (mask) mask.delete(); } catch (e) {}
  }
}

function processFrame(payload: any) {
  // Comprehensive validation
  if (!prevGray || !corners || !cv || !isOpenCVReady) {
    self.postMessage({
      type: 'error',
      payload: 'OpenCV not ready or tracking not initialized'
    });
    return;
  }

  const { imageData, frameNumber, timestamp } = payload;
  
  // Validate input data
  if (!imageData || !imageData.data || imageData.width <= 0 || imageData.height <= 0) {
    self.postMessage({
      type: 'error',
      payload: 'Invalid image data provided'
    });
    return;
  }

  // Enhanced validation with better memory management
  if (!corners || corners.rows <= 0 || corners.empty()) {
    console.log('⚠️ Tracking lost, attempting to reinitialize...');
    try {
      // Clean up existing matrices safely
      if (prevGray && !prevGray.isDeleted()) prevGray.delete();
      if (corners && !corners.isDeleted()) corners.delete();
      
      // Create new matrices
      corners = new cv.Mat();
      const tempSrc = cv.matFromImageData(imageData);
      prevGray = new cv.Mat();
      cv.cvtColor(tempSrc, prevGray, cv.COLOR_RGBA2GRAY);
      
      // Simple reinitialization without AI region to avoid conflicts
      const tempMask = new cv.Mat();
      cv.goodFeaturesToTrack(
        prevGray,
        corners,
        25, // Reduced for stability
        0.01,
        10, // More spacing
        tempMask,
        3,
        false,
        0.04
      );
      
      // Clean up temp matrices
      tempSrc.delete();
      tempMask.delete();
      
      if (!corners || corners.rows === 0) {
        self.postMessage({
          type: 'error',
          payload: 'No trackable features found - video may need better lighting or more visual detail'
        });
        return;
      }
      
      console.log(`✅ Reinitialized with ${corners.rows} tracking points`);
      
    } catch (reinitError) {
      console.error('Reinitialize error:', reinitError);
      self.postMessage({
        type: 'error',
        payload: `Tracking reinitialize failed: ${reinitError instanceof Error ? reinitError.message : 'OpenCV error'}`
      });
      return;
    }
  }

  let src, gray, nextPts, status, errors;

  try {
    // Step 1: Convert to grayscale with validation
    try {
      src = cv.matFromImageData(imageData);
      if (!src || src.empty()) {
        throw new Error('Failed to create matrix from image data');
      }
    } catch (e) {
      throw new Error(`Image conversion failed: ${e}`);
    }

    try {
      gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      if (gray.empty()) {
        throw new Error('Grayscale conversion failed');
      }
    } catch (e) {
      throw new Error(`Grayscale conversion failed: ${e}`);
    }

    // Step 2: Prepare optical flow matrices
    try {
      nextPts = new cv.Mat();
      status = new cv.Mat();  
      errors = new cv.Mat();
    } catch (e) {
      throw new Error(`Matrix initialization failed: ${e}`);
    }

    // Step 3: Optical flow with extensive validation
    try {
      // Validate all required matrices before optical flow
      if (!prevGray || prevGray.empty()) {
        throw new Error('Previous frame matrix is invalid');
      }
      if (!gray || gray.empty()) {
        throw new Error('Current frame matrix is invalid');
      }
      if (!corners || corners.rows === 0) {
        throw new Error('No corners available for tracking');
      }
      
      // Handle dimension mismatch by reinitializing with current frame
      if (prevGray.rows !== gray.rows || prevGray.cols !== gray.cols) {
        console.log(`⚠️ Frame size changed: ${prevGray.cols}x${prevGray.rows} -> ${gray.cols}x${gray.rows}`);
        console.log('Reinitializing tracking with new frame dimensions...');
        
        // Clean up old data
        if (corners) corners.delete();
        
        // Update previous frame to match new dimensions
        prevGray.delete();
        prevGray = gray.clone();
        
        // Reinitialize corners with new frame
        corners = new cv.Mat();
        const tempMask = new cv.Mat();
        cv.goodFeaturesToTrack(
          prevGray,
          corners,
          25,
          0.01,
          10,
          tempMask,
          3,
          false,
          0.04
        );
        tempMask.delete();
        
        console.log(`✅ Reinitialized with ${corners.rows} points at ${gray.cols}x${gray.rows}`);
        
        // Skip optical flow for this frame, return empty results
        self.postMessage({
          type: 'tracking_result',
          payload: []
        });
        return;
      }
      
      const criteria = new cv.TermCriteria(
        cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT,
        20, // Reduced iterations for stability
        0.01 // Less precision for stability
      );

      cv.calcOpticalFlowPyrLK(
        prevGray,
        gray,
        corners,
        nextPts,
        status,
        errors,
        new cv.Size(11, 11), // Smaller window for stability
        1, // Single pyramid level for simplicity
        criteria
      );
      
      // Validate optical flow results
      if (!nextPts || nextPts.empty()) {
        throw new Error('Optical flow produced no results');
      }
      if (!status || status.empty()) {
        throw new Error('Optical flow status matrix is empty');
      }
      
    } catch (e) {
      // More detailed error reporting for OpenCV failures
      const errorMsg = typeof e === 'object' && e !== null ? 
        (e.message || `OpenCV error code: ${e}`) : 
        `OpenCV error: ${e}`;
      throw new Error(`Optical flow calculation failed: ${errorMsg}`);
    }

    // Step 4: Extract results with extensive validation
    const trackingPoints: any[] = [];
    const validCorners = [];

    try {
      if (status && status.rows > 0 && nextPts && status.data) {
        // More flexible data access
        const statusData = status.data || status.data8U;
        const pointsData = nextPts.data32F || nextPts.data;
        
        if (statusData && pointsData) {
          for (let i = 0; i < Math.min(status.rows, 50); i++) { // Limit iterations
            try {
              const statusValue = statusData[i];
              if (statusValue === 1) {
                const x = pointsData[i * 2];
                const y = pointsData[i * 2 + 1];
                
                // More lenient validation with barbell movement filtering
                if (typeof x === 'number' && typeof y === 'number' && 
                    !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y) &&
                    x >= 0 && y >= 0 && x <= imageData.width && y <= imageData.height) {
                  
                  // Filter out points too close to edges (likely noise)
                  const edgeBuffer = 30;
                  if (x > edgeBuffer && x < imageData.width - edgeBuffer &&
                      y > edgeBuffer && y < imageData.height - edgeBuffer) {
                    
                    trackingPoints.push({
                      x: Math.round(x),
                      y: Math.round(y),
                      frame: frameNumber,
                      timestamp
                    });

                    validCorners.push(x, y);
                  }
                }
              }
            } catch (e) {
              // Skip this point if there's any error
              continue;
            }
          }
        }
      }
    } catch (e) {
      // Don't throw error for point extraction, just continue with empty points
      console.log(`Point extraction issue: ${e}`);
    }

    // Step 5: Update corners with validation (more graceful handling)
    try {
      if (validCorners.length >= 4) { // At least 2 corners
        const oldCorners = corners;
        corners = cv.matFromArray(validCorners.length / 2, 1, cv.CV_32FC2, validCorners);
        
        if (corners && !corners.empty()) {
          // Success - clean up old corners
          oldCorners.delete();
        } else {
          // Failed to create new corners - keep old ones
          corners = oldCorners;
        }
      } else if (validCorners.length === 0) {
        // No points found - try to continue with existing corners for one more frame
        console.log('No tracking points found, keeping existing corners');
      }
      // If we have some corners (1-3) but not enough, keep the existing ones
    } catch (e) {
      console.log(`Corner update failed, keeping existing: ${e}`);
      // Don't return error, just continue with existing corners
    }

    // Step 6: Update previous frame
    try {
      if (prevGray) prevGray.delete();
      prevGray = gray.clone();
      if (!prevGray || prevGray.empty()) {
        throw new Error('Failed to update previous frame');
      }
    } catch (e) {
      throw new Error(`Frame update failed: ${e}`);
    }

    // Debug: Log tracking point distribution before sending
    if (trackingPoints.length > 0) {
      const avgX = trackingPoints.reduce((sum, p) => sum + p.x, 0) / trackingPoints.length;
      const avgY = trackingPoints.reduce((sum, p) => sum + p.y, 0) / trackingPoints.length;
      const spread = Math.max(
        ...trackingPoints.map(p => Math.abs(p.x - avgX)),
        ...trackingPoints.map(p => Math.abs(p.y - avgY))
      );
      
      console.log(`Frame ${frameNumber}: ${trackingPoints.length} points, center=(${Math.round(avgX)}, ${Math.round(avgY)}), spread=${Math.round(spread)}`);
      
      // Warning if points are too scattered (likely tracking noise)
      if (spread > 200) {
        console.warn('⚠️ Tracking points too scattered - may be tracking background features instead of barbell');
      }
    }

    // Success - send results
    self.postMessage({
      type: 'tracking_result',
      payload: trackingPoints
    });

  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: `Frame processing error: ${error instanceof Error ? error.message : 'OpenCV operation failed'}`
    });
  } finally {
    // Defensive cleanup
    try { if (src) src.delete(); } catch (e) {}
    try { if (gray) gray.delete(); } catch (e) {}
    try { if (nextPts) nextPts.delete(); } catch (e) {}
    try { if (status) status.delete(); } catch (e) {}
    try { if (errors) errors.delete(); } catch (e) {}
  }
}

function selectRegion(payload: any) {
  const { x, y, width, height } = payload;
  
  if (!prevGray) {
    self.postMessage({
      type: 'error',
      payload: 'No reference frame available'
    });
    return;
  }

  // Create mask for region of interest
  const mask = cv.Mat.zeros(prevGray.rows, prevGray.cols, cv.CV_8UC1);
  const rect = new cv.Rect(x, y, width, height);
  const roi = mask.roi(rect);
  roi.setTo(new cv.Scalar(255));

  // Detect corners in the selected region
  corners = new cv.Mat();
  cv.goodFeaturesToTrack(
    prevGray,
    corners,
    trackingSettings.maxCorners,
    trackingSettings.qualityLevel,
    trackingSettings.minDistance,
    mask,
    trackingSettings.blockSize,
    trackingSettings.useHarrisDetector,
    trackingSettings.k
  );

  mask.delete();
  roi.delete();

  self.postMessage({
    type: 'region_selected',
    payload: {
      cornersCount: corners.rows
    }
  });
}

function resetTracking() {
  if (prevGray) {
    prevGray.delete();
    prevGray = null;
  }
  if (corners) {
    corners.delete();
    corners = null;
  }
  
  self.postMessage({
    type: 'tracking_reset'
  });
}
