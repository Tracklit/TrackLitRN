import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Timer, 
  Volume2, 
  RefreshCw, 
  Gauge,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { Breadcrumb } from "@/components/breadcrumb";

export default function TrainingToolsPage() {
  // Tool cards with links to individual pages
  const toolCards = [
    {
      title: "Stopwatch",
      description: "Track your time with precision",
      icon: <Timer className="h-6 w-6 text-primary" />,
      href: "/tools/stopwatch"
    },
    {
      title: "Start Gun",
      description: "Simulate a race start signal",
      icon: <Volume2 className="h-6 w-6 text-primary" />,
      href: "/tools/start-gun"
    },
    {
      title: "Interval Timer",
      description: "Set up customized intervals",
      icon: <RefreshCw className="h-6 w-6 text-primary" />,
      href: "/tools/interval-timer"
    },
    {
      title: "Pace Calculator",
      description: "Calculate your target pace",
      icon: <Gauge className="h-6 w-6 text-primary" />,
      href: "/tools/pace-calculator"
    }
  ];
  
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Training Tools", href: "/training-tools" }
  ];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Training Tools"
        description="Tools to help you during training sessions"
      />

      {/* Tool Cards - 2 column layout matching the home page style */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
          {toolCards.map((card, index) => (
            <Link key={index} href={card.href}>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all duration-300 border border-muted hover:border-primary h-[140px] mx-auto mb-2 overflow-hidden group relative"
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
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/training-tools" component={TrainingToolsPage} />
  );
}