import { useState } from 'react';
import { Header } from '@/components/layout/header';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Zap, Brain, Camera, Mic, BarChart3, Users, Calendar, Trophy, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState('free'); // TODO: Get from user context
  const { toast } = useToast();

  const handleUpgrade = (plan: string) => {
    // TODO: Implement Stripe payment integration
    toast({
      title: 'Upgrade Coming Soon',
      description: `${plan} subscription will be available shortly!`,
    });
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-800',
      features: [
        'Basic workout tracking',
        'Journal entries (text only)',
        'Meet registration',
        'Basic results logging',
        'Community access',
        'Standard start gun tool',
        'Basic stopwatch',
        'Limited spike rewards'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$4.99',
      period: 'month',
      icon: Star,
      color: 'text-amber-400',
      bgColor: 'bg-amber-900/20',
      borderColor: 'border-amber-600',
      popular: true,
      features: [
        'Everything in Free',
        'Voice recording & transcription',
        'Media uploads (photos/videos)',
        'Advanced meet calendar view',
        'Detailed performance analytics',
        'Coach collaboration tools',
        'Priority community access',
        'Enhanced spike rewards',
        'Weather forecasting for meets',
        'Custom training programs',
        'Advanced results tracking',
        'Meet sharing with athletes'
      ]
    },
    {
      id: 'star',
      name: 'Star',
      price: '$9.99',
      period: 'month',
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-600',
      features: [
        'Everything in Pro',
        'Unlimited AI workout analysis',
        'AI-powered performance insights',
        'AI voice note transcription',
        'AI training recommendations',
        'AI meet preparation advice',
        'AI nutrition guidance',
        'AI injury prevention tips',
        'Advanced predictive analytics',
        'Unlimited spike rewards',
        'Priority customer support',
        'Early access to new features',
        'Custom AI coaching assistant'
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#010a18] text-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
                Choose Your Plan
              </h1>
              <p className="text-xl text-blue-300 mb-6">
                Unlock your athletic potential with advanced training tools
              </p>
              <div className="flex justify-center items-center gap-2 text-sm text-blue-400">
                <Zap className="h-4 w-4" />
                <span>All plans include core training features • Cancel anytime</span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {plans.map((plan) => {
                const IconComponent = plan.icon;
                const isCurrentPlan = currentPlan === plan.id;
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative overflow-hidden ${plan.bgColor} ${plan.borderColor} border-2 ${
                      plan.popular ? 'ring-2 ring-amber-500 ring-opacity-50' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-center py-2">
                        <Badge className="bg-white text-amber-600 font-semibold">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className={`text-center ${plan.popular ? 'pt-10' : 'pt-4'} pb-4`}>
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${plan.bgColor} flex items-center justify-center`}>
                        <IconComponent className={`h-6 w-6 ${plan.color}`} />
                      </div>
                      <CardTitle className="text-xl font-bold text-white mb-2">
                        {plan.name}
                      </CardTitle>
                      <div className="mb-2">
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        {plan.period !== 'forever' && (
                          <span className="text-blue-300 ml-1 text-sm">/{plan.period}</span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="px-4 pb-4">
                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {plan.features.slice(0, 6).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-100 text-xs leading-relaxed">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 6 && (
                          <div className="text-blue-300 text-xs text-center pt-1">
                            +{plan.features.length - 6} more features
                          </div>
                        )}
                      </div>



                      {/* Action Button */}
                      <Button
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={isCurrentPlan}
                        size="sm"
                        className={`w-full ${
                          isCurrentPlan 
                            ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed' 
                            : plan.id === 'free'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : plan.id === 'pro'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Get Started' : 'Upgrade Now'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Feature Comparison */}
            <div className="bg-blue-900/20 rounded-lg p-8 border border-blue-800/60">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Feature Comparison
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Training & Analytics
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Workout Tracking</span>
                      <div className="flex gap-2">
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Performance Analytics</span>
                      <div className="flex gap-2">
                        <span className="h-4 w-4"></span>
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">AI Insights</span>
                      <div className="flex gap-2">
                        <span className="h-4 w-4"></span>
                        <Brain className="h-4 w-4 text-amber-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Collaboration
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Community Access</span>
                      <div className="flex gap-2">
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Coach Tools</span>
                      <div className="flex gap-2">
                        <span className="h-4 w-4"></span>
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Meet Sharing</span>
                      <div className="flex gap-2">
                        <span className="h-4 w-4"></span>
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Media & AI
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-200">Voice Recording</span>
                      <div className="flex gap-2">
                        <span className="h-4 w-4"></span>
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Media Uploads</span>
                      <div className="flex gap-2">
                        <span className="h-4 w-4"></span>
                        <Check className="h-4 w-4 text-green-400" />
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-200">Unlimited AI</span>
                      <div className="flex gap-2">
                        <span className="h-4 w-4"></span>
                        <span className="h-4 w-4"></span>
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold text-white mb-6">
                Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-800/60">
                  <h3 className="font-semibold text-blue-300 mb-3">Can I upgrade or downgrade anytime?</h3>
                  <p className="text-blue-200 text-sm">
                    Yes! You can change your plan at any time. Upgrades take effect immediately, 
                    and downgrades take effect at the end of your current billing cycle.
                  </p>
                </div>
                <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-800/60">
                  <h3 className="font-semibold text-blue-300 mb-3">What are Spikes?</h3>
                  <p className="text-blue-200 text-sm">
                    Spikes are our in-app currency that can be earned through achievements and 
                    used to unlock AI features on Free and Pro plans.
                  </p>
                </div>
                <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-800/60">
                  <h3 className="font-semibold text-blue-300 mb-3">How do I cancel my subscription?</h3>
                  <p className="text-blue-200 text-sm">
                    You can cancel your subscription at any time from your account settings. 
                    Your plan will remain active until the end of your current billing period.
                  </p>
                </div>
                <div className="bg-blue-900/20 rounded-lg p-6 border border-blue-800/60">
                  <h3 className="font-semibold text-blue-300 mb-3">Do AI features work offline?</h3>
                  <p className="text-blue-200 text-sm">
                    AI features require an internet connection to function, but all your training 
                    data is stored locally and synced when online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}