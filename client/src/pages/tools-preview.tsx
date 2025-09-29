import { Card, CardContent } from "@/components/ui/card";
import { 
  Timer, 
  Volume2, 
  RefreshCw, 
  Gauge,
  BookOpen,
  Lock,
  Video,
  Flag,
  PlayCircle,
  FileText
} from "lucide-react";
import { Link } from "wouter";

// Simple Tools preview page without authentication
export default function ToolsPreviewPage() {
  const toolCards = [
    {
      title: "Video Analysis",
      description: "AI-powered race video analysis with Sprinthia",
      icon: <PlayCircle className="h-3 w-3 text-white" />,
      href: "/tools/video-analysis",
      disabled: false
    },
    {
      title: "Photo Finish",
      description: "Analyze race videos with timing overlays",
      icon: <Flag className="h-3 w-3 text-white" />,
      href: "/tools/photo-finish",
      disabled: false
    },
    {
      title: "Start Gun",
      description: "Simulate a race start signal",
      icon: <Volume2 className="h-3 w-3 text-white" />,
      href: "/tools/start-gun",
      disabled: false
    },
    {
      title: "Stopwatch",
      description: "Track your time with precision",
      icon: <Timer className="h-3 w-3 text-white" />,
      href: "/tools/stopwatch",
      disabled: false
    },
    {
      title: "Journal",
      description: "View and search your workout notes",
      icon: <FileText className="h-3 w-3 text-white" />,
      href: "/tools/journal",
      disabled: false
    },
    {
      title: "Exercise Library",
      description: "Store and organize your training videos",
      icon: <Video className="h-3 w-3 text-white" />,
      href: "/tools/exercise-library",
      disabled: false
    },
    {
      title: "Rep Starter",
      description: "Countdown timer for repetitions",
      icon: <RefreshCw className="h-3 w-3 text-muted-foreground" />,
      href: "#",
      disabled: true
    },
    {
      title: "Pace Calculator",
      description: "Calculate your target pace",
      icon: <Gauge className="h-3 w-3 text-muted-foreground" />,
      href: "#",
      disabled: true
    }
  ];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-10">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Training Tools</h1>
        <p className="text-white/80">Tools preview with large white icons on gradient cards</p>
      </div>

      {/* Tool Cards - 2 column layout */}
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
                      <div className="p-1.5 rounded-full bg-muted border border-muted">
                        <div className="h-3 w-3 flex items-center justify-center text-muted-foreground">
                          {card.icon}
                        </div>
                      </div>
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: '0.5px solid rgba(148, 163, 184, 0.25)', 
                    borderRadius: '6px',
                    boxShadow: '0 0 20px 8px rgba(102, 126, 234, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.40), 0 15px 20px -5px rgba(0, 0, 0, 0.30)'
                  }}
                >
                  {/* Content Area */}
                  <CardContent className="p-2.5 relative h-full flex flex-col justify-center z-10">
                    <div className="flex flex-col items-center text-center gap-3">
                      {/* Icon at top */}
                      <div className="flex justify-center">
                        {card.icon}
                      </div>
                      
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