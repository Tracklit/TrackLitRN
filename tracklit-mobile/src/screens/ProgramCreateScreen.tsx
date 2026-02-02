import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import DocumentPicker, { type DocumentPickerResponse } from 'react-native-document-picker';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { uploadProgramFile } from '@/lib/upload';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Visibility = 'public' | 'private' | 'premium';

type PriceType = 'spikes' | 'money';

type DurationWeeks = 1 | 2 | 4 | 6 | 8 | 12;

type CreateMethod = 'builder' | 'upload' | 'text' | 'sprinthia' | 'import';

type CreateProgramPayload = {
  title: string;
  description?: string;
  visibility: Visibility;
  price: number;
  priceType: PriceType;
  duration: number;
  isTextBased?: boolean;
  textContent?: string;
};

type SprinthiaFormData = {
  totalLengthWeeks: number;
  blocks: number;
  workoutsPerWeek: number;
  gymWorkoutsPerWeek: number;
  blockFocus:
    | 'speed'
    | 'speed-maintenance'
    | 'speed-endurance'
    | 'mixed'
    | 'short-to-long'
    | 'long-to-short';
  aiPrompt: string;
};

export const ProgramCreateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [selectedMethod, setSelectedMethod] = useState<CreateMethod | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [priceType, setPriceType] = useState<PriceType>('spikes');
  const [price, setPrice] = useState('0');
  const [duration, setDuration] = useState<DurationWeeks>(4);
  const [textContent, setTextContent] = useState('');
  const [uploadFile, setUploadFile] = useState<DocumentPickerResponse | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTitle, setImportTitle] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importSheetUrl, setImportSheetUrl] = useState('');
  const [importVisibility, setImportVisibility] = useState<Visibility>('private');
  const [importDuration, setImportDuration] = useState('30');
  const [importCategory, setImportCategory] = useState('sprint');
  const [importLevel, setImportLevel] = useState('intermediate');
  const [sprinthiaData, setSprinthiaData] = useState<SprinthiaFormData>({
    totalLengthWeeks: 4,
    blocks: 2,
    workoutsPerWeek: 4,
    gymWorkoutsPerWeek: 2,
    blockFocus: 'speed',
    aiPrompt: '',
  });
  const [generatedProgram, setGeneratedProgram] = useState<string | null>(null);

  const ensurePricing = (nextVisibility: Visibility) => {
    if (nextVisibility !== 'premium') {
      setPrice('0');
    }
  };

  const createProgramMutation = useMutation({
    mutationFn: async (payload: CreateProgramPayload) => {
      if (!isAuthenticated || isGuest) {
        throw new Error('Login required');
      }
      if (!payload.title.trim()) {
        throw new Error('Program title is required');
      }
      if (payload.isTextBased && !payload.textContent?.trim()) {
        throw new Error('Program content is required');
      }

      return apiRequest<{ id: number | string }>('/api/programs', {
        method: 'POST',
        data: payload,
      });
    },
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Created', 'Your program was created successfully.');
      if (program?.id !== undefined) {
        if (selectedMethod === 'text') {
          navigation.navigate('MainTabs', { screen: 'Programs' } as never);
        } else if (selectedMethod === 'builder') {
          navigation.replace('ProgramEditor', { id: program.id });
        } else {
          navigation.replace('ProgramDetail', { id: program.id });
        }
      } else {
        navigation.goBack();
      }
    },
    onError: (error: Error) => {
      Alert.alert('Unable to create program', error.message || 'Please try again.');
    },
  });

  const uploadProgramMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) {
        throw new Error('Login required');
      }
      if (!uploadFile) {
        throw new Error('Select a file to upload');
      }
      if (!title.trim()) {
        throw new Error('Program title is required');
      }

      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error('Price must be 0 or greater');
      }

      return uploadProgramFile({
        file: uploadFile,
        fields: {
          title: title.trim(),
          description: description.trim(),
          visibility,
          price: priceNum,
          priceType,
          duration,
        },
      });
    },
    onSuccess: (program: { id?: number | string }) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Uploaded', 'Your program document was uploaded successfully.');
      if (program?.id !== undefined) {
        navigation.replace('ProgramDetail', { id: program.id });
      } else {
        navigation.goBack();
      }
    },
    onError: (error: Error) => {
      Alert.alert('Unable to upload program', error.message || 'Please try again.');
    },
  });

  const importSheetMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) {
        throw new Error('Login required');
      }
      if (!importTitle.trim()) {
        throw new Error('Program title is required');
      }
      if (!importSheetUrl.trim()) {
        throw new Error('Google Sheet URL is required');
      }

      const durationNum = Number(importDuration);
      if (!Number.isFinite(durationNum) || durationNum <= 0) {
        throw new Error('Duration must be at least 1 day');
      }

      return apiRequest<{ program: { id: number | string }; importedSessions: number }>(
        '/api/programs/import-sheet',
        {
          method: 'POST',
          data: {
            title: importTitle.trim(),
            description: importDescription.trim(),
            googleSheetUrl: importSheetUrl.trim(),
            category: importCategory,
            level: importLevel,
            visibility: importVisibility,
            duration: durationNum,
          },
        },
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert(
        'Imported',
        `Program imported successfully with ${response?.importedSessions ?? 0} sessions.`,
      );
      setShowImportModal(false);
      if (response?.program?.id !== undefined) {
        navigation.replace('ProgramDetail', { id: response.program.id });
      } else {
        navigation.navigate('MainTabs', { screen: 'Programs' } as never);
      }
    },
    onError: (error: Error) => {
      Alert.alert('Import failed', error.message || 'Please try again.');
    },
  });

  const generateSprinthiaMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) {
        throw new Error('Login required');
      }
      if (!title.trim()) {
        throw new Error('Program title is required');
      }
      if (!sprinthiaData.aiPrompt.trim()) {
        throw new Error('AI prompt is required');
      }

      return apiRequest<{ content: string }>('/api/sprinthia/generate-program', {
        method: 'POST',
        data: {
          ...sprinthiaData,
          title: title.trim(),
          description: description.trim(),
        },
      });
    },
    onSuccess: (response) => {
      setGeneratedProgram(response?.content ?? null);
      Alert.alert('Generated', 'Your AI program is ready to review.');
    },
    onError: (error: Error) => {
      Alert.alert('Generation failed', error.message || 'Please try again.');
    },
  });

  const regenerateSprinthiaMutation = useMutation({
    mutationFn: async () => {
      if (!generatedProgram) {
        throw new Error('No program to rewrite');
      }
      return apiRequest<{ content: string }>('/api/sprinthia/regenerate-program', {
        method: 'POST',
        data: {
          ...sprinthiaData,
          title: title.trim(),
          description: description.trim(),
          previousContent: generatedProgram,
        },
      });
    },
    onSuccess: (response) => {
      setGeneratedProgram(response?.content ?? null);
    },
    onError: (error: Error) => {
      Alert.alert('Rewrite failed', error.message || 'Please try again.');
    },
  });

  const pill = (selected: boolean) => [styles.pill, selected && styles.pillActive];

  const methods = [
    {
      id: 'upload' as const,
      title: 'Upload Document',
      description: 'Share existing training documents in PDF or DOCX format.',
      icon: 'file-upload',
    },
    {
      id: 'builder' as const,
      title: 'Program Builder',
      description: 'Create a structured program with sessions and exercises.',
      icon: 'clipboard-list',
    },
    {
      id: 'text' as const,
      title: 'Text Based',
      description: 'Create a simple text-based program for Practice view.',
      icon: 'keyboard',
    },
    {
      id: 'sprinthia' as const,
      title: 'Build With Sprinthia',
      description: 'Generate a text program with AI assistance.',
      icon: 'robot',
    },
    {
      id: 'import' as const,
      title: 'Import from Sheets',
      description: 'Connect Google Sheets for auto-sync.',
      icon: 'upload',
    },
  ];

  const pickUploadFile = async () => {
    try {
      const file = await DocumentPicker.pickSingle({
        type: DocumentPicker.types.allFiles,
        copyTo: 'cachesDirectory',
      });
      setUploadFile({
        ...file,
        uri: file.fileCopyUri ?? file.uri,
      });
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }
      Alert.alert('File selection failed', 'Unable to select a document.');
    }
  };

  const handleCreateBuilder = () => {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert('Invalid price', 'Price must be 0 or greater.');
      return;
    }

    createProgramMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      visibility,
      price: priceNum,
      priceType,
      duration,
    });
  };

  const handleCreateText = () => {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert('Invalid price', 'Price must be 0 or greater.');
      return;
    }

    createProgramMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      visibility,
      price: priceNum,
      priceType,
      duration,
      isTextBased: true,
      textContent: textContent.trim(),
    });
  };

  const continueToEditSprinthia = () => {
    if (!generatedProgram) return;
    setTextContent(generatedProgram);
    setGeneratedProgram(null);
    setSelectedMethod('text');
  };

  const showPricing = visibility === 'premium';

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <LinearGradient
        colors={theme.gradients.webHeader.colors}
        start={theme.gradients.webHeader.start}
        end={theme.gradients.webHeader.end}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color="white" solid />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="primary-foreground">
          Create Program
        </Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text variant="h3" weight="bold" color="foreground">
            Create New Program
          </Text>
          <Text variant="body" color="muted">
            Build a training program for your athletes or share with the community.
          </Text>
        </View>

        {!selectedMethod ? (
          <View style={styles.methodGrid}>
            {methods.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.methodCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (item.id === 'import') {
                    setShowImportModal(true);
                  } else {
                    setSelectedMethod(item.id);
                  }
                }}
              >
                <LinearGradient
                  colors={theme.gradients.webPurple.colors}
                  start={theme.gradients.webPurple.start}
                  end={theme.gradients.webPurple.end}
                  style={styles.methodCardContent}
                >
                  <View style={styles.methodIcon}>
                    <FontAwesome5 name={item.icon as any} size={20} color="white" solid />
                  </View>
                  <Text variant="body" weight="bold" color="primary-foreground" style={styles.methodTitle}>
                    {item.title}
                  </Text>
                  <Text variant="small" color="primary-foreground" style={styles.methodDescription}>
                    {item.description}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Button
            variant="outline"
            onPress={() => setSelectedMethod(null)}
            style={styles.chooseMethodButton}
          >
            <FontAwesome5 name="arrow-left" size={14} color={theme.colors.primaryForeground} solid />
            <Text variant="small" weight="medium" color="primary-foreground" style={styles.chooseMethodText}>
              Choose Different Method
            </Text>
          </Button>
        )}

        {selectedMethod === 'builder' && (
          <Card style={styles.card}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardHeaderRow}>
                <FontAwesome5 name="book-open" size={16} color={theme.colors.primary} solid />
                <CardTitle>Build Custom Program</CardTitle>
              </View>
              <Text variant="small" color="muted">
                Create a structured training program with custom sessions and exercises.
              </Text>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              <TextInput
                style={styles.input}
                placeholder="Program title"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={theme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text variant="body" weight="semiBold" color="foreground">
                Visibility
              </Text>
              <View style={styles.pillRow}>
                {(['public', 'private', 'premium'] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={pill(visibility === v)}
                    onPress={() => {
                      setVisibility(v);
                      ensurePricing(v);
                    }}
                  >
                    <Text
                      variant="small"
                      weight="medium"
                      color={visibility === v ? 'foreground' : 'muted'}
                      style={visibility === v ? styles.pillTextActive : undefined}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text variant="body" weight="semiBold" color="foreground">
                Duration
              </Text>
              <View style={styles.pillRow}>
                {([1, 2, 4, 6, 8, 12] as const).map((w) => (
                  <TouchableOpacity key={w} style={pill(duration === w)} onPress={() => setDuration(w)}>
                    <Text
                      variant="small"
                      weight="medium"
                      color={duration === w ? 'foreground' : 'muted'}
                      style={duration === w ? styles.pillTextActive : undefined}
                    >
                      {w}w
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showPricing && (
                <>
                  <Text variant="body" weight="semiBold" color="foreground">
                    Pricing
                  </Text>
                  <View style={styles.pillRow}>
                    {(['spikes', 'money'] as const).map((t) => (
                      <TouchableOpacity key={t} style={pill(priceType === t)} onPress={() => setPriceType(t)}>
                        <Text
                          variant="small"
                          weight="medium"
                          color={priceType === t ? 'foreground' : 'muted'}
                          style={priceType === t ? styles.pillTextActive : undefined}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor={theme.colors.textMuted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <Button
                variant="default"
                size="lg"
                onPress={handleCreateBuilder}
                loading={createProgramMutation.isPending}
                disabled={!isAuthenticated || isGuest}
              >
                <FontAwesome5 name="check" size={16} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Create Program
                </Text>
              </Button>

              {(!isAuthenticated || isGuest) && (
                <Text variant="small" color="muted" style={styles.helperText}>
                  Sign in to create programs.
                </Text>
              )}
            </CardContent>
          </Card>
        )}

        {selectedMethod === 'upload' && (
          <Card style={styles.card}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardHeaderRow}>
                <FontAwesome5 name="file-upload" size={16} color={theme.colors.primary} solid />
                <CardTitle>Upload Program Document</CardTitle>
              </View>
              <Text variant="small" color="muted">
                Share existing training documents in PDF or DOCX format.
              </Text>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              <TextInput
                style={styles.input}
                placeholder="Program title"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={theme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TouchableOpacity style={styles.uploadPicker} onPress={pickUploadFile}>
                <FontAwesome5 name="paperclip" size={16} color="white" solid />
                <Text variant="small" weight="medium" color="primary-foreground">
                  {uploadFile?.name ?? 'Choose file'}
                </Text>
              </TouchableOpacity>
              <Text variant="small" color="muted">
                Supported formats: PDF, DOC, DOCX (max 10MB)
              </Text>

              <Text variant="body" weight="semiBold" color="foreground">
                Visibility
              </Text>
              <View style={styles.pillRow}>
                {(['public', 'private', 'premium'] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={pill(visibility === v)}
                    onPress={() => {
                      setVisibility(v);
                      ensurePricing(v);
                    }}
                  >
                    <Text
                      variant="small"
                      weight="medium"
                      color={visibility === v ? 'foreground' : 'muted'}
                      style={visibility === v ? styles.pillTextActive : undefined}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showPricing && (
                <>
                  <Text variant="body" weight="semiBold" color="foreground">
                    Pricing
                  </Text>
                  <View style={styles.pillRow}>
                    {(['spikes', 'money'] as const).map((t) => (
                      <TouchableOpacity key={t} style={pill(priceType === t)} onPress={() => setPriceType(t)}>
                        <Text
                          variant="small"
                          weight="medium"
                          color={priceType === t ? 'foreground' : 'muted'}
                          style={priceType === t ? styles.pillTextActive : undefined}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor={theme.colors.textMuted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <Button
                variant="default"
                size="lg"
                onPress={() => uploadProgramMutation.mutate()}
                loading={uploadProgramMutation.isPending}
                disabled={!isAuthenticated || isGuest}
              >
                <FontAwesome5 name="cloud-upload-alt" size={16} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Upload Program
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedMethod === 'text' && (
          <Card style={styles.card}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardHeaderRow}>
                <FontAwesome5 name="keyboard" size={16} color={theme.colors.primary} solid />
                <CardTitle>Text Based Program</CardTitle>
              </View>
              <Text variant="small" color="muted">
                Create a text-based program that displays as a scrollable list in Practice view.
              </Text>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              <TextInput
                style={styles.input}
                placeholder="Program title"
                placeholderTextColor={theme.colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={theme.colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <TextInput
                style={[styles.input, styles.textAreaLarge]}
                placeholder="Program content"
                placeholderTextColor={theme.colors.textMuted}
                value={textContent}
                onChangeText={setTextContent}
                multiline
              />

              <Text variant="body" weight="semiBold" color="foreground">
                Visibility
              </Text>
              <View style={styles.pillRow}>
                {(['public', 'private', 'premium'] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={pill(visibility === v)}
                    onPress={() => {
                      setVisibility(v);
                      ensurePricing(v);
                    }}
                  >
                    <Text
                      variant="small"
                      weight="medium"
                      color={visibility === v ? 'foreground' : 'muted'}
                      style={visibility === v ? styles.pillTextActive : undefined}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showPricing && (
                <>
                  <Text variant="body" weight="semiBold" color="foreground">
                    Pricing
                  </Text>
                  <View style={styles.pillRow}>
                    {(['spikes', 'money'] as const).map((t) => (
                      <TouchableOpacity key={t} style={pill(priceType === t)} onPress={() => setPriceType(t)}>
                        <Text
                          variant="small"
                          weight="medium"
                          color={priceType === t ? 'foreground' : 'muted'}
                          style={priceType === t ? styles.pillTextActive : undefined}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor={theme.colors.textMuted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <Button
                variant="default"
                size="lg"
                onPress={handleCreateText}
                loading={createProgramMutation.isPending}
                disabled={!isAuthenticated || isGuest}
              >
                <FontAwesome5 name="check" size={16} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Create Text Program
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedMethod === 'sprinthia' && (
          <Card style={[styles.card, styles.sprinthiaCard]}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardHeaderRow}>
                <FontAwesome5 name="robot" size={16} color="#f59e0b" solid />
                <CardTitle>Build With Sprinthia AI</CardTitle>
              </View>
              <Text variant="small" color="muted">
                Generate an AI-powered text program and then edit it before saving.
              </Text>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              {!generatedProgram ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Program title"
                    placeholderTextColor={theme.colors.textMuted}
                    value={title}
                    onChangeText={setTitle}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description (optional)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />

                  <Text variant="body" weight="semiBold" color="foreground">
                    Program Length
                  </Text>
                  <View style={styles.pillRow}>
                    {[1, 2, 4, 6, 8, 12].map((weeks) => (
                      <TouchableOpacity
                        key={weeks}
                        style={pill(sprinthiaData.totalLengthWeeks === weeks)}
                        onPress={() =>
                          setSprinthiaData((prev) => ({ ...prev, totalLengthWeeks: weeks }))
                        }
                      >
                        <Text
                          variant="small"
                          weight="medium"
                          color={sprinthiaData.totalLengthWeeks === weeks ? 'foreground' : 'muted'}
                          style={
                            sprinthiaData.totalLengthWeeks === weeks ? styles.pillTextActive : undefined
                          }
                        >
                          {weeks}w
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text variant="body" weight="semiBold" color="foreground">
                    Blocks
                  </Text>
                  <View style={styles.pillRow}>
                    {[1, 2, 3, 4, 5, 6].map((blocks) => (
                      <TouchableOpacity
                        key={blocks}
                        style={pill(sprinthiaData.blocks === blocks)}
                        onPress={() => setSprinthiaData((prev) => ({ ...prev, blocks }))}
                      >
                        <Text
                          variant="small"
                          weight="medium"
                          color={sprinthiaData.blocks === blocks ? 'foreground' : 'muted'}
                          style={sprinthiaData.blocks === blocks ? styles.pillTextActive : undefined}
                        >
                          {blocks}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text variant="body" weight="semiBold" color="foreground">
                    Workouts Per Week
                  </Text>
                  <View style={styles.pillRow}>
                    {[2, 3, 4, 5, 6, 7].map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={pill(sprinthiaData.workoutsPerWeek === count)}
                        onPress={() => setSprinthiaData((prev) => ({ ...prev, workoutsPerWeek: count }))}
                      >
                        <Text
                          variant="small"
                          weight="medium"
                          color={sprinthiaData.workoutsPerWeek === count ? 'foreground' : 'muted'}
                          style={
                            sprinthiaData.workoutsPerWeek === count ? styles.pillTextActive : undefined
                          }
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text variant="body" weight="semiBold" color="foreground">
                    Gym Workouts Per Week
                  </Text>
                  <View style={styles.pillRow}>
                    {[0, 1, 2, 3, 4, 5].map((count) => (
                      <TouchableOpacity
                        key={count}
                        style={pill(sprinthiaData.gymWorkoutsPerWeek === count)}
                        onPress={() =>
                          setSprinthiaData((prev) => ({ ...prev, gymWorkoutsPerWeek: count }))
                        }
                      >
                        <Text
                          variant="small"
                          weight="medium"
                          color={sprinthiaData.gymWorkoutsPerWeek === count ? 'foreground' : 'muted'}
                          style={
                            sprinthiaData.gymWorkoutsPerWeek === count ? styles.pillTextActive : undefined
                          }
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text variant="body" weight="semiBold" color="foreground">
                    Block Focus
                  </Text>
                  <View style={styles.pillRow}>
                    {[
                      { id: 'speed', label: 'Speed' },
                      { id: 'speed-maintenance', label: 'Speed Maintenance' },
                      { id: 'speed-endurance', label: 'Speed Endurance' },
                      { id: 'mixed', label: 'Mixed' },
                      { id: 'short-to-long', label: 'Short to Long' },
                      { id: 'long-to-short', label: 'Long to Short' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={pill(sprinthiaData.blockFocus === option.id)}
                        onPress={() =>
                          setSprinthiaData((prev) => ({
                            ...prev,
                            blockFocus: option.id as SprinthiaFormData['blockFocus'],
                          }))
                        }
                      >
                        <Text
                          variant="small"
                          weight="medium"
                          color={sprinthiaData.blockFocus === option.id ? 'foreground' : 'muted'}
                          style={
                            sprinthiaData.blockFocus === option.id ? styles.pillTextActive : undefined
                          }
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your goals and AI prompt"
                    placeholderTextColor={theme.colors.textMuted}
                    value={sprinthiaData.aiPrompt}
                    onChangeText={(value) => setSprinthiaData((prev) => ({ ...prev, aiPrompt: value }))}
                    multiline
                  />

                  <Button
                    variant="default"
                    size="lg"
                    onPress={() => generateSprinthiaMutation.mutate()}
                    loading={generateSprinthiaMutation.isPending}
                    disabled={!isAuthenticated || isGuest}
                  >
                    <FontAwesome5 name="magic" size={16} color="white" solid />
                    <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                      Generate Training Program
                    </Text>
                  </Button>
                </>
              ) : (
                <>
                  <Text variant="body" weight="semiBold" color="foreground">
                    Generated Program
                  </Text>
                  <View style={styles.generatedBox}>
                    <Text variant="small" color="foreground" style={styles.monoText}>
                      {generatedProgram}
                    </Text>
                  </View>
                  <View style={styles.generatedActions}>
                    <Button variant="default" size="md" onPress={continueToEditSprinthia}>
                      <FontAwesome5 name="edit" size={14} color="white" solid />
                      <Text variant="small" weight="bold" color="primary-foreground" style={styles.buttonText}>
                        Continue to Edit
                      </Text>
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onPress={() => regenerateSprinthiaMutation.mutate()}
                      loading={regenerateSprinthiaMutation.isPending}
                    >
                      <Text variant="small" weight="medium" color="primary-foreground">
                        Rewrite
                      </Text>
                    </Button>
                  </View>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Modal visible={showImportModal} transparent animationType="fade" onRequestClose={() => setShowImportModal(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowImportModal(false)}>
            <Pressable style={styles.importModal} onPress={() => undefined}>
              <Text variant="h4" weight="bold" color="foreground" style={styles.importTitle}>
                Import Program from Google Sheet
              </Text>
              <Text variant="small" color="muted">
                Provide a public Google Sheet URL and program details.
              </Text>
              <View style={styles.importFields}>
                <TextInput
                  style={styles.input}
                  placeholder="Program title"
                  placeholderTextColor={theme.colors.textMuted}
                  value={importTitle}
                  onChangeText={setImportTitle}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description"
                  placeholderTextColor={theme.colors.textMuted}
                  value={importDescription}
                  onChangeText={setImportDescription}
                  multiline
                />
                <TextInput
                  style={styles.input}
                  placeholder="Google Sheet URL"
                  placeholderTextColor={theme.colors.textMuted}
                  value={importSheetUrl}
                  onChangeText={setImportSheetUrl}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Category (sprint, distance, jumps...)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={importCategory}
                  onChangeText={setImportCategory}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Level (beginner, intermediate, advanced)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={importLevel}
                  onChangeText={setImportLevel}
                />
                <Text variant="body" weight="semiBold" color="foreground">
                  Visibility
                </Text>
                <View style={styles.pillRow}>
                  {(['public', 'private', 'premium'] as const).map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={pill(importVisibility === v)}
                      onPress={() => setImportVisibility(v)}
                    >
                      <Text
                        variant="small"
                        weight="medium"
                        color={importVisibility === v ? 'foreground' : 'muted'}
                        style={importVisibility === v ? styles.pillTextActive : undefined}
                      >
                        {v}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Duration (days)"
                  placeholderTextColor={theme.colors.textMuted}
                  value={importDuration}
                  onChangeText={setImportDuration}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.importActions}>
                <Button variant="outline" size="md" onPress={() => setShowImportModal(false)}>
                  <Text variant="small" weight="medium" color="primary-foreground">
                    Cancel
                  </Text>
                </Button>
                <Button
                  variant="default"
                  size="md"
                  onPress={() => importSheetMutation.mutate()}
                  loading={importSheetMutation.isPending}
                >
                  <Text variant="small" weight="bold" color="primary-foreground">
                    Import Program
                  </Text>
                </Button>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.webBorderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerSpacer: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  pageHeader: {
    gap: theme.spacing.sm,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  methodCard: {
    width: '48%',
    borderRadius: theme.borderRadius.webCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.webBorderLight,
  },
  methodCardActive: {
    borderColor: theme.colors.primary,
  },
  methodCardContent: {
    minHeight: 140,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  methodTitle: {
    textAlign: 'center',
  },
  methodDescription: {
    textAlign: 'center',
    opacity: 0.85,
  },
  card: {
    marginBottom: 0,
    borderRadius: theme.borderRadius.webCard,
    borderWidth: 1,
    borderColor: theme.colors.webCardBorder,
  },
  cardHeader: {
    gap: theme.spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pill: {
    minWidth: 84,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    borderColor: 'white',
    backgroundColor: 'white',
  },
  pillTextActive: {
    color: theme.colors.webPurpleStart,
  },
  buttonText: { marginLeft: theme.spacing.sm },
  helperText: { textAlign: 'center', lineHeight: 18 },
  chooseMethodButton: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chooseMethodText: {
    marginLeft: theme.spacing.sm,
  },
  uploadPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  textAreaLarge: {
    minHeight: 220,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  sprinthiaCard: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  generatedBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    maxHeight: 320,
  },
  generatedActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  importModal: {
    backgroundColor: '#0f172a',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.webBorderLight,
    gap: theme.spacing.md,
  },
  importTitle: {
    marginBottom: theme.spacing.xs,
  },
  importFields: {
    gap: theme.spacing.md,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
