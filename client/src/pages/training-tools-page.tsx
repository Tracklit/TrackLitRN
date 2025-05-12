import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useRef, useEffect } from "react";
import { Clock, Volume2, Play, Pause, RefreshCw, VolumeX } from "lucide-react";

export default function TrainingToolsPage() {
  const [activeTab, setActiveTab] = useState("stopwatch");
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Training Tools"
        description="Tools to help you during training sessions"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card 
          className={`cursor-pointer hover:bg-accent/10 transition-colors ${activeTab === "stopwatch" ? "border-primary" : ""}`}
          onClick={() => setActiveTab("stopwatch")}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Clock className="h-6 w-6 mr-2" />
              Stopwatch
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:bg-accent/10 transition-colors ${activeTab === "start-gun" ? "border-primary" : ""}`}
          onClick={() => setActiveTab("start-gun")}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Volume2 className="h-6 w-6 mr-2" />
              Start Gun
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:bg-accent/10 transition-colors ${activeTab === "interval-timer" ? "border-primary" : ""}`}
          onClick={() => setActiveTab("interval-timer")}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 mr-2" />
              Interval Timer
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {activeTab === "stopwatch" && <StopwatchTool />}
      {activeTab === "start-gun" && <StartGunTool />}
      {activeTab === "interval-timer" && <IntervalTimerTool />}
    </div>
  );
}

function StopwatchTool() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    setLaps([...laps, time]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Stopwatch</CardTitle>
        <CardDescription className="text-center">Track your time with precision</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-5xl font-mono font-bold my-8">{formatTime(time)}</div>
          <div className="flex justify-center space-x-4 mb-6">
            <Button onClick={handleStartStop}>
              {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outline" onClick={handleLap} disabled={!isRunning}>
              Lap
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {laps.length > 0 && (
            <div className="border rounded-md p-4 mt-4">
              <h3 className="font-medium mb-2">Laps</h3>
              <div className="max-h-40 overflow-y-auto">
                {laps.map((lapTime, index) => (
                  <div key={index} className="flex justify-between py-1 border-b last:border-0">
                    <span>Lap {laps.length - index}</span>
                    <span className="font-mono">{formatTime(lapTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StartGunTool() {
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/start-gun.mp3');
    
    // Handle cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playStartGun = () => {
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = volume / 100;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Start Gun</CardTitle>
        <CardDescription className="text-center">Simulate a race start gun</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="my-8">
          <Button size="lg" className="w-32 h-32 rounded-full text-lg" onClick={playStartGun}>
            START
          </Button>
        </div>
        
        <div className="flex items-center justify-center space-x-4 mt-8">
          <Button variant="outline" size="icon" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <div className="w-60">
            <Slider 
              value={[volume]} 
              max={100} 
              step={1}
              onValueChange={handleVolumeChange}
              disabled={isMuted}
            />
          </div>
          <span className="w-8 text-center">{volume}%</span>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          Note: Actual sound depends on your device settings
        </p>
      </CardContent>
    </Card>
  );
}

function IntervalTimerTool() {
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Interval Timer</CardTitle>
        <CardDescription className="text-center">Set up customized interval training</CardDescription>
      </CardHeader>
      <CardContent className="text-center p-8">
        <div className="flex flex-col items-center justify-center h-40">
          <p className="text-muted-foreground">Coming soon!</p>
          <p className="text-sm text-muted-foreground mt-2">This feature is under development</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/training-tools" component={TrainingToolsPage} />
  );
}