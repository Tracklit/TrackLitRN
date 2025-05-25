import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useRef, useEffect } from "react";
import { 
  Clock, 
  Volume2, 
  Play, 
  Pause, 
  RefreshCw, 
  VolumeX, 
  Timer, 
  Bell, 
  Gauge,
  Activity
} from "lucide-react";
import { Link } from "wouter";

export default function TrainingToolsPage() {
  const [activeTab, setActiveTab] = useState("stopwatch");
  
  // Tool cards for the new layout
  const toolCards = [
    {
      title: "Stopwatch",
      description: "Track your time with precision",
      icon: <Timer className="h-6 w-6 text-primary" />,
      id: "stopwatch"
    },
    {
      title: "Start Gun",
      description: "Simulate a race start signal",
      icon: <Volume2 className="h-6 w-6 text-primary" />,
      id: "start-gun"
    },
    {
      title: "Interval Timer",
      description: "Set up customized intervals",
      icon: <RefreshCw className="h-6 w-6 text-primary" />,
      id: "interval-timer"
    },
    {
      title: "Pace Calculator",
      description: "Calculate your target pace",
      icon: <Gauge className="h-6 w-6 text-primary" />,
      id: "pace-calculator"
    }
  ];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <PageHeader
        title="Training Tools"
        description="Tools to help you during training sessions"
      />

      {/* Tool Cards - 2 column layout matching the home page style */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
          {toolCards.map((card, index) => (
            <Card 
              key={index}
              className={`cursor-pointer hover:shadow-md transition-all duration-300 border ${activeTab === card.id ? 'border-primary' : 'border-muted hover:border-primary'} h-[140px] mx-auto mb-2 overflow-hidden group relative`}
              onClick={() => setActiveTab(card.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              <CardContent className="p-2.5 relative h-full flex flex-col justify-center">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/15 border border-primary/20 group-hover:bg-primary/25 transition-colors duration-300">
                    <div className="h-4 w-4 flex items-center justify-center text-primary">
                      {card.icon}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-bold mb-0.5">{card.title}</h2>
                    <p className="text-muted-foreground text-xs px-1 line-clamp-2 overflow-hidden">{card.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Active Tool Content */}
      <div className="max-w-xl mx-auto">
        {activeTab === "stopwatch" && <StopwatchTool />}
        {activeTab === "start-gun" && <StartGunTool />}
        {activeTab === "interval-timer" && <IntervalTimerTool />}
        {activeTab === "pace-calculator" && <PaceCalculatorTool />}
      </div>
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

function PaceCalculatorTool() {
  const [distance, setDistance] = useState(400);
  const [time, setTime] = useState({ minutes: 1, seconds: 0 });
  const [paceResult, setPaceResult] = useState({ pace: '', speed: '' });

  const calculatePace = () => {
    // Convert time to seconds
    const totalSeconds = (time.minutes * 60) + time.seconds;
    
    // Calculate pace (time per km)
    const distanceInKm = distance / 1000;
    const secondsPerKm = totalSeconds / distanceInKm;
    
    // Format pace as min:sec per km
    const paceMinutes = Math.floor(secondsPerKm / 60);
    const paceSeconds = Math.floor(secondsPerKm % 60);
    const formattedPace = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} min/km`;
    
    // Calculate speed in km/h
    const speedKmh = (distanceInKm / totalSeconds) * 3600;
    const formattedSpeed = `${speedKmh.toFixed(2)} km/h`;
    
    setPaceResult({ pace: formattedPace, speed: formattedSpeed });
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Pace Calculator</CardTitle>
        <CardDescription className="text-center">Calculate your running pace and speed</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Distance (meters)</label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 400, 800].map((dist) => (
                <Button 
                  key={dist}
                  type="button"
                  variant={distance === dist ? "default" : "outline"}
                  onClick={() => setDistance(dist)}
                  className="text-sm"
                >
                  {dist}m
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1000, 1500, 5000].map((dist) => (
                <Button 
                  key={dist}
                  type="button"
                  variant={distance === dist ? "default" : "outline"}
                  onClick={() => setDistance(dist)}
                  className="text-sm"
                >
                  {dist >= 1000 ? `${dist/1000}km` : `${dist}m`}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Time</label>
            <div className="flex items-center space-x-2">
              <div className="w-24">
                <label className="text-xs text-muted-foreground">Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={time.minutes}
                  onChange={(e) => setTime({...time, minutes: parseInt(e.target.value) || 0})}
                  className="w-full border rounded p-2 text-center"
                />
              </div>
              <span className="text-lg font-bold">:</span>
              <div className="w-24">
                <label className="text-xs text-muted-foreground">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={time.seconds}
                  onChange={(e) => setTime({...time, seconds: parseInt(e.target.value) || 0})}
                  className="w-full border rounded p-2 text-center"
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={calculatePace}
            className="w-full"
          >
            Calculate
          </Button>
          
          {paceResult.pace && (
            <div className="bg-primary/10 p-4 rounded-md mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pace</p>
                  <p className="text-lg font-semibold">{paceResult.pace}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Speed</p>
                  <p className="text-lg font-semibold">{paceResult.speed}</p>
                </div>
              </div>
            </div>
          )}
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