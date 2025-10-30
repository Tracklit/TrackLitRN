import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AssignProgramDialog } from "@/components/assign-program-dialog-updated";
import { SelfAssignProgramDialog } from "@/components/self-assign-program-dialog";
import { DeleteProgramDialog } from "@/components/delete-program-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  Crown,
  CreditCard,
  FileText,
  Filter,
  Info,
  LayersIcon,
  Loader2,
  LockIcon,
  Plus,
  User,
  RefreshCw,
  Search,
  Tag,
  TrendingUp,
  Users,
  Dumbbell,
  MoreVertical,
  Eye,
  UserPlus,
  UserCheck,
  Trash2,
  Upload,
  ExternalLink,
  Edit3,
  Star,
  CheckCircle,
  XCircle,
  ChevronDown,
  Grid3X3,
  List
} from "lucide-react";

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState("my-programs");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const { user } = useAuth();
  const { toast } = useToast();

  // Fresh user data with stable query key - refetches when needed
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  // Use fresh user data if available, fallback to auth user
  const activeUser = currentUser || user;
  
  // Query for user's created programs
  const { 
    data: userPrograms = [], 
    isLoading: isLoadingUserPrograms 
  } = useQuery({
    queryKey: ["/api/programs"],
    queryFn: async () => {
      const response = await fetch("/api/programs");
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    }
  });
  
  // Query for purchased programs
  const { 
    data: purchasedPrograms = [], 
    isLoading: isLoadingPurchasedPrograms 
  } = useQuery({
    queryKey: ["/api/purchased-programs"],
    queryFn: async () => {
      const response = await fetch("/api/purchased-programs");
      if (!response.ok) throw new Error("Failed to fetch purchased programs");
      return response.json();
    }
  });
  
  // Query for workout library
  const { 
    data: workoutLibrary = {}, 
    isLoading: isLoadingWorkoutLibrary 
  } = useQuery({
    queryKey: ["/api/workout-library"],
    queryFn: async () => {
      const response = await fetch("/api/workout-library");
      if (!response.ok) throw new Error("Failed to fetch workout library");
      return response.json();
    }
  });

  // Query for coach's subscription offering
  const { data: mySubscription } = useQuery<{
    id: number;
    coachId: number;
    title: string;
    description: string | null;
    priceAmount: number;
    priceCurrency: string;
    priceInterval: string;
    includedPrograms: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null>({
    queryKey: ["/api/my-subscription"],
    enabled: !!user,
  });

  // Mutations for program-subscription management
  const queryClient = useQueryClient();
  
  const addProgramToSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, programIds }: { subscriptionId: number; programIds: number[] }) => {
      const response = await apiRequest("POST", `/api/subscriptions/${subscriptionId}/programs`, {
        programIds
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      toast({
        title: "Success",
        description: "Program added to subscription successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add program to subscription",
        variant: "destructive",
      });
    },
  });

  const removeProgramFromSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, programId }: { subscriptionId: number; programId: number }) => {
      const response = await apiRequest("DELETE", `/api/subscriptions/${subscriptionId}/programs/${programId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      toast({
        title: "Success",
        description: "Program removed from subscription successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove program from subscription",
        variant: "destructive",
      });
    },
  });

  // Helper functions for subscription management
  const isProgramInSubscription = (programId: number) => {
    return mySubscription?.includedPrograms?.some((p: any) => p.id === programId) || false;
  };

  const handleToggleSubscriptionProgram = (programId: number) => {
    if (!mySubscription?.id) {
      toast({
        title: "No Subscription",
        description: "Create a subscription first to add programs",
        variant: "destructive",
      });
      return;
    }

    const isInSubscription = isProgramInSubscription(programId);
    
    if (isInSubscription) {
      removeProgramFromSubscriptionMutation.mutate({
        subscriptionId: mySubscription.id,
        programId
      });
    } else {
      addProgramToSubscriptionMutation.mutate({
        subscriptionId: mySubscription.id,
        programIds: [programId]
      });
    }
  };
  
  // Filter programs based on search query
  const filteredUserPrograms = Array.isArray(userPrograms) 
    ? userPrograms.filter(program => 
        program.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  const filteredPurchasedPrograms = Array.isArray(purchasedPrograms)
    ? purchasedPrograms.filter(program => 
        program.program?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.program?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  const filteredWorkouts = workoutLibrary?.workouts 
    ? workoutLibrary.workouts.filter(workout => 
        workout.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workout.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-sm border-b border-white/10" style={{ background: 'linear-gradient(135deg, rgba(91, 33, 182, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%)' }}>
        <div className="container max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">
                Programs
              </h1>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  type="search"
                  placeholder="Search programs..."
                  className="pl-10 w-full min-w-[200px] bg-white/10 border-white/20 focus:border-white/40 text-white placeholder:text-white/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white flex-shrink-0">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-gray-800 border-gray-700">
                  <DropdownMenuItem onClick={() => setFilterCategory("all")}>
                    All Programs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("sprint")}>
                    Sprint Programs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("distance")}>
                    Distance Programs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterCategory("strength")}>
                    Strength Programs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* View Toggle */}
              <div className="flex items-center bg-white/10 border border-white/20 rounded-md flex-shrink-0">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1 rounded-l-md ${viewMode === "cards" ? "bg-white text-purple-600" : "text-white/60 hover:text-white"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded-r-md ${viewMode === "list" ? "bg-white text-purple-600" : "text-white/60 hover:text-white"}`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-screen-xl mx-auto px-4 py-6 pb-24">{/* Extra bottom padding for FAB */}
      
        <Tabs defaultValue="my-programs" onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-3 mb-8 backdrop-blur-sm" style={{ background: 'linear-gradient(135deg, rgba(91, 33, 182, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <TabsTrigger 
              value="my-programs" 
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 font-medium text-white"
            >
              My Programs
            </TabsTrigger>
            <TabsTrigger 
              value="purchased" 
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 font-medium text-white"
            >
              Purchased
            </TabsTrigger>
            <TabsTrigger 
              value="workout-library" 
              className="data-[state=active]:bg-white data-[state=active]:text-purple-600 font-medium text-white"
            >
              Workout Library
            </TabsTrigger>
          </TabsList>
        
          {/* My Programs Tab */}
          <TabsContent value="my-programs">
            {isLoadingUserPrograms ? (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <ModernProgramCardSkeleton key={item} />
                ))}
              </div>
            ) : filteredUserPrograms.length === 0 ? (
              <EmptyState 
                title="No programs yet"
                description="You haven't created any training programs yet. Get started by creating your first program."
                action={
                  <Button className="text-white" style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)' }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Program
                  </Button>
                }
              />
            ) : (
              viewMode === "cards" ? (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {filteredUserPrograms.map((program) => (
                    <ModernProgramCard 
                      key={program.id} 
                      program={program}
                      viewMode="creator"
                      addProgramToSubscriptionMutation={addProgramToSubscriptionMutation}
                      removeProgramFromSubscriptionMutation={removeProgramFromSubscriptionMutation}
                      handleToggleSubscriptionProgram={handleToggleSubscriptionProgram}
                      isProgramInSubscription={isProgramInSubscription}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUserPrograms.map((program) => (
                    <CompactProgramListItem 
                      key={program.id}
                      program={program}
                      viewMode="creator"
                    />
                  ))}
                </div>
              )
            )}
          </TabsContent>
        
          {/* Purchased Programs Tab */}
          <TabsContent value="purchased">
            {isLoadingPurchasedPrograms ? (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <ModernProgramCardSkeleton key={item} />
                ))}
              </div>
            ) : filteredPurchasedPrograms.length === 0 ? (
              <EmptyState 
                title="No purchased programs"
                description="You haven't purchased any training programs yet. Check out the public programs to find quality training content."
                action={
                  <Button variant="outline" onClick={() => setActiveTab("workout-library")} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Browse Programs
                  </Button>
                }
              />
            ) : (
              viewMode === "cards" ? (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {filteredPurchasedPrograms.map((program) => (
                    <ModernProgramCard 
                      key={program.id} 
                      program={program}
                      viewMode="purchased"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPurchasedPrograms.map((program) => (
                    <CompactProgramListItem 
                      key={program.id}
                      program={program}
                      viewMode="purchased"
                    />
                  ))}
                </div>
              )
            )}
          </TabsContent>
        
        {/* Workout Library Tab */}
        <TabsContent value="workout-library">
          {isLoadingWorkoutLibrary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <WorkoutCardSkeleton key={item} />
              ))}
            </div>
          ) : (
            <>
              {workoutLibrary.isLimited && (
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Free account limit</AlertTitle>
                  <AlertDescription>
                    You can save up to {workoutLibrary.maxFreeAllowed} workouts with a free account. 
                    Upgrade to Premium for unlimited workout storage.
                  </AlertDescription>
                </Alert>
              )}
              
              {workoutLibrary.totalSaved >= workoutLibrary.maxFreeAllowed && (
                <div className="mb-6">
                  <Progress value={(workoutLibrary.totalSaved / workoutLibrary.maxFreeAllowed) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {workoutLibrary.totalSaved}/{workoutLibrary.maxFreeAllowed} workouts saved
                  </p>
                </div>
              )}
              
              {filteredWorkouts.length === 0 ? (
                <EmptyState 
                  title="No workouts found"
                  description="There are no workouts matching your search criteria."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWorkouts.map((workout) => (
                    <WorkoutCard key={workout.id} workout={workout} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      {activeTab === "my-programs" && (
        <div className="fixed bottom-20 right-6 z-50">
          {activeUser?.isCoach ? (
            <Button 
              asChild 
              className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/programs/create">
                <Plus className="h-6 w-6" />
              </Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  data-testid="button-create-program-menu"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-gray-800 border-gray-700 mb-4 z-[100]"
                data-testid="menu-create-program-options"
                sideOffset={8}
              >
                <DropdownMenuItem asChild>
                  <Link href="/programs/create" className="flex items-center cursor-pointer" data-testid="link-create-program">
                    <Plus className="h-4 w-4 mr-3" />
                    Create a Program
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/coaches" className="flex items-center cursor-pointer" data-testid="link-find-coach">
                    <User className="h-4 w-4 mr-3" />
                    Find a Coach
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/marketplace" className="flex items-center cursor-pointer" data-testid="link-find-program">
                    <Search className="h-4 w-4 mr-3" />
                    Find a Program
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer" data-testid="link-switch-coach">
                    <UserPlus className="h-4 w-4 mr-3" />
                    Switch to Coach account
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}

function ModernProgramCard({ 
  program, 
  type, 
  creator, 
  viewMode,
  addProgramToSubscriptionMutation,
  removeProgramFromSubscriptionMutation,
  handleToggleSubscriptionProgram,
  isProgramInSubscription
}: {
  program: any;
  type?: string;
  creator?: any;
  viewMode: "creator" | "public" | "purchased";
  addProgramToSubscriptionMutation?: any;
  removeProgramFromSubscriptionMutation?: any;
  handleToggleSubscriptionProgram?: (programId: number) => void;
  isProgramInSubscription?: (programId: number) => boolean;
}) {
  const progress = program.progress ? Math.round((program.completedSessions / program.totalSessions) * 100) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  
  // Create mutation for deleting programs
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: number) => {
      const response = await apiRequest("DELETE", `/api/programs/${programId}`, {});
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete program");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Program deleted",
        description: "The program has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting program",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleDeleteProgram = () => {
    deleteProgramMutation.mutate(program.id);
  };
  
  const refreshSheetMutation = useMutation({
    mutationFn: async (programId: number) => {
      if (!program.googleSheetUrl || !program.importedFromSheet) {
        throw new Error("This program is not linked to a Google Sheet");
      }
      
      const response = await apiRequest("POST", `/api/programs/refresh-sheet/${programId}`, {
        googleSheetUrl: program.googleSheetUrl
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to refresh program data");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sheet data refreshed",
        description: "Your program has been updated with the latest spreadsheet data",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assigned-programs'] });
      setIsRefreshing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  });
  
  // Get status based on program state
  const getStatusInfo = () => {
    if (program.visibility === 'public') return { label: 'Published', color: 'bg-green-600', icon: CheckCircle };
    if (program.visibility === 'private') return { label: 'Private', color: 'bg-blue-600', icon: LockIcon };
    if (program.totalSessions === 0) return { label: 'Draft', color: 'bg-yellow-600', icon: Edit3 };
    return { label: 'Active', color: 'bg-purple-600', icon: TrendingUp };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card 
      className="group break-inside-avoid mb-6 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer bg-primary/5 backdrop-blur-sm hover:border-blue-500/50"
      onClick={() => window.location.href = `/programs/${program.programId || program.id}`}
      style={{ borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.1)' }}
    >
      {/* Header with status badge */}
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-start mb-3">
          <Badge className={`${statusInfo.color} text-white px-2 py-1 text-xs font-medium rounded-md`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
          
          {viewMode === "creator" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700 rounded-md">
                <DropdownMenuItem asChild>
                  <Link href={`/programs/${program.id}`} className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()}
                  className="p-0"
                >
                  <AssignProgramDialog 
                    program={program}
                    variant="ghost"
                    size="sm"
                    fullWidth={true}
                    buttonText="Assign Program"
                    className="w-full justify-start p-2 h-auto font-normal"
                  />
                </DropdownMenuItem>
                
                {/* Add to Subscription Option - only show if subscription functions are available */}
                {handleToggleSubscriptionProgram && isProgramInSubscription && addProgramToSubscriptionMutation && removeProgramFromSubscriptionMutation && (
                  <DropdownMenuItem 
                    onClick={() => handleToggleSubscriptionProgram(program.id)}
                    disabled={addProgramToSubscriptionMutation.isPending || removeProgramFromSubscriptionMutation.isPending}
                    className={isProgramInSubscription(program.id) ? "text-green-400" : ""}
                  >
                    {isProgramInSubscription(program.id) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Remove from Subscription
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Add to Subscription
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                
                {program.importedFromSheet && (
                  <DropdownMenuItem 
                    onClick={() => {
                      setIsRefreshing(true);
                      refreshSheetMutation.mutate(program.id);
                    }}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh Data
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={handleDeleteProgram}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <CardTitle className="text-lg font-bold text-foreground mb-2 group-hover:text-blue-400 transition-colors">
          {program.title}
        </CardTitle>
        
        {program.description && (
          <CardDescription className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {program.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {/* Program details */}
        <div className="flex flex-wrap gap-2 mb-3">
          {program.category && (
            <Badge variant="outline" className="text-xs border-primary/25 text-muted-foreground rounded-md">
              <Tag className="h-3 w-3 mr-1" />
              {program.category}
            </Badge>
          )}

          {program.importedFromSheet && (
            <Badge variant="outline" className="text-xs border-green-600 text-green-400 rounded-md">
              <ExternalLink className="h-3 w-3 mr-1" />
              Google Sheet
            </Badge>
          )}
          {program.isUploadedProgram && (
            <Badge variant="outline" className="text-xs border-purple-600 text-purple-400 rounded-md">
              <Upload className="h-3 w-3 mr-1" />
              Document
            </Badge>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="h-4 w-4 mr-2" />
            <span>{program.duration || 0} days</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>{program.totalSessions || 0} sessions</span>
          </div>
        </div>
        
        {/* Progress bar for purchased programs */}
        {progress > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-[9px] font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-0.5" />
          </div>
        )}
      </CardContent>
      
      {/* Visibility icon in bottom right corner */}
      <div className="absolute bottom-1 right-1">
        {program.isAssigned && <UserCheck className="h-3 w-3 text-blue-500" />}
        {!program.isAssigned && program.visibility === 'premium' && <Crown className="h-3 w-3 text-yellow-500" />}
        {!program.isAssigned && program.visibility === 'private' && <LockIcon className="h-3 w-3 text-muted-foreground" />}
      </div>
      
      {/* Assigned program indicator */}
      {program.isAssigned && (
        <div className="absolute top-1 left-1">
          <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 bg-blue-100 text-blue-700 border-blue-200">
            Coach: {program.assignerName}
          </Badge>
        </div>
      )}

    </Card>
  );
}

function CompactProgramListItem({ program, viewMode, creator }: {
  program: any;
  viewMode: "creator" | "public" | "purchased";
  creator?: any;
}) {
  const progress = program.progress ? Math.round((program.completedSessions / program.totalSessions) * 100) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create mutation for deleting programs
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: number) => {
      const response = await apiRequest("DELETE", `/api/programs/${programId}`, {});
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete program");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Program deleted",
        description: "The program has been successfully deleted",
      });
      // Refresh the programs list
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting program",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteProgram = () => {
    if (confirm("Are you sure you want to delete this program? This action cannot be undone.")) {
      deleteProgramMutation.mutate(program.id);
    }
  };

  return (
    <Card className="bg-primary/5 hover:border-gray-600/50 transition-all duration-200" style={{ borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.1)' }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground text-sm truncate">{program.title}</h3>
              {program.isAssigned && <UserCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              {!program.isAssigned && program.visibility === 'premium' && <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
              {!program.isAssigned && program.visibility === 'private' && <LockIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{program.description || "No description"}</p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div className="text-xs text-muted-foreground">
              {program.duration || 0} days
            </div>
            {progress > 0 && (
              <div className="text-xs text-muted-foreground">
                {progress}% complete
              </div>
            )}
            
            {/* Actions Menu */}
            {viewMode === "creator" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-gray-800 border-gray-700 rounded-md">
                  <DropdownMenuItem asChild>
                    <Link href={`/programs/${program.id}/edit`} className="flex items-center cursor-pointer">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Program
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeleteProgram} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Program
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ModernProgramCardSkeleton() {
  return (
    <Card className="break-inside-avoid mb-6 overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/30 animate-pulse" style={{ borderRadius: '6px' }}>
      <CardHeader className="p-4 pb-3">
        <div className="flex justify-between items-start mb-3">
          <div className="h-6 w-16 bg-gray-700/50 rounded"></div>
          <div className="h-6 w-6 bg-gray-700/50 rounded"></div>
        </div>
        <div className="h-6 w-full bg-gray-700/50 rounded mb-2"></div>
        <div className="h-4 w-3/4 bg-gray-700/50 rounded"></div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-16 bg-gray-700/50 rounded"></div>
          <div className="h-5 w-20 bg-gray-700/50 rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-4 w-full bg-gray-700/50 rounded"></div>
          <div className="h-4 w-full bg-gray-700/50 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramCard({ program, type, creator, viewMode }: {
  program: any;
  type?: string;
  creator?: any;
  viewMode: "creator" | "public" | "purchased";
}) {
  const progress = program.progress ? Math.round((program.completedSessions / program.totalSessions) * 100) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Create mutation for deleting programs
  const deleteProgramMutation = useMutation({
    mutationFn: async (programId: number) => {
      const response = await apiRequest("DELETE", `/api/programs/${programId}`, {});
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to delete program");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Program deleted",
        description: "The program has been successfully deleted",
      });
      // Refresh the programs list
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting program",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle program deletion
  const handleDeleteProgram = () => {
    deleteProgramMutation.mutate(program.id);
  };
  
  // Create mutation for refreshing Google Sheet data
  const refreshSheetMutation = useMutation({
    mutationFn: async (programId: number) => {
      if (!program.googleSheetUrl || !program.importedFromSheet) {
        throw new Error("This program is not linked to a Google Sheet");
      }
      
      const response = await apiRequest("POST", `/api/programs/refresh-sheet/${programId}`, {
        googleSheetUrl: program.googleSheetUrl
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to refresh program data");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sheet data refreshed",
        description: "Your program has been updated with the latest spreadsheet data",
      });
      // Refresh the programs list
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      // Refresh assigned programs to update sessions
      queryClient.invalidateQueries({ queryKey: ['/api/assigned-programs'] });
      setIsRefreshing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  });
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="h-32 relative bg-slate-100 border-b overflow-hidden">
        {program.isUploadedProgram ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <FileText className="h-10 w-10 text-slate-400" />
            <span className="text-xs text-slate-500 mt-1">Program Document</span>
          </div>
        ) : program.importedFromSheet ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className="grid grid-cols-3 gap-1 h-16 w-40">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={i % 2 === 0 ? "bg-slate-200 rounded h-4" : "bg-slate-300 rounded h-4"}></div>
              ))}
            </div>
            <span className="text-xs text-slate-500 mt-1">Google Sheet Import</span>
          </div>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
            <div className="absolute bottom-2 left-2 right-2 text-xs text-white font-medium px-2 py-1 bg-black/30 rounded backdrop-blur-sm">
              Preview content and exercises
            </div>
            <div className="grid grid-cols-3 gap-1 h-full p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white/10 rounded h-10"></div>
              ))}
            </div>
          </div>
        )}
        {/* File icon for uploaded documents */}
        {program.isUploadedProgram && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="flex items-center gap-1 bg-background/80">
              <FileText className="h-3 w-3" />
              <span>Document</span>
            </Badge>
          </div>
        )}
        
        {/* Google Sheet badge */}
        {program.importedFromSheet && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="flex items-center gap-1 bg-background/80">
              <FileText className="h-3 w-3 text-green-600" />
              <span>Google Sheet</span>
            </Badge>
          </div>
        )}
        
        {program.visibility === 'premium' && (
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-yellow-500" />
              <span>{program.price || 0} Spikes</span>
            </Badge>
          </div>
        )}
        {program.visibility === 'private' && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="flex items-center gap-1 bg-background/80">
              <LockIcon className="h-3 w-3" />
              <span>Private</span>
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{program.title}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">{program.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <CalendarDays className="h-4 w-4 mr-2" />
            <span>{program.duration} days</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <LayersIcon className="h-4 w-4 mr-2" />
            <span>{program.totalSessions || 0} sessions</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <Tag className="h-4 w-4 mr-2" />
            <span className="capitalize">{program.category || "General"}</span>
          </div>
          
          {viewMode === "purchased" && progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        {viewMode === "creator" ? (
          program.isUploadedProgram ? (
            <div className="flex w-full gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={program.programFileUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Document
                </a>
              </Button>
              <Button variant="default" size="sm" asChild className="flex-1">
                <Link href={`/programs/${program.id}`}><FileText className="h-3.5 w-3.5 mr-1.5" />Edit</Link>
              </Button>
              <AssignProgramDialog 
                program={program} 
                size="sm" 
                className="flex-1" 
                buttonText="Assign" 
              />
            </div>
          ) : program.importedFromSheet ? (
            <div className="flex w-full gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={program.googleSheetUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Sheet
                </a>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  setIsRefreshing(true);
                  refreshSheetMutation.mutate(program.id);
                }}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Refresh
              </Button>
              <AssignProgramDialog 
                program={program}
                size="sm"
                className="flex-1"
                buttonText="Assign"
              />
              <DeleteProgramDialog
                programId={program.id}
                programTitle={program.title}
                buttonSize="sm"
                className="flex-1"
              />
            </div>
          ) : (
            <div className="flex w-full gap-2">
              <Button variant="default" size="sm" asChild className="flex-1">
                <Link href={`/programs/${program.id}/edit`}><FileText className="h-3.5 w-3.5 mr-1.5" />Edit</Link>
              </Button>
              <AssignProgramDialog 
                program={program}
                size="sm"
                className="flex-1"
                buttonText="Assign"
              />
              <DeleteProgramDialog
                programId={program.id}
                programTitle={program.title}
                buttonSize="sm"
                className="flex-1"
                buttonText="Delete"
              />
            </div>
          )
        ) : viewMode === "purchased" ? (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/programs/${program.programId || program.id}`}>Details</Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href={`/programs/${program.programId || program.id}`}>Continue</Link>
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/programs/${program.id}`}>Preview</Link>
            </Button>
            {program.visibility === 'premium' ? (
              program.priceType === 'money' ? (
                <Button variant="default" size="sm" asChild>
                  <Link href={`/programs/${program.id}/checkout`}>
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    ${program.price || 0}
                  </Link>
                </Button>
              ) : (
                <Button variant="default" size="sm">
                  <Crown className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                  Purchase
                </Button>
              )
            ) : program.visibility === 'private' ? (
              <Button variant="default" size="sm" disabled>
                <LockIcon className="h-3.5 w-3.5 mr-1.5" />
                Private
              </Button>
            ) : (
              <SelfAssignProgramDialog 
                program={program}
                size="sm"
                variant="default"
                buttonText="Start Free"
              />
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}



function WorkoutCard({ workout }: { workout: any }) {
  const handleUserClick = () => {
    if (workout.content?.originalUser) {
      window.open(`/public-profile/${workout.content.originalUser}`, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{workout.title}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex flex-col space-y-2 text-sm">
          {workout.content?.program && (
            <div className="flex items-center text-muted-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              <span>{workout.content.program}</span>
            </div>
          )}
          
          {workout.content?.session && (
            <div className="flex items-center text-muted-foreground">
              <Dumbbell className="h-4 w-4 mr-2" />
              <span>{workout.content.session}</span>
            </div>
          )}
          
          {workout.content?.moodRating && (
            <div className="flex items-center text-muted-foreground">
              <span className="h-4 w-4 mr-2">😊</span>
              <span>Mood: {workout.content.moodRating}/10</span>
            </div>
          )}

          {workout.content?.originalUser && (
            <div className="flex items-center text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span>Original by: </span>
              <button 
                onClick={handleUserClick}
                className="text-blue-600 hover:text-blue-800 underline ml-1 transition-colors"
              >
                {workout.content.originalUser}
              </button>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button variant="ghost" size="sm">Preview</Button>
        <Button variant="default" size="sm">Add to Program</Button>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ title, description, action }: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/20">
      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2 text-center">{title}</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-md">{description}</p>
      {action}
    </div>
  );
}

function CompactProgramCardSkeleton() {
  return (
    <Card className="overflow-hidden h-24 bg-black/95 border-gray-800/50 relative">
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2 text-center">
            <Skeleton className="h-4 w-3/4 mb-1 mx-auto" />
            <div className="h-px bg-gray-700/40 w-full mt-2 mb-1"></div>
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
        <Skeleton className="h-2 w-full mt-2" />
      </CardHeader>
      <CardContent className="p-3 pt-0 pb-1">
      </CardContent>
      
      {/* Skeleton for visibility icon */}
      <div className="absolute bottom-1 right-1">
        <Skeleton className="h-3 w-3" />
      </div>
    </Card>
  );
}

function ProgramCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-muted animate-pulse" />
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-1" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </CardFooter>
    </Card>
  );
}

function WorkoutCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-1" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </CardFooter>
    </Card>
  );
}

export function Component() {
  return (
    <ProtectedRoute path="/programs" component={ProgramsPage} />
  );
}