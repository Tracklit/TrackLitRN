import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface WorkoutReactionsProps {
  sessionId: number;
  isOwnWorkout?: boolean; // true if this is the user's own assigned workout
  showCounts?: boolean; // whether to show reaction counts
  className?: string;
}

interface ReactionData {
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
}

export function WorkoutReactions({ 
  sessionId, 
  isOwnWorkout = false, 
  showCounts = true,
  className 
}: WorkoutReactionsProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionData>({
    likes: 0,
    dislikes: 0,
    userReaction: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial reaction data
  useEffect(() => {
    if (!user || !sessionId) return;
    
    const fetchReactions = async () => {
      try {
        const response = await apiRequest("GET", `/api/sessions/${sessionId}/reactions`);
        const data = await response.json();
        setReactions(data);
      } catch (error) {
        console.error("Error fetching reactions:", error);
      }
    };

    fetchReactions();
  }, [sessionId, user]);

  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (reactions.userReaction === reactionType) {
        // Remove reaction if clicking the same button
        await apiRequest("DELETE", `/api/sessions/${sessionId}/react`);
        setReactions(prev => ({
          ...prev,
          [reactionType === 'like' ? 'likes' : 'dislikes']: Math.max(0, prev[reactionType === 'like' ? 'likes' : 'dislikes'] - 1),
          userReaction: null
        }));
      } else {
        // Add or change reaction
        await apiRequest("POST", `/api/sessions/${sessionId}/react`, {
          reactionType
        });
        
        setReactions(prev => {
          const newReactions = { ...prev };
          
          // Remove old reaction count
          if (prev.userReaction) {
            const oldType = prev.userReaction === 'like' ? 'likes' : 'dislikes';
            newReactions[oldType] = Math.max(0, newReactions[oldType] - 1);
          }
          
          // Add new reaction count
          const newType = reactionType === 'like' ? 'likes' : 'dislikes';
          newReactions[newType] = newReactions[newType] + 1;
          newReactions.userReaction = reactionType;
          
          return newReactions;
        });
      }
    } catch (error) {
      console.error("Error updating reaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Like Button */}
      <button
        onClick={() => handleReaction('like')}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md transition-all",
          "hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed",
          reactions.userReaction === 'like' 
            ? "bg-green-500/20 text-green-400" 
            : "text-gray-400 hover:text-green-400"
        )}
      >
        <ThumbsUp className="h-4 w-4" />
        {showCounts && <span className="text-sm">{reactions.likes}</span>}
      </button>

      {/* Dislike Button - only show for own workouts */}
      {isOwnWorkout && (
        <button
          onClick={() => handleReaction('dislike')}
          disabled={isLoading}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md transition-all",
            "hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed",
            reactions.userReaction === 'dislike' 
              ? "bg-red-500/20 text-red-400" 
              : "text-gray-400 hover:text-red-400"
          )}
        >
          <ThumbsDown className="h-4 w-4" />
          {showCounts && <span className="text-sm">{reactions.dislikes}</span>}
        </button>
      )}
    </div>
  );
}

// Simplified version for modals (just thumbs up for other users' workouts)
export function SimpleWorkoutLike({ sessionId, className }: { sessionId: number; className?: string }) {
  return (
    <WorkoutReactions 
      sessionId={sessionId} 
      isOwnWorkout={false}
      showCounts={false}
      className={className}
    />
  );
}