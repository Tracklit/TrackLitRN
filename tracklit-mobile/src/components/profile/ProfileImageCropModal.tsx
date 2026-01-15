import React, { useMemo, useRef, useState } from 'react';
import { Modal, View, StyleSheet, PanResponder, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import theme from '@/utils/theme';

interface ProfileImageCropModalProps {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onSave: (uri: string) => void;
}

export const ProfileImageCropModal: React.FC<ProfileImageCropModalProps> = ({
  visible,
  imageUri,
  onCancel,
  onSave,
}) => {
  const [scale, setScale] = useState(1);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {},
      }),
    [pan],
  );

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text variant="h3" weight="bold" color="foreground" style={styles.title}>
            Adjust Profile Image
          </Text>
          <Text variant="small" color="muted" style={styles.helper}>
            Drag to reposition and use the slider to zoom. We’ll upload the original image.
          </Text>

          <View style={styles.previewContainer}>
            <View style={styles.previewCircle}>
              {imageUri ? (
                <Animated.Image
                  source={{ uri: imageUri }}
                  style={[
                    styles.previewImage,
                    {
                      transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale },
                      ],
                    },
                  ]}
                  {...panResponder.panHandlers}
                />
              ) : (
                <Text variant="small" color="muted">
                  No image selected
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sliderRow}>
            <Text variant="small" color="muted">
              Zoom
            </Text>
            <Slider
              value={scale}
              onValueChange={setScale}
              minimumValue={0.8}
              maximumValue={3}
              step={0.05}
              style={styles.slider}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.border}
            />
          </View>

          <View style={styles.actions}>
            <Button variant="outline" onPress={onCancel} style={styles.actionButton}>
              Cancel
            </Button>
            <Button
              variant="default"
              onPress={() => {
                if (imageUri) {
                  onSave(imageUri);
                } else {
                  onCancel();
                }
              }}
              style={styles.actionButton}
            >
              Save Image
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modal: {
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#0f172a',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  helper: {
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 220,
    height: 220,
  },
  sliderRow: {
    gap: theme.spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

