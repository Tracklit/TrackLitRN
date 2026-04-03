import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Gift, CurrencyDollar, ArrowRight, ArrowLeft } from 'phosphor-react-native';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
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

const COLORS = {
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
  success: '#22c55e',
  successBg: 'rgba(34,197,94,0.08)',
  successBorder: 'rgba(34,197,94,0.15)',
  amberBg: 'rgba(245,158,11,0.08)',
  amberBorder: 'rgba(245,158,11,0.15)',
  dotInactive: 'rgba(255,255,255,0.15)',
};

const isAlreadyClaimedError = (err: any) => {
  const msg = (err?.message ?? '').toString().toLowerCase();
  return msg.includes('already claimed') || msg.includes('welcome spikes already claimed');
};

const SCREEN_WIDTH = Dimensions.get('window').width;

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

export const OnboardingOverlay: React.FC<Props> = ({ navigationRef }) => {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
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

  const [claimedSpikes, setClaimedSpikes] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimedBonus, setClaimedBonus] = useState<number | null>(null);

  useEffect(() => {
    if (isActive) {
      setClaimedSpikes(false);
      setClaimError(null);
      setClaimedBonus(null);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: currentStepIndex,
        animated: true,
      });
    }
  }, [currentStepIndex, isActive]);

  const claimMutation = useMutation({
    mutationFn: () =>
      apiRequest<ClaimResponse>('/api/claim-welcome-spikes', { method: 'POST' }),
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
          <CheckCircle size={18} color={COLORS.success} weight="fill" />
          <Text style={styles.claimedText}>
            Welcome bonus claimed{claimedBonus ? ` (+${claimedBonus})` : ''}.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.claimBlock}>
        <View style={styles.claimHeader}>
          <Gift size={20} color={COLORS.success} weight="fill" />
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
            colors={[COLORS.orange, COLORS.orangeLight]}
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

  return (
    <View
      style={[
        styles.fullScreen,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16, backgroundColor: COLORS.bg },
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
              <ArrowLeft size={14} color={COLORS.orange} weight="bold" />
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
            onPress={isLastStep ? complete : next}
            disabled={claimMutation.isPending}
            style={styles.footerPrimaryBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.orange, COLORS.orangeLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerPrimaryBtnInner}
            >
              <Text style={styles.footerPrimaryBtnText}>{primaryLabel}</Text>
              {!isLastStep ? (
                <ArrowRight size={14} color={COLORS.textPrimary} weight="bold" />
              ) : null}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {claimMutation.isPending ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.textPrimary} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: COLORS.textPrimary,
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
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.glass,
  },
  footerSideBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
  },
  footerSkipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
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
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.orange,
  },
  dotInactive: {
    backgroundColor: COLORS.dotInactive,
  },
  claimBlock: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.successBg,
    borderWidth: 0.5,
    borderColor: COLORS.successBorder,
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
    color: COLORS.textPrimary,
  },
  claimSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
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
    color: COLORS.textPrimary,
  },
  claimedRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.successBg,
    borderWidth: 0.5,
    borderColor: COLORS.successBorder,
    width: '100%',
    maxWidth: 400,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
