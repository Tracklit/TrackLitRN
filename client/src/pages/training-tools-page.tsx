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
  Camera
} from "lucide-react";
import { Link } from "wouter";



export default function WorkoutToolsPage() {
  // Tool cards with links to individual pages
  const toolCards = [
    {
      title: "Video Analysis",
      description: "AI-powered race video analysis with Sprinthia",
      icon: <Camera className="h-6 w-6 text-white" />,
      href: "/tools/video-analysis",
      disabled: false,
      gradient: "bg-gradient-to-br from-blue-600 to-purple-600"
    },
    {
      title: "Stopwatch",
      description: "Track your time with precision",
      icon: <Timer className="h-6 w-6 text-white" />,
      href: "/tools/stopwatch",
      disabled: false,
      gradient: "bg-gradient-to-bl from-purple-700 to-blue-500"
    },
    {
      title: "Start Gun",
      description: "Simulate a race start signal",
      icon: <Volume2 className="h-6 w-6 text-white" />,
      href: "/tools/start-gun",
      disabled: false,
      gradient: "bg-gradient-to-tr from-blue-700 to-purple-500"
    },
    {
      title: "Photo Finish",
      description: "Analyze race videos with timing overlays",
      icon: <Video className="h-6 w-6 text-white" />,
      href: "/tools/photo-finish",
      disabled: false,
      gradient: "bg-gradient-to-tl from-purple-600 to-blue-600"
    },
    {
      title: "Journal",
      description: "View and search your workout notes",
      icon: <BookOpen className="h-6 w-6 text-white" />,
      href: "/tools/journal",
      disabled: false,
      gradient: "bg-gradient-to-br from-blue-500 to-purple-700"
    },
    {
      title: "Exercise Library",
      description: "Store and organize your training videos",
      icon: <Video className="h-6 w-6 text-white" />,
      href: "/tools/exercise-library",
      disabled: false,
      gradient: "bg-gradient-to-bl from-purple-500 to-blue-700"
    },
    {
      title: "Rep Starter",
      description: "Countdown timer for repetitions",
      icon: <RefreshCw className="h-6 w-6 text-muted-foreground" />,
      href: "#",
      disabled: true
    },
    {
      title: "Pace Calculator",
      description: "Calculate your target pace",
      icon: <Gauge className="h-6 w-6 text-muted-foreground" />,
      href: "#",
      disabled: true
    }
  ];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-5 pb-10">

      
      <PageHeader
        title="Workout Tools"
        description="Tools to help you during workout sessions"
      />

      {/* Tool Cards - 2 column layout matching the home page style */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-4 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
          {toolCards.map((card, index) => (
            card.disabled ? (
              // Disabled card
              <div key={index}>
                <Card 
                  className="cursor-not-allowed h-[140px] mx-auto mb-2 overflow-hidden relative bg-muted/30"
                >
                  <div className="absolute inset-0 bg-background/50"></div>
                  <CardContent className="p-2.5 relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-1.5 rounded-full bg-muted border border-muted">
                        <div className="h-4 w-4 flex items-center justify-center text-muted-foreground">
                          {card.icon}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1">
                          <h2 className="text-base font-bold mb-0.5 text-muted-foreground">{card.title}</h2>
                          <Lock className="h-3 w-3 text-muted-foreground" />
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
                  className={`cursor-pointer h-[140px] mx-auto mb-2 overflow-hidden relative ${card.gradient} group hover:scale-105 transition-all duration-300 border border-gray-300/50`}
                >
                  {/* Content Area */}
                  <CardContent className="p-2.5 relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-1.5 rounded-full bg-white/20 border border-white/30">
                        <div className="h-4 w-4 flex items-center justify-center">
                          {card.icon}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-base font-bold mb-0.5 text-white">{card.title}</h2>
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