import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HamburgerMenu } from '@/components/layout/hamburger-menu';
import { Meet, Result } from '@shared/schema';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Trophy, 
  Users, 
  Clock, 
  Clipboard, 
  ArrowRight,
  Calendar,
  Coins,
  ChevronRight,
  Timer,
  LineChart,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { MotivationalQuote } from '@/components/motivational-quote';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { user } = useAuth();
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  
  // Fetch data for stats (simplified for now)
  const { data: meets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  const { data: results } = useQuery<Result[]>({
    queryKey: ['/api/results'],
  });

  // Category cards for main navigation
  const categoryCards = [
    {
      title: "Practice",
      description: "Training sessions and programs",
      icon: <Dumbbell className="h-6 w-6 text-primary" />,
      href: "/practice",
    },
    {
      title: "Programs",
      description: "Training plans and schedules",
      icon: <Clipboard className="h-6 w-6 text-primary" />,
      href: "/practice",
    },
    {
      title: "Competitions",
      description: "Meets, results and analytics",
      icon: <Trophy className="h-6 w-6 text-primary" />,
      href: "/meets",
    },
    {
      title: "Clubs & Groups",
      description: "Find a new home",
      icon: <Users className="h-6 w-6 text-primary" />,
      href: "/clubs",
    }
  ];

  // Define motivational quote
  const quote = {
    text: "The difference between the impossible and the possible lies in a person's determination.",
    author: "Tommy Lasorda"
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <HamburgerMenu />
      
      <main className="pt-20 px-4 container mx-auto max-w-7xl">
        {/* Greeting Section */}
        <section className="mb-8 mt-4 mx-auto" style={{ maxWidth: "540px" }}>
          <h1 className="text-3xl font-bold mb-2">
            Hello, {user?.name?.split(' ')[0] || user?.username}
          </h1>
          <p className="text-muted-foreground">
            Welcome to Track Pro - Your Track and Field Companion
          </p>
        </section>
        
        {/* Main Category Cards - 2 column layout with fixed size */}
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 20px" }}>
            {categoryCards.map((card, index) => (
              <Link href={card.href} key={index}>
                <Card className="cursor-pointer hover:shadow-md transition-all duration-300 border border-muted hover:border-primary h-[250px] w-[250px] mx-auto mb-5 overflow-hidden group relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <CardContent className="p-6 relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center text-center gap-7">
                      <div className="p-4 rounded-full bg-primary/15 border border-primary/20 group-hover:bg-primary/25 transition-colors duration-300">
                        <div className="h-8 w-8 flex items-center justify-center text-primary">
                          {card.icon}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-3">{card.title}</h2>
                        <p className="text-muted-foreground text-sm px-2 line-clamp-3 overflow-hidden">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Today's Session Preview */}
        <section className="mb-12 mx-auto" style={{ maxWidth: "540px" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Today's Session</h2>
            <Link href="/practice">
              <Button variant="link" className="text-primary p-0 h-auto">
                <span>View All Sessions</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <Card className="border-primary/20 w-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30">Track Session</Badge>
                  <CardTitle className="text-xl">Speed Endurance</CardTitle>
                  <CardDescription className="flex items-center gap-3 mt-1">
                    <span>4:00 PM</span>
                    <span>•</span>
                    <span>Main Track</span>
                    <span>•</span>
                    <span>Intensity: High</span>
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10">
                  Start Session
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Dynamic Warmup</p>
                    <p className="text-sm text-muted-foreground">Duration: 15 min</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">6 × 200m</p>
                    <p className="text-sm text-muted-foreground">Pace: 32s • Rest: 2 min</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">4 × 300m</p>
                    <p className="text-sm text-muted-foreground">Pace: 48s • Rest: 3 min</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <LineChart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Cool Down</p>
                    <p className="text-sm text-muted-foreground">Duration: 10 min</p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t pt-3 flex justify-between text-sm text-muted-foreground">
              <div>Coach: Coach Williams</div>
              <div className="flex items-center">
                <span className="text-primary font-medium">Details</span>
                <ArrowUpRight className="ml-1 h-3 w-3 text-primary" />
              </div>
            </CardFooter>
          </Card>
        </section>
        
        {/* Motivational Quote */}
        <section className="mb-12 mx-auto" style={{ maxWidth: "540px" }}>
          <Card className="border-primary/20 bg-primary/5 w-full">
            <CardContent className="p-6">
              <p className="italic text-lg mb-2">&ldquo;{quote.text}&rdquo;</p>
              <p className="text-right text-muted-foreground">— {quote.author}</p>
            </CardContent>
          </Card>
        </section>
      </main>
      
      {/* Create Meet Modal */}
      <CreateMeetModal
        isOpen={isCreateMeetOpen}
        onClose={() => setIsCreateMeetOpen(false)}
      />
    </div>
  );
}
