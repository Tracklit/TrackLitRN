import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme, type ThemeValues } from '@/contexts/ThemeContext';

/**
 * Factory hook for theme-aware styles.
 *
 * Define `createStyles` at MODULE SCOPE (outside the component) so it is a
 * stable reference. The returned styles are memoized and only recomputed when
 * the resolved theme flips (at most 2 distinct objects in the app's lifetime).
 *
 * Usage:
 *   const createStyles = (t: ThemeValues) => StyleSheet.create({
 *     container: { flex: 1, backgroundColor: t.colors.backgroundSolid },
 *   });
 *
 *   const MyScreen = () => {
 *     const { styles, theme, isDark } = useThemedStyles(createStyles);
 *     return <View style={styles.container} />;
 *   };
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (theme: ThemeValues) => T,
): { styles: T; theme: ThemeValues; isDark: boolean } {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme, createStyles]);
  return { styles, theme, isDark };
}
