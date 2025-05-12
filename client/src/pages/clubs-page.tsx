import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Globe, Shield, Plus, MessagesSquare, UserCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function ClubsPage() {
  const { user } = useAuth();
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Clubs & Groups"
        description="Join clubs and chat with fellow athletes"
        action={
          <Dialog open={isCreateClubOpen} onOpenChange={setIsCreateClubOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Club</DialogTitle>
                <DialogDescription>
                  Create a club to connect with other athletes and coaches.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Club Name</Label>
                  <Input id="name" placeholder="Enter club name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe your club" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="public">Public - Anyone can join</option>
                    <option value="private">Private - Approval required</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateClubOpen(false)}>Cancel</Button>
                <Button type="submit">Create Club</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="my-clubs" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>
          <TabsTrigger value="groups">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="my-clubs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Empty state */}
            <Card className="col-span-full text-center py-8">
              <CardContent>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-medium">You haven't joined any clubs yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Clubs connect you with other athletes and coaches for training and competitions.
                </p>
                <Button className="mt-4" onClick={() => document.getElementById('discover-tab')?.click()}>
                  Discover Clubs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Empty state */}
            <Card className="col-span-full text-center py-8">
              <CardContent>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <MessagesSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-medium">No group chats yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Groups let you chat with specific sets of athletes and coaches.
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Group
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="discover" id="discover-tab">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example club cards */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Track Stars Academy</CardTitle>
                    <CardDescription>Elite training for sprinters and jumpers</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">142 members</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our community of dedicated athletes focused on sprint events and jumps. 
                  Weekly training plans and expert coaching available.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Join Club</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Distance Runners Guild</CardTitle>
                    <CardDescription>For cross country and distance events</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">98 members</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Community for endurance athletes specializing in 800m and up.
                  Share training routes, compare race strategies, and support each other.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Join Club</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Field Event Specialists</CardTitle>
                    <CardDescription>Throws, jumps, and combined events</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Shield className="h-4 w-4" />
                    <span>Private</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">67 members</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Exclusive group for serious field event athletes. 
                  Technical coaching, video analysis, and competition preparation.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Request to Join</Button>
              </CardFooter>
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
    <ProtectedRoute path="/clubs" component={ClubsPage} />
  );
}