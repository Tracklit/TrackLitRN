import { TrackingPoint, VelocityData } from '@shared/schema';

export class VelocityCalculator {
  static calculateInstantaneousVelocity(
    points: TrackingPoint[],
    pixelsPerMm: number,
    frameRate: number = 30
  ): number[] {
    if (points.length < 2) return [];

    const velocities: number[] = [];
    
    console.log(`🔧 Velocity calc: pixelsPerMm=${pixelsPerMm.toFixed(3)}, frameRate=${frameRate}`);
  
    // Find trajectory bounds to filter out movement extremes
    const yPositions = points.map(p => p.y);
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    const yRange = maxY - minY;
    
    // Define "topmost extension" as top 15% of movement range
    const topExtensionThreshold = minY + yRange * 0.15;
    console.log(`📊 Movement bounds: Y range ${minY.toFixed(1)} to ${maxY.toFixed(1)} (${yRange.toFixed(1)}px)`);
    console.log(`🚫 Excluding topmost 15% above Y=${topExtensionThreshold.toFixed(1)} to avoid peak velocity over-estimation`);
    
    for (let i = 1; i < points.length; i++) {
      const point1 = points[i - 1];
      const point2 = points[i];
      
      // Skip velocity calculation if either point is in the topmost extension
      if (point1.y <= topExtensionThreshold || point2.y <= topExtensionThreshold) {
        if (i <= 5) { // Debug first few exclusions
          console.log(`🚫 Excluding point ${i}: Y positions (${point1.y.toFixed(1)}, ${point2.y.toFixed(1)}) in topmost extension`);
        }
        continue;
      }
      
      // Calculate displacement in pixels
      const deltaX = point2.x - point1.x;
      const deltaY = point2.y - point1.y;
      const displacement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Convert to meters
      const displacementMeters = (displacement / pixelsPerMm) / 1000;
      
      // Calculate time difference - use frame rate if timestamps are unreliable
      let deltaTime = (point2.timestamp - point1.timestamp) / 1000; // Convert to seconds
      if (deltaTime <= 0 || deltaTime > 1) {
        // Fallback to frame rate
        deltaTime = 1 / frameRate;
      }
      
      // Calculate velocity (m/s)
      const velocity = deltaTime > 0 ? Math.abs(displacementMeters / deltaTime) : 0;
      
      // Debug displacement calculation for first few points
      if (i <= 3) {
        console.log(`🔍 Point ${i}: (${point1.x.toFixed(1)}, ${point1.y.toFixed(1)}) → (${point2.x.toFixed(1)}, ${point2.y.toFixed(1)})`);
        console.log(`  Displacement: ${displacement.toFixed(2)}px = ${(displacement/pixelsPerMm).toFixed(2)}mm = ${(displacement/pixelsPerMm/1000).toFixed(4)}m`);
        console.log(`  Time: ${deltaTime.toFixed(4)}s → Velocity: ${velocity.toFixed(3)} m/s`);
      }
      
      // Sanity check: velocities above 5 m/s in weightlifting are extremely rare
      if (velocity > 5.0) {
        console.warn(`⚠️ High velocity detected: ${velocity.toFixed(2)} m/s (displacement=${displacement.toFixed(1)}px, time=${deltaTime.toFixed(3)}s)`);
      }
      
      // Cap velocities at reasonable maximum (10 m/s) to prevent calibration errors from skewing results
      velocities.push(Math.min(velocity, 10.0));
    }
    
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const maxVel = Math.max(...velocities);
    console.log(`📊 VELOCITY SUMMARY:`);
    console.log(`  Calculated ${velocities.length} velocities`);
    console.log(`  Average: ${avgVelocity.toFixed(3)} m/s`);
    console.log(`  Peak: ${maxVel.toFixed(3)} m/s`);
    console.log(`  Expected range: 1.0-3.0 m/s for weightlifting`);
    if (maxVel > 5.0) console.warn(`  ⚠️ Peak velocity too high - calibration issue likely`);
    if (maxVel < 0.5) console.warn(`  ⚠️ Peak velocity too low - calibration issue likely`);
    
    return velocities;
  }

  static identifyConcentricPhase(
    points: TrackingPoint[],
    velocities: number[]
  ): { start: number; end: number; isUpward: boolean } {
    if (points.length < 3) return { start: 0, end: points.length - 1, isUpward: true };

    // Determine movement direction based on overall displacement
    const totalDisplacement = points[points.length - 1].y - points[0].y;
    const isUpward = totalDisplacement < 0; // Negative Y means upward movement

    // Find the phase with consistent movement in the primary direction
    let maxConsistentStart = 0;
    let maxConsistentEnd = points.length - 1;
    let maxConsistentLength = 0;

    for (let start = 0; start < points.length - 1; start++) {
      for (let end = start + 1; end < points.length; end++) {
        const displacement = points[end].y - points[start].y;
        const movingInPrimaryDirection = isUpward ? displacement < 0 : displacement > 0;
        
        if (movingInPrimaryDirection && (end - start) > maxConsistentLength) {
          maxConsistentLength = end - start;
          maxConsistentStart = start;
          maxConsistentEnd = end;
        }
      }
    }

    return {
      start: maxConsistentStart,
      end: maxConsistentEnd,
      isUpward
    };
  }

  static calculateMeanVelocity(velocities: number[], start: number = 0, end?: number): number {
    const endIndex = end ?? velocities.length;
    const subset = velocities.slice(start, endIndex);
    if (subset.length === 0) return 0;
    
    const sum = subset.reduce((acc, vel) => acc + vel, 0);
    return sum / subset.length;
  }

  static calculatePeakVelocity(velocities: number[], start: number = 0, end?: number): number {
    const endIndex = end ?? velocities.length;
    const subset = velocities.slice(start, endIndex);
    if (subset.length === 0) return 0;
    
    const peakVel = Math.max(...subset);
    const peakIndex = subset.indexOf(peakVel) + start;
    
    console.log(`🔍 PEAK VELOCITY DEBUG:`);
    console.log(`  Total velocities: ${velocities.length}`);
    console.log(`  Analyzing range: ${start} to ${endIndex} (${subset.length} values)`);
    console.log(`  Peak velocity: ${peakVel.toFixed(3)} m/s at index ${peakIndex}`);
    console.log(`  Top 5 velocities: ${subset.sort((a,b) => b-a).slice(0,5).map(v => v.toFixed(3)).join(', ')}`);
    
    return peakVel;
  }

  static smoothVelocities(velocities: number[], windowSize: number = 3): number[] {
    if (velocities.length < windowSize) return velocities;

    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < velocities.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(velocities.length, i + halfWindow + 1);
      const window = velocities.slice(start, end);
      const average = window.reduce((sum, vel) => sum + vel, 0) / window.length;
      smoothed.push(average);
    }

    return smoothed;
  }

  static analyzeVelocityData(
    points: TrackingPoint[],
    pixelsPerMm: number,
    frameRate: number = 30
  ): VelocityData {
    const instantVelocities = this.calculateInstantaneousVelocity(points, pixelsPerMm, frameRate);
    const smoothedVelocities = this.smoothVelocities(instantVelocities);
    
    const concentricPhase = this.identifyConcentricPhase(points, smoothedVelocities);
    const concentricVelocities = smoothedVelocities.slice(concentricPhase.start, concentricPhase.end + 1);
    
    const meanVelocity = this.calculateMeanVelocity(concentricVelocities);
    const peakVelocity = this.calculatePeakVelocity(concentricVelocities);
    const currentVelocity = smoothedVelocities[smoothedVelocities.length - 1] || 0;

    return {
      current: currentVelocity,
      mean: meanVelocity,
      peak: peakVelocity,
      instant: smoothedVelocities,
      timestamps: points.map(p => p.timestamp)
    };
  }

  static determinePowerZone(meanVelocity: number): 'strength' | 'power' | 'speed' {
    if (meanVelocity < 0.5) return 'strength';
    if (meanVelocity < 1.0) return 'power';
    return 'speed';
  }
}