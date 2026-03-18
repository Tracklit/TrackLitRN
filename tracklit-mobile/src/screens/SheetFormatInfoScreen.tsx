import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Table, Columns, CheckCircle, ArrowRight } from 'phosphor-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SheetFormatInfo'>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  glass: 'rgba(255,255,255,0.05)',
  green: '#22c55e',
};

const ADVANCED_COLUMNS = [
  { col: 'A', label: 'Date', eg: 'Feb-24' },
  { col: 'B', label: 'Pre-Act 1', eg: 'A-skips' },
  { col: 'C', label: 'Pre-Act 2', eg: 'Med ball' },
  { col: 'D', label: 'Short', eg: '6×30m' },
  { col: 'E', label: 'Medium', eg: '4×150m' },
  { col: 'F', label: 'Long', eg: '2×300m' },
  { col: 'G', label: 'Extra', eg: 'Gym 3' },
];

export const SheetFormatInfoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const showContinue = route.params?.showContinue ?? false;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Sheet Formats</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (showContinue ? 100 : 40) }]}
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
            One row per training day. Column A holds the date and Column B holds the full session description as free text.
          </Text>

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>
                <Text style={styles.tableHeaderText}>A — Date</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeaderCell, { flex: 3, borderRightWidth: 0 }]}>
                <Text style={styles.tableHeaderText}>B — Session</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableCellText}>Feb-24</Text>
              </View>
              <View style={[styles.tableCell, { flex: 3, borderRightWidth: 0 }]}>
                <Text style={styles.tableCellText}>Warm up, 4×60m, 3×150m, cool down</Text>
              </View>
            </View>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableCellText}>Feb-25</Text>
              </View>
              <View style={[styles.tableCell, { flex: 3, borderRightWidth: 0 }]}>
                <Text style={styles.tableCellText}>Tempo 6×200m, core circuit</Text>
              </View>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableCellText}>Feb-26</Text>
              </View>
              <View style={[styles.tableCell, { flex: 3, borderRightWidth: 0 }]}>
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

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderCell]}>
              {ADVANCED_COLUMNS.map(({ col }, i) => (
                <View
                  key={col}
                  style={[
                    styles.advCell,
                    i === ADVANCED_COLUMNS.length - 1 && { borderRightWidth: 0 },
                  ]}
                >
                  <View style={styles.colLetterBadge}>
                    <Text style={styles.colLetterText}>{col}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.tableRow}>
              {ADVANCED_COLUMNS.map(({ col, label }, i) => (
                <View
                  key={col}
                  style={[
                    styles.advCell,
                    i === ADVANCED_COLUMNS.length - 1 && { borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.advLabelText} numberOfLines={2}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              {ADVANCED_COLUMNS.map(({ col, eg }, i) => (
                <View
                  key={col}
                  style={[
                    styles.advCell,
                    i === ADVANCED_COLUMNS.length - 1 && { borderRightWidth: 0 },
                  ]}
                >
                  <Text style={styles.advExampleText} numberOfLines={2}>{eg}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tipRow}>
            <CheckCircle size={14} color={C.green} weight="fill" />
            <Text style={styles.tipText}>Google Sheets import also supports this format via the Advanced selector.</Text>
          </View>
        </View>

        <View style={styles.autoDetectCard}>
          <Text style={styles.autoDetectTitle}>Auto-detection</Text>
          <Text style={styles.autoDetectBody}>
            When uploading a CSV or XLSX file, Tracklit inspects the first few rows and automatically selects the correct format. If columns C–G are empty, it uses Simple. Otherwise it uses Advanced.
          </Text>
        </View>
      </ScrollView>

      {showContinue && (
        <View style={[styles.continueBar, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.85}
            onPress={() => navigation.replace('ProgramImport')}
          >
            <LinearGradient
              colors={[C.orange, C.orangeLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtnInner}
            >
              <Text style={styles.continueBtnText}>Continue to Import</Text>
              <ArrowRight size={16} color="white" weight="bold" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  tableHeaderCell: {
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
  advCell: {
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 7,
    borderRightWidth: 0.5,
    borderRightColor: C.border,
    alignItems: 'center',
  },
  colLetterBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,122,0,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colLetterText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.orange,
  },
  advLabelText: {
    fontSize: 9,
    fontWeight: '600',
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  advExampleText: {
    fontSize: 9,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
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
  continueBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  continueBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});
