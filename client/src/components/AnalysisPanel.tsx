import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Save, TrendingUp, Zap, Clock, Target, Activity } from 'lucide-react';
import { AnalysisResult, ProcessingStatus } from '@shared/schema';

interface AnalysisPanelProps {
  analysisResult: AnalysisResult | null;
  processingStatus: ProcessingStatus;
  onSave?: () => void;
}

export function AnalysisPanel({ analysisResult, processingStatus, onSave }: AnalysisPanelProps) {
  const getPowerZoneColor = (zone: string) => {
    switch (zone) {
      case 'strength': return 'bg-red-100 text-red-800';
      case 'power': return 'bg-yellow-100 text-yellow-800';
      case 'speed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPowerZoneDescription = (zone: string) => {
    switch (zone) {
      case 'strength': return 'Heavy load, focus on strength development';
      case 'power': return 'Moderate load, optimal for power development';
      case 'speed': return 'Light load, focus on speed and technique';
      default: return 'Unknown training zone';
    }
  };

  // Show processing status
  if (processingStatus.isProcessing) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Processing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{processingStatus.currentStep}</span>
              <span>{Math.round(processingStatus.progress)}%</span>
            </div>
            <Progress value={processingStatus.progress} className="w-full" />
          </div>
          
          {processingStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-1">Processing Error</h4>
              <p className="text-sm text-red-600">{processingStatus.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show analysis results
  if (analysisResult) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Analysis Results
            </div>
            {onSave && (
              <Button onClick={onSave} size="sm" data-testid="button-save-analysis">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {analysisResult.meanVelocity.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Mean Velocity (m/s)</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {analysisResult.peakVelocity.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Peak Velocity (m/s)</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {analysisResult.concentricDuration.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Concentric Duration (s)</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {analysisResult.rangeOfMotion.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Range of Motion (cm)</div>
            </div>
          </div>

          {/* Power Zone */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Training Zone Analysis
            </h4>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={getPowerZoneColor(analysisResult.powerZone)}>
                {analysisResult.powerZone.toUpperCase()} ZONE
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getPowerZoneDescription(analysisResult.powerZone)}
              </span>
            </div>
          </div>

          {/* Movement Quality */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Movement Quality
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Path Deviation</label>
                <div className="text-lg font-medium">
                  {analysisResult.pathDeviation.toFixed(1)} cm
                </div>
                <div className="text-xs text-muted-foreground">
                  {analysisResult.pathDeviation < 5 ? 'Excellent' : 
                   analysisResult.pathDeviation < 10 ? 'Good' : 'Needs improvement'}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground">Rep Duration</label>
                <div className="text-lg font-medium">
                  {analysisResult.repDuration.toFixed(2)} s
                </div>
                <div className="text-xs text-muted-foreground">
                  Total movement time
                </div>
              </div>
            </div>
          </div>

          {/* Velocity Profile */}
          {analysisResult.velocityData && analysisResult.velocityData.instant.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Velocity Profile
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Velocity Range:</span>
                  <span>
                    {Math.min(...analysisResult.velocityData.instant).toFixed(2)} - {Math.max(...analysisResult.velocityData.instant).toFixed(2)} m/s
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data Points:</span>
                  <span>{analysisResult.velocityData.instant.length} samples</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tracking Points:</span>
                  <span>{analysisResult.trackingPoints.length} positions</span>
                </div>
              </div>
            </div>
          )}

          {/* Training Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Training Recommendations</h4>
            <div className="space-y-1 text-sm text-blue-700">
              {analysisResult.powerZone === 'strength' && (
                <>
                  <p>• Focus on maximal strength development</p>
                  <p>• Consider increasing load for future sets</p>
                  <p>• Maintain good form and controlled tempo</p>
                </>
              )}
              {analysisResult.powerZone === 'power' && (
                <>
                  <p>• Optimal zone for power development</p>
                  <p>• Maintain this load range for power training</p>
                  <p>• Focus on explosive concentric movement</p>
                </>
              )}
              {analysisResult.powerZone === 'speed' && (
                <>
                  <p>• Excellent for speed and technique work</p>
                  <p>• Consider adding load for strength gains</p>
                  <p>• Perfect for movement pattern refinement</p>
                </>
              )}
              
              {analysisResult.pathDeviation > 10 && (
                <p>• Work on movement stability and control</p>
              )}
              
              {analysisResult.concentricDuration > 3 && (
                <p>• Consider more explosive movement patterns</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  return (
    <Card className="w-full">
      <CardContent className="p-8 text-center">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
        <p className="text-sm text-muted-foreground">
          Record or upload a video to see detailed VBT analysis results
        </p>
      </CardContent>
    </Card>
  );
}