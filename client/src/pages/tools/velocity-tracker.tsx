import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Clock, 
  Ruler, 
  ArrowLeft,
  Target,
  TrendingUp,
  Calculator
} from "lucide-react";
import { Link } from "wouter";

interface TimeEntry {
  distance: number;
  time: number;
  speed: number;
  pace: string;
  timestamp: Date;
}

function VelocityTracker() {
  // Stopwatch state
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [splits, setSplits] = useState<TimeEntry[]>([]);
  
  // Manual entry state
  const [distance, setDistance] = useState<string>("");
  const [manualTime, setManualTime] = useState<string>("");
  
  // Calculator state
  const [targetDistance, setTargetDistance] = useState<string>("");
  const [targetTime, setTargetTime] = useState<string>("");
  const [requiredSpeed, setRequiredSpeed] = useState<number | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const formatPace = (speedMps: number): string => {
    if (speedMps === 0) return "0:00";
    const secondsPer100m = 100 / speedMps;
    const minutes = Math.floor(secondsPer100m / 60);
    const seconds = Math.floor(secondsPer100m % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setSplits([]);
  };

  const handleSplit = () => {
    if (time > 0) {
      const distanceInput = prompt("Enter distance covered (meters):");
      if (distanceInput && !isNaN(Number(distanceInput))) {
        const dist = Number(distanceInput);
        const timeInSeconds = time / 1000;
        const speed = dist / timeInSeconds; // m/s
        const pace = formatPace(speed);
        
        const newEntry: TimeEntry = {
          distance: dist,
          time: timeInSeconds,
          speed: speed,
          pace: pace,
          timestamp: new Date()
        };
        
        setSplits(prev => [...prev, newEntry]);
      }
    }
  };

  const handleManualEntry = () => {
    if (distance && manualTime) {
      const dist = Number(distance);
      const timeInSeconds = Number(manualTime);
      
      if (!isNaN(dist) && !isNaN(timeInSeconds) && dist > 0 && timeInSeconds > 0) {
        const speed = dist / timeInSeconds;
        const pace = formatPace(speed);
        
        const newEntry: TimeEntry = {
          distance: dist,
          time: timeInSeconds,
          speed: speed,
          pace: pace,
          timestamp: new Date()
        };
        
        setSplits(prev => [...prev, newEntry]);
        setDistance("");
        setManualTime("");
      }
    }
  };

  const calculateRequiredSpeed = () => {
    if (targetDistance && targetTime) {
      const dist = Number(targetDistance);
      const timeInSeconds = Number(targetTime);
      
      if (!isNaN(dist) && !isNaN(timeInSeconds) && dist > 0 && timeInSeconds > 0) {
        const speed = dist / timeInSeconds;
        setRequiredSpeed(speed);
      }
    }
  };

  const clearHistory = () => {
    setSplits([]);
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 pt-20 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/training-tools">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold" data-testid="text-title">Velocity Tracker</h1>
        </div>
      </div>

      <Tabs defaultValue="stopwatch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stopwatch" data-testid="tab-stopwatch">
            <Clock className="h-4 w-4 mr-2" />
            Live Timer
          </TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual">
            <Calculator className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="calculator" data-testid="tab-calculator">
            <Target className="h-4 w-4 mr-2" />
            Speed Calculator
          </TabsTrigger>
        </TabsList>

        {/* Live Timer Tab */}
        <TabsContent value="stopwatch">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stopwatch */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Stopwatch
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Time Display */}
                <div className="text-center">
                  <div 
                    className="text-4xl font-mono font-bold mb-4" 
                    data-testid="text-time-display"
                  >
                    {formatTime(time)}
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex justify-center gap-3">
                    {!isRunning ? (
                      <Button 
                        onClick={handleStart} 
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-start"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <Button 
                        onClick={handlePause}
                        variant="secondary"
                        data-testid="button-pause"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    
                    <Button 
                      onClick={handleSplit}
                      disabled={time === 0}
                      data-testid="button-split"
                    >
                      <Ruler className="h-4 w-4 mr-2" />
                      Record Split
                    </Button>
                    
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      data-testid="button-reset"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Splits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Results
                  </div>
                  {splits.length > 0 && (
                    <Button
                      onClick={clearHistory}
                      variant="ghost"
                      size="sm"
                      data-testid="button-clear-history"
                    >
                      Clear
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {splits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No timing data yet. Start the timer and record splits!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {splits.slice(-5).reverse().map((split, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                        data-testid={`split-entry-${index}`}
                      >
                        <div>
                          <div className="font-semibold">{split.distance}m</div>
                          <div className="text-sm text-muted-foreground">
                            {split.time.toFixed(2)}s
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="mb-1">
                            {split.speed.toFixed(2)} m/s
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {split.pace}/100m
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Manual Time Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (meters)</Label>
                  <Input
                    id="distance"
                    type="number"
                    placeholder="e.g., 100"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    data-testid="input-distance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time (seconds)</Label>
                  <Input
                    id="time"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 11.50"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    data-testid="input-time"
                  />
                </div>
              </div>
              <Button 
                onClick={handleManualEntry}
                className="w-full"
                disabled={!distance || !manualTime}
                data-testid="button-add-entry"
              >
                <Zap className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Speed Calculator Tab */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Speed Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target-distance">Target Distance (meters)</Label>
                  <Input
                    id="target-distance"
                    type="number"
                    placeholder="e.g., 100"
                    value={targetDistance}
                    onChange={(e) => setTargetDistance(e.target.value)}
                    data-testid="input-target-distance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-time">Target Time (seconds)</Label>
                  <Input
                    id="target-time"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10.50"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    data-testid="input-target-time"
                  />
                </div>
              </div>
              
              <Button 
                onClick={calculateRequiredSpeed}
                className="w-full"
                disabled={!targetDistance || !targetTime}
                data-testid="button-calculate"
              >
                <Target className="h-4 w-4 mr-2" />
                Calculate Required Speed
              </Button>

              {requiredSpeed !== null && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg" data-testid="text-required-speed-title">
                        Required Speed
                      </h3>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-primary" data-testid="text-speed-mps">
                          {requiredSpeed.toFixed(2)} m/s
                        </div>
                        <div className="text-muted-foreground" data-testid="text-speed-kmh">
                          {(requiredSpeed * 3.6).toFixed(2)} km/h
                        </div>
                        <div className="text-muted-foreground" data-testid="text-pace">
                          {formatPace(requiredSpeed)}/100m pace
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* All Splits History */}
      {splits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Complete History ({splits.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {splits.reverse().map((split, index) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg space-y-2"
                  data-testid={`history-entry-${index}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{split.distance}m</div>
                      <div className="text-sm text-muted-foreground">
                        {split.time.toFixed(2)}s
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {split.speed.toFixed(2)} m/s
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Pace: {split.pace}/100m
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {split.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function Component() {
  return <VelocityTracker />;
}