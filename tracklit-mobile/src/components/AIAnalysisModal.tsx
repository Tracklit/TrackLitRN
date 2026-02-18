import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { X, Brain, Barbell } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/types';

interface AIAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  analysis: string | null;
  error: string | null;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  visible,
  onClose,
  loading,
  analysis,
  error,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleCreateProgram = () => {
    onClose();
    navigation.navigate('ProgramCreate' as any);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Brain size={22} color="#FF9800" weight="fill" />
              <Text variant="h3" weight="bold" style={styles.title}>AI Analysis</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#fff" weight="bold" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF9800" />
                <Text variant="body" style={styles.loadingText}>
                  Analyzing your form and technique...
                </Text>
                <Text variant="small" style={styles.loadingSubtext}>
                  This may take a few seconds
                </Text>
              </View>
            )}

            {error && (
              <View style={styles.errorCard}>
                <Text variant="body" weight="bold" style={styles.errorTitle}>Analysis Failed</Text>
                <Text variant="small" style={styles.errorText}>{error}</Text>
              </View>
            )}

            {analysis && !loading && (
              <View style={styles.analysisContent}>
                {parseAnalysisSections(analysis).map((section, i) => (
                  <View key={i} style={styles.section}>
                    {section.title && (
                      <Text variant="body" weight="bold" style={styles.sectionTitle}>
                        {section.title}
                      </Text>
                    )}
                    <Text variant="small" style={styles.sectionText}>
                      {section.content}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity style={styles.programBtn} onPress={handleCreateProgram} activeOpacity={0.7}>
                  <Barbell size={20} color="#fff" weight="fill" />
                  <Text variant="body" weight="bold" style={styles.programBtnText}>
                    Create Improvement Program
                  </Text>
                </TouchableOpacity>

                <Text variant="small" style={styles.disclaimer}>
                  AI analysis is a guide — always consult with your coach for personalized training decisions.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function parseAnalysisSections(text: string): { title: string | null; content: string }[] {
  const lines = text.split('\n');
  const sections: { title: string | null; content: string }[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+(.+)/);
    const boldMatch = line.match(/^\*\*(.+?)\*\*/);

    if (headerMatch || boldMatch) {
      if (currentLines.length > 0) {
        sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
        currentLines = [];
      }
      currentTitle = headerMatch ? headerMatch[1] : boldMatch![1];
      const remainder = line.replace(/^#{1,3}\s+.+/, '').replace(/^\*\*.+?\*\*:?\s*/, '').trim();
      if (remainder) currentLines.push(remainder);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || currentTitle) {
    sections.push({ title: currentTitle, content: currentLines.join('\n').trim() });
  }

  if (sections.length === 0 && text.trim()) {
    sections.push({ title: null, content: text.trim() });
  }

  return sections;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  container: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#fff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#888',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,51,102,0.2)',
  },
  errorTitle: {
    color: '#FF3366',
    marginBottom: 6,
  },
  errorText: {
    color: '#ccc',
  },
  analysisContent: {
    paddingVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FF9800',
    fontSize: 15,
    marginBottom: 6,
  },
  sectionText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },
  programBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#00CC66',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 12,
  },
  programBtnText: {
    color: '#fff',
    fontSize: 15,
  },
  disclaimer: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
});
