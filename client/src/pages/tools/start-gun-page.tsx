import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function StartGunPage() {
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

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Training Tools", href: "/training-tools" },
    { label: "Start Gun", href: "/tools/start-gun" },
  ];

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Start Gun"
        description="Simulate a race start gun for your training"
      />

      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="p-6 text-center">
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
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/start-gun" component={StartGunPage} />
  );
}