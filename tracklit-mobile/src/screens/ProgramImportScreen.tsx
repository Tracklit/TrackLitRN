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
  Link as LinkIcon,
  FileArrowUp,
  Paperclip,
  Check,
  Table,
  FilePdf,
  Warning,
  Info,
  Lightbulb,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { Text } from '@/components/ui/Text';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { uploadProgramFile } from '@/lib/upload';
import { parseCSVString, parseXLSXBase64, type ParsedSession, type SheetTemplate } from '@/lib/spreadsheetParser';
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
  const [sheetTemplate, setSheetTemplate] = useState<SheetTemplate>('simple');
  const [detectedLocalTemplate, setDetectedLocalTemplate] = useState<SheetTemplate | null>(null);

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
      setDetectedLocalTemplate(null);
      const type = detectFileType(picked);
      setDetectedType(type);
      if (!title.trim()) {
        const nameWithoutExt = picked.name.replace(/\.[^.]+$/, '');
        setTitle(nameWithoutExt);
      }
      if (type === 'spreadsheet') {
        try {
          const ext = (picked.name || '').split('.').pop()?.toLowerCase() || '';
          const baseName = picked.name.replace(/\.[^.]+$/, '');
          let parsed;
          if (ext === 'xlsx' || ext === 'xls') {
            const base64 = await FileSystem.readAsStringAsync(picked.uri, { encoding: 'base64' });
            parsed = parseXLSXBase64(base64, baseName);
          } else {
            const content = await FileSystem.readAsStringAsync(picked.uri);
            parsed = parseCSVString(content, baseName);
          }
          setDetectedLocalTemplate(parsed.detectedTemplate);
        } catch {
          // detection failed silently — will retry on submit
        }
      }
    } catch {
      Alert.alert('File selection failed', 'Unable to select a document.');
    }
  };

  const clearInput = () => {
    setFile(null);
    setLinkInput('');
    setDetectedType(null);
    setDetectedLocalTemplate(null);
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
            sheetTemplate,
          },
        },
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Imported', `Program imported with ${response?.importedSessions ?? 0} sessions.`);
      if (response?.program?.id !== undefined) navigation.replace('ProgramDetail', { id: response.program.id });
      else navigation.navigate('MainTabs', { screen: 'Training' } as never);
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
      navigation.navigate('MainTabs', { screen: 'Training' } as never);
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

      const ext = (file.name || '').split('.').pop()?.toLowerCase() || '';
      const baseName = file.name.replace(/\.[^.]+$/, '');

      let parsed;
      if (ext === 'xlsx' || ext === 'xls') {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: 'base64',
        });
        parsed = parseXLSXBase64(base64, baseName);
      } else {
        const content = await FileSystem.readAsStringAsync(file.uri);
        parsed = parseCSVString(content, baseName);
      }

      if (!parsed.sessions.length) throw new Error('No sessions found in the spreadsheet');

      const durationInput = importDuration.trim() ? Number(importDuration) : undefined;
      if (durationInput !== undefined && (!Number.isFinite(durationInput) || durationInput <= 0)) throw new Error('Duration must be a positive number');
      const durationNum = durationInput ?? parsed.sessions.length;
      const program = await apiRequest<{ id: number | string }>('/api/programs', {
        method: 'POST',
        data: {
          title: title.trim(),
          description: description.trim() || `Imported from ${file.name}`,
          visibility,
          price: 0,
          priceType: 'spikes',
          duration: durationNum,
          importedFromSheet: true,
          ...(importCategory ? { category: importCategory } : {}),
          ...(importLevel ? { level: importLevel } : {}),
        },
      });

      if (!program?.id) throw new Error('Failed to create program');

      const sessionPayloads = parsed.sessions.map((s: ParsedSession) => ({
        programId: program.id,
        dayNumber: s.dayNumber,
        date: s.date,
        preActivation1: s.preActivation1,
        preActivation2: s.preActivation2,
        shortDistanceWorkout: s.shortDistanceWorkout,
        mediumDistanceWorkout: s.mediumDistanceWorkout,
        longDistanceWorkout: s.longDistanceWorkout,
        extraSession: s.extraSession,
        isRestDay: s.isRestDay,
        title: s.title,
        description: s.description,
        gymData: s.gymData,
      }));

      await apiRequest(`/api/programs/${program.id}/sessions/batch`, {
        method: 'PUT',
        data: { sessions: sessionPayloads },
      });

      return { program, importedSessions: parsed.sessions.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Imported', `Spreadsheet imported with ${result?.importedSessions ?? 0} sessions.`);
      if (result?.program?.id !== undefined) navigation.replace('ProgramDetail', { id: result.program.id });
      else navigation.navigate('MainTabs', { screen: 'Training' } as never);
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
        <Text style={styles.headerTitle}>Import / Upload</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => navigation.navigate('SheetFormatInfo')}
          activeOpacity={0.7}
        >
          <Info size={18} color={C.textMuted} weight="fill" />
        </TouchableOpacity>
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

        {detectedType === 'spreadsheet' && detectedLocalTemplate && (
          <View style={styles.detectedTemplateBanner}>
            <Lightbulb size={14} color={C.orange} weight="fill" />
            <Text style={styles.detectedTemplateText}>
              Detected format: <Text style={styles.detectedTemplateBold}>
                {detectedLocalTemplate === 'simple' ? 'Simple (Date + Session)' : 'Advanced (7 columns)'}
              </Text>
            </Text>
          </View>
        )}

        {detectedType === 'google_sheet' && (
          <View style={styles.templateSection}>
            <Text style={styles.sectionLabel}>Sheet Template</Text>
            <View style={styles.templateToggle}>
              {(['simple', 'advanced'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.templateBtn, sheetTemplate === t && styles.templateBtnActive]}
                  onPress={() => setSheetTemplate(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.templateBtnText, sheetTemplate === t && styles.templateBtnTextActive]}>
                    {t === 'simple' ? 'Simple' : 'Advanced'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {sheetTemplate === 'simple' && (
              <View style={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                  <Info size={14} color={C.orange} weight="fill" />
                  <Text style={styles.instructionsTitle}>How to format your sheet</Text>
                </View>
                <Text style={styles.instructionsBody}>
                  Your Google Sheet should have 2 columns:{'\n\n'}
                  <Text style={styles.instructionsBold}>Column A</Text> — Date (e.g. Feb-24, Mar-1){'\n'}
                  <Text style={styles.instructionsBold}>Column B</Text> — Session details (your full workout description){'\n\n'}
                  The first row should be a header row (it will be skipped).{'\n'}
                  Each row after that becomes one training session.
                </Text>
                <View style={styles.exampleTable}>
                  <View style={styles.exampleRow}>
                    <View style={[styles.exampleCell, styles.exampleHeaderCell]}><Text style={styles.exampleHeaderText}>A</Text></View>
                    <View style={[styles.exampleCell, styles.exampleHeaderCell, { flex: 3 }]}><Text style={styles.exampleHeaderText}>B</Text></View>
                  </View>
                  <View style={styles.exampleRow}>
                    <View style={styles.exampleCell}><Text style={styles.exampleCellText}>Feb-24</Text></View>
                    <View style={[styles.exampleCell, { flex: 3 }]}><Text style={styles.exampleCellText}>Warm up, 4x60m, 3x150m, cool down</Text></View>
                  </View>
                  <View style={styles.exampleRow}>
                    <View style={styles.exampleCell}><Text style={styles.exampleCellText}>Feb-25</Text></View>
                    <View style={[styles.exampleCell, { flex: 3 }]}><Text style={styles.exampleCellText}>Tempo runs 6x200m, core work</Text></View>
                  </View>
                </View>
              </View>
            )}

            {sheetTemplate === 'advanced' && (
              <Text style={styles.templateHint}>
                Advanced uses 7 columns: Date, Pre-Act 1, Pre-Act 2, Short Distance, Medium Distance, Long Distance, Extra Session.
              </Text>
            )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedTemplateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,122,0,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  detectedTemplateText: {
    fontSize: 13,
    color: C.textMuted,
    flex: 1,
  },
  detectedTemplateBold: {
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
  templateSection: {
    gap: 10,
  },
  templateToggle: {
    flexDirection: 'row',
    gap: 0,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  templateBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: C.glass,
  },
  templateBtnActive: {
    backgroundColor: 'rgba(255,122,0,0.15)',
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  templateBtnTextActive: {
    color: C.orange,
  },
  templateHint: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },
  instructionsCard: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,122,0,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.15)',
    padding: 14,
    gap: 10,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.orange,
  },
  instructionsBody: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 19,
  },
  instructionsBold: {
    fontWeight: '700',
    color: C.textPrimary,
  },
  exampleTable: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: C.border,
  },
  exampleRow: {
    flexDirection: 'row',
  },
  exampleCell: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: C.border,
    backgroundColor: C.glass,
  },
  exampleHeaderCell: {
    backgroundColor: 'rgba(255,122,0,0.1)',
  },
  exampleHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.orange,
    textAlign: 'center',
  },
  exampleCellText: {
    fontSize: 11,
    color: C.textSecondary,
  },
});
