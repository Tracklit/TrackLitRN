import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { AdvancedAnalysis } from '@/components/AdvancedAnalysis';
import { FrameComparison } from '@/components/FrameComparison';
import type { PoseLandmark } from '@/components/MediaPipeBridge';
import type { FrameAnalysis, LandmarkSnapshot } from '@/utils/poseAnalysis';

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
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text variant="h3" weight="bold" style={styles.headerTitle}>Analysis</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#fff" weight="bold" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#fff',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
});
