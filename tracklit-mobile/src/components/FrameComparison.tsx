import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { X, Camera } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { PoseOverlay } from '@/components/PoseOverlay';
import type { PoseLandmark } from '@/components/MediaPipeBridge';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
interface CapturedFrame {
  uri: string;
  landmarks: PoseLandmark[];
  timeMs: number;
  frame: number;
}

interface FrameComparisonProps {
  frameA: CapturedFrame | null;
  frameB: CapturedFrame | null;
  onCaptureFrame: () => void;
  onClear: () => void;
  canCapture: boolean;
}

const FRAME_WIDTH = 160;
const FRAME_HEIGHT = 100;

export const FrameComparison: React.FC<FrameComparisonProps> = ({
  frameA,
  frameB,
  onCaptureFrame,
  onClear,
  canCapture,
}) => {
  const { styles } = useThemedStyles(createStyles);
  const hasFrames = frameA || frameB;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="body" weight="bold" style={styles.title}>Frame Comparison</Text>
        {hasFrames && (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
            <X size={14} color="#FF3366" weight="bold" />
            <Text variant="small" style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.frames}>
        <View style={styles.frameSlot}>
          {frameA ? (
            <View style={styles.frameContent}>
              <Image source={{ uri: frameA.uri }} style={styles.frameImage} resizeMode="cover" />
              <PoseOverlay
                landmarks={frameA.landmarks}
                width={FRAME_WIDTH}
                height={FRAME_HEIGHT}
                colorByConfidence
              />
              <View style={styles.frameLabel}>
                <Text variant="small" style={styles.frameLabelText}>
                  {(frameA.timeMs / 1000).toFixed(2)}s | F{frameA.frame}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyFrame}
              onPress={canCapture ? onCaptureFrame : undefined}
              activeOpacity={0.7}
              disabled={!canCapture}
            >
              <Camera size={24} color={canCapture ? '#FF9800' : '#555'} weight="fill" />
              <Text variant="small" style={styles.emptyText}>
                {canCapture ? 'Capture Frame A' : 'Enable pose first'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.vsContainer}>
          <Text variant="small" weight="bold" style={styles.vsText}>vs</Text>
        </View>

        <View style={styles.frameSlot}>
          {frameB ? (
            <View style={styles.frameContent}>
              <Image source={{ uri: frameB.uri }} style={styles.frameImage} resizeMode="cover" />
              <PoseOverlay
                landmarks={frameB.landmarks}
                width={FRAME_WIDTH}
                height={FRAME_HEIGHT}
                colorByConfidence
              />
              <View style={styles.frameLabel}>
                <Text variant="small" style={styles.frameLabelText}>
                  {(frameB.timeMs / 1000).toFixed(2)}s | F{frameB.frame}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyFrame}
              onPress={canCapture && frameA ? onCaptureFrame : undefined}
              activeOpacity={0.7}
              disabled={!canCapture || !frameA}
            >
              <Camera size={24} color={canCapture && frameA ? '#FF9800' : '#555'} weight="fill" />
              <Text variant="small" style={styles.emptyText}>
                {!frameA ? 'Capture A first' : canCapture ? 'Capture Frame B' : 'Enable pose first'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {frameA && frameB && (
        <View style={styles.diffSummary}>
          <Text variant="small" style={styles.diffTitle}>Quick Diff</Text>
          <Text variant="small" style={styles.diffDesc}>
            Time gap: {Math.abs(frameB.timeMs - frameA.timeMs).toFixed(0)}ms ({Math.abs(frameB.frame - frameA.frame)} frames)
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    backgroundColor: t.colors.overlaySubtle,
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: t.colors.textPrimary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearText: {
    color: '#FF3366',
    fontSize: 12,
  },
  frames: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  frameSlot: {
    flex: 1,
    height: FRAME_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
  },
  frameContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  frameLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  frameLabelText: {
    color: t.colors.textPrimary,
    fontSize: 9,
  },
  emptyFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.colors.overlayMedium,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  vsContainer: {
    width: 24,
    alignItems: 'center',
  },
  vsText: {
    color: '#666',
    fontSize: 12,
  },
  diffSummary: {
    marginTop: 10,
    backgroundColor: 'rgba(255,152,0,0.08)',
    padding: 10,
    borderRadius: 8,
  },
  diffTitle: {
    color: '#FF9800',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  diffDesc: {
    color: '#aaa',
    fontSize: 11,
  },
});
