import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { PoseLandmark } from './MediaPipeBridge';

interface PoseOverlayProps {
  landmarks: PoseLandmark[];
  width: number;
  height: number;
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

export const PoseOverlay: React.FC<PoseOverlayProps> = ({ landmarks, width, height }) => {
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

    return (
      <View
        key={`line-${idx}`}
        style={[
          styles.line,
          {
            left: posA.x,
            top: posA.y,
            width: length,
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

    return (
      <View
        key={`dot-${idx}`}
        style={[
          styles.dot,
          {
            left: x - LANDMARK_SIZE / 2,
            top: y - LANDMARK_SIZE / 2,
          },
        ]}
      />
    );
  });

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {connectionLines}
      {landmarkDots}
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
    backgroundColor: '#00FF88',
    transformOrigin: 'left center',
    borderRadius: 1.5,
    opacity: 0.85,
  },
  dot: {
    position: 'absolute',
    width: LANDMARK_SIZE,
    height: LANDMARK_SIZE,
    borderRadius: LANDMARK_SIZE / 2,
    backgroundColor: '#FF3366',
    borderWidth: 1,
    borderColor: '#fff',
  },
});
