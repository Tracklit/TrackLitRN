import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CaretLeft,
  BookOpen,
  CheckCircle,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CoachAssignProgram'>;

interface CoachProgram {
  id: number;
  title: string;
  description?: string | null;
  isPublic?: boolean;
  sessionsCount?: number;
}

export const CoachAssignProgramScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { athleteId, athleteName, athleteUsername } = route.params;
  const { isAuthenticated } = useAuth();
  const { styles, theme } = useThemedStyles(createStyles);
  const queryClient = useQueryClient();

  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());

  const programsQuery = useQuery({
    queryKey: ['coach-programs'],
    queryFn: () => apiRequest<CoachProgram[]>('/api/programs/coach'),
    enabled: isAuthenticated,
  });

  const invalidateAssignmentQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['coach-programs'] });
    void queryClient.invalidateQueries({ queryKey: ['coach-athletes'] });
    void queryClient.invalidateQueries({ queryKey: ['user-programs'] });
    void queryClient.invalidateQueries({ queryKey: ['my-programs'] });
    void queryClient.invalidateQueries({ queryKey: ['my-programs-home'] });
    void queryClient.invalidateQueries({ queryKey: ['today-session'] });
  };

  const assignMutation = useMutation({
    mutationFn: (programId: number) =>
      apiRequest(`/api/programs/${programId}/assign`, {
        method: 'POST',
        data: { assigneeId: Number(athleteId) },
      }),
    onSuccess: (_, programId) => {
      setAssignedIds(prev => new Set([...prev, programId]));
      invalidateAssignmentQueries();
    },
    onError: (err: any, programId) => {
      const msg = err?.message || 'Failed to assign program';
      if (msg === 'Program is already assigned to this user') {
        setAssignedIds(prev => new Set([...prev, programId]));
        invalidateAssignmentQueries();
        return;
      }
      Alert.alert('Could not assign', msg);
    },
  });

  const programs = programsQuery.data ?? [];
  const displayName = athleteName || `@${athleteUsername}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CaretLeft size={22} color={theme.colors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Assign Program</Text>
          <Text style={styles.headerSub}>to {displayName}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {programsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.brandOrange} style={{ marginTop: 48 }} />
        ) : programs.length === 0 ? (
          <View style={styles.empty}>
            <BookOpen size={36} color={theme.colors.textMuted} weight="fill" />
            <Text style={styles.emptyText}>
              You have no programs yet. Create a program first to assign it to athletes.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {programs.map((program) => {
              const assigned = assignedIds.has(program.id);
              const isPending = assignMutation.isPending && assignMutation.variables === program.id;
              return (
                <View key={program.id} style={styles.programCard}>
                  <View style={styles.programIcon}>
                    <BookOpen size={18} color={theme.colors.brandOrange} weight="fill" />
                  </View>
                  <View style={styles.programInfo}>
                    <Text style={styles.programTitle} numberOfLines={1}>
                      {program.title}
                    </Text>
                    {!!program.description && (
                      <Text style={styles.programDesc} numberOfLines={2}>
                        {program.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.assignBtn,
                      assigned && styles.assignBtnDone,
                    ]}
                    activeOpacity={0.75}
                    disabled={assigned || isPending}
                    onPress={() => assignMutation.mutate(program.id)}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : assigned ? (
                      <CheckCircle size={16} color={theme.colors.success} weight="fill" />
                    ) : (
                      <Text style={styles.assignBtnText}>Assign</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.backgroundSolid },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.overlayLight,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: t.colors.textPrimary },
  headerSub: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
  scroll: { padding: 20 },
  list: { gap: 10 },
  programCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: t.colors.brandOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programInfo: { flex: 1 },
  programTitle: { fontSize: 14, fontWeight: '600', color: t.colors.textPrimary },
  programDesc: { fontSize: 12, color: t.colors.textMuted, marginTop: 3, lineHeight: 16 },
  assignBtn: {
    backgroundColor: t.colors.brandOrange,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 68,
    height: 34,
  },
  assignBtnDone: { backgroundColor: 'transparent' },
  assignBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 13, color: t.colors.textMuted, textAlign: 'center', maxWidth: 260 },
});
