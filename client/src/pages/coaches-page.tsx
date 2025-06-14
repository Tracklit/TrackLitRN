import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, MessageCircle, TrendingUp, Users, Calendar, Clock, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Athlete {
  id: number;
  username: string;
  name: string;
  profileImageUrl?: string;
  relationshipId: number;
  acceptedAt: string;
}

interface MoodStats {
  athletes: {
    athleteId: number;
    athleteName: string;
    athleteUsername: string;
    avgMood: number | null;
    entryCount: number;
  }[];
  overall: {
    avgMood: number | null;
    entryCount: number;
  };
  timeRange: number;
}

interface JournalEntry {
  id: number;
  title: string;
  notes: string;
  content: any;
  isPublic: boolean;
  createdAt: string;
  athleteId: number;
  athleteName: string;
  athleteUsername: string;
  athleteProfileImageUrl?: string;
}

interface Comment {
  id: number;
  content: string;
  isPrivate: boolean;
  parentCommentId?: number;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorUsername: string;
  authorProfileImageUrl?: string;
  authorIsCoach: boolean;
}

export default function CoachesPage() {
  const [timeRange, setTimeRange] = useState("7");
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [newComments, setNewComments] = useState<{ [key: number]: string }>({});
  const [commentsData, setCommentsData] = useState<{ [key: number]: Comment[] }>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch coach's athletes
  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ["/api/coaches/athletes"],
  });

  // Fetch mood statistics
  const { data: moodStats, isLoading: moodLoading } = useQuery<MoodStats>({
    queryKey: ["/api/coaches/mood-stats", timeRange],
    queryFn: () => apiRequest(`/api/coaches/mood-stats?timeRange=${timeRange}`),
  });

  // Fetch athlete journal entries
  const { data: journalEntries = [], isLoading: journalLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/coaches/journal-entries"],
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ journalId, content, isPrivate }: { journalId: number; content: string; isPrivate: boolean }) =>
      apiRequest(`/api/journal/${journalId}/comments`, "POST", { content, isPrivate }),
    onSuccess: (newComment, variables) => {
      // Update local comments data
      setCommentsData(prev => ({
        ...prev,
        [variables.journalId]: [...(prev[variables.journalId] || []), newComment]
      }));
      
      // Clear the comment input
      setNewComments(prev => ({
        ...prev,
        [variables.journalId]: ""
      }));
      
      toast({
        title: "Comment added",
        description: variables.isPrivate ? "Private comment sent to athlete" : "Public comment added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch comments for a journal entry
  const fetchComments = async (journalId: number) => {
    try {
      const comments = await apiRequest(`/api/journal/${journalId}/comments`);
      setCommentsData(prev => ({
        ...prev,
        [journalId]: comments
      }));
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  // Toggle journal entry expansion
  const toggleEntry = (entryId: number) => {
    const newExpanded = new Set(expandedEntries);
    if (expandedEntries.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
      // Fetch comments when expanding if not already loaded
      if (!commentsData[entryId]) {
        fetchComments(entryId);
      }
    }
    setExpandedEntries(newExpanded);
  };

  // Handle comment submission
  const handleAddComment = (journalId: number, isPrivate: boolean = true) => {
    const content = newComments[journalId]?.trim();
    if (!content) return;

    addCommentMutation.mutate({
      journalId,
      content,
      isPrivate,
    });
  };

  // Get mood color based on rating
  const getMoodColor = (rating: number | null) => {
    if (!rating) return "bg-gray-400";
    if (rating <= 3) return "bg-red-500";
    if (rating <= 5) return "bg-yellow-500";
    if (rating <= 7) return "bg-blue-500";
    return "bg-green-500";
  };

  // Format mood rating
  const formatMoodRating = (rating: number | null) => {
    return rating ? rating.toFixed(1) : "N/A";
  };

  // Parse journal content for mood rating
  const getJournalMood = (content: any) => {
    try {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      return parsed?.moodRating || null;
    } catch {
      return null;
    }
  };

  if (athletesLoading || moodLoading || journalLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coach Dashboard</h1>
          <p className="text-muted-foreground">Monitor your athletes' progress and provide guidance</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{athletes.length} Athletes</span>
        </div>
      </div>

      {/* Mood Statistics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mood Tracking Overview
            </CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last week</SelectItem>
                <SelectItem value="30">Last month</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Overall Average */}
            <Card className="border-2 border-primary/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Team Average</div>
                  <div className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg",
                    getMoodColor(moodStats?.overall.avgMood || null)
                  )}>
                    {formatMoodRating(moodStats?.overall.avgMood || null)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {moodStats?.overall.entryCount || 0} entries
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Athletes */}
            {moodStats?.athletes.slice(0, 3).map((athlete) => (
              <Card key={athlete.athleteId}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium mb-2 truncate">{athlete.athleteName}</div>
                    <div className={cn(
                      "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold",
                      getMoodColor(athlete.avgMood)
                    )}>
                      {formatMoodRating(athlete.avgMood)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {athlete.entryCount} entries
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All Athletes Mood List */}
          {moodStats?.athletes && moodStats.athletes.length > 3 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">All Athletes</h4>
              <div className="space-y-2">
                {moodStats.athletes.map((athlete) => (
                  <div key={athlete.athleteId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="font-medium">{athlete.athleteName}</span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                        getMoodColor(athlete.avgMood)
                      )}>
                        {formatMoodRating(athlete.avgMood)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {athlete.entryCount} entries
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Diary Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Training Diary Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {journalEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No diary entries found.</p>
              <p className="text-sm">Your athletes' diary entries will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {journalEntries.map((entry) => {
                const isExpanded = expandedEntries.has(entry.id);
                const entryMood = getJournalMood(entry.content);
                const comments = commentsData[entry.id] || [];
                
                return (
                  <Collapsible
                    key={entry.id}
                    open={isExpanded}
                    onOpenChange={() => toggleEntry(entry.id)}
                  >
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={entry.athleteProfileImageUrl} />
                                <AvatarFallback>
                                  {entry.athleteName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{entry.title}</h3>
                                  {entry.isPublic ? (
                                    <Globe className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  {entryMood && (
                                    <div className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs",
                                      getMoodColor(entryMood)
                                    )}>
                                      {entryMood}
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  by {entry.athleteName} • {new Date(entry.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {comments.length > 0 && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  {comments.length}
                                </Badge>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {/* Entry Content */}
                          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
                            <p className="whitespace-pre-wrap">{entry.notes || "No notes provided."}</p>
                          </div>

                          {/* Comments Section */}
                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              Comments
                            </h4>

                            {/* Existing Comments */}
                            {comments.length > 0 && (
                              <div className="space-y-3">
                                {comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className={cn(
                                      "p-3 rounded-lg border",
                                      comment.isPrivate
                                        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                                        : "border-border bg-background"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={comment.authorProfileImageUrl} />
                                        <AvatarFallback className="text-xs">
                                          {comment.authorName.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium text-sm">{comment.authorName}</span>
                                      {comment.isPrivate && (
                                        <Badge variant="outline" className="text-xs">
                                          <Lock className="h-3 w-3 mr-1" />
                                          Private
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm">{comment.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment Form */}
                            <div className="space-y-3 border-t pt-4">
                              <Textarea
                                placeholder="Add a comment for this athlete..."
                                value={newComments[entry.id] || ""}
                                onChange={(e) => setNewComments(prev => ({
                                  ...prev,
                                  [entry.id]: e.target.value
                                }))}
                                className="min-h-[80px]"
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleAddComment(entry.id, true)}
                                  disabled={!newComments[entry.id]?.trim() || addCommentMutation.isPending}
                                  className="flex items-center gap-2"
                                >
                                  <Lock className="h-4 w-4" />
                                  Private Comment
                                </Button>
                                {entry.isPublic && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleAddComment(entry.id, false)}
                                    disabled={!newComments[entry.id]?.trim() || addCommentMutation.isPending}
                                    className="flex items-center gap-2"
                                  >
                                    <Globe className="h-4 w-4" />
                                    Public Comment
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Private comments are only visible to you and the athlete.
                                {entry.isPublic && " Public comments are visible to everyone."}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}