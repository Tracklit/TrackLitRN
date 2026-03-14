import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Heart,
  Lightning,
  FirstAidKit,
  Bone,
  Robot,
  Sparkle,
  ArrowRight,
  ChatCircleDots,
  Info,
  List,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { LinearGradient } from '@/components/LinearGradient';
import { ScreenTabBar } from '@/components/ScreenTabBar';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';

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
  red: '#ef4444',
  blue: '#60a5fa',
  purple: '#a855f7',
};

const rehabCategories = [
  {
    id: 'acute-muscle',
    title: 'Acute Muscle Injuries',
    description: 'Evidence-based recovery programs for sudden muscle injuries',
    iconColor: C.red,
    IconComponent: Heart,
    accentBorder: 'rgba(239,68,68,0.25)',
    subpages: [
      { id: 'hamstring', name: 'Hamstring' },
      { id: 'quad', name: 'Quadriceps' },
      { id: 'calf', name: 'Calf' },
      { id: 'groin', name: 'Groin' },
    ],
  },
  {
    id: 'chronic-injuries',
    title: 'Chronic Injuries',
    description: 'Long-term management for persistent and overuse injuries',
    iconColor: C.orange,
    IconComponent: Lightning,
    accentBorder: 'rgba(255,122,0,0.25)',
    subpages: [
      { id: 'foot', name: 'Foot' },
      { id: 'hamstring', name: 'Hamstring' },
      { id: 'quad', name: 'Quadriceps' },
      { id: 'calf', name: 'Calf' },
      { id: 'groin', name: 'Groin' },
      { id: 'other-tendons', name: 'Other Tendons' },
    ],
  },
  {
    id: 'back-injuries',
    title: 'Back Injuries',
    description: 'Specialized programs for spinal and back-related issues',
    iconColor: C.blue,
    IconComponent: FirstAidKit,
    accentBorder: 'rgba(96,165,250,0.25)',
    subpages: [
      { id: 'disc', name: 'Disc Issues' },
      { id: 'ligament', name: 'Ligament' },
      { id: 'other', name: 'Other' },
    ],
  },
  {
    id: 'bone-breaks',
    title: 'Bone Breaks',
    description: 'Recovery protocols for fractures and bone injuries',
    iconColor: C.purple,
    IconComponent: Bone,
    accentBorder: 'rgba(168,85,247,0.25)',
    subpages: [
      { id: 'ankle', name: 'Ankle' },
      { id: 'knee', name: 'Knee' },
      { id: 'shoulder', name: 'Shoulder' },
      { id: 'rib', name: 'Rib' },
      { id: 'other', name: 'Other' },
    ],
  },
];

export const RehabScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();

  const isStarUser = (user as any)?.subscriptionTier === 'star' || (user as any)?.isPremium;
  const spikes = Number((user as any)?.spikes ?? 0);

  const categories = useMemo(() => rehabCategories, []);

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('rehab_disclaimer_accepted').then((val) => {
      if (val !== 'true') setShowDisclaimer(true);
    });
  }, []);

  const handleAcceptDisclaimer = async () => {
    await AsyncStorage.setItem('rehab_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  const handleProgramPress = (categoryId: string, programId: string, programName: string) => {
    if (categoryId === 'acute-muscle' && programId === 'hamstring') {
      navigation.navigate('RehabHamstringProgram');
      return;
    }
    if (categoryId === 'chronic-injuries' && programId === 'foot') {
      navigation.navigate('RehabFootProgram');
      return;
    }
    navigation.navigate('RehabProgramComingSoon', {
      title: `${programName} Protocol`,
      category: categoryId,
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.drawerButton} onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <List size={20} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rehabilitation</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIconCircle}>
              <Heart size={24} color={C.red} weight="fill" />
            </View>
          </View>
          <Text style={styles.heroTitle}>Rehabilitation Center</Text>
          <Text style={styles.heroSubtitle}>
            Evidence-based recovery programs designed to get you back to peak performance safely and effectively.
          </Text>
        </View>

        <LinearGradient
          colors={['rgba(168,85,247,0.12)', 'rgba(96,165,250,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiCard}
        >
          <View style={styles.aiHeaderRow}>
            <Robot size={20} color={C.purple} weight="fill" />
            <Text style={styles.aiTitle}>AI Rehabilitation Consultant</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>
                {isStarUser ? 'Star Feature' : '50 Spikes'}
              </Text>
            </View>
          </View>
          <Text style={styles.aiDescription}>
            Get personalized rehabilitation guidance from our AI specialist. Describe your injury for a customized recovery program.
          </Text>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('Sprinthia')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[C.orange, C.orangeLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiButtonInner}
            >
              <Sparkle size={16} color="#fff" weight="fill" />
              <Text style={styles.aiButtonText}>Start AI Consultation</Text>
            </LinearGradient>
          </TouchableOpacity>
          {!isStarUser && (
            <Text style={styles.aiCost}>
              This consultation costs 50 Spikes. You have {spikes} Spikes.
            </Text>
          )}
        </LinearGradient>

        <View style={styles.categoriesContainer}>
          {categories.map((category) => {
            const Icon = category.IconComponent;
            return (
              <View
                key={category.id}
                style={[styles.categoryCard, { borderColor: category.accentBorder }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.iconColor}15` }]}>
                    <Icon size={22} color={category.iconColor} weight="fill" />
                  </View>
                  <View style={styles.categoryTextBlock}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                </View>
                <Text style={styles.availableLabel}>Available Programs</Text>
                <View style={styles.subGrid}>
                  {category.subpages.map((subpage) => (
                    <TouchableOpacity
                      key={subpage.id}
                      style={styles.subButton}
                      onPress={() => handleProgramPress(category.id, subpage.id, subpage.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.subButtonText}>{subpage.name}</Text>
                      <ArrowRight size={12} color={C.textMuted} weight="bold" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>

      <Modal
        visible={showDisclaimer}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalIconRow}>
              <View style={styles.modalIconWrap}>
                <Info size={26} color={C.blue} weight="fill" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Professional Guidance</Text>
            <Text style={styles.modalBody}>
              All programs are based on current sports medicine research and are intended to support — not replace — professional medical care.{'\n\n'}Always consult your healthcare provider, physiotherapist, or coach before starting any rehabilitation program. Stop immediately if you experience pain or discomfort.
            </Text>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAcceptDisclaimer}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[C.orange, C.orangeLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptBtnInner}
              >
                <Text style={styles.acceptBtnText}>I Understand & Accept</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScreenTabBar />
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
  drawerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  heroIconRow: {
    marginBottom: 4,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  aiCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(168,85,247,0.2)',
    padding: 16,
    gap: 12,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.purple,
  },
  aiDescription: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 19,
  },
  aiButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  aiButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  aiCost: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextBlock: {
    flex: 1,
    gap: 3,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
  },
  categoryDescription: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
  },
  availableLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    backgroundColor: C.glass,
    minWidth: 120,
    gap: 8,
  },
  subButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1A1D28',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    borderTopWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalIconRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    color: '#8A90B5',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  acceptBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  acceptBtnInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
