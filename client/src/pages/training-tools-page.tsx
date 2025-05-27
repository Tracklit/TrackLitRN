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
  Video
} from "lucide-react";
import { Link } from "wouter";
import { Breadcrumb } from "@/components/breadcrumb";
import startGunImagePath from "@assets/startgun.png";
import stopwatchImagePath from "@assets/IMG_4081.jpeg";

export default function WorkoutToolsPage() {
  // Tool cards with links to individual pages
  const toolCards = [
    {
      title: "Stopwatch",
      description: "Track your time with precision",
      icon: <Timer className="h-6 w-6 text-primary" />,
      href: "/tools/stopwatch",
      disabled: false
    },
    {
      title: "Start Gun",
      description: "Simulate a race start signal",
      icon: <Volume2 className="h-6 w-6 text-primary" />,
      href: "/tools/start-gun",
      disabled: false
    },
    {
      title: "Journal",
      description: "View and search your workout notes",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/tools/journal",
      disabled: false
    },
    {
      title: "Photo Finish",
      description: "Analyze race videos with timing overlays",
      icon: <Video className="h-6 w-6 text-primary" />,
      href: "/tools/photo-finish",
      disabled: false
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
  
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Workout Tools", href: "/training-tools" }
  ];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-10 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Workout Tools"
        description="Tools to help you during workout sessions"
      />

      {/* Tool Cards - 2 column layout matching the home page style */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
          {toolCards.map((card, index) => (
            card.disabled ? (
              // Disabled card
              <div key={index}>
                <Card 
                  className="cursor-not-allowed border border-muted h-[140px] mx-auto mb-2 overflow-hidden relative bg-muted/30"
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
                  className="cursor-pointer hover:shadow-md transition-all duration-300 border border-muted hover:border-primary h-[140px] mx-auto mb-2 overflow-hidden group relative"
                >
                  {/* Header Image - For Start Gun and Stopwatch */}
                  {(card.title === "Start Gun" || card.title === "Stopwatch") && (
                    <div 
                      className="h-1/2 bg-cover bg-center bg-no-repeat relative"
                      style={{ 
                        backgroundImage: `url(${card.title === "Start Gun" ? startGunImagePath : stopwatchImagePath})` 
                      }}
                    >
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  )}
                  
                  {/* Content Area */}
                  <CardContent className={`p-2.5 relative flex flex-col justify-center ${(card.title === "Start Gun" || card.title === "Stopwatch") ? "h-1/2" : "h-full"}`}>
                    <div className="flex flex-col items-center text-center gap-2">
                      {(card.title !== "Start Gun" && card.title !== "Stopwatch") && (
                        <div className="p-1.5 rounded-full bg-primary/15 border border-primary/20 group-hover:bg-primary/25 transition-colors duration-300">
                          <div className="h-4 w-4 flex items-center justify-center text-primary">
                            {card.icon}
                          </div>
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-bold mb-0.5">{card.title}</h2>
                        <p className="text-muted-foreground text-xs px-1 line-clamp-2 overflow-hidden">{card.description}</p>
                      </div>
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ArrowRight className="h-3 w-3 text-primary" />
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