import { useState } from "react";
import { Link } from "wouter";
import { 
  Heart, 
  Zap, 
  Bone, 
  Activity,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Send,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const rehabCategories = [
  {
    id: "acute-muscle",
    title: "Acute Muscle Injuries",
    description: "Evidence-based recovery programs for sudden muscle injuries",
    icon: <Heart className="h-8 w-8 text-red-500" />,
    color: "border-red-200 hover:border-red-300",
    subpages: [
      { id: "hamstring", name: "Hamstring" },
      { id: "quad", name: "Quadriceps" },
      { id: "calf", name: "Calf" },
      { id: "groin", name: "Groin" }
    ]
  },
  {
    id: "chronic-injuries",
    title: "Chronic Injuries",
    description: "Long-term management for persistent and overuse injuries",
    icon: <Zap className="h-8 w-8 text-primary" />,
    color: "border-primary/30 hover:border-primary/50",
    subpages: [
      { id: "foot", name: "Foot" },
      { id: "hamstring", name: "Hamstring" },
      { id: "quad", name: "Quadriceps" },
      { id: "calf", name: "Calf" },
      { id: "groin", name: "Groin" },
      { id: "other-tendons", name: "Other Tendons" }
    ]
  },
  {
    id: "back-injuries",
    title: "Back Injuries",
    description: "Specialized programs for spinal and back-related issues",
    icon: <Activity className="h-8 w-8 text-blue-500" />,
    color: "border-blue-200 hover:border-blue-300",
    subpages: [
      { id: "disc", name: "Disc Issues" },
      { id: "ligament", name: "Ligament" },
      { id: "other", name: "Other" }
    ]
  },
  {
    id: "bone-breaks",
    title: "Bone Breaks",
    description: "Recovery protocols for fractures and bone injuries",
    icon: <Bone className="h-8 w-8 text-purple-500" />,
    color: "border-purple-200 hover:border-purple-300",
    subpages: [
      { id: "ankle", name: "Ankle" },
      { id: "knee", name: "Knee" },
      { id: "shoulder", name: "Shoulder" },
      { id: "rib", name: "Rib" },
      { id: "other", name: "Other" }
    ]
  }
];

export default function RehabPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiQuery, setAiQuery] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);

  const aiConsultationMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/rehab/ai-consultation", {
        query,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Consultation Complete",
        description: "Your personalized rehab program has been created and assigned.",
      });
      setAiQuery("");
      setIsAiOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Consultation Failed",
        description: "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAiSubmit = () => {
    if (!aiQuery.trim()) return;
    
    if (user?.subscription !== "star" && (user?.spikes || 0) < 50) {
      toast({
        title: "Insufficient Access",
        description: "AI consultations require Star subscription or 50 Spikes per session.",
        variant: "destructive",
      });
      return;
    }

    aiConsultationMutation.mutate(aiQuery);
  };

  const isStarUser = user?.subscription === "star";
  const hasSpikes = (user?.spikes || 0) >= 50;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#010a18' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="h-10 w-10 text-red-500" />
            <h1 className="text-4xl font-bold text-white">Rehabilitation Center</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Evidence-based recovery programs designed to get you back to peak performance safely and effectively
          </p>
        </div>

        {/* AI Consultation Section */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bot className="h-6 w-6 text-purple-400" />
                <CardTitle className="text-white">AI Rehabilitation Consultant</CardTitle>
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                  {isStarUser ? "Star Feature" : "50 Spikes"}
                </Badge>
              </div>
              <CardDescription className="text-gray-300">
                Get personalized rehabilitation guidance from our AI specialist. Describe your injury, symptoms, and current status for a customized recovery program.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isAiOpen ? (
                <Button 
                  onClick={() => setIsAiOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!isStarUser && !hasSpikes}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start AI Consultation
                </Button>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Describe your injury, pain level, current symptoms, and any limitations you're experiencing. Be as detailed as possible for the best recommendations..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    className="min-h-[120px] bg-gray-800/50 border-gray-700 text-white"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAiSubmit}
                      disabled={!aiQuery.trim() || aiConsultationMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {aiConsultationMutation.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Get AI Program
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAiOpen(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Cancel
                    </Button>
                  </div>
                  {!isStarUser && (
                    <p className="text-sm text-gray-400">
                      This consultation will cost 50 Spikes. You currently have {user?.spikes || 0} Spikes.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rehab Categories Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {rehabCategories.map((category) => (
            <Card 
              key={category.id} 
              className={`bg-gray-800/30 border transition-all duration-200 hover:bg-gray-800/40 ${category.color}`}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  {category.icon}
                  <div>
                    <CardTitle className="text-xl text-white">{category.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 mb-4">Available Programs:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {category.subpages.map((subpage) => (
                      <Link 
                        key={subpage.id}
                        href={`/rehab/${category.id}/${subpage.id}`}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-between bg-gray-700/50 border-gray-600 text-gray-200 hover:bg-gray-600/50"
                        >
                          {subpage.name}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gray-800/30 border-gray-700 max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Professional Guidance</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                All rehabilitation programs are based on current sports medicine research and best practices. 
                These programs are designed to complement professional medical care, not replace it. 
                Always consult with your healthcare provider before starting any rehabilitation program, 
                especially for serious injuries or persistent pain.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}