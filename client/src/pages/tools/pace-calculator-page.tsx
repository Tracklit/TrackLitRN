import { useState } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gauge } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function PaceCalculatorPage() {
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

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Training Tools", href: "/training-tools" },
    { label: "Pace Calculator", href: "/tools/pace-calculator" },
  ];

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Pace Calculator"
        description="Calculate your running pace and speed"
      />

      <Card className="w-full max-w-xl mx-auto">
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
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/pace-calculator" component={PaceCalculatorPage} />
  );
}