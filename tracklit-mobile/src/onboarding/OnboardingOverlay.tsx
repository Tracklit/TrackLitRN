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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';
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
          <CheckCircle size={18} color={theme.colors.success} weight="fill" />
          <Text variant="caption" color="success" weight="medium">
            Welcome bonus claimed{claimedBonus ? ` (+${claimedBonus})` : ''}.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.claimBlock}>
        <View style={styles.claimHeader}>
          <Gift size={18} color={theme.colors.success} weight="fill" />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="foreground" weight="semiBold">
              Welcome Bonus Available
            </Text>
            <Text variant="small" color="muted">
              Claim your first 100 Spikes.
            </Text>
          </View>
          <CurrencyDollar size={18} color="#f59e0b" weight="fill" />
        </View>

        {claimError ? (
          <Text variant="small" color="warning" style={{ marginTop: theme.spacing.sm }}>
            {claimError}
          </Text>
        ) : null}

        <Button
          testID="onboarding-claim"
          onPress={handleClaimSpikes}
          loading={claimMutation.isPending}
          style={styles.claimButton}
        >
          Claim 100 Spikes
        </Button>
      </View>
    );
  };

  const renderPage = ({ item, index }: { item: OnboardingStep; index: number }) => (
    <View style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
      <View style={styles.pageContent}>
        <Card style={styles.introCard} contentStyle={styles.cardContentNoFlex}>
          <View style={styles.iconWrap}>{item.icon}</View>
          <Text variant="h3" weight="bold" color="foreground" center>
            {item.title}
          </Text>
          <View style={styles.bodyWrap}>{item.body}</View>
          {renderClaimBlock(item)}
        </Card>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[
        styles.fullScreen,
        { paddingTop: insets.top + theme.spacing.lg, paddingBottom: insets.bottom + theme.spacing.lg },
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
        <Text variant="small" color="muted" center>
          Step {currentStepIndex + 1} of {totalSteps}
        </Text>
        <StepDots total={totalSteps} current={currentStepIndex} onDotPress={handleDotPress} />

        <View style={styles.footerButtons}>
          {canGoBack ? (
            <Button
              testID="onboarding-back"
              variant="ghost"
              size="sm"
              onPress={back}
              style={styles.footerButton}
            >
              <View style={styles.inlineIconRow}>
                <ArrowLeft size={14} color={theme.colors.primary} weight="fill" />
                <Text variant="caption" color="accent" weight="medium">
                  Back
                </Text>
              </View>
            </Button>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <Button
            testID="onboarding-skip"
            variant="ghost"
            size="sm"
            onPress={skip}
            style={styles.footerButton}
          >
            <Text variant="caption" color="accent" weight="medium">
              Skip
            </Text>
          </Button>

          <Button
            testID="onboarding-next"
            size="sm"
            onPress={isLastStep ? complete : next}
            disabled={claimMutation.isPending}
            style={styles.footerButtonPrimary}
          >
            <View style={styles.inlineIconRow}>
              <Text variant="caption" color="primary-foreground" weight="medium">
                {primaryLabel}
              </Text>
              {!isLastStep ? (
                <ArrowRight size={14} color={theme.colors.primaryForeground} weight="fill" />
              ) : null}
            </View>
          </Button>
        </View>
      </View>

      {claimMutation.isPending ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={theme.colors.foreground} />
        </View>
      ) : null}
    </LinearGradient>
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
    paddingHorizontal: theme.spacing.lg,
  },
  pageContent: {
    alignItems: 'center',
  },
  introCard: {
    width: '100%',
    maxWidth: 520,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyWrap: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  footerArea: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  footerButton: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  footerButtonPrimary: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  inlineIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  claimBlock: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.12)',
    gap: theme.spacing.sm,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  claimButton: {
    marginTop: theme.spacing.sm,
  },
  claimedRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.12)',
  },
  cardContentNoFlex: {
    flex: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
