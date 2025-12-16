import theme from '@/utils/theme';

/**
 * The bottom tab bar is absolutely positioned and also adds its own safe-area padding.
 * If screens only pad by `bottomNavHeight + insets.bottom`, the last items can end up
 * hidden behind the tab bar on many devices.
 */
export function getBottomNavOverlayHeight(insetsBottom: number): number {
  return theme.layout.bottomNavHeight + Math.max(insetsBottom, theme.spacing.md);
}

/**
 * Standard padding to ensure scrollable content clears overlays (bottom nav + safe area).
 */
export function getScreenContentBottomPadding(
  insetsBottom: number,
  options?: {
    includeBottomNav?: boolean;
    extra?: number;
  },
): number {
  const includeBottomNav = options?.includeBottomNav ?? true;
  const extra = options?.extra ?? theme.spacing.xl;
  const base = includeBottomNav ? getBottomNavOverlayHeight(insetsBottom) : insetsBottom;
  return base + extra;
}



