export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type Tier = 'free' | 'pro' | 'star';
export type ResetPeriod = 'week' | 'month' | 'unlimited';

export interface TierLimits {
  ariaPrompts: number | 'unlimited';
  promptResetPeriod: ResetPeriod;
  groupChatCount: number | 'unlimited';
  groupMemberLimit: number | 'unlimited';
  photoFinishUploads: number | 'unlimited';
}

export const TIER_DISPLAY_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  pro: 'Pro',
  elite: 'Elite',
};

export const TIER_PRICES: Record<SubscriptionTier, { weekly?: string; monthly?: string }> = {
  free: {},
  pro: { weekly: '$2.99/wk', monthly: '$5.99/mo' },
  elite: { weekly: '$4.99/wk', monthly: '$13.99/mo' },
};

export const TIER_LIMITS = {
  free: {
    ariaPromptsPerWeek: 5,
    ariaPrompts: 3 as number | 'unlimited',
    promptResetPeriod: 'week' as ResetPeriod,
    groupChatCount: 3 as number | 'unlimited',
    groupMemberLimit: 10 as number | 'unlimited',
    maxGroups: 3,
    maxMembersPerGroup: 10,
    photoFinishUploads: 5 as number | 'unlimited',
    photoFinishUploadsPerMonth: 3,
    maxActivePrograms: 3,
    spikesMultiplier: 1.0,
    coachPlatformFeePercent: null as number | null,
    unlimitedGroups: false,
    unlimitedMembers: false,
  },
  pro: {
    ariaPromptsPerMonth: 50,
    ariaPrompts: 50 as number | 'unlimited',
    promptResetPeriod: 'month' as ResetPeriod,
    groupChatCount: 20 as number | 'unlimited',
    groupMemberLimit: 50 as number | 'unlimited',
    maxGroups: 3,
    maxMembersPerGroup: 30,
    photoFinishUploads: 50 as number | 'unlimited',
    photoFinishUploadsPerMonth: 25,
    maxActivePrograms: null as number | null,
    spikesMultiplier: 1.25,
    coachPlatformFeePercent: 18 as number | null,
    unlimitedGroups: false,
    unlimitedMembers: false,
  },
  elite: {
    ariaPromptsPerMonth: null as number | null,
    ariaPrompts: 'unlimited' as number | 'unlimited',
    promptResetPeriod: 'unlimited' as ResetPeriod,
    groupChatCount: 'unlimited' as number | 'unlimited',
    groupMemberLimit: 'unlimited' as number | 'unlimited',
    maxGroups: null as number | null,
    maxMembersPerGroup: null as number | null,
    photoFinishUploads: 'unlimited' as number | 'unlimited',
    photoFinishUploadsPerMonth: null as number | null,
    maxActivePrograms: null as number | null,
    spikesMultiplier: 1.5,
    coachPlatformFeePercent: 16 as number | null,
    unlimitedGroups: true,
    unlimitedMembers: true,
  },
};

export const TIER_ENTITLEMENT_LABELS: Record<SubscriptionTier, string[]> = {
  free: [
    '5 Aria prompts / week',
    '3 group chats (max 10 members each)',
    '3 photo finish uploads / month',
    '3 active programs',
    'Standard Spikes earning',
  ],
  pro: [
    '50 Aria prompts / month',
    '3 group chats (max 30 members)',
    '25 photo finish uploads / month',
    'Unlimited programs',
    '1.25× Spikes earning',
    '18% coach platform fee',
  ],
  elite: [
    'Unlimited Aria prompts',
    'Unlimited groups & members',
    'Unlimited photo finish uploads',
    'Unlimited programs',
    '1.5× Spikes earning',
    '16% coach platform fee',
    'Early feature access',
  ],
};

export function resolveUserTier(raw: string | null | undefined): SubscriptionTier {
  if (raw === 'pro') return 'pro';
  if (raw === 'elite' || raw === 'star') return 'elite';
  return 'free';
}
