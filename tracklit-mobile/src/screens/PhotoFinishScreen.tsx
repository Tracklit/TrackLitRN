import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

export const PhotoFinishScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);

  const handleSelectFromLibrary = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        selectionLimit: 1,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        navigation.navigate('PhotoFinishAnalysis', {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName,
        });
      }
    } catch (error) {
      Alert.alert('Library Error', 'Unable to access video library. Please check permissions.');
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!selectedImage) {
      Alert.alert('No Video', 'Please select a video first.');
      return;
    }
    navigation.navigate('PhotoFinishAnalysis', {
      uri: selectedImage.uri,
      fileName: selectedImage.fileName,
    });
  }, [selectedImage]);

  const handleClearImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + theme.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <Text variant="h2" weight="bold" color="foreground">
            Photo Finish
          </Text>
          <View style={styles.backButton} />
        </View>

        <Text variant="body" color="muted" style={styles.description}>
          Upload a race finish video to analyze frame by frame.
        </Text>

        {/* Video Preview */}
        <Card style={styles.imageCard}>
          <CardContent style={styles.imageContainer}>
            {selectedImage ? (
              <View style={styles.imageWrapper}>
                <View style={styles.videoPlaceholder}>
                  <FontAwesome5 name="video" size={48} color={theme.colors.textMuted} solid />
                  <Text variant="small" color="muted" style={styles.placeholderText}>
                    {selectedImage.fileName || 'Selected video'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearImage}
                >
                  <FontAwesome5 name="times-circle" size={24} color={theme.colors.destructive} solid />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <FontAwesome5 name="video" size={48} color={theme.colors.textMuted} solid />
                <Text variant="body" color="muted" style={styles.placeholderText}>
                  No video selected
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            variant="default"
            size="lg"
            onPress={handleSelectFromLibrary}
            style={styles.actionButton}
          >
            <FontAwesome5 name="upload" size={18} color="white" solid />
            <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
              Select Video
            </Text>
          </Button>
        </View>

        {/* Analyze Button */}
        {selectedImage && (
          <Button
            variant="default"
            size="lg"
            onPress={handleAnalyze}
            style={styles.analyzeButton}
          >
            <FontAwesome5 name="search" size={18} color="white" solid />
            <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
              Analyze Video
            </Text>
          </Button>
        )}

        <Button
          variant="outline"
          size="lg"
          onPress={() => navigation.navigate('PhotoFinishAnalysis')}
          style={styles.analyzeButtonAlt}
        >
          <FontAwesome5 name="sliders-h" size={18} color={theme.colors.foreground} solid />
          <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
            Open analysis tools
          </Text>
        </Button>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <CardContent>
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.infoTitle}>
              How it works
            </Text>
            <View style={styles.infoItem}>
              <FontAwesome5 name="check-circle" size={16} color={theme.colors.primary} solid />
              <Text variant="body" color="muted" style={styles.infoText}>
                Upload a video of the race finish
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="check-circle" size={16} color={theme.colors.primary} solid />
              <Text variant="body" color="muted" style={styles.infoText}>
                Analyze the video frame by frame
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="check-circle" size={16} color={theme.colors.primary} solid />
              <Text variant="body" color="muted" style={styles.infoText}>
                Get a detailed breakdown of finish positions
              </Text>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    textAlign: 'center',
  },
  imageCard: {
    minHeight: 250,
  },
  imageContainer: {
    flex: 1,
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 230,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  clearButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: theme.spacing.xs,
  },
  placeholder: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  placeholderText: {
    marginTop: theme.spacing.sm,
  },
  actions: {
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  buttonText: {
    marginLeft: theme.spacing.sm,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.success,
  },
  analyzeButtonAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  infoCard: {
    marginTop: theme.spacing.md,
  },
  infoTitle: {
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
  },
});

