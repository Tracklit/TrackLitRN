import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumPromotionProps {
  variant?: 'sidebar' | 'card';
  onUpgrade?: () => void;
}

export function PremiumPromotion({ variant = 'card', onUpgrade }: PremiumPromotionProps) {
  if (variant === 'sidebar') {
    return (
      <div className="bg-darkNavy rounded-lg p-4 text-white">
        <div className="flex items-center space-x-2 mb-2">
          <Crown className="h-5 w-5 text-accent" />
          <h3 className="font-medium">Go Pro</h3>
        </div>
        <p className="text-xs opacity-80 mb-3">Unlock AI coaching, calendar sharing and more.</p>
        <Button 
          className="w-full bg-accent hover:bg-accent/90 text-darkNavy"
          onClick={onUpgrade}
        >
          Upgrade Now
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-darkNavy rounded-xl shadow-sm p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Crown className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-lg">Upgrade to Pro</h3>
          </div>
          <p className="text-sm opacity-80 mb-4">
            Get AI-powered performance analysis, coach assignment, and calendar sharing.
          </p>
          <Button 
            className="bg-accent hover:bg-accent/90 text-darkNavy"
            onClick={onUpgrade}
          >
            Unlock Pro Features
          </Button>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1530143584546-02191bc84eb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
          alt="Premium features" 
          className="w-16 h-16 object-cover rounded-lg" 
        />
      </div>
    </div>
  );
}
