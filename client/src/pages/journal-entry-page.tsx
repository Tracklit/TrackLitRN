import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "wouter";

export default function JournalEntryPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get date from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date') || new Date().toLocaleDateString();
  
  // Form state
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState([5]);
  const [isPublic, setIsPublic] = useState(false);
  
  // Create mutation for adding journal entry
  const createMutation = useMutation({
    mutationFn: async (entryData: any) => {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create journal entry');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved successfully.",
        duration: 3000,
      });
      setLocation('/practice');
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your journal entry.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const entryData = {
      title: title.trim(),
      notes: notes.trim(),
      type: "workout",
      isPublic,
      content: {
        mood: mood[0],
        date: dateParam,
      },
    };

    createMutation.mutate(entryData);
  };

  const getMoodLabel = (value: number) => {
    if (value <= 2) return 'Poor';
    if (value <= 4) return 'Fair';
    if (value <= 6) return 'Good';
    if (value <= 8) return 'Great';
    return 'Excellent';
  };

  const getMoodColor = (value: number) => {
    if (value <= 2) return 'text-red-500';
    if (value <= 4) return 'text-orange-500';
    if (value <= 6) return 'text-yellow-500';
    if (value <= 8) return 'text-green-500';
    return 'text-green-600';
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/practice">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Journal Entry</h1>
              <p className="text-muted-foreground">{dateParam}</p>
            </div>
          </div>
        </div>

        {/* Journal Form */}
        <Card className="bg-gradient-to-br from-blue-800 to-purple-400 border-none" style={{ borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
          <CardHeader>
            <CardTitle className="text-white">Training Journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter journal entry title..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                maxLength={100}
              />
            </div>

            {/* Notes Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did your training go today? Share your thoughts..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 min-h-[120px]"
                maxLength={1000}
              />
            </div>

            {/* Mood Slider */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Overall Mood</label>
                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-lg font-bold ${getMoodColor(mood[0])}`}>
                      {mood[0]}/10
                    </span>
                    <span className={`text-sm font-medium ${getMoodColor(mood[0])}`}>
                      {getMoodLabel(mood[0])}
                    </span>
                  </div>
                  <Slider
                    value={mood}
                    onValueChange={setMood}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-2">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between bg-white/10 border border-white/20 rounded-lg p-4">
              <div>
                <label className="text-sm font-medium text-white">Make Public</label>
                <p className="text-xs text-white/60 mt-1">
                  Share this entry with your coach and teammates
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-white/20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Link to="/practice" className="flex-1">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}