import { PageContainer } from "@/components/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap
} from "lucide-react";
import { Link } from "wouter";
import { OptimizedBackgroundImage } from '@/components/optimized-background-image';
import { PreloadImages } from '@/components/preload-images';

// Import background images - using practice background for consistency
import practiceBackground from '@assets/Screenshot 2025-06-15 205621_1750013855167.png';

export default function ArcadePage() {
  // Background image for all game cards (consistent with dashboard)
  const gameBackground = practiceBackground;

  // Game cards - currently only Reaction Time game
  const gameCards = [
    {
      title: "Tracklympics",
      description: "Retro track & field championship game",
      icon: <Zap className="h-6 w-6 text-white" />,
      href: "/arcade/tracklympics",
      disabled: false,
      backgroundImage: gameBackground,
      hasBackground: true
    }
  ];

  return (
    <PageContainer>
      <div className="container max-w-screen-xl mx-auto p-4 pt-5 pb-10">
        {/* Preload game card images */}
        <PreloadImages images={[gameBackground]} quality={20} priority={true} />

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Arcade</h1>
          <p className="text-muted-foreground">Experience retro track and field championship</p>
        </div>

        {/* Game Cards Grid */}
        <section className="grid grid-cols-1 gap-3">
          <div className="max-w-2xl mx-auto w-full space-y-3">
            {gameCards.map((game, index) => (
              <Link href={game.href} key={index}>
                <Card className="cursor-pointer shadow-2xl h-[90px] overflow-hidden group relative bg-primary/5 hover:bg-primary/10 transition-colors" style={{ border: '0.5px solid rgba(168, 85, 247, 0.25)' }}>
                  {/* Background image */}
                  {game.hasBackground && (
                    <div 
                      className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-80"
                      style={{
                        backgroundImage: `url(${game.backgroundImage})`,
                        zIndex: 0
                      }}
                    />
                  )}
                  
                  <CardContent className="p-4 relative h-full flex flex-col justify-center z-10">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h2 className="font-bold mb-2 flex items-center gap-2" style={{ fontSize: '18px' }}>
                          {game.title}
                        </h2>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          {game.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-muted-foreground text-sm">&gt;</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}