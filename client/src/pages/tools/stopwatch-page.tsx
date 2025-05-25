import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function StopwatchPage() {
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

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Training Tools", href: "/training-tools" },
    { label: "Stopwatch", href: "/tools/stopwatch" },
  ];

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Stopwatch"
        description="Track your time with precision"
      />

      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="p-6">
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
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/stopwatch" component={StopwatchPage} />
  );
}