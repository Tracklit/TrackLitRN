import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  CaretDown,
  CaretUp,
  Crosshair,
  Scales,
  PersonArmsSpread,
  Ruler,
  ArrowsOutLineVertical,
  ShieldCheck,
  Brain,
  Barbell,
  Lightning,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Timer,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import type { PoseLandmark } from '@/components/MediaPipeBridge';
import {
  computeFullAnalysis,
  computePerformanceMetrics,
  type FrameAnalysis,
  type JointAngle,
  type SymmetryMetric,
  type MotionVector,
  type LandmarkSnapshot,
  type PerformanceMetrics,
} from '@/utils/poseAnalysis';

interface AdvancedAnalysisProps {
  landmarks: PoseLandmark[] | null;
  timestamp: number;
  onRequestAI: (analysis: FrameAnalysis) => void;
  aiLoading?: boolean;
  landmarkHistory?: LandmarkSnapshot[];
}

function AngleBar({ angle, max = 180 }: { angle: number; max?: number }) {
  const pct = Math.min((angle / max) * 100, 100);
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%` }]} />
    </View>
  );
}

function SymmetryBar({ metric }: { metric: SymmetryMetric }) {
  const color = metric.status === 'balanced' ? '#00FF88' : metric.status === 'slight' ? '#FFD600' : '#FF3366';
  return (
    <View style={styles.symmetryRow}>
      <Text variant="small" style={styles.metricLabel}>{metric.name}</Text>
      <View style={styles.symmetryValues}>
        <Text variant="small" style={styles.sideValue}>L: {metric.leftValue}°</Text>
        <View style={[styles.symmetryDot, { backgroundColor: color }]} />
        <Text variant="small" style={styles.sideValue}>R: {metric.rightValue}°</Text>
      </View>
      <Text variant="small" style={[styles.diffText, { color }]}>{metric.percentDiff}% diff</Text>
    </View>
  );
}

function ConfidenceDot({ score, name }: { score: number; name: string }) {
  const color = score >= 70 ? '#00FF88' : score >= 40 ? '#FFD600' : '#FF3366';
  return (
    <View style={styles.confItem}>
      <View style={[styles.confDot, { backgroundColor: color }]} />
      <Text variant="small" style={styles.confLabel}>{name}</Text>
      <Text variant="small" style={[styles.confValue, { color }]}>{score}%</Text>
    </View>
  );
}

function MotionRow({ vector }: { vector: MotionVector }) {
  const dirIcon = () => {
    if (vector.velocity.magnitude < 0.01) return null;
    const angle = Math.atan2(-vector.velocity.y, vector.velocity.x) * (180 / Math.PI);
    if (angle > -45 && angle <= 45) return <ArrowRight size={12} color="#00FF88" weight="bold" />;
    if (angle > 45 && angle <= 135) return <ArrowUp size={12} color="#00FF88" weight="bold" />;
    if (angle > -135 && angle <= -45) return <ArrowDown size={12} color="#00FF88" weight="bold" />;
    return <ArrowLeft size={12} color="#00FF88" weight="bold" />;
  };

  const accelColor = vector.acceleration.magnitude > 0.5 ? '#FF9800' : '#888';

  return (
    <View style={styles.motionRow}>
      <View style={styles.motionLeft}>
        <Text variant="small" style={styles.metricLabel}>{vector.bodyPart}</Text>
        <View style={styles.motionDir}>{dirIcon()}</View>
      </View>
      <View style={styles.motionRight}>
        <View style={styles.motionMetric}>
          <Text variant="small" style={styles.motionLabel}>Vel</Text>
          <Text variant="small" weight="bold" style={styles.motionValue}>{vector.velocity.magnitude.toFixed(2)}</Text>
        </View>
        <View style={styles.motionMetric}>
          <Text variant="small" style={styles.motionLabel}>Acc</Text>
          <Text variant="small" weight="bold" style={[styles.motionValue, { color: accelColor }]}>{vector.acceleration.magnitude.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

export const AdvancedAnalysis: React.FC<AdvancedAnalysisProps> = ({
  landmarks,
  timestamp,
  onRequestAI,
  aiLoading = false,
  landmarkHistory,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'angles' | 'symmetry' | 'position' | 'confidence' | 'motion' | 'performance'>('angles');

  const analysis = useMemo(() => {
    if (!landmarks || landmarks.length === 0) return null;
    return computeFullAnalysis(landmarks, timestamp, landmarkHistory);
  }, [landmarks, timestamp, landmarkHistory]);

  const perfMetrics = useMemo<PerformanceMetrics | null>(() => {
    if (!landmarkHistory || landmarkHistory.length < 3) return null;
    return computePerformanceMetrics(landmarkHistory);
  }, [landmarkHistory]);

  if (!analysis) return null;

  const tabs = [
    { key: 'angles' as const, label: 'Angles', icon: Crosshair },
    { key: 'symmetry' as const, label: 'Symmetry', icon: Scales },
    { key: 'position' as const, label: 'Position', icon: PersonArmsSpread },
    { key: 'motion' as const, label: 'Motion', icon: Lightning },
    { key: 'performance' as const, label: 'Performance', icon: Timer },
    { key: 'confidence' as const, label: 'Quality', icon: ShieldCheck },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Barbell size={18} color="#FF9800" weight="fill" />
          <Text variant="body" weight="bold" style={styles.headerTitle}>Advanced Analysis</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.overallBadge}>
            <Text variant="small" weight="bold" style={styles.overallText}>{analysis.confidence.overall}%</Text>
          </View>
          {expanded ? <CaretUp size={16} color="#aaa" /> : <CaretDown size={16} color="#aaa" />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text variant="small" style={styles.quickLabel}>Lean</Text>
              <Text variant="body" weight="bold" style={styles.quickValue}>{analysis.leanAngle.angle}°</Text>
              <Text variant="small" style={styles.quickSub}>{analysis.leanAngle.direction}</Text>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickStat}>
              <Text variant="small" style={styles.quickLabel}>CoM</Text>
              <Text variant="body" weight="bold" style={styles.quickValue}>
                {(analysis.centerOfMass.y * 100).toFixed(0)}%
              </Text>
              <Text variant="small" style={styles.quickSub}>height</Text>
            </View>
            <View style={styles.quickDivider} />
            <View style={styles.quickStat}>
              <Text variant="small" style={styles.quickLabel}>Joints</Text>
              <Text variant="body" weight="bold" style={styles.quickValue}>{analysis.jointAngles.length}</Text>
              <Text variant="small" style={styles.quickSub}>detected</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Icon size={14} color={isActive ? '#FF9800' : '#888'} weight="fill" />
                  <Text variant="small" style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.tabContent}>
            {activeTab === 'angles' && (
              <View>
                {analysis.jointAngles.map((a: JointAngle, i: number) => (
                  <View key={i} style={styles.angleRow}>
                    <View style={styles.angleInfo}>
                      <Text variant="small" style={styles.metricLabel}>{a.name}</Text>
                      <Text variant="small" style={styles.angleSide}>{a.side}</Text>
                    </View>
                    <View style={styles.angleRight}>
                      <AngleBar angle={a.angle} />
                      <Text variant="small" weight="bold" style={styles.angleValue}>{a.angle}°</Text>
                    </View>
                  </View>
                ))}
                {analysis.jointAngles.length === 0 && (
                  <Text variant="small" style={styles.emptyText}>No joint angles detected — try a clearer frame</Text>
                )}
              </View>
            )}

            {activeTab === 'symmetry' && (
              <View>
                {analysis.symmetry.map((s: SymmetryMetric, i: number) => (
                  <SymmetryBar key={i} metric={s} />
                ))}
                {analysis.symmetry.length === 0 && (
                  <Text variant="small" style={styles.emptyText}>Need both sides visible for symmetry analysis</Text>
                )}
              </View>
            )}

            {activeTab === 'position' && (
              <View>
                <View style={styles.leanCard}>
                  <ArrowsOutLineVertical size={20} color="#FF9800" weight="fill" />
                  <View style={styles.leanInfo}>
                    <Text variant="body" weight="bold" style={styles.leanValue}>
                      {analysis.leanAngle.angle}° {analysis.leanAngle.direction}
                    </Text>
                    <Text variant="small" style={styles.leanDesc}>{analysis.leanAngle.description}</Text>
                  </View>
                </View>

                <View style={styles.comCard}>
                  <Crosshair size={20} color="#00FF88" weight="fill" />
                  <View style={styles.leanInfo}>
                    <Text variant="body" weight="bold" style={styles.leanValue}>Center of Mass</Text>
                    <Text variant="small" style={styles.leanDesc}>{analysis.centerOfMass.description}</Text>
                  </View>
                </View>

                {analysis.strideMetrics.map((m, i) => (
                  <View key={i} style={styles.strideRow}>
                    <Ruler size={14} color="#888" weight="fill" />
                    <Text variant="small" style={styles.strideLabel}>{m.name}</Text>
                    <Text variant="small" weight="bold" style={styles.strideValue}>{m.value}{m.unit}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'performance' && (
              <View>
                {perfMetrics ? (
                  <>
                    <View style={styles.perfGrid}>
                      <View style={styles.perfCell}>
                        <Timer size={18} color="#FF9800" weight="fill" />
                        <Text variant="small" style={styles.perfLabel}>Contact Time</Text>
                        <Text variant="body" weight="bold" style={styles.perfValue}>
                          {perfMetrics.groundContactTimeMs !== null
                            ? `${Math.round(perfMetrics.groundContactTimeMs)}ms`
                            : '—'}
                        </Text>
                      </View>
                      <View style={styles.perfDivider} />
                      <View style={styles.perfCell}>
                        <Ruler size={18} color="#00FF88" weight="fill" />
                        <Text variant="small" style={styles.perfLabel}>Stride Length</Text>
                        <Text variant="body" weight="bold" style={styles.perfValue}>
                          {perfMetrics.strideLengthNorm !== null
                            ? `${perfMetrics.strideLengthNorm.toFixed(3)}`
                            : '—'}
                        </Text>
                        <Text variant="small" style={styles.perfUnit}>norm. units</Text>
                      </View>
                    </View>
                    <View style={styles.perfGrid}>
                      <View style={styles.perfCell}>
                        <Lightning size={18} color="#FFD600" weight="fill" />
                        <Text variant="small" style={styles.perfLabel}>Cadence</Text>
                        <Text variant="body" weight="bold" style={styles.perfValue}>
                          {perfMetrics.strideFrequencyHz !== null
                            ? `${(perfMetrics.strideFrequencyHz * 60).toFixed(0)} spm`
                            : '—'}
                        </Text>
                        <Text variant="small" style={styles.perfUnit}>strides/min</Text>
                      </View>
                      <View style={styles.perfDivider} />
                      <View style={styles.perfCell}>
                        <ArrowRight size={18} color="#00CFFF" weight="fill" />
                        <Text variant="small" style={styles.perfLabel}>Velocity</Text>
                        <Text variant="body" weight="bold" style={styles.perfValue}>
                          {perfMetrics.horizontalVelocityNorm !== null
                            ? `${perfMetrics.horizontalVelocityNorm.toFixed(3)}`
                            : '—'}
                        </Text>
                        <Text variant="small" style={styles.perfUnit}>norm. units/s</Text>
                      </View>
                    </View>
                    <View style={styles.perfNote}>
                      <Text variant="small" style={styles.perfNoteText}>
                        Metrics estimated from pose landmark history across {(landmarkHistory ?? []).length} frames. Values are in normalised image coordinates (0–1 range). Scrub through more of the video for better accuracy.
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text variant="small" style={styles.emptyText}>
                    Scrub through frames with pose enabled to compute performance metrics. Need at least 3 frames.
                  </Text>
                )}
              </View>
            )}

            {activeTab === 'motion' && (
              <View>
                {analysis.motion ? (
                  <>
                    <View style={styles.motionOverview}>
                      <View style={styles.motionOverviewItem}>
                        <Text variant="small" style={styles.quickLabel}>Avg Speed</Text>
                        <Text variant="body" weight="bold" style={styles.quickValue}>{analysis.motion.overallSpeed.toFixed(2)}</Text>
                        <Text variant="small" style={styles.quickSub}>units/s</Text>
                      </View>
                      <View style={styles.quickDivider} />
                      <View style={styles.motionOverviewItem}>
                        <Text variant="small" style={styles.quickLabel}>Direction</Text>
                        <Text variant="body" weight="bold" style={styles.quickValue}>{analysis.motion.dominantDirection}</Text>
                        <Text variant="small" style={styles.quickSub}>dominant</Text>
                      </View>
                    </View>
                    {analysis.motion.vectors.map((v, i) => (
                      <MotionRow key={i} vector={v} />
                    ))}
                  </>
                ) : (
                  <Text variant="small" style={styles.emptyText}>
                    Scrub through frames to see velocity and acceleration data. Need at least 2 frames.
                  </Text>
                )}
              </View>
            )}

            {activeTab === 'confidence' && (
              <View>
                <View style={styles.overallConfCard}>
                  <Text variant="body" weight="bold" style={styles.overallConfText}>
                    Overall Detection Quality
                  </Text>
                  <View style={styles.overallConfBar}>
                    <View
                      style={[
                        styles.overallConfFill,
                        {
                          width: `${analysis.confidence.overall}%`,
                          backgroundColor: analysis.confidence.overall >= 70 ? '#00FF88' : analysis.confidence.overall >= 40 ? '#FFD600' : '#FF3366',
                        },
                      ]}
                    />
                  </View>
                  <Text variant="small" style={styles.overallConfScore}>{analysis.confidence.overall}%</Text>
                </View>
                {analysis.confidence.regions.map((r, i) => (
                  <ConfidenceDot key={i} score={r.score} name={r.name} />
                ))}

                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#00FF88' }]} />
                    <Text variant="small" style={styles.legendText}>High (&gt;70%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FFD600' }]} />
                    <Text variant="small" style={styles.legendText}>Medium</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF3366' }]} />
                    <Text variant="small" style={styles.legendText}>Low (&lt;40%)</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.aiButton, aiLoading && styles.aiButtonDisabled]}
            onPress={() => !aiLoading && onRequestAI(analysis)}
            activeOpacity={0.7}
            disabled={aiLoading}
          >
            <Brain size={20} color="#fff" weight="fill" />
            <Text variant="body" weight="bold" style={styles.aiButtonText}>
              {aiLoading ? 'Analyzing...' : 'AI Analysis & Suggestions'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    marginHorizontal: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overallBadge: {
    backgroundColor: 'rgba(255,152,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  overallText: {
    color: '#FF9800',
    fontSize: 11,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
  },
  quickDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  quickLabel: {
    color: '#888',
    fontSize: 11,
  },
  quickValue: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 2,
  },
  quickSub: {
    color: '#666',
    fontSize: 10,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#FF9800',
  },
  tabContent: {
    minHeight: 100,
  },
  angleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  angleInfo: {
    flex: 1,
  },
  metricLabel: {
    color: '#ccc',
    fontSize: 13,
  },
  angleSide: {
    color: '#666',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  angleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  angleValue: {
    color: '#FF9800',
    fontSize: 14,
    width: 40,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 2,
  },
  symmetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  symmetryValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  sideValue: {
    color: '#ccc',
    fontSize: 12,
  },
  symmetryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  diffText: {
    fontSize: 11,
    width: 60,
    textAlign: 'right',
  },
  leanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,152,0,0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  comCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,255,136,0.08)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  leanInfo: {
    flex: 1,
  },
  leanValue: {
    color: '#fff',
    fontSize: 14,
  },
  leanDesc: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  strideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  strideLabel: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
  },
  strideValue: {
    color: '#FF9800',
    fontSize: 13,
  },
  overallConfCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  overallConfText: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 8,
  },
  overallConfBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  overallConfFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallConfScore: {
    color: '#aaa',
    fontSize: 11,
    textAlign: 'right',
  },
  confItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  confDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  confLabel: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
  confValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#888',
    fontSize: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
  perfGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  perfCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  perfDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  perfLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  perfValue: {
    color: '#fff',
    fontSize: 17,
  },
  perfUnit: {
    color: '#555',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  perfNote: {
    backgroundColor: 'rgba(255,152,0,0.06)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.15)',
  },
  perfNoteText: {
    color: '#888',
    fontSize: 11,
    lineHeight: 16,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  motionOverview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  motionOverviewItem: {
    flex: 1,
    alignItems: 'center',
  },
  motionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  motionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  motionDir: {
    width: 16,
    alignItems: 'center',
  },
  motionRight: {
    flexDirection: 'row',
    gap: 16,
  },
  motionMetric: {
    alignItems: 'center',
    minWidth: 50,
  },
  motionLabel: {
    color: '#666',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  motionValue: {
    color: '#00FF88',
    fontSize: 13,
  },
});
