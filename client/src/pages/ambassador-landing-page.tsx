import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Trophy, Crown, CheckCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Form schema
const ambassadorFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  socialMediaHandles: z.string().min(1, "Please provide your social media handles"),
  audienceSize: z.number().min(1000, "Minimum audience size is 1,000"),
  hasTrackLitAccount: z.boolean().refine(val => val === true, "You must have a TrackLit account"),
  agreesToLOI: z.boolean().refine(val => val === true, "You must agree to the Letter of Intent"),
  signature: z.string().min(1, "Digital signature is required"),
});

type AmbassadorFormData = z.infer<typeof ambassadorFormSchema>;

interface TierCard {
  id: string;
  title: string;
  requirements: string;
  rewards: string[];
  highlight: "purple" | "gold";
  icon: React.ReactNode;
}

// LOI Text
const LOI_TEXT = `
LETTER OF INTENT - TRACKLIT AMBASSADOR PROGRAM

This Letter of Intent outlines the terms and expectations for participation in the TrackLit Ambassador Program.

1. PROGRAM OVERVIEW
The TrackLit Ambassador Program is designed to partner with influential track and field athletes, coaches, and enthusiasts to promote our platform and grow our community.

2. AMBASSADOR RESPONSIBILITIES
- Authentic promotion of TrackLit through your social media channels
- Creating engaging content showcasing TrackLit features
- Providing feedback to help improve our platform
- Maintaining professional conduct that aligns with TrackLit values

3. COMPENSATION STRUCTURE
Compensation varies by tier and includes:
- Monetary rewards per successful referral
- Revenue sharing opportunities (select tiers)
- Free Spikes (in-app currency) packages
- Exclusive access to new features
- Blue checkmark verification on your profile

4. REQUIREMENTS
- Minimum follower counts as specified by tier
- Active engagement with track and field community
- Registered TrackLit account in good standing
- Compliance with platform terms of service

5. TERM AND TERMINATION
This agreement may be terminated by either party with 30 days written notice. TrackLit reserves the right to terminate immediately for violations of program guidelines.

6. CONFIDENTIALITY
Ambassadors may receive early access to features and should maintain confidentiality until public release.

By signing below, you acknowledge that you have read, understood, and agree to the terms outlined in this Letter of Intent.
`;

export default function AmbassadorLandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLOI, setShowLOI] = useState(false);
  const [signatureData, setSignatureData] = useState("");
  const { toast } = useToast();

  const form = useForm<AmbassadorFormData>({
    resolver: zodResolver(ambassadorFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      socialMediaHandles: "",
      audienceSize: 0,
      hasTrackLitAccount: false,
      agreesToLOI: false,
      signature: "",
    },
  });

  // Determine tier based on audience size
  const getTier = (audienceSize: number): string => {
    if (audienceSize >= 500000) return "Star";
    if (audienceSize >= 50000) return "Champ";
    if (audienceSize >= 10000) return "Pro";
    if (audienceSize >= 5000) return "Athlete";
    return "Not Eligible";
  };

  const affiliateCards: TierCard[] = [
    {
      id: "athlete",
      title: "Athlete",
      requirements: "5,000–10,000 social audience",
      rewards: [
        "Blue checkmark verification",
        "Small Spikes package",
        "Up to $3 per user referral"
      ],
      highlight: "purple",
      icon: <Users className="h-6 w-6" />
    },
    {
      id: "pro",
      title: "Pro",
      requirements: "10,000–50,000 social audience",
      rewards: [
        "Blue checkmark verification",
        "Medium Spikes package",
        "Up to $6 per user referral"
      ],
      highlight: "purple",
      icon: <Trophy className="h-6 w-6" />
    },
    {
      id: "champ",
      title: "Champ",
      requirements: "50,000–100,000 social audience",
      rewards: [
        "Blue checkmark verification",
        "Large Spikes package",
        "Up to $6 per user referral",
        "Revenue share per referred subscriber"
      ],
      highlight: "purple",
      icon: <Crown className="h-6 w-6" />
    }
  ];

  const sponsorshipCard: TierCard = {
    id: "star",
    title: "Star",
    requirements: "500,000+ social audience",
    rewards: [
      "Blue checkmark verification",
      "Maximum Spikes package",
      "$6 per user referral",
      "Revenue share per referred subscriber",
      "Paid content collaboration opportunities"
    ],
    highlight: "gold",
    icon: <Star className="h-6 w-6" />
  };

  const onSubmit = async (data: AmbassadorFormData) => {
    if (!signatureData) {
      toast({
        title: "Signature Required",
        description: "Please provide your digital signature",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Determine tier based on audience size
      const tier = getTier(data.audienceSize);
      
      const submissionData = {
        ...data,
        signature: signatureData,
        assignedTier: tier,
        submittedAt: new Date().toISOString(),
      };

      // For now, just store in local storage (later integrate with backend)
      console.log("Ambassador application submitted:", submissionData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for signing up! Our team will reach out soon.",
      });
      
      // Reset form
      form.reset();
      setSignatureData("");
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignature = (event: React.ChangeEvent<HTMLInputElement>) => {
    const signature = event.target.value;
    setSignatureData(signature);
    form.setValue("signature", signature);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Become a TrackLit Ambassador
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2">
            The Ultimate Toolkit for Track & Field
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Join our elite community of track and field influencers and help grow the sport while earning exclusive rewards.
          </p>
        </div>

        {/* Affiliate Opportunities Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Affiliate Opportunities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {affiliateCards.map((card) => (
              <Card key={card.id} className="bg-gray-900 border-purple-500 border-2 hover:border-purple-400 transition-colors">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
                      {card.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-white">{card.title}</CardTitle>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                    {card.requirements}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {card.rewards.map((reward, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{reward}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sponsorship Opportunities Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Sponsorship Opportunities</h2>
          <div className="flex justify-center">
            <Card className="bg-gray-900 border-yellow-500 border-2 hover:border-yellow-400 transition-colors max-w-md w-full">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-400">
                    {sponsorshipCard.icon}
                  </div>
                </div>
                <CardTitle className="text-xl text-white">{sponsorshipCard.title}</CardTitle>
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                  {sponsorshipCard.requirements}
                </Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {sponsorshipCard.rewards.map((reward, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{reward}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sign-Up Form Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">Apply Now</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* Full Name */}
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Full Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              className="bg-gray-800 border-gray-600 text-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Enter your email address" 
                              className="bg-gray-800 border-gray-600 text-white"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Social Media Handles */}
                    <FormField
                      control={form.control}
                      name="socialMediaHandles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Social Media Handles</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List your social media handles (Instagram, TikTok, YouTube, etc.)"
                              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Audience Size */}
                    <FormField
                      control={form.control}
                      name="audienceSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Total Audience Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Enter your total follower count across all platforms"
                              className="bg-gray-800 border-gray-600 text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                          {form.watch("audienceSize") > 0 && (
                            <div className="mt-2">
                              <Badge 
                                variant="secondary" 
                                className={`${getTier(form.watch("audienceSize")) === "Not Eligible" 
                                  ? "bg-red-500/20 text-red-300" 
                                  : getTier(form.watch("audienceSize")) === "Star"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-purple-500/20 text-purple-300"
                                }`}
                              >
                                Eligible Tier: {getTier(form.watch("audienceSize"))}
                              </Badge>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    {/* TrackLit Account Confirmation */}
                    <FormField
                      control={form.control}
                      name="hasTrackLitAccount"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-white">
                              I confirm I have registered a TrackLit account
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* LOI Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-white">Letter of Intent</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLOI(!showLOI)}
                          className="border-gray-600 text-white hover:bg-gray-800"
                        >
                          {showLOI ? "Hide" : "Show"} LOI
                        </Button>
                      </div>
                      
                      {showLOI && (
                        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                            {LOI_TEXT}
                          </pre>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="agreesToLOI"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-white">
                                I have read and agree to the Letter of Intent
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Digital Signature */}
                    <FormField
                      control={form.control}
                      name="signature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Digital Signature</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input 
                                placeholder="Type your full name as your digital signature"
                                className="bg-gray-800 border-gray-600 text-white"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleSignature(e);
                                }}
                              />
                              {signatureData && (
                                <div className="bg-gray-800 border border-gray-600 rounded p-3">
                                  <p className="text-gray-400 text-xs mb-1">Digital Signature:</p>
                                  <p className="text-white font-cursive text-lg">{signatureData}</p>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        "Submit Ambassador Application"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>Questions? Contact us at ambassadors@tracklit.com</p>
        </div>

      </div>
    </div>
  );
}