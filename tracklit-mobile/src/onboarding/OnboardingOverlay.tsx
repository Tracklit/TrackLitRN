import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import {
  CheckCircle,
  Gift,
  CurrencyDollar,
  ArrowRight,
  ArrowLeft,
  Barbell,
  ClipboardText,
  Info,
} from 'phosphor-react-native';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
import type { OnboardingStep } from '@/onboarding/steps';

type Props = {
  navigationRef: any;
};

type ClaimResponse = {
  success?: boolean;
  spikes?: number;
  bonus?: number;
  error?: string;
};

type RoleChoice = 'athlete' | 'coach';

const isAlreadyClaimedError = (err: any) => {
  const msg = (err?.message ?? '').toString().toLowerCase();
  return msg.includes('already claimed') || msg.includes('welcome spikes already claimed');
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export const OnboardingOverlay: React.FC<Props> = ({ navigationRef }) => {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { styles, theme } = useThemedStyles(createStyles);
  const {
    isReady,
    isActive,
    currentStepIndex,
    steps,
    next,
    back,
    skip,
    complete,
    goToStep,
  } = useOnboarding();

  const flatListRef = useRef<FlatList>(null);
  const totalSteps = steps.length;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [claimedSpikes, setClaimedSpikes] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedBonus, setClaimedBonus] = useState<number | null>(null);

  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [roleChoice, setRoleChoice] = useState<RoleChoice | null>(null);

  useEffect(() => {
    if (isActive) {
      setClaimedSpikes(false);
      setClaimError(null);
      setClaimedBonus(null);
      setShowRoleSelect(false);
      setRoleChoice(null);
      fadeAnim.setValue(1);
    }
  }, [isActive, fadeAnim]);

  useEffect(() => {
    if (isActive && flatListRef.current && !showRoleSelect) {
      flatListRef.current.scrollToIndex({
        index: currentStepIndex,
        animated: true,
      });
    }
  }, [currentStepIndex, isActive, showRoleSelect]);

  const claimMutation = useMutation({
    mutationFn: () =>
      apiRequest<ClaimResponse>('/api/claim-welcome-spikes', { method: 'POST' }),
  });

  const roleSetMutation = useMutation({
    mutationFn: (isCoach: boolean) =>
      apiRequest('/api/user/coach-status', { method: 'PATCH', data: { isCoach } }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      await refreshUser();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        complete();
      });
    },
  });

  const handleClaimSpikes = async () => {
    if (claimedSpikes || claimMutation.isPending) return;
    setClaimError(null);

    try {
      const res = await claimMutation.mutateAsync();
      setClaimedSpikes(true);
      setClaimedBonus(typeof res?.bonus === 'number' ? res.bonus : 100);
    } catch (err: any) {
      if (isAlreadyClaimedError(err)) {
        setClaimedSpikes(true);
        setClaimedBonus(100);
      } else {
        setClaimError(err?.message ? String(err.message) : 'Failed to claim welcome bonus');
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['/api/spike-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/login-streak'] });
    await refreshUser();
  };

  const handleDotPress = useCallback((index: number) => {
    goToStep(index);
  }, [goToStep]);

  const handleMomentumEnd = useCallback((e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentStepIndex && newIndex >= 0 && newIndex < totalSteps) {
      goToStep(newIndex);
    }
  }, [currentStepIndex, totalSteps, goToStep]);

  const handleFinish = useCallback(() => {
    setShowRoleSelect(true);
  }, []);

  const handleRoleConfirm = useCallback(() => {
    if (!roleChoice || roleSetMutation.isPending) return;
    roleSetMutation.mutate(roleChoice === 'coach');
  }, [roleChoice, roleSetMutation]);

  const handleSkipRole = useCallback(async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      complete();
    });
  }, [fadeAnim, complete]);

  const canGoBack = currentStepIndex > 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const step = steps[currentStepIndex];

  const primaryLabel = useMemo(() => {
    if (isLastStep) return step?.primaryCtaLabel ?? 'Finish';
    return step?.primaryCtaLabel ?? 'Next';
  }, [isLastStep, step?.primaryCtaLabel]);

  if (!isReady || !isActive || !step) return null;

  const renderClaimBlock = (s: OnboardingStep) => {
    if (!s.showClaimSpikes) return null;

    if (claimedSpikes) {
      return (
        <View style={styles.claimedRow} testID="onboarding-claimed">
          <CheckCircle size={18} color={theme.colors.success} weight="fill" />
          <Text style={styles.claimedText}>
            Welcome bonus claimed{claimedBonus ? ` (+${claimedBonus})` : ''}.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.claimBlock}>
        <View style={styles.claimHeader}>
          <Gift size={20} color={theme.colors.success} weight="fill" />
          <View style={{ flex: 1 }}>
            <Text style={styles.claimTitle}>Welcome Bonus Available</Text>
            <Text style={styles.claimSubtext}>Claim your first 100 Spikes.</Text>
          </View>
          <CurrencyDollar size={20} color="#f59e0b" weight="fill" />
        </View>

        {claimError ? (
          <Text style={styles.claimError}>{claimError}</Text>
        ) : null}

        <TouchableOpacity
          testID="onboarding-claim"
          style={styles.claimBtn}
          onPress={handleClaimSpikes}
          activeOpacity={0.8}
          disabled={claimMutation.isPending}
        >
          <LinearGradient
            colors={['#FF7A00', '#FF9D00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.claimBtnInner}
          >
            <Text style={styles.claimBtnText}>
              {claimMutation.isPending ? 'Claiming...' : 'Claim 100 Spikes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPage = ({ item }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        {item.icon ? <View style={styles.iconWrap}>{item.icon}</View> : null}
        <Text style={styles.stepTitle}>{item.title}</Text>
        <View style={styles.bodyWrap}>{item.body}</View>
        {renderClaimBlock(item)}
      </View>
    </View>
  );

  const StepDots: React.FC<{ total: number; current: number; onDotPress: (index: number) => void }> = ({
    total,
    current,
    onDotPress,
  }) => (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onDotPress(index)}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          activeOpacity={0.6}
        >
          <View
            style={[
              styles.dot,
              index === current ? styles.dotActive : styles.dotInactive,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (showRoleSelect) {
    return (
      <Animated.View
        style={[
          styles.fullScreen,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
            backgroundColor: theme.colors.backgroundSolid,
            opacity: fadeAnim,
          },
        ]}
      >
        <View style={styles.roleContainer}>
          <Text style={styles.roleTitle}>What describes you best?</Text>
          <Text style={styles.roleSubtitle}>
            This personalises your TrackLit experience from the start.
          </Text>

          <TouchableOpacity
            style={[
              styles.roleCard,
              roleChoice === 'athlete' && styles.roleCardActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setRoleChoice('athlete')}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(255,122,0,0.12)' }]}>
              <Barbell size={28} color={theme.colors.brandOrange} weight="fill" />
            </View>
            <View style={styles.roleCardText}>
              <Text style={styles.roleCardTitle}>Athlete</Text>
              <Text style={styles.roleCardDesc}>
                Track sessions, log programs, monitor progress and compete.
              </Text>
            </View>
            {roleChoice === 'athlete' && (
              <CheckCircle size={22} color={theme.colors.brandOrange} weight="fill" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              roleChoice === 'coach' && [styles.roleCardActive, styles.roleCardActiveBlue],
            ]}
            activeOpacity={0.8}
            onPress={() => setRoleChoice('coach')}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: 'rgba(96,165,250,0.10)' }]}>
              <ClipboardText size={28} color="#60a5fa" weight="fill" />
            </View>
            <View style={styles.roleCardText}>
              <Text style={styles.roleCardTitle}>Coach</Text>
              <Text style={styles.roleCardDesc}>
                Manage athletes, assign programs and monitor team activity.
              </Text>
            </View>
            {roleChoice === 'coach' && (
              <CheckCircle size={22} color="#60a5fa" weight="fill" />
            )}
          </TouchableOpacity>

          <View style={styles.roleInfoRow}>
            <Info size={13} color={theme.colors.textMuted} weight="fill" />
            <Text style={styles.roleInfoText}>
              You can change this later in Account Settings.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.roleConfirmBtn, !roleChoice && styles.roleConfirmBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleRoleConfirm}
            disabled={!roleChoice || roleSetMutation.isPending}
          >
            {roleSetMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.roleConfirmBtnText}>
                  {roleChoice ? `Continue as ${roleChoice === 'coach' ? 'Coach' : 'Athlete'}` : 'Select a role to continue'}
                </Text>
                {!!roleChoice && <ArrowRight size={16} color="#fff" weight="bold" />}
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.roleSkipBtn} onPress={handleSkipRole} activeOpacity={0.6}>
            <Text style={styles.roleSkipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.fullScreen,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, backgroundColor: theme.colors.backgroundSolid, opacity: fadeAnim },
      ]}
    >
      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialScrollIndex={currentStepIndex}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 100);
        }}
        style={styles.flatList}
      />

      <View style={styles.footerArea}>
        <Text style={styles.stepCounter}>
          Step {currentStepIndex + 1} of {totalSteps}
        </Text>
        <StepDots total={totalSteps} current={currentStepIndex} onDotPress={handleDotPress} />

        <View style={styles.footerButtons}>
          {canGoBack ? (
            <TouchableOpacity
              testID="onboarding-back"
              onPress={back}
              style={styles.footerSideBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={14} color={theme.colors.brandOrange} weight="bold" />
              <Text style={styles.footerSideBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity
            testID="onboarding-skip"
            onPress={skip}
            style={styles.footerSideBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.footerSkipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="onboarding-next"
            onPress={isLastStep ? handleFinish : next}
            disabled={claimMutation.isPending}
            style={styles.footerPrimaryBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FF7A00', '#FF9D00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerPrimaryBtnInner}
            >
              <Text style={styles.footerPrimaryBtnText}>{primaryLabel}</Text>
              {!isLastStep ? (
                <ArrowRight size={14} color={theme.colors.textPrimary} weight="bold" />
              ) : null}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {claimMutation.isPending ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.textPrimary} />
        </View>
      ) : null}
    </Animated.View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  flatList: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pageContent: {
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: t.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  bodyWrap: {
    width: '100%',
    maxWidth: 400,
    gap: 14,
  },
  footerArea: {
    paddingHorizontal: 24,
    gap: 10,
  },
  stepCounter: {
    fontSize: 12,
    color: t.colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  footerSideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: t.colors.overlaySubtle,
  },
  footerSideBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
  footerSkipText: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.textMuted,
  },
  footerPrimaryBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  footerPrimaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: t.colors.brandOrange,
  },
  dotInactive: {
    backgroundColor: t.colors.overlayHeavy,
  },
  claimBlock: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(34,197,94,0.15)',
    gap: 10,
    width: '100%',
    maxWidth: 400,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  claimTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.textPrimary,
  },
  claimSubtext: {
    fontSize: 12,
    color: t.colors.textMuted,
    marginTop: 1,
  },
  claimError: {
    fontSize: 12,
    color: '#f59e0b',
  },
  claimBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 2,
  },
  claimBtnInner: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  claimBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  claimedRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(34,197,94,0.15)',
    width: '100%',
    maxWidth: 400,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: '600',
    color: t.colors.success,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  roleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  roleTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: t.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: t.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: t.colors.cardSolid,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: t.colors.overlayLight,
  },
  roleCardActive: {
    borderColor: t.colors.brandOrange,
    backgroundColor: 'rgba(255,122,0,0.07)',
  },
  roleCardActiveBlue: {
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96,165,250,0.10)',
  },
  roleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardText: {
    flex: 1,
    gap: 4,
  },
  roleCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  roleCardDesc: {
    fontSize: 13,
    color: t.colors.textMuted,
    lineHeight: 18,
  },
  roleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  roleInfoText: {
    fontSize: 12,
    color: t.colors.textMuted,
    textAlign: 'center',
  },
  roleConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: t.colors.brandOrange,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  roleConfirmBtnDisabled: {
    backgroundColor: 'rgba(255,122,0,0.30)',
  },
  roleConfirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  roleSkipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  roleSkipText: {
    fontSize: 13,
    color: t.colors.textMuted,
    fontWeight: '500',
  },
});
