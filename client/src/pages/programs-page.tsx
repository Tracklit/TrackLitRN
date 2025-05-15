import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  BookOpen, 
  CalendarDays, 
  Clock, 
  Crown, 
  Plus, 
  AlignLeft, 
  PlusCircle, 
  Dumbbell, 
  Lock,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProgramsPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const { toast } = useToast();
  
  // Fetch user's programs
  const { 
    data: userPrograms = [], 
    isLoading: isLoadingPrograms 
  } = useQuery({
    queryKey: ["/api/programs"],
    enabled: !!user
  });
  
  // Fetch purchased programs
  const { 
    data: purchasedPrograms = [], 
    isLoading: isLoadingPurchased 
  } = useQuery({
    queryKey: ["/api/purchased-programs"],
    enabled: !!user
  });
  
  // Fetch workout library
  const { 
    data: workoutLibrary, 
    isLoading: isLoadingLibrary 
  } = useQuery({
    queryKey: ["/api/workout-library"],
    enabled: !!user
  });
  
  const handleCalendarViewClick = () => {
    if (!user?.isPremium) {
      toast({
        title: "Premium Feature",
        description: "Calendar view is available for premium users only.",
        variant: "destructive"
      });
      return;
    }
    
    setViewMode("calendar");
  };
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Programs"
        description="Track your training programs and workouts"
      />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <AlignLeft className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button 
            variant={viewMode === "calendar" ? "default" : "outline"} 
            size="sm"
            onClick={handleCalendarViewClick}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
            {!user?.isPremium && <Lock className="h-3 w-3 ml-1" />}
          </Button>
        </div>
        
        <Button asChild>
          <Link href="/programs/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Program
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="my-programs" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="my-programs">My Programs</TabsTrigger>
          <TabsTrigger value="purchased">Purchased Programs</TabsTrigger>
          <TabsTrigger value="library">Workout Library</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-programs">
          {isLoadingPrograms ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((_, i) => (
                <ProgramCardSkeleton key={i} />
              ))}
            </div>
          ) : userPrograms.length === 0 ? (
            <EmptyState 
              title="No Programs Yet" 
              description="Create your first training program to get started"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPrograms.map((program: any) => (
                <ProgramCard 
                  key={program.id} 
                  program={program} 
                  type="created" 
                  viewMode={viewMode}
                />
              ))}
              <CreateProgramCard />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="purchased">
          {isLoadingPurchased ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((_, i) => (
                <ProgramCardSkeleton key={i} />
              ))}
            </div>
          ) : purchasedPrograms.length === 0 ? (
            <EmptyState 
              title="No Purchased Programs" 
              description="Purchase programs from other users to access their training plans"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchasedPrograms.map((purchase: any) => (
                <ProgramCard 
                  key={purchase.id} 
                  program={purchase.program} 
                  type="purchased" 
                  creator={purchase.creator}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="library">
          {isLoadingLibrary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((_, i) => (
                <WorkoutCardSkeleton key={i} />
              ))}
            </div>
          ) : !workoutLibrary || workoutLibrary.workouts.length === 0 ? (
            <EmptyState 
              title="Your Workout Library is Empty" 
              description="Save workouts from your practice sessions to build your library"
            />
          ) : (
            <>
              {workoutLibrary.isLimited && (
                <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/40 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Library Limit Reached
                      </h3>
                      <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                        <p>
                          You've saved {workoutLibrary.totalSaved} workouts out of {workoutLibrary.maxFreeAllowed} allowed for free accounts.
                          Upgrade to premium to save unlimited workouts.
                        </p>
                      </div>
                    </div>
                    <div className="ml-auto">
                      <Button variant="outline" size="sm">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={(workoutLibrary.totalSaved / workoutLibrary.maxFreeAllowed) * 100} className="h-2" />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workoutLibrary.workouts.map((workout: any) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProgramCard({ program, type, creator, viewMode }: {
  program: any;
  type: "created" | "purchased";
  creator?: { username: string };
  viewMode: "list" | "calendar";
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-36 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
        {program.coverImageUrl && (
          <img 
            src={program.coverImageUrl} 
            alt={program.title} 
            className="w-full h-full object-cover"
          />
        )}
        {program.isPremium && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{program.title}</CardTitle>
            <CardDescription>
              {type === "purchased" && creator && (
                <span className="text-xs text-muted-foreground">By {creator.username}</span>
              )}
            </CardDescription>
          </div>
          <Badge variant={program.category === "sprint" ? "default" : 
                        program.category === "distance" ? "outline" : 
                        program.category === "jumps" ? "secondary" : "destructive"}>
            {program.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground mb-2 line-clamp-2">{program.description}</div>
        <div className="flex items-center mt-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 mr-1" />
          <span>{program.duration} days</span>
          <Clock className="h-4 w-4 ml-3 mr-1" />
          <span>{viewMode === "list" ? "List view" : "Calendar view"}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/programs/${program.id}`}>
            <BookOpen className="h-4 w-4 mr-2" />
            View
          </Link>
        </Button>
        {type === "created" && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/programs/${program.id}/edit`}>
              Edit
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function CreateProgramCard() {
  return (
    <Card className="overflow-hidden border-dashed h-full">
      <Link href="/programs/create">
        <div className="flex flex-col items-center justify-center h-full p-6 cursor-pointer hover:bg-accent/10 transition-colors">
          <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Create New Program</h3>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Build a custom training program to reach your goals
          </p>
        </div>
      </Link>
    </Card>
  );
}

function WorkoutCard({ workout }: { workout: any }) {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{workout.title}</CardTitle>
          <Badge variant={workout.category === "saved" ? "secondary" : "default"}>
            {workout.category}
          </Badge>
        </div>
        <CardDescription>
          {workout.completedAt && new Date(workout.completedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground mb-2 line-clamp-2">{workout.description}</div>
        <div className="flex items-center mt-2 text-sm text-muted-foreground">
          <Dumbbell className="h-4 w-4 mr-1" />
          {workout.isPublic ? "Public workout" : "Private workout"}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/workouts/${workout.id}`}>
            View Details
          </Link>
        </Button>
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
    <div className="border rounded-lg p-12 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <BookOpen className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
}

function ProgramCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-36 w-full" />
      <CardHeader className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <div className="flex items-center mt-4">
          <Skeleton className="h-4 w-16 mr-3" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </CardFooter>
    </Card>
  );
}

function WorkoutCardSkeleton() {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <div className="flex items-center mt-4">
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-28" />
      </CardFooter>
    </Card>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/programs" component={ProgramsPage} />
  );
}