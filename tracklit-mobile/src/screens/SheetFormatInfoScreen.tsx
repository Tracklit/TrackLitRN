import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Table, Columns, CheckCircle } from 'phosphor-react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@/components/ui/Text';

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  green: '#22c55e',
};

export const SheetFormatInfoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={C.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sheet Formats</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Tracklit supports two spreadsheet formats for importing training programs. The format is detected automatically when you upload a local file.
        </Text>

        <View style={styles.formatCard}>
          <View style={styles.formatHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,122,0,0.12)' }]}>
              <Columns size={20} color={C.orange} weight="fill" />
            </View>
            <View style={styles.formatTitleBlock}>
              <Text style={styles.formatTitle}>Simple Format</Text>
              <Text style={styles.formatSubtitle}>2 columns — Date + Session</Text>
            </View>
          </View>

          <Text style={styles.formatDesc}>
            The simplest option. One row per training day. Column A holds the date and Column B holds the full session description as free text.
          </Text>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableHeader, { flex: 1 }]}>
                <Text style={styles.tableHeaderText}>A — Date</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, { flex: 3 }]}>
                <Text style={styles.tableHeaderText}>B — Session</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableCellText}>Feb-24</Text>
              </View>
              <View style={[styles.tableCell, { flex: 3 }]}>
                <Text style={styles.tableCellText}>Warm up, 4×60m, 3×150m, cool down</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableCellText}>Feb-25</Text>
              </View>
              <View style={[styles.tableCell, { flex: 3 }]}>
                <Text style={styles.tableCellText}>Tempo 6×200m, core circuit</Text>
              </View>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableCellText}>Feb-26</Text>
              </View>
              <View style={[styles.tableCell, { flex: 3 }]}>
                <Text style={styles.tableCellText}>Rest day</Text>
              </View>
            </View>
          </View>

          <View style={styles.tipRow}>
            <CheckCircle size={14} color={C.green} weight="fill" />
            <Text style={styles.tipText}>First row is treated as a header and skipped automatically.</Text>
          </View>
        </View>

        <View style={styles.formatCard}>
          <View style={styles.formatHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(184,192,255,0.1)' }]}>
              <Table size={20} color={C.textSecondary} weight="fill" />
            </View>
            <View style={styles.formatTitleBlock}>
              <Text style={styles.formatTitle}>Advanced Format</Text>
              <Text style={styles.formatSubtitle}>7 columns — structured workouts</Text>
            </View>
          </View>

          <Text style={styles.formatDesc}>
            Designed for coaches who structure sessions across multiple workout categories. Each column maps to a specific component of the training day.
          </Text>

          <View style={styles.columnList}>
            {[
              { col: 'A', label: 'Date', eg: 'Feb-24' },
              { col: 'B', label: 'Pre-Activation 1', eg: 'Drills, A-skips' },
              { col: 'C', label: 'Pre-Activation 2', eg: 'Medicine ball circuit' },
              { col: 'D', label: 'Short Distance', eg: '6×30m fly' },
              { col: 'E', label: 'Medium Distance', eg: '4×150m' },
              { col: 'F', label: 'Long Distance', eg: '2×300m' },
              { col: 'G', label: 'Extra Session', eg: 'Gym 3 — squats, RDL' },
            ].map(({ col, label, eg }) => (
              <View key={col} style={styles.columnRow}>
                <View style={styles.colBadge}>
                  <Text style={styles.colBadgeText}>{col}</Text>
                </View>
                <View style={styles.colInfo}>
                  <Text style={styles.colLabel}>{label}</Text>
                  <Text style={styles.colExample}>{eg}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.tipRow}>
            <CheckCircle size={14} color={C.green} weight="fill" />
            <Text style={styles.tipText}>Google Sheets import also supports this format via the Advanced tab selector.</Text>
          </View>
        </View>

        <View style={styles.autoDetectCard}>
          <Text style={styles.autoDetectTitle}>Auto-detection</Text>
          <Text style={styles.autoDetectBody}>
            When uploading a CSV or XLSX file, Tracklit inspects the first few rows and automatically selects the correct format. If columns C–G are empty, it uses Simple. Otherwise it uses Advanced. No manual selection needed.
          </Text>
        </View>
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
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.glass,
    borderWidth: 0.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  intro: {
    fontSize: 14,
    color: C.textMuted,
    lineHeight: 22,
  },
  formatCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 0.5,
    borderColor: C.border,
    gap: 14,
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatTitleBlock: {
    gap: 2,
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  formatSubtitle: {
    fontSize: 13,
    color: C.textMuted,
  },
  formatDesc: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
  },
  table: {
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tableHeader: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRightWidth: 0.5,
    borderRightColor: C.border,
  },
  tableCellText: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 18,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
    flex: 1,
  },
  columnList: {
    gap: 8,
  },
  columnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  colBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.orange,
  },
  colInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  colExample: {
    fontSize: 12,
    color: C.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  autoDetectCard: {
    backgroundColor: 'rgba(255,122,0,0.06)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.2)',
    gap: 8,
  },
  autoDetectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.orange,
  },
  autoDetectBody: {
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 20,
  },
});
