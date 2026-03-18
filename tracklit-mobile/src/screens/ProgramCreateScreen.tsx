import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  FileArrowUp,
  ClipboardText,
  Keyboard,
  Robot,
  BookOpen,
  Check,
  PencilSimple,
  MagicWand,
} from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  surface: '#161823',
  card: '#1C1F2B',
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
};

type Visibility = 'public' | 'private' | 'premium';
type PriceType = 'spikes' | 'money';
type DurationWeeks = 1 | 2 | 4 | 6 | 8 | 12;
type CreateMethod = 'builder' | 'text' | 'sprinthia';

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
    if (nextVisibility !== 'premium') setPrice('0');
  };

  const createProgramMutation = useMutation({
    mutationFn: async (payload: CreateProgramPayload) => {
      if (!isAuthenticated || isGuest) throw new Error('Login required');
      if (!payload.title.trim()) throw new Error('Program title is required');
      if (payload.isTextBased && !payload.textContent?.trim()) throw new Error('Program content is required');
      return apiRequest<{ id: number | string }>('/api/programs', { method: 'POST', data: payload });
    },
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Created', 'Your program was created successfully.');
      if (program?.id !== undefined) {
        if (selectedMethod === 'text') {
          navigation.navigate('MainTabs', { screen: 'Training' } as never);
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

  const generateSprinthiaMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) throw new Error('Login required');
      if (!title.trim()) throw new Error('Program title is required');
      if (!sprinthiaData.aiPrompt.trim()) throw new Error('AI prompt is required');
      return apiRequest<{ content: string }>('/api/sprinthia/generate-program', {
        method: 'POST',
        data: { ...sprinthiaData, title: title.trim(), description: description.trim() },
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
      if (!generatedProgram) throw new Error('No program to rewrite');
      return apiRequest<{ content: string }>('/api/sprinthia/regenerate-program', {
        method: 'POST',
        data: { ...sprinthiaData, title: title.trim(), description: description.trim(), previousContent: generatedProgram },
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
  const pillText = (selected: boolean): any => [styles.pillText, selected && styles.pillTextActive];

  const methods = [
    { id: 'import' as const, title: 'Import / Upload', description: 'PDF, Sheets, CSV or DOCX.', Icon: FileArrowUp },
    { id: 'text' as const, title: 'Text Based', description: 'Simple text-based program.', Icon: Keyboard },
    { id: 'sprinthia' as const, title: 'Sprinthia AI', description: 'Generate with AI assistance.', Icon: Robot },
  ];

  const handleCreateBuilder = () => {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert('Invalid price', 'Price must be 0 or greater.');
      return;
    }
    createProgramMutation.mutate({ title: title.trim(), description: description.trim(), visibility, price: priceNum, priceType, duration });
  };

  const handleCreateText = () => {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert('Invalid price', 'Price must be 0 or greater.');
      return;
    }
    createProgramMutation.mutate({ title: title.trim(), description: description.trim(), visibility, price: priceNum, priceType, duration, isTextBased: true, textContent: textContent.trim() });
  };

  const continueToEditSprinthia = () => {
    if (!generatedProgram) return;
    setTextContent(generatedProgram);
    setGeneratedProgram(null);
    setSelectedMethod('text');
  };

  const showPricing = visibility === 'premium';

  const renderVisibilityPills = (vis: Visibility, setVis: (v: Visibility) => void, onPricing?: (v: Visibility) => void) => (
    <View style={styles.pillRow}>
      {(['public', 'private', 'premium'] as const).map((v) => (
        <TouchableOpacity key={v} style={pill(vis === v)} onPress={() => { setVis(v); onPricing?.(v); }}>
          <Text style={pillText(vis === v)}>{v}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDurationPills = () => (
    <View style={styles.pillRow}>
      {([1, 2, 4, 6, 8, 12] as const).map((w) => (
        <TouchableOpacity key={w} style={pill(duration === w)} onPress={() => setDuration(w)}>
          <Text style={pillText(duration === w)}>{w}w</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPricingSection = () => showPricing ? (
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
  ) : null;

  const renderGradientBtn = (label: string, onPress: () => void, loading: boolean, icon?: React.ReactNode) => (
    <TouchableOpacity style={styles.gradientBtn} onPress={onPress} activeOpacity={0.8} disabled={loading || !isAuthenticated || isGuest}>
      <LinearGradient colors={[C.orange, C.orangeLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientBtnInner}>
        {icon}
        <Text style={styles.gradientBtnText}>{loading ? 'Working...' : label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Program</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScreenScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={120}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Create New Program</Text>
          <Text style={styles.pageSubtitle}>Build a training program for your athletes or share with the community.</Text>
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
                    navigation.replace('ProgramImport');
                  } else {
                    setSelectedMethod(item.id);
                  }
                }}
              >
                <View style={styles.methodIcon}>
                  <item.Icon size={20} color={C.orange} weight="fill" />
                </View>
                <Text style={styles.methodTitle}>{item.title}</Text>
                <Text style={styles.methodDescription}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.backMethodBtn} onPress={() => setSelectedMethod(null)} activeOpacity={0.7}>
            <ArrowLeft size={14} color={C.orange} weight="bold" />
            <Text style={styles.backMethodText}>Choose Different Method</Text>
          </TouchableOpacity>
        )}

        {selectedMethod === 'builder' && (
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <BookOpen size={16} color={C.orange} weight="fill" />
              <Text style={styles.formCardTitle}>Build Custom Program</Text>
            </View>
            <Text style={styles.formCardSubtitle}>Create a structured training program with custom sessions and exercises.</Text>
            <View style={styles.formFields}>
              <TextInput style={styles.input} placeholder="Program title" placeholderTextColor={C.textMuted} value={title} onChangeText={setTitle} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Description" placeholderTextColor={C.textMuted} value={description} onChangeText={setDescription} multiline />
              <Text style={styles.sectionLabel}>Visibility</Text>
              {renderVisibilityPills(visibility, setVisibility, ensurePricing)}
              <Text style={styles.sectionLabel}>Duration</Text>
              {renderDurationPills()}
              {renderPricingSection()}
              {renderGradientBtn('Create Program', handleCreateBuilder, createProgramMutation.isPending, <Check size={16} color="white" weight="fill" />)}
              {(!isAuthenticated || isGuest) && <Text style={styles.helperText}>Sign in to create programs.</Text>}
            </View>
          </View>
        )}

        {selectedMethod === 'text' && (
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <Keyboard size={16} color={C.orange} weight="fill" />
              <Text style={styles.formCardTitle}>Text Based Program</Text>
            </View>
            <Text style={styles.formCardSubtitle}>Create a text-based program that displays as a scrollable list in Practice view.</Text>
            <View style={styles.formFields}>
              <TextInput style={styles.input} placeholder="Program title" placeholderTextColor={C.textMuted} value={title} onChangeText={setTitle} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Description" placeholderTextColor={C.textMuted} value={description} onChangeText={setDescription} multiline />
              <TextInput style={[styles.input, styles.textAreaLarge]} placeholder="Program content" placeholderTextColor={C.textMuted} value={textContent} onChangeText={setTextContent} multiline />
              <Text style={styles.sectionLabel}>Visibility</Text>
              {renderVisibilityPills(visibility, setVisibility, ensurePricing)}
              {renderPricingSection()}
              {renderGradientBtn('Create Text Program', handleCreateText, createProgramMutation.isPending, <Check size={16} color="white" weight="fill" />)}
            </View>
          </View>
        )}

        {selectedMethod === 'sprinthia' && (
          <View style={[styles.formCard, { borderColor: 'rgba(245,158,11,0.2)' }]}>
            <View style={styles.formCardHeader}>
              <Robot size={16} color="#f59e0b" weight="fill" />
              <Text style={styles.formCardTitle}>Build With Sprinthia AI</Text>
            </View>
            <Text style={styles.formCardSubtitle}>Generate an AI-powered text program and then edit it before saving.</Text>
            <View style={styles.formFields}>
              {!generatedProgram ? (
                <>
                  <TextInput style={styles.input} placeholder="Program title" placeholderTextColor={C.textMuted} value={title} onChangeText={setTitle} />
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Description (optional)" placeholderTextColor={C.textMuted} value={description} onChangeText={setDescription} multiline />

                  <Text style={styles.sectionLabel}>Program Length</Text>
                  <View style={styles.pillRow}>
                    {[1, 2, 4, 6, 8, 12].map((weeks) => (
                      <TouchableOpacity key={weeks} style={pill(sprinthiaData.totalLengthWeeks === weeks)} onPress={() => setSprinthiaData((prev) => ({ ...prev, totalLengthWeeks: weeks }))}>
                        <Text style={pillText(sprinthiaData.totalLengthWeeks === weeks)}>{weeks}w</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Blocks</Text>
                  <View style={styles.pillRow}>
                    {[1, 2, 3, 4, 5, 6].map((blocks) => (
                      <TouchableOpacity key={blocks} style={pill(sprinthiaData.blocks === blocks)} onPress={() => setSprinthiaData((prev) => ({ ...prev, blocks }))}>
                        <Text style={pillText(sprinthiaData.blocks === blocks)}>{blocks}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Workouts Per Week</Text>
                  <View style={styles.pillRow}>
                    {[2, 3, 4, 5, 6, 7].map((count) => (
                      <TouchableOpacity key={count} style={pill(sprinthiaData.workoutsPerWeek === count)} onPress={() => setSprinthiaData((prev) => ({ ...prev, workoutsPerWeek: count }))}>
                        <Text style={pillText(sprinthiaData.workoutsPerWeek === count)}>{count}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Gym Workouts Per Week</Text>
                  <View style={styles.pillRow}>
                    {[0, 1, 2, 3, 4, 5].map((count) => (
                      <TouchableOpacity key={count} style={pill(sprinthiaData.gymWorkoutsPerWeek === count)} onPress={() => setSprinthiaData((prev) => ({ ...prev, gymWorkoutsPerWeek: count }))}>
                        <Text style={pillText(sprinthiaData.gymWorkoutsPerWeek === count)}>{count}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Block Focus</Text>
                  <View style={styles.pillRow}>
                    {[
                      { id: 'speed', label: 'Speed' },
                      { id: 'speed-maintenance', label: 'Speed Maint.' },
                      { id: 'speed-endurance', label: 'Speed End.' },
                      { id: 'mixed', label: 'Mixed' },
                      { id: 'short-to-long', label: 'Short to Long' },
                      { id: 'long-to-short', label: 'Long to Short' },
                    ].map((option) => (
                      <TouchableOpacity key={option.id} style={pill(sprinthiaData.blockFocus === option.id)} onPress={() => setSprinthiaData((prev) => ({ ...prev, blockFocus: option.id as SprinthiaFormData['blockFocus'] }))}>
                        <Text style={pillText(sprinthiaData.blockFocus === option.id)}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your goals and AI prompt" placeholderTextColor={C.textMuted} value={sprinthiaData.aiPrompt} onChangeText={(value) => setSprinthiaData((prev) => ({ ...prev, aiPrompt: value }))} multiline />

                  {renderGradientBtn('Generate Training Program', () => generateSprinthiaMutation.mutate(), generateSprinthiaMutation.isPending, <MagicWand size={16} color="white" weight="fill" />)}
                </>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Generated Program</Text>
                  <View style={styles.generatedBox}>
                    <Text style={styles.monoText}>{generatedProgram}</Text>
                  </View>
                  <View style={styles.generatedActions}>
                    {renderGradientBtn('Continue to Edit', continueToEditSprinthia, false, <PencilSimple size={14} color="white" weight="fill" />)}
                    <TouchableOpacity style={styles.outlineBtn} onPress={() => regenerateSprinthiaMutation.mutate()} disabled={regenerateSprinthiaMutation.isPending} activeOpacity={0.7}>
                      <Text style={styles.outlineBtnText}>{regenerateSprinthiaMutation.isPending ? 'Rewriting...' : 'Rewrite'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
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
  headerSpacer: { flex: 1 },
  content: {
    padding: 20,
    gap: 16,
  },
  pageHeader: {
    gap: 6,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 20,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  methodCard: {
    width: '48%',
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,122,0,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.2)',
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    textAlign: 'center',
  },
  methodDescription: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 15,
  },
  backMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  backMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.orange,
  },
  formCard: {
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.border,
    padding: 16,
    gap: 10,
  },
  formCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  formCardSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 18,
  },
  formFields: {
    gap: 12,
    marginTop: 4,
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
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  textAreaLarge: {
    minHeight: 200,
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
  outlineBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMuted,
  },
  helperText: {
    fontSize: 12,
    color: C.textMuted,
  },
  generatedBox: {
    backgroundColor: C.glass,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.border,
    maxHeight: 300,
  },
  monoText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: C.textPrimary,
    lineHeight: 18,
  },
  generatedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
