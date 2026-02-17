import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Gift, Coins, ArrowRight, ArrowLeft } from 'lucide-react-native';

import { LinearGradient } from '@/components/LinearGradient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import theme from '@/utils/theme';

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

const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          index === current ? styles.dotActive : styles.dotInactive,
        ]}
      />
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
  } = useOnboarding();

  const step = steps[currentStepIndex];
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
    if (!isActive || !step?.onEnter) return;
    if (step.mode !== 'tour') return;
    step.onEnter(navigationRef);
  }, [isActive, step, navigationRef]);

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

  const canGoBack = currentStepIndex > 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            if (isLastStep) {
              complete();
            } else {
              next();
            }
          });
        } else if (gestureState.dx > SWIPE_THRESHOLD && canGoBack) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            back();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const primaryLabel = useMemo(() => {
    if (isLastStep) return step?.primaryCtaLabel ?? 'Finish';
    return step?.primaryCtaLabel ?? 'Next';
  }, [isLastStep, step?.primaryCtaLabel]);

  if (!isReady || !step) return null;

  const renderClaimBlock = () => {
    if (!step.showClaimSpikes) return null;

    if (claimedSpikes) {
      return (
        <View style={styles.claimedRow} testID="onboarding-claimed">
          <CheckCircle2 size={18} color={theme.colors.success} />
          <Text variant="caption" color="success" weight="medium">
            Welcome bonus claimed{claimedBonus ? ` (+${claimedBonus})` : ''}.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.claimBlock}>
        <View style={styles.claimHeader}>
          <Gift size={18} color={theme.colors.success} />
          <View style={{ flex: 1 }}>
            <Text variant="caption" color="foreground" weight="semiBold">
              Welcome Bonus Available
            </Text>
            <Text variant="small" color="muted">
              Claim your first 100 Spikes.
            </Text>
          </View>
          <Coins size={18} color="#f59e0b" />
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

  const FooterButtons = () => (
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
            <ArrowLeft size={14} color={theme.colors.primary} />
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
            <ArrowRight size={14} color={theme.colors.primaryForeground} />
          ) : null}
        </View>
      </Button>
    </View>
  );

  if (step.mode === 'intro') {
    return (
      <Modal
        visible={isActive}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={skip}
      >
        <LinearGradient
          colors={theme.gradient.background}
          locations={theme.gradient.locations}
          style={[
            styles.introContainer,
            { paddingTop: insets.top + theme.spacing.lg, paddingBottom: insets.bottom + theme.spacing.lg },
          ]}
        >
          <Animated.View
            {...panResponder.panHandlers}
            style={{ transform: [{ translateX }] }}
          >
            <Card style={styles.introCard} contentStyle={styles.cardContentNoFlex}>
              <View style={styles.iconWrap}>{step.icon}</View>
              <Text variant="h3" weight="bold" color="foreground" center>
                {step.title}
              </Text>

              <View style={styles.bodyWrap}>{step.body}</View>

              {renderClaimBlock()}

              <View style={styles.footerWrap}>
                <Text variant="small" color="muted" center>
                  Step {currentStepIndex + 1} of {totalSteps}
                </Text>
                <StepDots total={totalSteps} current={currentStepIndex} />
                <FooterButtons />
              </View>
            </Card>
          </Animated.View>

          {claimMutation.isPending ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={theme.colors.foreground} />
            </View>
          ) : null}
        </LinearGradient>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={skip}
    >
      <View
        style={[
          styles.tourContainer,
          { paddingTop: insets.top + theme.spacing.lg, paddingBottom: insets.bottom + theme.spacing.lg },
        ]}
      >
        <View style={styles.tourSheet}>
          <Card style={styles.tourCard} contentStyle={styles.cardContentNoFlex}>
            <View style={styles.tourHeader}>
              <View style={styles.tourIcon}>{step.icon}</View>
              <View style={{ flex: 1 }}>
                <Text variant="h4" weight="bold" color="foreground">
                  {step.title}
                </Text>
                <Text variant="small" color="muted">
                  Step {currentStepIndex + 1} of {totalSteps}
                </Text>
              </View>
            </View>

            <View style={styles.bodyWrap}>{step.body}</View>

            <StepDots total={totalSteps} current={currentStepIndex} />
            <FooterButtons />
          </Card>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  introCard: {
    width: '100%',
    maxWidth: 520,
    marginBottom: 0,
    backgroundColor: 'rgba(10, 21, 41, 0.92)',
    borderColor: 'rgba(30, 58, 138, 0.2)',
    borderWidth: 1,
  },
  tourContainer: {
    flex: 1,
    backgroundColor: 'rgba(1, 10, 24, 0.55)',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
  },
  tourSheet: {
    width: '100%',
    alignItems: 'center',
  },
  tourCard: {
    width: '100%',
    maxWidth: 520,
    marginBottom: 0,
    backgroundColor: 'rgba(10, 21, 41, 0.92)',
    borderColor: 'rgba(30, 58, 138, 0.2)',
    borderWidth: 1,
  },
  tourHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  tourIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyWrap: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  footerWrap: {
    marginTop: theme.spacing.lg,
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
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.18)',
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
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.18)',
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
