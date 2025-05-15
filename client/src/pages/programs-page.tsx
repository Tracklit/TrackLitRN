import { useState } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  Crown,
  FileText,
  Filter,
  Info,
  LayersIcon,
  Loader2,
  LockIcon,
  Plus,
  Search,
  Tag,
  TrendingUp,
  Dumbbell
} from "lucide-react";

export default function ProgramsPage() {
  const [activeTab, setActiveTab] = useState("my-programs");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
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
  
  // Filter programs based on search query
  const filteredUserPrograms = Array.isArray(userPrograms) 
    ? userPrograms.filter(program => 
        program.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  const filteredPurchasedPrograms = Array.isArray(purchasedPrograms)
    ? purchasedPrograms.filter(program => 
        program.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        program.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  const filteredWorkouts = workoutLibrary?.workouts 
    ? workoutLibrary.workouts.filter(workout => 
        workout.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workout.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Training Programs"
        description="Create, discover, and follow training programs"
      />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search programs..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {activeTab === "my-programs" && (
          <Button asChild>
            <Link href="/programs/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Link>
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="my-programs" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-3 mb-6">
          <TabsTrigger value="my-programs">My Programs</TabsTrigger>
          <TabsTrigger value="purchased">Purchased</TabsTrigger>
          <TabsTrigger value="workout-library">Workout Library</TabsTrigger>
        </TabsList>
        
        {/* My Programs Tab */}
        <TabsContent value="my-programs">
          {isLoadingUserPrograms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <ProgramCardSkeleton key={item} />
              ))}
            </div>
          ) : filteredUserPrograms.length === 0 ? (
            <EmptyState 
              title="No programs yet"
              description="You haven't created any training programs yet. Get started by creating your first program."
              action={
                <Button asChild>
                  <Link href="/programs/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Program
                  </Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CreateProgramCard />
                
                {filteredUserPrograms.map((program) => (
                  <ProgramCard 
                    key={program.id} 
                    program={program}
                    viewMode="creator"
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Purchased Programs Tab */}
        <TabsContent value="purchased">
          {isLoadingPurchasedPrograms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <ProgramCardSkeleton key={item} />
              ))}
            </div>
          ) : filteredPurchasedPrograms.length === 0 ? (
            <EmptyState 
              title="No purchased programs"
              description="You haven't purchased any training programs yet. Check out the public programs to find quality training content."
              action={
                <Button variant="outline" onClick={() => setActiveTab("workout-library")}>
                  Browse Programs
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPurchasedPrograms.map((program) => (
                <ProgramCard 
                  key={program.id} 
                  program={program}
                  viewMode="purchased"
                />
              ))}
            </div>
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
  );
}

function ProgramCard({ program, type, creator, viewMode }: {
  program: any;
  type?: string;
  creator?: any;
  viewMode: "creator" | "public" | "purchased";
}) {
  const progress = program.progress ? Math.round((program.completedSessions / program.totalSessions) * 100) : 0;
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/40 relative">
        {/* File icon for uploaded documents */}
        {program.isUploadedProgram && (
          <div className="absolute top-2 left-2">
            <Badge variant="outline" className="flex items-center gap-1 bg-background/80">
              <FileText className="h-3 w-3" />
              <span>Document</span>
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
          <>
            <Button variant="ghost" size="sm">Edit</Button>
            <Button variant="default" size="sm" asChild>
              <Link href={`/programs/${program.id}`}>View Program</Link>
            </Button>
          </>
        ) : viewMode === "purchased" ? (
          <>
            <Button variant="ghost" size="sm">Details</Button>
            <Button variant="default" size="sm">Continue</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm">Preview</Button>
            {program.visibility === 'premium' ? (
              <Button variant="default" size="sm">
                <Crown className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                Purchase
              </Button>
            ) : program.visibility === 'private' ? (
              <Button variant="default" size="sm" disabled>
                <LockIcon className="h-3.5 w-3.5 mr-1.5" />
                Private
              </Button>
            ) : (
              <Button variant="default" size="sm">Start Free</Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

function CreateProgramCard() {
  return (
    <Card className="overflow-hidden h-full flex flex-col justify-center border-dashed">
      <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
        <div className="bg-primary/10 p-3 rounded-full mb-4">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl mb-2">Create New Program</CardTitle>
        <CardDescription className="mb-6">
          Design your own training program to follow or share with others
        </CardDescription>
        <Button asChild>
          <Link href="/programs/create">Create Program</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function WorkoutCard({ workout }: { workout: any }) {
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
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            <span>{workout.duration} min</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <Dumbbell className="h-4 w-4 mr-2" />
            <span className="capitalize">{workout.focusArea || "Full body"}</span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span>
              {workout.intensity === 'low' ? 'Low intensity' :
               workout.intensity === 'medium' ? 'Medium intensity' :
               workout.intensity === 'high' ? 'High intensity' : 'Varied intensity'}
            </span>
          </div>
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