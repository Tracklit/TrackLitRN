import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Play, Upload, Zap, CheckCircle, Clock, AlertCircle, Star, Crown, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VideoAnalysis {
  id: number;
  videoUrl: string;
  videoTitle: string;
  analysisType: string;
  prompt: string;
  aiResponse?: string;
  spikesUsed: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface UsageData {
  tier: string;
  spikes: number;
  usage: {
    weekly: number;
    monthly: number;
  };
  limits: {
    weeklyPrompts: number;
    monthlyPrompts: number;
  };
  pricing: {
    spikesPerPrompt: number;
  };
}

const analysisTypes = [
  {
    id: 'sprint_form',
    name: 'Sprint Form Analysis',
    description: 'Comprehensive biomechanical analysis of running form, posture, and efficiency',
    icon: '🏃‍♂️'
  },
  {
    id: 'block_start',
    name: 'Block Start Analysis',
    description: 'Detailed breakdown of starting blocks technique and acceleration phase',
    icon: '🚀'
  },
  {
    id: 'stride_length',
    name: 'Stride Length Analysis',
    description: 'Optimization of stride length patterns for maximum speed efficiency',
    icon: '📏'
  },
  {
    id: 'stride_frequency',
    name: 'Stride Frequency Analysis',
    description: 'Analysis of turnover rate and frequency optimization',
    icon: '⚡'
  },
  {
    id: 'ground_contact_time',
    name: 'Ground Contact Time',
    description: 'Examination of foot strike patterns and ground interaction efficiency',
    icon: '👟'
  },
  {
    id: 'flight_time',
    name: 'Flight Time Analysis',
    description: 'Analysis of airborne phase mechanics and body positioning',
    icon: '🦅'
  }
];

const tierInfo = {
  free: { name: 'Free', icon: Users, color: 'text-gray-500' },
  pro: { name: 'Pro', icon: Star, color: 'text-blue-500' },
  star: { name: 'Star', icon: Crown, color: 'text-yellow-500' }
};

export default function SprinthiaVideoAnalysis() {
  const [selectedType, setSelectedType] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('analyze');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch usage data
  const { data: usage, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ['/api/video-analysis/usage'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch analysis history
  const { data: history, isLoading: historyLoading } = useQuery<{ analyses: VideoAnalysis[] }>({
    queryKey: ['/api/video-analysis/history'],
    enabled: activeTab === 'history'
  });

  // Start analysis mutation
  const startAnalysisMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/video-analysis/analyze', 'POST', data),
    onSuccess: (result) => {
      toast({
        title: "Analysis Started",
        description: "Sprinthia is analyzing your video. Check back in a few moments for results."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/video-analysis/usage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/video-analysis/history'] });
      setVideoUrl('');
      setVideoTitle('');
      setCustomPrompt('');
      setSelectedType('');
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to start video analysis",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    if (!videoUrl || !videoTitle || !selectedType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    startAnalysisMutation.mutate({
      videoUrl,
      videoTitle,
      analysisType: selectedType,
      customPrompt: customPrompt || undefined
    });
  };

  const canAnalyze = () => {
    if (!usage) return false;
    
    if (usage.tier === 'star') return true;
    if (usage.tier === 'pro' && usage.usage.weekly < usage.limits.weeklyPrompts) return true;
    if (usage.tier === 'free' && usage.usage.monthly < usage.limits.monthlyPrompts) return true;
    
    return usage.spikes >= usage.pricing.spikesPerPrompt;
  };

  const getUsageText = () => {
    if (!usage) return '';
    
    if (usage.tier === 'star') return 'Unlimited analysis';
    if (usage.tier === 'pro') return `${usage.usage.weekly}/${usage.limits.weeklyPrompts} weekly analyses used`;
    return `${usage.usage.monthly}/${usage.limits.monthlyPrompts} monthly analyses used`;
  };

  const TierIcon = usage ? tierInfo[usage.tier as keyof typeof tierInfo]?.icon : Users;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Sprinthia Video Analysis
            </h1>
          </motion.div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get expert biomechanical analysis of your sprint technique with AI-powered insights from Sprinthia
          </p>
        </div>

        {/* Usage Overview */}
        {usage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TierIcon className={`w-6 h-6 ${tierInfo[usage.tier as keyof typeof tierInfo]?.color}`} />
                    <div>
                      <h3 className="font-semibold">{tierInfo[usage.tier as keyof typeof tierInfo]?.name} Plan</h3>
                      <p className="text-sm text-gray-600">{getUsageText()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Available Spikes</p>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold">{usage.spikes}</span>
                      </div>
                    </div>
                    {!canAnalyze() && (
                      <Badge variant="secondary">Need {usage.pricing.spikesPerPrompt} spikes</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze">New Analysis</TabsTrigger>
            <TabsTrigger value="history">Analysis History</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            {/* Analysis Form */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Video for Analysis</CardTitle>
                <CardDescription>
                  Provide a video URL and select the type of analysis you'd like Sprinthia to perform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Video URL *</Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoTitle">Video Title *</Label>
                    <Input
                      id="videoTitle"
                      placeholder="e.g., 100m Sprint Training"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Analysis Type *</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        {analysisTypes.find(t => t.id === selectedType)?.description}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="customPrompt">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="customPrompt"
                    placeholder="Add specific areas you'd like Sprinthia to focus on..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!canAnalyze() || startAnalysisMutation.isPending || !videoUrl || !videoTitle || !selectedType}
                  className="w-full"
                  size="lg"
                >
                  {startAnalysisMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Starting Analysis...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Analyze Video with Sprinthia
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            {historyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {history?.analyses?.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No analyses yet</h3>
                      <p className="text-gray-500">Upload your first video to get started with Sprinthia analysis</p>
                    </CardContent>
                  </Card>
                ) : (
                  <AnimatePresence>
                    {history?.analyses?.map((analysis, index) => (
                      <motion.div
                        key={analysis.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <AnalysisCard analysis={analysis} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: VideoAnalysis }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', text: 'Processing' },
    completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', text: 'Complete' },
    failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', text: 'Failed' }
  };

  const config = statusConfig[analysis.status];
  const StatusIcon = config.icon;
  const analysisType = analysisTypes.find(t => t.id === analysis.analysisType);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{analysis.videoTitle}</CardTitle>
            <div className="flex items-center gap-2">
              <span>{analysisType?.icon}</span>
              <span className="text-sm text-gray-600">{analysisType?.name}</span>
            </div>
          </div>
          <Badge variant="secondary" className={`${config.bg} ${config.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>
      
      {analysis.aiResponse && (
        <CardContent>
          <div className="space-y-4">
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Sprinthia's Analysis</h4>
              <div className="prose prose-sm max-w-none">
                {analysis.aiResponse.split('\n').map((paragraph, idx) => (
                  paragraph.trim() && (
                    <p key={idx} className="mb-2 text-gray-700">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Analyzed {new Date(analysis.createdAt).toLocaleDateString()}</span>
              {analysis.spikesUsed > 0 && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span>{analysis.spikesUsed} spikes used</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}