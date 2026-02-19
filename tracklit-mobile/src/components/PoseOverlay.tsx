import React from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import type { PoseLandmark } from './MediaPipeBridge';

interface PoseOverlayProps {
  landmarks: PoseLandmark[];
  width: number;
  height: number;
  colorByConfidence?: boolean;
  showAngles?: boolean;
}

const CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 23], [12, 24],
  [23, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28],
  [15, 17], [15, 19], [15, 21],
  [16, 18], [16, 20], [16, 22],
  [27, 29], [27, 31],
  [28, 30], [28, 32],
];

const VISIBILITY_THRESHOLD = 0.5;
const LANDMARK_SIZE = 6;

function getConfidenceColor(visibility: number): string {
  if (visibility >= 0.7) return '#00FF88';
  if (visibility >= 0.4) return '#FFD600';
  return '#FF3366';
}

function getLineColor(visA: number, visB: number): string {
  const avg = (visA + visB) / 2;
  if (avg >= 0.7) return '#00FF88';
  if (avg >= 0.4) return '#FFD600';
  return '#FF6644';
}

const ANGLE_JOINTS: { a: number; b: number; c: number; label: string }[] = [
  { a: 11, b: 13, c: 15, label: 'L.Elb' },
  { a: 12, b: 14, c: 16, label: 'R.Elb' },
  { a: 23, b: 25, c: 27, label: 'L.Knee' },
  { a: 24, b: 26, c: 28, label: 'R.Knee' },
  { a: 11, b: 23, c: 25, label: 'L.Hip' },
  { a: 12, b: 24, c: 26, label: 'R.Hip' },
  { a: 23, b: 11, c: 13, label: 'L.Shldr' },
  { a: 24, b: 12, c: 14, label: 'R.Shldr' },
];

function calcJointAngle(lmA: PoseLandmark, lmB: PoseLandmark, lmC: PoseLandmark): number {
  const ba = { x: lmA.x - lmB.x, y: lmA.y - lmB.y };
  const bc = { x: lmC.x - lmB.x, y: lmC.y - lmB.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBA = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
  const magBC = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
  if (magBA === 0 || magBC === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.round((Math.acos(cosAngle) * 180) / Math.PI);
}

export const PoseOverlay: React.FC<PoseOverlayProps> = ({ landmarks, width, height, colorByConfidence = true, showAngles = false }) => {
  if (!landmarks || landmarks.length === 0 || width === 0 || height === 0) return null;

  const getPos = (idx: number) => {
    const lm = landmarks[idx];
    if (!lm || lm.visibility < VISIBILITY_THRESHOLD) return null;
    return { x: lm.x * width, y: lm.y * height };
  };

  const connectionLines = CONNECTIONS.map(([a, b], idx) => {
    const posA = getPos(a);
    const posB = getPos(b);
    if (!posA || !posB) return null;

    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const lineColor = colorByConfidence
      ? getLineColor(landmarks[a].visibility, landmarks[b].visibility)
      : '#00FF88';

    return (
      <View
        key={`line-${idx}`}
        style={[
          styles.line,
          {
            left: posA.x,
            top: posA.y,
            width: length,
            backgroundColor: lineColor,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      />
    );
  });

  const landmarkDots = landmarks.map((lm, idx) => {
    if (idx < 11 || lm.visibility < VISIBILITY_THRESHOLD) return null;
    const x = lm.x * width;
    const y = lm.y * height;

    const dotColor = colorByConfidence ? getConfidenceColor(lm.visibility) : '#FF3366';

    return (
      <View
        key={`dot-${idx}`}
        style={[
          styles.dot,
          {
            left: x - LANDMARK_SIZE / 2,
            top: y - LANDMARK_SIZE / 2,
            backgroundColor: dotColor,
          },
        ]}
      />
    );
  });

  const angleLabels = showAngles ? ANGLE_JOINTS.map((joint, idx) => {
    const lmA = landmarks[joint.a];
    const lmB = landmarks[joint.b];
    const lmC = landmarks[joint.c];
    if (!lmA || !lmB || !lmC) return null;
    if (lmA.visibility < VISIBILITY_THRESHOLD || lmB.visibility < VISIBILITY_THRESHOLD || lmC.visibility < VISIBILITY_THRESHOLD) return null;

    const angle = calcJointAngle(lmA, lmB, lmC);
    const pos = getPos(joint.b);
    if (!pos) return null;

    return (
      <View
        key={`angle-${idx}`}
        style={[styles.angleLabel, { left: pos.x + 8, top: pos.y - 10 }]}
      >
        <RNText style={styles.angleLabelText}>{angle}°</RNText>
      </View>
    );
  }) : null;

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {connectionLines}
      {landmarkDots}
      {angleLabels}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  line: {
    position: 'absolute',
    height: 3,
    transformOrigin: 'left center',
    borderRadius: 1.5,
    opacity: 0.85,
  },
  dot: {
    position: 'absolute',
    width: LANDMARK_SIZE,
    height: LANDMARK_SIZE,
    borderRadius: LANDMARK_SIZE / 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  angleLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.5)',
  },
  angleLabelText: {
    color: '#FF9800',
    fontSize: 9,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
