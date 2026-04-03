export type Tier = 'free' | 'pro' | 'star';
export type ResetPeriod = 'week' | 'month' | 'unlimited';

export interface TierLimits {
  ariaPrompts: number | 'unlimited';
  promptResetPeriod: ResetPeriod;
  groupChatCount: number | 'unlimited';
  groupMemberLimit: number | 'unlimited';
  photoFinishUploads: number | 'unlimited';
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    ariaPrompts: 3,
    promptResetPeriod: 'week',
    groupChatCount: 3,
    groupMemberLimit: 10,
    photoFinishUploads: 5,
  },
  pro: {
    ariaPrompts: 50,
    promptResetPeriod: 'month',
    groupChatCount: 20,
    groupMemberLimit: 50,
    photoFinishUploads: 50,
  },
  star: {
    ariaPrompts: 'unlimited',
    promptResetPeriod: 'unlimited',
    groupChatCount: 'unlimited',
    groupMemberLimit: 'unlimited',
    photoFinishUploads: 'unlimited',
  },
};

export const TIER_DISPLAY_NAMES: Record<Tier, string> = {
  free: 'Free',
  pro: 'Pro',
  star: 'Elite',
};
