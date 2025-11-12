import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Play, Trash2, MoreVertical, Grid3X3, List, Copy, Check, Users, Lock, Crown } from "lucide-react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ExerciseLibraryItem {
  id: number;
  name: string;
  description: string | null;
  type: 'upload' | 'youtube';
  fileUrl: string | null;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  thumbnailUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
}

interface LibraryLimits {
  uploads: {
    current: number;
    limit: number;
    canUpload: boolean;
  };
  youtube: {
    current: number;
    limit: number;
    canAdd: boolean;
  };
}

export default function ExerciseLibraryPage() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fullscreenVideo, setFullscreenVideo] = useState<ExerciseLibraryItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const [libraryShareDialogOpen, setLibraryShareDialogOpen] = useState(false);
  const [selectedLibraryRecipients, setSelectedLibraryRecipients] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exercise library
  const { data: libraryData, isLoading } = useQuery({
    queryKey: ['/api/exercise-library', currentPage],
    queryFn: () => apiRequest('GET', `/api/exercise-library?page=${currentPage}`).then(res => res.json())
  });

  // Fetch library limits
  const { data: limits } = useQuery<LibraryLimits>({
    queryKey: ['/api/exercise-library/limits'],
    queryFn: () => apiRequest('GET', '/api/exercise-library/limits').then(res => res.json())
  });

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('GET', '/api/user').then(res => res.json())
  });

  // Search users function
  const searchUsers = async (query: string) => {
    if (query.length < 2) return [];
    try {
      const response = await apiRequest('GET', `/api/users/search?q=${encodeURIComponent(query)}`);
      return response.json();
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      await apiRequest('DELETE', `/api/exercise-library/${exerciseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library/limits'] });
      toast({ title: "Success", description: "Exercise deleted successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Delete Failed", 
        description: "Failed to delete exercise",
        variant: "destructive" 
      });
    }
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (data: { exerciseId: number; recipientIds: number[]; message: string }) => {
      const response = await apiRequest('POST', '/api/exercise-library/share', data);
      return response.json();
    },
    onSuccess: () => {
      setShareDialogOpen(false);
      setSelectedRecipients([]);
      setShareMessage("");
      toast({ title: "Success", description: "Exercise shared successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Share Failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Library sharing mutation
  const libraryShareMutation = useMutation({
    mutationFn: async (data: { recipientIds: number[]; useSpikes?: boolean }) => {
      const response = await apiRequest('POST', '/api/exercise-library/share-library', data);
      return response.json();
    },
    onSuccess: () => {
      setLibraryShareDialogOpen(false);
      setSelectedLibraryRecipients([]);
      toast({ title: "Success", description: "Library access shared successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Share Failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const openFullscreen = (exercise: ExerciseLibraryItem) => {
    setFullscreenVideo(exercise);
  };

  const closeFullscreen = () => {
    setFullscreenVideo(null);
  };

  const copyExerciseLink = async (exerciseId: number) => {
    const link = `${window.location.origin}/exercise/${exerciseId}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: "Success", description: "Link copied to clipboard!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleShareInternal = () => {
    if (selectedExercise && selectedRecipients.length > 0) {
      shareMutation.mutate({
        exerciseId: selectedExercise.id,
        recipientIds: selectedRecipients,
        message: shareMessage
      });
    }
  };

  const handleLibraryShare = (useSpikes = false) => {
    if (selectedLibraryRecipients.length > 0) {
      libraryShareMutation.mutate({
        recipientIds: selectedLibraryRecipients,
        useSpikes
      });
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const getSubscriptionTier = () => {
    if (!userData) return 'free';
    if ((userData as any).isPremium) return 'star';
    if ((userData as any).isProUser) return 'pro';
    return 'free';
  };

  const canShareLibrary = () => {
    const tier = getSubscriptionTier();
    if (tier === 'pro' || tier === 'star') return true;
    return ((userData as any)?.spikes || 0) >= 100; // Free users need 100 spikes
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getThumbnail = (exercise: ExerciseLibraryItem) => {
    if (exercise.type === 'youtube' && exercise.thumbnailUrl) {
      return exercise.thumbnailUrl;
    }
    return '/placeholder-video.jpg';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container max-w-7xl mx-auto px-4 pt-20 pb-16">
        
        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`h-9 px-4 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
              data-testid="button-view-grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`h-9 px-4 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex gap-3">
            <Link href="/tools/exercise-library/add">
              <button
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                }}
                data-testid="button-add-video"
              >
                <Plus className="h-5 w-5" />
                Add Video
              </button>
            </Link>

            <button
              onClick={() => setLibraryShareDialogOpen(true)}
              disabled={!canShareLibrary()}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                canShareLibrary()
                  ? 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 backdrop-blur-xl text-white'
                  : 'bg-slate-800/30 border border-slate-700/30 text-slate-500 cursor-not-allowed'
              }`}
              data-testid="button-share-library"
            >
              {getSubscriptionTier() === 'star' ? (
                <Crown className="h-5 w-5 text-yellow-500" />
              ) : getSubscriptionTier() === 'pro' ? (
                <Users className="h-5 w-5 text-blue-500" />
              ) : (
                <Lock className="h-5 w-5 text-slate-500" />
              )}
              Share Library
              {getSubscriptionTier() === 'free' && (
                <Badge
                  className="ml-2 text-xs px-2 py-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                    border: 'none'
                  }}
                >
                  100 Spikes
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Exercise Grid/List */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-slate-800/50" />
                <div className="p-6">
                  <div className="h-5 bg-slate-700/50 rounded mb-3 w-3/4" />
                  <div className="h-4 bg-slate-700/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : libraryData?.exercises?.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {libraryData.exercises.map((exercise: ExerciseLibraryItem) => (
                  <div
                    key={exercise.id}
                    className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 shadow-xl hover:shadow-2xl"
                    data-testid={`card-exercise-${exercise.id}`}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={getThumbnail(exercise)}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-video.jpg';
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => openFullscreen(exercise)}
                          className="w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                          style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                          }}
                          data-testid={`button-play-${exercise.id}`}
                        >
                          <Play className="h-6 w-6 fill-white text-white ml-0.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-white truncate mb-2">
                            {exercise.name}
                          </h3>
                          {exercise.fileSize && (
                            <span className="text-sm text-slate-400">
                              {formatFileSize(exercise.fileSize)}
                            </span>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                              data-testid={`button-menu-${exercise.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExercise(exercise);
                                setShareDialogOpen(true);
                              }}
                              className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 focus:text-white"
                              data-testid={`menu-item-share-${exercise.id}`}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(exercise.id)}
                              className="cursor-pointer text-red-400 hover:bg-red-900/50 focus:bg-red-900/50 focus:text-red-300"
                              data-testid={`menu-item-delete-${exercise.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {libraryData.exercises.map((exercise: ExerciseLibraryItem) => (
                  <div
                    key={exercise.id}
                    className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-300 shadow-xl hover:shadow-2xl"
                    data-testid={`card-exercise-${exercise.id}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="relative w-40 h-24 overflow-hidden rounded-2xl flex-shrink-0">
                        <img
                          src={getThumbnail(exercise)}
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-video.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => openFullscreen(exercise)}
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                            style={{
                              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                            }}
                            data-testid={`button-play-${exercise.id}`}
                          >
                            <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white mb-2 truncate">
                          {exercise.name}
                        </h3>
                        {exercise.description && (
                          <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                            {exercise.description}
                          </p>
                        )}
                        {exercise.fileSize && (
                          <span className="text-xs text-slate-500">
                            {formatFileSize(exercise.fileSize)}
                          </span>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                            data-testid={`button-menu-${exercise.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedExercise(exercise);
                              setShareDialogOpen(true);
                            }}
                            className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700 focus:text-white"
                            data-testid={`menu-item-share-${exercise.id}`}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(exercise.id)}
                            className="cursor-pointer text-red-400 hover:bg-red-900/50 focus:bg-red-900/50 focus:text-red-300"
                            data-testid={`menu-item-delete-${exercise.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 py-32 px-16 flex items-center justify-center min-h-[400px]">
            <Link href="/tools/exercise-library/add">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                }}
                data-testid="button-add-first-video"
              >
                <Plus className="h-5 w-5" />
                Add Your First Video
              </button>
            </Link>
          </div>
        )}

        {/* Fullscreen Video Modal */}
        {fullscreenVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl leading-none z-10"
              data-testid="button-close-fullscreen"
            >
              ×
            </button>
            
            <div className="relative w-full max-w-6xl aspect-video">
              {fullscreenVideo.type === 'youtube' && fullscreenVideo.youtubeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${fullscreenVideo.youtubeVideoId}?autoplay=1`}
                  className="w-full h-full rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : fullscreenVideo.fileUrl ? (
                <video
                  src={fullscreenVideo.fileUrl}
                  controls
                  autoPlay
                  className="w-full h-full rounded-2xl"
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Share Exercise Modal */}
        {shareDialogOpen && selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShareDialogOpen(false)}
            />
            
            <div className="relative bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Share Exercise</h2>
                  <button
                    onClick={() => setShareDialogOpen(false)}
                    className="text-slate-400 hover:text-white text-3xl leading-none"
                    data-testid="button-close-share"
                  >
                    ×
                  </button>
                </div>
                
                <div className="text-sm text-slate-400">
                  Sharing: <span className="text-white font-semibold">{selectedExercise.name}</span>
                </div>
                
                <Tabs defaultValue="link" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 p-1 rounded-xl">
                    <TabsTrigger 
                      value="link"
                      className="text-slate-400 data-[state=active]:text-white rounded-lg data-[state=active]:bg-slate-700"
                      data-testid="tab-copy-link"
                    >
                      Copy Link
                    </TabsTrigger>
                    <TabsTrigger 
                      value="internal"
                      className="text-slate-400 data-[state=active]:text-white rounded-lg data-[state=active]:bg-slate-700"
                      data-testid="tab-send-message"
                    >
                      Send Message
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="link" className="mt-6 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/exercise/${selectedExercise.id}`}
                        readOnly
                        className="bg-slate-800 border-slate-700 text-white"
                        data-testid="input-share-link"
                      />
                      <Button
                        onClick={() => copyExerciseLink(selectedExercise.id)}
                        size="sm"
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                        data-testid="button-copy-link"
                      >
                        {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="internal" className="mt-6 space-y-4">
                    <div>
                      <Label className="text-white mb-2 block">Search Users</Label>
                      <div className="relative">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Type username to search..."
                          className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                          data-testid="input-search-users"
                        />
                        {isSearching && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="mt-3 max-h-40 overflow-y-auto space-y-2 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                          {searchResults.map((user: any) => (
                            <div
                              key={user.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedRecipients.includes(user.id)
                                  ? 'bg-purple-500/20 border border-purple-500/50'
                                  : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
                              }`}
                              onClick={() => {
                                setSelectedRecipients(prev =>
                                  prev.includes(user.id)
                                    ? prev.filter(id => id !== user.id)
                                    : [...prev, user.id]
                                );
                              }}
                              data-testid={`user-option-${user.id}`}
                            >
                              <div className="text-white font-medium">{user.name}</div>
                              <div className="text-slate-400 text-sm">@{user.username}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {selectedRecipients.length > 0 && (
                      <div>
                        <Label className="text-white mb-2 block">Message (Optional)</Label>
                        <textarea
                          value={shareMessage}
                          onChange={(e) => setShareMessage(e.target.value)}
                          placeholder="Add a message..."
                          className="w-full min-h-[100px] bg-slate-800 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 resize-none"
                          data-testid="textarea-share-message"
                        />
                        
                        <button
                          onClick={handleShareInternal}
                          disabled={shareMutation.isPending}
                          className="w-full mt-4 px-6 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-50"
                          style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                          }}
                          data-testid="button-send-share"
                        >
                          {shareMutation.isPending ? 'Sending...' : `Share with ${selectedRecipients.length} ${selectedRecipients.length === 1 ? 'person' : 'people'}`}
                        </button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
