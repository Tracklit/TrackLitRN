import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

export const PhotoFinishScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTakePhoto = useCallback(async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 1,
        saveToPhotos: true,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Unable to access camera. Please check permissions.');
    }
  }, []);

  const handleSelectFromLibrary = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Library Error', 'Unable to access photo library. Please check permissions.');
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select or take a photo first.');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis (in production, this would call an API)
    setTimeout(() => {
      setIsAnalyzing(false);
      Alert.alert(
        'Analysis Complete',
        'Photo finish analysis with frame-by-frame breakdown is coming soon! This feature will help you analyze race finishes in detail.',
        [{ text: 'OK' }]
      );
    }, 2000);
  }, [selectedImage]);

  const handleClearImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        style={styles.scrollView}
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
          Capture or select a race finish photo to analyze frame by frame.
        </Text>

        {/* Image Preview */}
        <Card style={styles.imageCard}>
          <CardContent style={styles.imageContainer}>
            {selectedImage ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearImage}
                >
                  <FontAwesome5 name="times-circle" size={24} color={theme.colors.destructive} solid />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <FontAwesome5 name="camera" size={48} color={theme.colors.textMuted} solid />
                <Text variant="body" color="muted" style={styles.placeholderText}>
                  No image selected
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
            onPress={handleTakePhoto}
            style={styles.actionButton}
          >
            <FontAwesome5 name="camera" size={18} color="white" solid />
            <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
              Take Photo
            </Text>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onPress={handleSelectFromLibrary}
            style={styles.actionButton}
          >
            <FontAwesome5 name="images" size={18} color={theme.colors.foreground} solid />
            <Text variant="body" weight="bold" color="foreground" style={styles.buttonText}>
              Choose from Library
            </Text>
          </Button>
        </View>

        {/* Analyze Button */}
        {selectedImage && (
          <Button
            variant="default"
            size="lg"
            onPress={handleAnalyze}
            loading={isAnalyzing}
            style={styles.analyzeButton}
          >
            <FontAwesome5 name="search" size={18} color="white" solid />
            <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
              {isAnalyzing ? 'Analyzing...' : 'Analyze Photo'}
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
                Capture or select a photo of the race finish
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="check-circle" size={16} color={theme.colors.primary} solid />
              <Text variant="body" color="muted" style={styles.infoText}>
                AI analyzes the image frame by frame
              </Text>
            </View>
            <View style={styles.infoItem}>
              <FontAwesome5 name="check-circle" size={16} color={theme.colors.primary} solid />
              <Text variant="body" color="muted" style={styles.infoText}>
                Get detailed breakdown of finish positions
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
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.lg,
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

