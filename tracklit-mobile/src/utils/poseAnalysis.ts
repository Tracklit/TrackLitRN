import type { PoseLandmark } from '@/components/MediaPipeBridge';

export interface JointAngle {
  name: string;
  angle: number;
  side: 'left' | 'right' | 'center';
  description: string;
}

export interface SymmetryMetric {
  name: string;
  leftValue: number;
  rightValue: number;
  difference: number;
  percentDiff: number;
  status: 'balanced' | 'slight' | 'significant';
}

export interface CenterOfMass {
  x: number;
  y: number;
  description: string;
}

export interface StrideMetric {
  name: string;
  value: number;
  unit: string;
  description: string;
}

export interface LeanAngle {
  angle: number;
  direction: 'forward' | 'backward' | 'upright';
  description: string;
}

export interface ConfidenceScore {
  overall: number;
  regions: {
    name: string;
    score: number;
    status: 'high' | 'medium' | 'low';
  }[];
}

export interface MotionVector {
  bodyPart: string;
  velocity: { x: number; y: number; magnitude: number };
  acceleration: { x: number; y: number; magnitude: number };
  unit: string;
}

export interface MotionData {
  vectors: MotionVector[];
  overallSpeed: number;
  dominantDirection: string;
}

export interface LandmarkSnapshot {
  landmarks: PoseLandmark[];
  timestamp: number;
}

export interface FrameAnalysis {
  jointAngles: JointAngle[];
  symmetry: SymmetryMetric[];
  centerOfMass: CenterOfMass;
  strideMetrics: StrideMetric[];
  leanAngle: LeanAngle;
  confidence: ConfidenceScore;
  motion?: MotionData;
  timestamp: number;
}

const LANDMARK = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT: 31,
  RIGHT_FOOT: 32,
};

const VIS_THRESHOLD = 0.4;

function isVisible(lm: PoseLandmark): boolean {
  return lm && lm.visibility >= VIS_THRESHOLD;
}

function calcAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  if (magBA === 0 || magBC === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.round((Math.acos(cosAngle) * 180) / Math.PI);
}

function dist(a: PoseLandmark, b: PoseLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(a: PoseLandmark, b: PoseLandmark): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function computeJointAngles(landmarks: PoseLandmark[]): JointAngle[] {
  const angles: JointAngle[] = [];
  const lm = landmarks;

  if (isVisible(lm[LANDMARK.LEFT_SHOULDER]) && isVisible(lm[LANDMARK.LEFT_ELBOW]) && isVisible(lm[LANDMARK.LEFT_WRIST])) {
    angles.push({
      name: 'Left Elbow',
      angle: calcAngle(lm[LANDMARK.LEFT_SHOULDER], lm[LANDMARK.LEFT_ELBOW], lm[LANDMARK.LEFT_WRIST]),
      side: 'left',
      description: 'Angle at the left elbow joint',
    });
  }

  if (isVisible(lm[LANDMARK.RIGHT_SHOULDER]) && isVisible(lm[LANDMARK.RIGHT_ELBOW]) && isVisible(lm[LANDMARK.RIGHT_WRIST])) {
    angles.push({
      name: 'Right Elbow',
      angle: calcAngle(lm[LANDMARK.RIGHT_SHOULDER], lm[LANDMARK.RIGHT_ELBOW], lm[LANDMARK.RIGHT_WRIST]),
      side: 'right',
      description: 'Angle at the right elbow joint',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_HIP]) && isVisible(lm[LANDMARK.LEFT_KNEE]) && isVisible(lm[LANDMARK.LEFT_ANKLE])) {
    angles.push({
      name: 'Left Knee',
      angle: calcAngle(lm[LANDMARK.LEFT_HIP], lm[LANDMARK.LEFT_KNEE], lm[LANDMARK.LEFT_ANKLE]),
      side: 'left',
      description: 'Angle at the left knee joint',
    });
  }

  if (isVisible(lm[LANDMARK.RIGHT_HIP]) && isVisible(lm[LANDMARK.RIGHT_KNEE]) && isVisible(lm[LANDMARK.RIGHT_ANKLE])) {
    angles.push({
      name: 'Right Knee',
      angle: calcAngle(lm[LANDMARK.RIGHT_HIP], lm[LANDMARK.RIGHT_KNEE], lm[LANDMARK.RIGHT_ANKLE]),
      side: 'right',
      description: 'Angle at the right knee joint',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_SHOULDER]) && isVisible(lm[LANDMARK.LEFT_HIP]) && isVisible(lm[LANDMARK.LEFT_KNEE])) {
    angles.push({
      name: 'Left Hip',
      angle: calcAngle(lm[LANDMARK.LEFT_SHOULDER], lm[LANDMARK.LEFT_HIP], lm[LANDMARK.LEFT_KNEE]),
      side: 'left',
      description: 'Angle at the left hip joint',
    });
  }

  if (isVisible(lm[LANDMARK.RIGHT_SHOULDER]) && isVisible(lm[LANDMARK.RIGHT_HIP]) && isVisible(lm[LANDMARK.RIGHT_KNEE])) {
    angles.push({
      name: 'Right Hip',
      angle: calcAngle(lm[LANDMARK.RIGHT_SHOULDER], lm[LANDMARK.RIGHT_HIP], lm[LANDMARK.RIGHT_KNEE]),
      side: 'right',
      description: 'Angle at the right hip joint',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_HIP]) && isVisible(lm[LANDMARK.LEFT_SHOULDER]) && isVisible(lm[LANDMARK.LEFT_ELBOW])) {
    angles.push({
      name: 'Left Shoulder',
      angle: calcAngle(lm[LANDMARK.LEFT_HIP], lm[LANDMARK.LEFT_SHOULDER], lm[LANDMARK.LEFT_ELBOW]),
      side: 'left',
      description: 'Angle at the left shoulder joint',
    });
  }

  if (isVisible(lm[LANDMARK.RIGHT_HIP]) && isVisible(lm[LANDMARK.RIGHT_SHOULDER]) && isVisible(lm[LANDMARK.RIGHT_ELBOW])) {
    angles.push({
      name: 'Right Shoulder',
      angle: calcAngle(lm[LANDMARK.RIGHT_HIP], lm[LANDMARK.RIGHT_SHOULDER], lm[LANDMARK.RIGHT_ELBOW]),
      side: 'right',
      description: 'Angle at the right shoulder joint',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_KNEE]) && isVisible(lm[LANDMARK.LEFT_ANKLE]) && isVisible(lm[LANDMARK.LEFT_FOOT])) {
    angles.push({
      name: 'Left Ankle',
      angle: calcAngle(lm[LANDMARK.LEFT_KNEE], lm[LANDMARK.LEFT_ANKLE], lm[LANDMARK.LEFT_FOOT]),
      side: 'left',
      description: 'Angle at the left ankle joint',
    });
  }

  if (isVisible(lm[LANDMARK.RIGHT_KNEE]) && isVisible(lm[LANDMARK.RIGHT_ANKLE]) && isVisible(lm[LANDMARK.RIGHT_FOOT])) {
    angles.push({
      name: 'Right Ankle',
      angle: calcAngle(lm[LANDMARK.RIGHT_KNEE], lm[LANDMARK.RIGHT_ANKLE], lm[LANDMARK.RIGHT_FOOT]),
      side: 'right',
      description: 'Angle at the right ankle joint',
    });
  }

  return angles;
}

export function computeSymmetry(landmarks: PoseLandmark[]): SymmetryMetric[] {
  const metrics: SymmetryMetric[] = [];
  const lm = landmarks;

  const pairs: { name: string; leftA: number; leftB: number; leftC: number; rightA: number; rightB: number; rightC: number }[] = [
    { name: 'Knee Angle', leftA: LANDMARK.LEFT_HIP, leftB: LANDMARK.LEFT_KNEE, leftC: LANDMARK.LEFT_ANKLE, rightA: LANDMARK.RIGHT_HIP, rightB: LANDMARK.RIGHT_KNEE, rightC: LANDMARK.RIGHT_ANKLE },
    { name: 'Elbow Angle', leftA: LANDMARK.LEFT_SHOULDER, leftB: LANDMARK.LEFT_ELBOW, leftC: LANDMARK.LEFT_WRIST, rightA: LANDMARK.RIGHT_SHOULDER, rightB: LANDMARK.RIGHT_ELBOW, rightC: LANDMARK.RIGHT_WRIST },
    { name: 'Hip Angle', leftA: LANDMARK.LEFT_SHOULDER, leftB: LANDMARK.LEFT_HIP, leftC: LANDMARK.LEFT_KNEE, rightA: LANDMARK.RIGHT_SHOULDER, rightB: LANDMARK.RIGHT_HIP, rightC: LANDMARK.RIGHT_KNEE },
    { name: 'Shoulder Angle', leftA: LANDMARK.LEFT_HIP, leftB: LANDMARK.LEFT_SHOULDER, leftC: LANDMARK.LEFT_ELBOW, rightA: LANDMARK.RIGHT_HIP, rightB: LANDMARK.RIGHT_SHOULDER, rightC: LANDMARK.RIGHT_ELBOW },
  ];

  for (const pair of pairs) {
    const leftVisible = isVisible(lm[pair.leftA]) && isVisible(lm[pair.leftB]) && isVisible(lm[pair.leftC]);
    const rightVisible = isVisible(lm[pair.rightA]) && isVisible(lm[pair.rightB]) && isVisible(lm[pair.rightC]);

    if (leftVisible && rightVisible) {
      const leftVal = calcAngle(lm[pair.leftA], lm[pair.leftB], lm[pair.leftC]);
      const rightVal = calcAngle(lm[pair.rightA], lm[pair.rightB], lm[pair.rightC]);
      const diff = Math.abs(leftVal - rightVal);
      const avg = (leftVal + rightVal) / 2;
      const pct = avg > 0 ? Math.round((diff / avg) * 100) : 0;

      metrics.push({
        name: pair.name,
        leftValue: leftVal,
        rightValue: rightVal,
        difference: diff,
        percentDiff: pct,
        status: pct <= 5 ? 'balanced' : pct <= 15 ? 'slight' : 'significant',
      });
    }
  }

  const distPairs: { name: string; leftA: number; leftB: number; rightA: number; rightB: number }[] = [
    { name: 'Arm Length', leftA: LANDMARK.LEFT_SHOULDER, leftB: LANDMARK.LEFT_WRIST, rightA: LANDMARK.RIGHT_SHOULDER, rightB: LANDMARK.RIGHT_WRIST },
    { name: 'Leg Reach', leftA: LANDMARK.LEFT_HIP, leftB: LANDMARK.LEFT_ANKLE, rightA: LANDMARK.RIGHT_HIP, rightB: LANDMARK.RIGHT_ANKLE },
  ];

  for (const pair of distPairs) {
    if (isVisible(lm[pair.leftA]) && isVisible(lm[pair.leftB]) && isVisible(lm[pair.rightA]) && isVisible(lm[pair.rightB])) {
      const leftVal = Math.round(dist(lm[pair.leftA], lm[pair.leftB]) * 1000);
      const rightVal = Math.round(dist(lm[pair.rightA], lm[pair.rightB]) * 1000);
      const diff = Math.abs(leftVal - rightVal);
      const avg = (leftVal + rightVal) / 2;
      const pct = avg > 0 ? Math.round((diff / avg) * 100) : 0;

      metrics.push({
        name: pair.name,
        leftValue: leftVal,
        rightValue: rightVal,
        difference: diff,
        percentDiff: pct,
        status: pct <= 5 ? 'balanced' : pct <= 15 ? 'slight' : 'significant',
      });
    }
  }

  return metrics;
}

export function computeCenterOfMass(landmarks: PoseLandmark[]): CenterOfMass | null {
  const lm = landmarks;

  const torsoPoints = [LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP];
  const limbPoints = [LANDMARK.LEFT_ELBOW, LANDMARK.RIGHT_ELBOW, LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE, LANDMARK.LEFT_ANKLE, LANDMARK.RIGHT_ANKLE];

  const TORSO_WEIGHT = 0.55;
  const LIMB_WEIGHT = 0.45;

  const visibleTorso = torsoPoints.filter((i) => isVisible(lm[i]));
  const visibleLimbs = limbPoints.filter((i) => isVisible(lm[i]));

  if (visibleTorso.length < 2) return null;

  let torsoX = 0, torsoY = 0;
  for (const i of visibleTorso) {
    torsoX += lm[i].x;
    torsoY += lm[i].y;
  }
  torsoX /= visibleTorso.length;
  torsoY /= visibleTorso.length;

  if (visibleLimbs.length === 0) {
    return { x: torsoX, y: torsoY, description: 'Estimated from torso only' };
  }

  let limbX = 0, limbY = 0;
  for (const i of visibleLimbs) {
    limbX += lm[i].x;
    limbY += lm[i].y;
  }
  limbX /= visibleLimbs.length;
  limbY /= visibleLimbs.length;

  const comX = torsoX * TORSO_WEIGHT + limbX * LIMB_WEIGHT;
  const comY = torsoY * TORSO_WEIGHT + limbY * LIMB_WEIGHT;

  let desc = 'Center of gravity';
  if (comY < 0.4) desc = 'High center of gravity — explosive phase';
  else if (comY > 0.6) desc = 'Low center of gravity — stable base';
  else desc = 'Neutral center of gravity';

  return { x: comX, y: comY, description: desc };
}

export function computeStrideMetrics(landmarks: PoseLandmark[]): StrideMetric[] {
  const metrics: StrideMetric[] = [];
  const lm = landmarks;

  if (isVisible(lm[LANDMARK.LEFT_ANKLE]) && isVisible(lm[LANDMARK.RIGHT_ANKLE])) {
    const separation = Math.abs(lm[LANDMARK.LEFT_ANKLE].x - lm[LANDMARK.RIGHT_ANKLE].x);
    metrics.push({
      name: 'Stride Width',
      value: Math.round(separation * 100),
      unit: '%',
      description: 'Horizontal separation between ankles relative to frame width',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_KNEE]) && isVisible(lm[LANDMARK.LEFT_HIP])) {
    const lift = Math.max(0, lm[LANDMARK.LEFT_HIP].y - lm[LANDMARK.LEFT_KNEE].y);
    metrics.push({
      name: 'Left Knee Lift',
      value: Math.round(lift * 100),
      unit: '%',
      description: 'How high the left knee is lifted relative to hip',
    });
  }

  if (isVisible(lm[LANDMARK.RIGHT_KNEE]) && isVisible(lm[LANDMARK.RIGHT_HIP])) {
    const lift = Math.max(0, lm[LANDMARK.RIGHT_HIP].y - lm[LANDMARK.RIGHT_KNEE].y);
    metrics.push({
      name: 'Right Knee Lift',
      value: Math.round(lift * 100),
      unit: '%',
      description: 'How high the right knee is lifted relative to hip',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_WRIST]) && isVisible(lm[LANDMARK.RIGHT_WRIST])) {
    const armSep = dist(lm[LANDMARK.LEFT_WRIST], lm[LANDMARK.RIGHT_WRIST]);
    metrics.push({
      name: 'Arm Separation',
      value: Math.round(armSep * 100),
      unit: '%',
      description: 'Distance between wrists — indicates arm drive amplitude',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_SHOULDER]) && isVisible(lm[LANDMARK.RIGHT_SHOULDER])) {
    const shoulderWidth = dist(lm[LANDMARK.LEFT_SHOULDER], lm[LANDMARK.RIGHT_SHOULDER]);
    metrics.push({
      name: 'Shoulder Width',
      value: Math.round(shoulderWidth * 100),
      unit: '%',
      description: 'Detected shoulder width relative to frame',
    });
  }

  if (isVisible(lm[LANDMARK.LEFT_HIP]) && isVisible(lm[LANDMARK.RIGHT_HIP])) {
    const hipWidth = dist(lm[LANDMARK.LEFT_HIP], lm[LANDMARK.RIGHT_HIP]);
    metrics.push({
      name: 'Hip Width',
      value: Math.round(hipWidth * 100),
      unit: '%',
      description: 'Detected hip width relative to frame',
    });
  }

  return metrics;
}

export function computeLeanAngle(landmarks: PoseLandmark[]): LeanAngle | null {
  const lm = landmarks;

  const shouldersVisible = isVisible(lm[LANDMARK.LEFT_SHOULDER]) && isVisible(lm[LANDMARK.RIGHT_SHOULDER]);
  const hipsVisible = isVisible(lm[LANDMARK.LEFT_HIP]) && isVisible(lm[LANDMARK.RIGHT_HIP]);

  if (!shouldersVisible || !hipsVisible) return null;

  const shoulderMid = midpoint(lm[LANDMARK.LEFT_SHOULDER], lm[LANDMARK.RIGHT_SHOULDER]);
  const hipMid = midpoint(lm[LANDMARK.LEFT_HIP], lm[LANDMARK.RIGHT_HIP]);

  const dx = shoulderMid.x - hipMid.x;
  const dy = hipMid.y - shoulderMid.y;

  const angleFromVertical = Math.round(Math.atan2(dx, dy) * (180 / Math.PI));

  let direction: 'forward' | 'backward' | 'upright' = 'upright';
  let desc = '';

  if (angleFromVertical > 5) {
    direction = 'forward';
    desc = `${Math.abs(angleFromVertical)}° forward lean — good for acceleration phase`;
  } else if (angleFromVertical < -5) {
    direction = 'backward';
    desc = `${Math.abs(angleFromVertical)}° backward lean — may indicate braking`;
  } else {
    desc = 'Upright posture — typical for top speed or standing';
  }

  return { angle: angleFromVertical, direction, description: desc };
}

export function computeConfidence(landmarks: PoseLandmark[]): ConfidenceScore {
  const lm = landmarks;

  const regions: { name: string; indices: number[] }[] = [
    { name: 'Head', indices: [LANDMARK.NOSE, LANDMARK.LEFT_EYE, LANDMARK.RIGHT_EYE, LANDMARK.LEFT_EAR, LANDMARK.RIGHT_EAR] },
    { name: 'Upper Body', indices: [LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER, LANDMARK.LEFT_ELBOW, LANDMARK.RIGHT_ELBOW, LANDMARK.LEFT_WRIST, LANDMARK.RIGHT_WRIST] },
    { name: 'Core', indices: [LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP] },
    { name: 'Lower Body', indices: [LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE, LANDMARK.LEFT_ANKLE, LANDMARK.RIGHT_ANKLE, LANDMARK.LEFT_HEEL, LANDMARK.RIGHT_HEEL, LANDMARK.LEFT_FOOT, LANDMARK.RIGHT_FOOT] },
  ];

  const regionScores = regions.map((region) => {
    const scores = region.indices.map((i) => (lm[i] ? lm[i].visibility : 0));
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const score = Math.round(avg * 100);
    return {
      name: region.name,
      score,
      status: (score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    };
  });

  const overall = Math.round(regionScores.reduce((a, b) => a + b.score, 0) / regionScores.length);

  return { overall, regions: regionScores };
}

export function computeMotion(history: LandmarkSnapshot[]): MotionData | null {
  if (history.length < 2) return null;

  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  const dtSeconds = Math.abs(current.timestamp - previous.timestamp) / 1000;
  if (dtSeconds === 0) return null;

  const trackedParts: { name: string; indices: number[] }[] = [
    { name: 'Center of Mass', indices: [LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP, LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER] },
    { name: 'Left Hand', indices: [LANDMARK.LEFT_WRIST] },
    { name: 'Right Hand', indices: [LANDMARK.RIGHT_WRIST] },
    { name: 'Left Foot', indices: [LANDMARK.LEFT_ANKLE] },
    { name: 'Right Foot', indices: [LANDMARK.RIGHT_ANKLE] },
    { name: 'Left Knee', indices: [LANDMARK.LEFT_KNEE] },
    { name: 'Right Knee', indices: [LANDMARK.RIGHT_KNEE] },
  ];

  const vectors: MotionVector[] = [];

  for (const part of trackedParts) {
    const currPositions = part.indices
      .filter((i) => current.landmarks[i] && isVisible(current.landmarks[i]))
      .map((i) => current.landmarks[i]);
    const prevPositions = part.indices
      .filter((i) => previous.landmarks[i] && isVisible(previous.landmarks[i]))
      .map((i) => previous.landmarks[i]);

    if (currPositions.length === 0 || prevPositions.length === 0) continue;

    const currX = currPositions.reduce((s, l) => s + l.x, 0) / currPositions.length;
    const currY = currPositions.reduce((s, l) => s + l.y, 0) / currPositions.length;
    const prevX = prevPositions.reduce((s, l) => s + l.x, 0) / prevPositions.length;
    const prevY = prevPositions.reduce((s, l) => s + l.y, 0) / prevPositions.length;

    const vx = (currX - prevX) / dtSeconds;
    const vy = (currY - prevY) / dtSeconds;
    const vMag = Math.sqrt(vx * vx + vy * vy);

    let ax = 0, ay = 0, aMag = 0;
    if (history.length >= 3) {
      const older = history[history.length - 3];
      const dtPrev = Math.abs(previous.timestamp - older.timestamp) / 1000;
      if (dtPrev > 0) {
        const olderPositions = part.indices
          .filter((i) => older.landmarks[i] && isVisible(older.landmarks[i]))
          .map((i) => older.landmarks[i]);
        if (olderPositions.length > 0) {
          const olderX = olderPositions.reduce((s, l) => s + l.x, 0) / olderPositions.length;
          const olderY = olderPositions.reduce((s, l) => s + l.y, 0) / olderPositions.length;
          const prevVx = (prevX - olderX) / dtPrev;
          const prevVy = (prevY - olderY) / dtPrev;
          ax = (vx - prevVx) / dtSeconds;
          ay = (vy - prevVy) / dtSeconds;
          aMag = Math.sqrt(ax * ax + ay * ay);
        }
      }
    }

    vectors.push({
      bodyPart: part.name,
      velocity: { x: Math.round(vx * 100) / 100, y: Math.round(vy * 100) / 100, magnitude: Math.round(vMag * 100) / 100 },
      acceleration: { x: Math.round(ax * 100) / 100, y: Math.round(ay * 100) / 100, magnitude: Math.round(aMag * 100) / 100 },
      unit: 'units/s',
    });
  }

  const overallSpeed = vectors.length > 0
    ? Math.round(vectors.reduce((s, v) => s + v.velocity.magnitude, 0) / vectors.length * 100) / 100
    : 0;

  const comVector = vectors.find((v) => v.bodyPart === 'Center of Mass');
  let dominantDirection = 'stationary';
  if (comVector && comVector.velocity.magnitude > 0.01) {
    const angle = Math.atan2(-comVector.velocity.y, comVector.velocity.x) * (180 / Math.PI);
    if (angle > -45 && angle <= 45) dominantDirection = 'right';
    else if (angle > 45 && angle <= 135) dominantDirection = 'up';
    else if (angle > -135 && angle <= -45) dominantDirection = 'down';
    else dominantDirection = 'left';
  }

  return { vectors, overallSpeed, dominantDirection };
}

export function computeFullAnalysis(landmarks: PoseLandmark[], timestamp: number = 0, history?: LandmarkSnapshot[]): FrameAnalysis {
  return {
    jointAngles: computeJointAngles(landmarks),
    symmetry: computeSymmetry(landmarks),
    centerOfMass: computeCenterOfMass(landmarks) || { x: 0.5, y: 0.5, description: 'Unable to compute' },
    strideMetrics: computeStrideMetrics(landmarks),
    leanAngle: computeLeanAngle(landmarks) || { angle: 0, direction: 'upright', description: 'Unable to compute' },
    confidence: computeConfidence(landmarks),
    motion: history ? computeMotion(history) || undefined : undefined,
    timestamp,
  };
}

export function formatAnalysisForAI(analysis: FrameAnalysis, frameInfo?: { frame: number; fps: number; timeMs: number }): string {
  let text = '';

  if (frameInfo) {
    text += `Frame: ${frameInfo.frame} | Time: ${(frameInfo.timeMs / 1000).toFixed(3)}s | FPS: ${frameInfo.fps}\n\n`;
  }

  text += '== JOINT ANGLES ==\n';
  for (const a of analysis.jointAngles) {
    text += `${a.name}: ${a.angle}°\n`;
  }

  text += '\n== BODY SYMMETRY ==\n';
  for (const s of analysis.symmetry) {
    text += `${s.name}: L=${s.leftValue} R=${s.rightValue} (${s.percentDiff}% diff, ${s.status})\n`;
  }

  text += '\n== TRUNK LEAN ==\n';
  text += `${analysis.leanAngle.angle}° (${analysis.leanAngle.direction}) — ${analysis.leanAngle.description}\n`;

  text += '\n== CENTER OF MASS ==\n';
  text += `Position: (${(analysis.centerOfMass.x * 100).toFixed(1)}%, ${(analysis.centerOfMass.y * 100).toFixed(1)}%) — ${analysis.centerOfMass.description}\n`;

  text += '\n== STRIDE & POSITION METRICS ==\n';
  for (const m of analysis.strideMetrics) {
    text += `${m.name}: ${m.value}${m.unit}\n`;
  }

  text += '\n== DETECTION CONFIDENCE ==\n';
  text += `Overall: ${analysis.confidence.overall}%\n`;
  for (const r of analysis.confidence.regions) {
    text += `  ${r.name}: ${r.score}% (${r.status})\n`;
  }

  if (analysis.motion) {
    text += '\n== MOTION (VELOCITY & ACCELERATION) ==\n';
    text += `Overall Speed: ${analysis.motion.overallSpeed} units/s | Direction: ${analysis.motion.dominantDirection}\n`;
    for (const v of analysis.motion.vectors) {
      text += `${v.bodyPart}: vel=${v.velocity.magnitude.toFixed(2)} acc=${v.acceleration.magnitude.toFixed(2)} ${v.unit}\n`;
    }
  }

  return text;
}

export function formatComparisonForAI(frameA: FrameAnalysis, frameB: FrameAnalysis, frameInfoA?: { frame: number; fps: number; timeMs: number }, frameInfoB?: { frame: number; fps: number; timeMs: number }): string {
  let text = '=== FRAME COMPARISON ===\n\n';
  text += '--- Frame A ---\n';
  text += formatAnalysisForAI(frameA, frameInfoA);
  text += '\n--- Frame B ---\n';
  text += formatAnalysisForAI(frameB, frameInfoB);

  text += '\n--- KEY DIFFERENCES ---\n';
  for (const aAngle of frameA.jointAngles) {
    const bAngle = frameB.jointAngles.find((b) => b.name === aAngle.name);
    if (bAngle) {
      const diff = bAngle.angle - aAngle.angle;
      if (Math.abs(diff) >= 3) {
        text += `${aAngle.name}: ${aAngle.angle}° → ${bAngle.angle}° (${diff > 0 ? '+' : ''}${diff}°)\n`;
      }
    }
  }

  const leanDiff = frameB.leanAngle.angle - frameA.leanAngle.angle;
  if (Math.abs(leanDiff) >= 2) {
    text += `Trunk Lean: ${frameA.leanAngle.angle}° → ${frameB.leanAngle.angle}° (${leanDiff > 0 ? '+' : ''}${leanDiff}°)\n`;
  }

  return text;
}
