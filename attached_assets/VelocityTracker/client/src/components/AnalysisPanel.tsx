import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Activity, Target, Timer } from 'lucide-react';
import { AnalysisResult, ProcessingStatus } from '@/types/vbt';

interface AnalysisPanelProps {
  analysisResult: AnalysisResult | null;
  processingStatus: ProcessingStatus;
}

export function AnalysisPanel({ analysisResult, processingStatus }: AnalysisPanelProps) {
  const powerZoneConfig = {
    strength: { color: 'text-chart-5', label: 'STRENGTH', threshold: '< 0.5 m/s' },
    power: { color: 'text-chart-4', label: 'POWER', threshold: '0.5-1.0 m/s' },
    speed: { color: 'text-chart-3', label: 'SPEED', threshold: '> 1.0 m/s' }
  };

  const getPowerZoneProgress = (zone: 'strength' | 'power' | 'speed') => {
    if (!analysisResult) return 0;
    const mean = analysisResult.meanVelocity;
    
    switch (zone) {
      case 'strength':
        return Math.min(100, (mean / 0.5) * 100);
      case 'power':
        return mean >= 0.5 && mean < 1.0 ? ((mean - 0.5) / 0.5) * 100 : 0;
      case 'speed':
        return mean >= 1.0 ? Math.min(100, ((mean - 1.0) / 1.0) * 100) : 0;
      default:
        return 0;
    }
  };

  const renderVelocityChart = () => {
    if (!analysisResult?.velocityData.instant) return null;

    const data = analysisResult.velocityData.instant;
    const maxVel = Math.max(...data);
    const points = data.map((vel, index) => {
      const x = (index / (data.length - 1)) * 180 + 10; // Scale to SVG width
      const y = 70 - (vel / maxVel) * 50; // Invert Y and scale
      return `${x},${y}`;
    }).join(' ');

    const peakIndex = data.indexOf(maxVel);
    const peakX = (peakIndex / (data.length - 1)) * 180 + 10;
    const peakY = 70 - (maxVel / maxVel) * 50;

    return (
      <svg className="w-full h-20" viewBox="0 0 200 80">
        <defs>
          <linearGradient id="velocityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
            <stop offset="100%" stopColor="hsl(25, 95%, 53%)" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          stroke="url(#velocityGradient)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx={peakX}
          cy={peakY}
          r="3"
          fill="hsl(25, 95%, 53%)"
        />
        <text x="10" y="75" fontSize="8" fill="hsl(220, 10%, 65%)">
          Velocity vs Time
        </text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analysis Results */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="text-chart-1 mr-2 h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {processingStatus.isProcessing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {processingStatus.currentStep}
                </span>
                <span className="text-sm text-muted-foreground">
                  {processingStatus.progress}%
                </span>
              </div>
              <Progress 
                value={processingStatus.progress} 
                className="w-full"
                data-testid="progress-analysis"
              />
              {processingStatus.error && (
                <p className="text-sm text-destructive" data-testid="text-error">
                  {processingStatus.error}
                </p>
              )}
            </div>
          ) : analysisResult ? (
            <>
              {/* Velocity Metrics */}
              <div className="velocity-chart rounded-lg p-4 border border-border">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-chart-1" data-testid="text-mean-result">
                      {analysisResult.meanVelocity.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Mean Velocity (m/s)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-chart-2" data-testid="text-peak-result">
                      {analysisResult.peakVelocity.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Peak Velocity (m/s)</div>
                  </div>
                </div>

                {/* Velocity Chart */}
                <div className="h-20 bg-muted rounded border relative">
                  {renderVelocityChart()}
                </div>
              </div>

              {/* Movement Analysis */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Timer className="mr-1 h-3 w-3" />
                    Rep Duration:
                  </span>
                  <span className="text-sm font-mono" data-testid="text-rep-duration">
                    {analysisResult.repDuration.toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Activity className="mr-1 h-3 w-3" />
                    Concentric Phase:
                  </span>
                  <span className="text-sm font-mono" data-testid="text-concentric-duration">
                    {analysisResult.concentricDuration.toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Target className="mr-1 h-3 w-3" />
                    Bar Path Deviation:
                  </span>
                  <span className="text-sm font-mono" data-testid="text-path-deviation">
                    ±{analysisResult.pathDeviation.toFixed(1)}cm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ROM:</span>
                  <span className="text-sm font-mono" data-testid="text-range-of-motion">
                    {analysisResult.rangeOfMotion.toFixed(1)}cm
                  </span>
                </div>
              </div>

              {/* Power Zone Indicator */}
              <div className="bar-path-viz rounded-lg p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Power Zone</span>
                  <span className={`text-xs font-semibold ${powerZoneConfig[analysisResult.powerZone].color}`}>
                    {powerZoneConfig[analysisResult.powerZone].label}
                  </span>
                </div>
                <div className="flex space-x-1 mb-2">
                  <div 
                    className={`h-2 bg-chart-5 rounded-full flex-1 ${
                      analysisResult.powerZone === 'strength' ? 'opacity-100' : 'opacity-40'
                    }`}
                  />
                  <div 
                    className={`h-2 bg-chart-4 rounded-full flex-1 ${
                      analysisResult.powerZone === 'power' ? 'opacity-100' : 'opacity-40'
                    }`}
                  />
                  <div 
                    className={`h-2 bg-chart-3 rounded-full flex-1 ${
                      analysisResult.powerZone === 'speed' ? 'opacity-100' : 'opacity-40'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Strength</span>
                  <span>Power</span>
                  <span>Speed</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Upload or record a video to begin analysis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
