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
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CaretLeft,
  BookOpen,
  CheckCircle,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CoachAssignProgram'>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.38)',
  green: '#22c55e',
};

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

  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());

  const programsQuery = useQuery({
    queryKey: ['coach-programs'],
    queryFn: () => apiRequest<CoachProgram[]>('/api/programs/coach'),
    enabled: isAuthenticated,
  });

  const assignMutation = useMutation({
    mutationFn: (programId: number) =>
      apiRequest(`/api/programs/${programId}/assign`, {
        method: 'POST',
        data: { assigneeId: athleteId },
      }),
    onSuccess: (_, programId) => {
      setAssignedIds(prev => new Set([...prev, programId]));
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to assign program';
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
          <CaretLeft size={22} color={C.textPrimary} weight="bold" />
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
          <ActivityIndicator color={C.orange} style={{ marginTop: 48 }} />
        ) : programs.length === 0 ? (
          <View style={styles.empty}>
            <BookOpen size={36} color={C.textMuted} weight="fill" />
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
                    <BookOpen size={18} color={C.orange} weight="fill" />
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
                      <CheckCircle size={16} color={C.green} weight="fill" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  headerSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  scroll: { padding: 20 },
  list: { gap: 10 },
  programCard: {
    backgroundColor: C.card,
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
    backgroundColor: 'rgba(255,122,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programInfo: { flex: 1 },
  programTitle: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  programDesc: { fontSize: 12, color: C.textMuted, marginTop: 3, lineHeight: 16 },
  assignBtn: {
    backgroundColor: C.orange,
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
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', maxWidth: 260 },
});
