import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Link as LinkIcon,
  FileArrowUp,
  Paperclip,
  Check,
  CloudArrowUp,
  Table,
  FilePdf,
  Warning,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';

import { Text } from '@/components/ui/Text';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { uploadProgramFile } from '@/lib/upload';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  green: '#22c55e',
};

type Visibility = 'public' | 'private' | 'premium';
type PriceType = 'spikes' | 'money';
type DetectedType = 'google_sheet' | 'document' | 'spreadsheet' | null;

const GOOGLE_SHEET_REGEX = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

const DOC_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const SHEET_MIMES = new Set([
  'text/csv',
  'text/comma-separated-values',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const SHEET_EXTENSIONS = new Set(['csv', 'xls', 'xlsx']);
const DOC_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);

function detectFileType(file: DocumentPicker.DocumentPickerAsset): DetectedType {
  const mime = file.mimeType || '';
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || '';

  if (SHEET_MIMES.has(mime) || SHEET_EXTENSIONS.has(ext)) return 'spreadsheet';
  if (DOC_MIMES.has(mime) || DOC_EXTENSIONS.has(ext)) return 'document';
  return 'document';
}

function detectLinkType(url: string): DetectedType {
  if (GOOGLE_SHEET_REGEX.test(url)) return 'google_sheet';
  return null;
}

function getTypeLabel(type: DetectedType): string {
  switch (type) {
    case 'google_sheet': return 'Google Sheets Import';
    case 'document': return 'Document Upload';
    case 'spreadsheet': return 'Spreadsheet Import';
    default: return '';
  }
}

function getTypeIcon(type: DetectedType) {
  switch (type) {
    case 'google_sheet': return Table;
    case 'document': return FilePdf;
    case 'spreadsheet': return Table;
    default: return FileArrowUp;
  }
}

export const ProgramImportScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [linkInput, setLinkInput] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [detectedType, setDetectedType] = useState<DetectedType>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [priceType, setPriceType] = useState<PriceType>('spikes');
  const [price, setPrice] = useState('0');
  const [importDuration, setImportDuration] = useState('');
  const [importCategory, setImportCategory] = useState('');
  const [importLevel, setImportLevel] = useState('');

  const handleLinkChange = useCallback((text: string) => {
    setLinkInput(text);
    const type = detectLinkType(text.trim());
    if (type) {
      setDetectedType(type);
      setFile(null);
    } else if (!file) {
      setDetectedType(null);
    }
  }, [file]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const picked = result.assets[0];
      setFile(picked);
      setLinkInput('');
      const type = detectFileType(picked);
      setDetectedType(type);
      if (!title.trim()) {
        const nameWithoutExt = picked.name.replace(/\.[^.]+$/, '');
        setTitle(nameWithoutExt);
      }
    } catch {
      Alert.alert('File selection failed', 'Unable to select a document.');
    }
  };

  const clearInput = () => {
    setFile(null);
    setLinkInput('');
    setDetectedType(null);
    setTitle('');
    setDescription('');
  };

  const importSheetMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) throw new Error('Login required');
      if (!title.trim()) throw new Error('Program title is required');
      if (!linkInput.trim()) throw new Error('Google Sheet URL is required');
      const durationNum = importDuration.trim() ? Number(importDuration) : undefined;
      if (durationNum !== undefined && (!Number.isFinite(durationNum) || durationNum <= 0)) throw new Error('Duration must be a positive number');
      return apiRequest<{ program: { id: number | string }; importedSessions: number }>(
        '/api/programs/import-sheet',
        {
          method: 'POST',
          data: {
            title: title.trim(),
            description: description.trim(),
            googleSheetUrl: linkInput.trim(),
            ...(importCategory ? { category: importCategory } : {}),
            ...(importLevel ? { level: importLevel } : {}),
            visibility,
            ...(durationNum !== undefined ? { duration: durationNum } : {}),
          },
        },
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Imported', `Program imported with ${response?.importedSessions ?? 0} sessions.`);
      if (response?.program?.id !== undefined) navigation.replace('ProgramDetail', { id: response.program.id });
      else navigation.navigate('MainTabs', { screen: 'Programs' } as never);
    },
    onError: (error: Error) => {
      Alert.alert('Import failed', error.message || 'Please try again.');
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) throw new Error('Login required');
      if (!file) throw new Error('Select a file to upload');
      if (!title.trim()) throw new Error('Program title is required');
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) throw new Error('Price must be 0 or greater');
      return uploadProgramFile({
        file,
        fields: {
          title: title.trim(),
          description: description.trim(),
          visibility,
          price: priceNum,
          priceType,
          duration: 0,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Uploaded', 'Your program document was uploaded.');
      navigation.navigate('MainTabs', { screen: 'Programs' } as never);
    },
    onError: (error: Error) => {
      Alert.alert('Upload failed', error.message || 'Please try again.');
    },
  });

  const uploadSpreadsheetMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) throw new Error('Login required');
      if (!file) throw new Error('Select a spreadsheet file');
      if (!title.trim()) throw new Error('Program title is required');
      return uploadProgramFile({
        file,
        fields: {
          title: title.trim(),
          description: description.trim(),
          visibility,
          price: 0,
          priceType: 'spikes',
          duration: Number(importDuration) || 30,
          parseAsSpreadsheet: true,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Imported', 'Spreadsheet sessions imported.');
      navigation.navigate('MainTabs', { screen: 'Programs' } as never);
    },
    onError: (error: Error) => {
      Alert.alert('Import failed', error.message || 'Please try again.');
    },
  });

  const handleSubmit = () => {
    switch (detectedType) {
      case 'google_sheet':
        importSheetMutation.mutate();
        break;
      case 'document':
        uploadDocMutation.mutate();
        break;
      case 'spreadsheet':
        uploadSpreadsheetMutation.mutate();
        break;
    }
  };

  const isLoading =
    importSheetMutation.isPending || uploadDocMutation.isPending || uploadSpreadsheetMutation.isPending;

  const showPricing = visibility === 'premium' && detectedType === 'document';

  const pill = (selected: boolean) => [styles.pill, selected && styles.pillActive];
  const pillText = (selected: boolean): any => [styles.pillText, selected && styles.pillTextActive];

  const TypeIcon = getTypeIcon(detectedType);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import / Upload</Text>
        <View style={{ flex: 1 }} />
      </View>

      <KeyboardAwareScreenScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={120}
      >
        <Text style={styles.pageSubtitle}>
          Paste a Google Sheets link or choose a file. We'll detect the format automatically.
        </Text>

        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <LinkIcon size={16} color={C.textMuted} weight="bold" />
            <TextInput
              style={styles.linkInput}
              placeholder="Paste Google Sheets link..."
              placeholderTextColor={C.textMuted}
              value={linkInput}
              onChangeText={handleLinkChange}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!file}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.filePicker, file && styles.filePickerActive]}
            onPress={pickFile}
            activeOpacity={0.7}
          >
            <Paperclip size={16} color={file ? C.orange : C.textMuted} weight="fill" />
            <Text style={[styles.filePickerText, file && { color: C.textPrimary }]} numberOfLines={1}>
              {file?.name ?? 'Choose a file (PDF, DOC, XLSX, CSV)'}
            </Text>
          </TouchableOpacity>
        </View>

        {detectedType && (
          <View style={styles.detectedBanner}>
            <TypeIcon size={16} color={C.orange} weight="fill" />
            <Text style={styles.detectedText}>{getTypeLabel(detectedType)}</Text>
            <TouchableOpacity onPress={clearInput} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {detectedType && (
          <View style={styles.formCard}>
            <View style={styles.formFields}>
              <TextInput
                style={styles.input}
                placeholder="Program title"
                placeholderTextColor={C.textMuted}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor={C.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {(detectedType === 'google_sheet' || detectedType === 'spreadsheet') && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Category (sprint, distance, jumps...)"
                    placeholderTextColor={C.textMuted}
                    value={importCategory}
                    onChangeText={setImportCategory}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Level (beginner, intermediate, advanced)"
                    placeholderTextColor={C.textMuted}
                    value={importLevel}
                    onChangeText={setImportLevel}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Duration (days)"
                    placeholderTextColor={C.textMuted}
                    value={importDuration}
                    onChangeText={setImportDuration}
                    keyboardType="number-pad"
                  />
                </>
              )}

              <Text style={styles.sectionLabel}>Visibility</Text>
              <View style={styles.pillRow}>
                {(['public', 'private', 'premium'] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={pill(visibility === v)}
                    onPress={() => {
                      setVisibility(v);
                      if (v !== 'premium') setPrice('0');
                    }}
                  >
                    <Text style={pillText(visibility === v)}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {showPricing && (
                <>
                  <Text style={styles.sectionLabel}>Pricing</Text>
                  <View style={styles.pillRow}>
                    {(['spikes', 'money'] as const).map((t) => (
                      <TouchableOpacity key={t} style={pill(priceType === t)} onPress={() => setPriceType(t)}>
                        <Text style={pillText(priceType === t)}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Price"
                    placeholderTextColor={C.textMuted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <TouchableOpacity
                style={styles.gradientBtn}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isLoading || !isAuthenticated || isGuest}
              >
                <LinearGradient
                  colors={[C.orange, C.orangeLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtnInner}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Check size={16} color="white" weight="fill" />
                  )}
                  <Text style={styles.gradientBtnText}>
                    {isLoading
                      ? 'Working...'
                      : detectedType === 'google_sheet'
                        ? 'Import Program'
                        : detectedType === 'spreadsheet'
                          ? 'Import Spreadsheet'
                          : 'Upload Program'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {(!isAuthenticated || isGuest) && (
                <View style={styles.warningRow}>
                  <Warning size={14} color={C.orange} weight="fill" />
                  <Text style={styles.helperText}>Sign in to import programs.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </KeyboardAwareScreenScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  pageSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 20,
  },
  inputSection: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: C.glass,
  },
  linkInput: {
    flex: 1,
    paddingVertical: 14,
    color: C.textPrimary,
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: C.border,
  },
  dividerText: {
    fontSize: 11,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    backgroundColor: C.glass,
  },
  filePickerActive: {
    borderColor: 'rgba(255,122,0,0.3)',
    borderStyle: 'solid',
    backgroundColor: 'rgba(255,122,0,0.06)',
  },
  filePickerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: C.textMuted,
  },
  detectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,122,0,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.2)',
  },
  detectedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.orange,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  formCard: {
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
  },
  formFields: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    marginTop: 4,
  },
  input: {
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    color: C.textPrimary,
    backgroundColor: C.glass,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    minWidth: 60,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    backgroundColor: C.glass,
  },
  pillActive: {
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderColor: 'rgba(255,122,0,0.3)',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textMuted,
  },
  pillTextActive: {
    color: C.orange,
    fontWeight: '600',
  },
  gradientBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  gradientBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  gradientBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
  },
  helperText: {
    fontSize: 12,
    color: C.textMuted,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
