import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type PhotoFinishAnalysisRouteProp = RouteProp<RootStackParamList, 'PhotoFinishAnalysis'>;

export const PhotoFinishAnalysisScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<PhotoFinishAnalysisRouteProp>();
  const [asset, setAsset] = useState<Asset | null>(
    route.params?.uri ? { uri: route.params?.uri, fileName: route.params?.fileName } : null
  );

  const pickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'video', selectionLimit: 1 });
    if (result.didCancel) return;
    if (result.errorCode) return;
    const selected = result.assets?.[0] ?? null;
    if (selected?.uri) setAsset(selected);
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={[styles.content, { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Photo Finish Analysis
            </Text>
            <Text variant="small" color="muted">
              Frame-by-frame tools (video flow)
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Pick a finish video</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.md }}>
            <Button variant="default" size="lg" onPress={pickPhoto}>
              <FontAwesome5 name="video" size={16} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={{ marginLeft: theme.spacing.sm }}>
                Choose from library
              </Text>
            </Button>

            {asset?.uri ? (
              <View style={styles.previewWrap}>
                <FontAwesome5 name="video" size={36} color={theme.colors.textMuted} solid />
                <Text variant="small" color="muted">
                  {asset.fileName || 'Selected video'}
                </Text>
              </View>
            ) : (
              <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
                No video selected yet.
              </Text>
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Coming next</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.sm }}>
            <Text variant="body" color="muted">
              - Zoom + pan
            </Text>
            <Text variant="body" color="muted">
              - Finish-line marker + angle guide
            </Text>
            <Text variant="body" color="muted">
              - Frame-by-frame (video) + export
            </Text>
            <Text variant="small" color="muted" style={{ marginTop: theme.spacing.md }}>
              This screen exists to ensure Photo Finish has a real destination on mobile and never crashes. We’ll fill it out further in the next iteration.
            </Text>
          </CardContent>
        </Card>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { marginBottom: 0 },
  previewWrap: {
    width: '100%',
    height: 240,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  preview: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.backgroundSolid,
  },
});


