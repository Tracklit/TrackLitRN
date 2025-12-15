import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Timer, 
  Volume2, 
  RefreshCw, 
  Gauge,
  ArrowRight,
  BookOpen,
  Lock,
  Video,
  Camera,
  Flag,
  PlayCircle,
  FileText,
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { OptimizedBackgroundImage } from '@/components/optimized-background-image';
import { PreloadImages } from '@/components/preload-images';

// Import dashboard card images - temporarily commented out
// import sprinthiaBackground from '@assets/image_1750019864190.png';
// import practiceBackground from '@assets/Screenshot 2025-06-15 205621_1750013855167.png';
// import programsBackground from '@assets/image_1750012192490.png';
// import raceBackground from '@assets/Screenshot 2025-06-15 205651_1750013855167.png';
// import toolsBackground from '@assets/Screenshot 2025-06-15 205721_1750013855168.png';



export default function WorkoutToolsPage() {
  // Background images for tool cards - temporarily disabled
  const toolBackgrounds: string[] = [];

  // Tool cards with links to individual pages
  const toolCards = [
    {
      title: "Video Analysis",
      description: "AI-powered race video analysis with Sprinthia",
      icon: <PlayCircle className="h-6 w-6 text-white" />,
      href: "/tools/video-analysis",
      disabled: false,
      backgroundImage: toolBackgrounds[0],
      hasBackground: false
    },
    {
      title: "Photo Finish",
      description: "Analyze race videos with timing overlays",
      icon: <Flag className="h-6 w-6 text-white" />,
      href: "/tools/photo-finish",
      disabled: false,
      backgroundImage: toolBackgrounds[1],
      hasBackground: false
    },
    {
      title: "Start Gun",
      description: "Simulate a race start signal",
      icon: <Volume2 className="h-6 w-6 text-white" />,
      href: "/tools/start-gun",
      disabled: false,
      backgroundImage: toolBackgrounds[2],
      hasBackground: false
    },
    {
      title: "Stopwatch",
      description: "Track your time with precision",
      icon: <Timer className="h-6 w-6 text-white" />,
      href: "/tools/stopwatch",
      disabled: false,
      backgroundImage: toolBackgrounds[3],
      hasBackground: false
    },
    {
      title: "Journal",
      description: "View and search your workout notes",
      icon: <FileText className="h-6 w-6 text-white" />,
      href: "/tools/journal",
      disabled: false,
      backgroundImage: toolBackgrounds[4],
      hasBackground: false
    },
    {
      title: "Exercise Library",
      description: "Store and organize your training videos",
      icon: <Video className="h-6 w-6 text-white" />,
      href: "/tools/exercise-library",
      disabled: false,
      backgroundImage: toolBackgrounds[5],
      hasBackground: false
    },
    {
      title: "Velocity Tracker",
      description: "Track speed and acceleration metrics",
      icon: <Zap className="h-6 w-6 text-white" />,
      href: "/tools/velocity-tracker",
      disabled: false,
      backgroundImage: toolBackgrounds[6],
      hasBackground: false
    }
  ];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-10">
      {/* Preload tool card images - temporarily commented out */}
      {/* <PreloadImages images={toolBackgrounds} quality={20} priority={true} /> */}

      {/* Tool Cards - 2 column layout matching the home page style */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-4 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
          {toolCards.map((card, index) => (
            card.disabled ? (
              // Disabled card
              <div key={index}>
                <Card 
                  className="cursor-not-allowed h-[112px] mx-auto mb-2 overflow-hidden relative bg-muted/30"
                  style={{ 
                    borderRadius: '6px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.40), 0 15px 20px -5px rgba(0, 0, 0, 0.30)'
                  }}
                >
                  <div className="absolute inset-0 bg-background/50"></div>
                  <CardContent className="p-2.5 relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <h2 className="text-base font-bold mb-0.5 text-muted-foreground">{card.title}</h2>
                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-xs px-1 line-clamp-2 overflow-hidden">{card.description}</p>
                      </div>
                      <div className="absolute bottom-1 text-center w-full text-xs text-muted-foreground">
                        Coming soon
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Enabled card
              <Link key={index} href={card.href}>
                <Card 
                  className="cursor-pointer h-[112px] mx-auto mb-2 overflow-hidden relative group hover:scale-105 transition-all duration-300"
                  style={{ 
                    background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                    border: '0.5px solid rgba(148, 163, 184, 0.25)', 
                    borderRadius: '6px',
                    boxShadow: '0 0 20px 8px rgba(102, 126, 234, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.40), 0 15px 20px -5px rgba(0, 0, 0, 0.30)'
                  }}
                >
                  {/* Background Image */}
                  {card.hasBackground && card.backgroundImage && (
                    <div
                      className="absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-500"
                      style={{
                        backgroundImage: `url(${card.backgroundImage})`,
                        backgroundPosition: 'bottom right',
                        opacity: 0.95,
                        zIndex: 0
                      }}
                    />
                  )}
                  
                  {/* Content Area */}
                  <CardContent className="p-2.5 relative h-full flex flex-col justify-center z-10">
                    <div className="flex flex-col items-center text-center gap-3">
                      {/* Title and description */}
                      <div>
                        <h2 className="text-base font-bold mb-1 text-white">{card.title}</h2>
                        <p className="text-white/80 text-xs px-1 line-clamp-2 overflow-hidden">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          ))}
        </div>
      </section>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/training-tools" component={WorkoutToolsPage} />
  );
}