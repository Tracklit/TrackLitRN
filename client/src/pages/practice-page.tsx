import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Calendar, Clock, List, Play, PenLine } from "lucide-react";

export default function PracticePage() {
  const { user } = useAuth();

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Practice"
        description="Track your training sessions and progress"
      />

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="diary">Training Diary</TabsTrigger>
          <TabsTrigger value="tools">Training Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder for upcoming practice sessions */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">Speed Workout</CardTitle>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Tomorrow</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>45 minutes</span>
                  <span className="mx-2">•</span>
                  <Dumbbell className="h-4 w-4 mr-1" />
                  <span>High intensity</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Focus on acceleration and top-end speed with 60m sprints and block starts.</p>
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" className="flex items-center">
                    <List className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button size="sm" className="flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">Endurance Training</CardTitle>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Thursday</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>60 minutes</span>
                  <span className="mx-2">•</span>
                  <Dumbbell className="h-4 w-4 mr-1" />
                  <span>Medium intensity</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Build stamina with tempo runs and 400m repeats. Focus on form throughout.</p>
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" className="flex items-center">
                    <List className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button size="sm" className="flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">Recovery Session</CardTitle>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Saturday</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>30 minutes</span>
                  <span className="mx-2">•</span>
                  <Dumbbell className="h-4 w-4 mr-1" />
                  <span>Low intensity</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Light recovery workout with stretching and mobility exercises to promote recovery.</p>
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" className="flex items-center">
                    <List className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button size="sm" className="flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Button className="w-full" size="lg">View Training Program</Button>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Your completed practice sessions will appear here</p>
            <Button className="mt-4">Record a Practice Session</Button>
          </div>
        </TabsContent>

        <TabsContent value="diary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenLine className="h-5 w-5 mr-2" />
                  Training Diary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Keep track of your thoughts, feelings, and progress during training</p>
                <Button>Create New Entry</Button>
              </CardContent>
            </Card>

            {/* Previous diary entries placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No diary entries yet</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Stopwatch</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Clock className="h-16 w-16 text-primary" />
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Start Gun</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Play className="h-16 w-16 text-primary" />
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Interval Timer</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Clock className="h-16 w-16 text-primary" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/practice" component={PracticePage} />
  );
}