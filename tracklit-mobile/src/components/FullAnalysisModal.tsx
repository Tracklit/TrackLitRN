import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { AdvancedAnalysis } from '@/components/AdvancedAnalysis';
import { FrameComparison } from '@/components/FrameComparison';
import type { PoseLandmark } from '@/components/MediaPipeBridge';
import type { FrameAnalysis, LandmarkSnapshot } from '@/utils/poseAnalysis';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface CapturedFrame {
  uri: string;
  landmarks: PoseLandmark[];
  timeMs: number;
  frame: number;
}

interface FullAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  landmarks: PoseLandmark[] | null;
  timestamp: number;
  onRequestAI: (analysis: FrameAnalysis) => void;
  aiLoading: boolean;
  frameA: CapturedFrame | null;
  frameB: CapturedFrame | null;
  onCaptureFrame: () => void;
  onClearFrames: () => void;
  canCapture: boolean;
  landmarkHistory?: LandmarkSnapshot[];
}

export const FullAnalysisModal: React.FC<FullAnalysisModalProps> = ({
  visible,
  onClose,
  landmarks,
  timestamp,
  onRequestAI,
  aiLoading,
  frameA,
  frameB,
  onCaptureFrame,
  onClearFrames,
  canCapture,
  landmarkHistory,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text variant="h3" weight="bold" style={styles.headerTitle}>Analysis</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <FrameComparison
              frameA={frameA}
              frameB={frameB}
              onCaptureFrame={onCaptureFrame}
              onClear={onClearFrames}
              canCapture={canCapture}
            />

            <AdvancedAnalysis
              landmarks={landmarks}
              timestamp={timestamp}
              onRequestAI={onRequestAI}
              aiLoading={aiLoading}
              landmarkHistory={landmarkHistory}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#fff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 16,
  },
});
