import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HamburgerMenu } from '@/components/layout/hamburger-menu';
import { Meet, Result } from '@shared/schema';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  Trophy, 
  Users, 
  Clock, 
  Clipboard, 
  ArrowRight,
  Calendar,
  Coins
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
      icon: <Dumbbell className="h-8 w-8 text-primary" />,
      href: "/practice",
      color: "from-primary/10 to-transparent"
    },
    {
      title: "Programs",
      description: "Training plans and schedules",
      icon: <Clipboard className="h-8 w-8 text-primary" />,
      href: "/practice",
      color: "from-primary/10 to-transparent"
    },
    {
      title: "Competitions",
      description: "Meets, results and analytics",
      icon: <Trophy className="h-8 w-8 text-primary" />,
      href: "/meets",
      color: "from-primary/10 to-transparent"
    },
    {
      title: "Clubs & Groups",
      description: "Connect with other athletes",
      icon: <Users className="h-8 w-8 text-primary" />,
      href: "/clubs",
      color: "from-primary/10 to-transparent"
    },
    {
      title: "Tools",
      description: "Stopwatch, start gun, and more",
      icon: <Clock className="h-8 w-8 text-primary" />,
      href: "/training-tools",
      color: "from-primary/10 to-transparent"
    },
    {
      title: "Calendar",
      description: "Schedule and upcoming events",
      icon: <Calendar className="h-8 w-8 text-primary" />,
      href: "/calendar",
      color: "from-primary/10 to-transparent"
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
        <section className="mb-8 mt-4">
          <h1 className="text-3xl font-bold mb-2">
            Hello, {user?.name?.split(' ')[0] || user?.username}
          </h1>
          <p className="text-muted-foreground">
            Welcome to Track Elite - your complete training platform
          </p>
        </section>
        
        {/* Main Category Cards */}
        <section className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryCards.map((card, index) => (
              <Link href={card.href} key={index}>
                <Card className="h-full cursor-pointer hover:shadow-md transition-all duration-300 overflow-hidden border border-muted hover:border-primary">
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", card.color)} />
                  <CardContent className="p-6 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-bold mb-2">{card.title}</h2>
                        <p className="text-muted-foreground text-sm mb-6">{card.description}</p>
                      </div>
                      <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                        {card.icon}
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <Button variant="ghost" className="pl-0 group hover:bg-transparent">
                        <span className="text-primary">Explore</span>
                        <ArrowRight className="ml-1 h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Quick Stats */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20 hover:border-primary transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Upcoming Meets</p>
                    <h3 className="text-3xl font-bold">2</h3>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-60" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Practice Sessions</p>
                    <h3 className="text-3xl font-bold">5</h3>
                  </div>
                  <div className="p-2 rounded-full bg-secondary/10">
                    <Dumbbell className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Clubs Joined</p>
                    <h3 className="text-3xl font-bold">1</h3>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-primary/20 hover:border-primary transition-colors overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-60" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Spikes Balance</p>
                    <h3 className="text-3xl font-bold">{user?.spikes || 0}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-secondary/10">
                    <Coins className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Motivational Quote */}
        <section className="mb-12">
          <Card className="border-primary/20 bg-gradient-to-r from-muted to-background">
            <CardContent className="p-8">
              <MotivationalQuote quote={quote.text} author={quote.author} />
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
