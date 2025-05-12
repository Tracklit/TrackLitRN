import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Trophy, CalendarCheck, MessageSquare, Medal, Gift, Crown, Award, Clock, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SpikesPage() {
  const { user } = useAuth();
  
  // Placeholder data
  const spikeBalance = user?.spikes || 0;
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Spikes"
        description="Your in-app currency for rewards and premium features"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Coins className="h-6 w-6 mr-2 text-amber-500" />
              {spikeBalance} Spikes
            </CardTitle>
            <CardDescription>Earn Spikes by completing activities and challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm font-medium">Premium Status</span>
                  </div>
                  <span className="text-sm text-muted-foreground">1,000 Spikes needed</span>
                </div>
                <Progress value={(spikeBalance / 1000) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Upgrade to Premium to unlock advanced features</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Weekly Challenge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 mr-2 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">Complete 3 training sessions</p>
                          <p className="text-xs text-muted-foreground">1/3 completed</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">+50 Spikes</div>
                    </div>
                    <Progress value={33.3} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Daily Login</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CalendarCheck className="h-5 w-5 mr-2 text-amber-500" />
                        <div>
                          <p className="text-sm font-medium">3-day streak</p>
                          <p className="text-xs text-muted-foreground">Come back tomorrow for more Spikes</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">+5 Spikes</div>
                    </div>
                    <div className="flex justify-between mt-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div
                          key={day}
                          className={`h-2 w-2 rounded-full ${
                            day <= 3 ? "bg-amber-500" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Earn Spikes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Compete in Meets</h3>
                <p className="text-xs text-muted-foreground">Earn 20-100 Spikes per meet based on performance</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Complete Training Sessions</h3>
                <p className="text-xs text-muted-foreground">Earn 10-30 Spikes for each completed practice</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Engage in Groups</h3>
                <p className="text-xs text-muted-foreground">Earn 5 Spikes for active participation</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <Medal className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Achieve Personal Bests</h3>
                <p className="text-xs text-muted-foreground">Earn 50 Spikes for each new personal record</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <RefreshCw className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Daily & Weekly Challenges</h3>
                <p className="text-xs text-muted-foreground">Complete special challenges for bonus Spikes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="premium">Premium Features</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Virtual Coach Session</CardTitle>
                <CardDescription>One-on-one video coaching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <Gift className="h-16 w-16 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Get personalized feedback on your technique from experienced coaches</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center">
                  <Coins className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="font-medium">300 Spikes</span>
                </div>
                <Button disabled={spikeBalance < 300}>Redeem</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Premium Training Plan</CardTitle>
                <CardDescription>4-week personalized plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <Award className="h-16 w-16 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Get a customized training plan tailored to your events and goals</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center">
                  <Coins className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="font-medium">500 Spikes</span>
                </div>
                <Button disabled={spikeBalance < 500}>Redeem</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Premium Membership</CardTitle>
                <CardDescription>1 month of Premium features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <Crown className="h-16 w-16 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Unlock all premium features including advanced analytics and AI coaching</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center">
                  <Coins className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="font-medium">1000 Spikes</span>
                </div>
                <Button disabled={spikeBalance < 1000}>Redeem</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="premium">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Premium Features</CardTitle>
                <CardDescription>Unlock with 1000 Spikes or monthly subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">AI Performance Analysis</h3>
                    <p className="text-xs text-muted-foreground">Get detailed AI-powered insights into your performance data</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Advanced Calendar View</h3>
                    <p className="text-xs text-muted-foreground">Optimize your training schedule with visual periodization</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Meet Sharing & Collaboration</h3>
                    <p className="text-xs text-muted-foreground">Share meets and collaborate with your team</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Unlimited Group Management</h3>
                    <p className="text-xs text-muted-foreground">Create and manage unlimited training groups</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Media Attachments</h3>
                    <p className="text-xs text-muted-foreground">Upload and share videos, images, and documents with practice sessions</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled={spikeBalance < 1000}>
                  <Crown className="h-4 w-4 mr-2" />
                  Unlock Premium Features
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Premium Tiers</CardTitle>
                <CardDescription>Choose the plan that works for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Monthly</h3>
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-amber-500" />
                      <span>1,000 Spikes</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Quarterly</h3>
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-amber-500" />
                      <span>2,500 Spikes</span>
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Save 17%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Annual</h3>
                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-1 text-amber-500" />
                      <span>8,000 Spikes</span>
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Save 33%</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Alternative Payment Options</h3>
                  <Button variant="outline" className="w-full mb-2">
                    Purchase Premium ($4.99/month)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Direct purchase also available
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your Spikes earning and spending history</CardDescription>
            </CardHeader>
            <CardContent>
              {spikeBalance > 0 ? (
                <div className="space-y-4">
                  {/* Example transactions */}
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">Completed Practice Session</p>
                      <p className="text-xs text-muted-foreground">May 10, 2025</p>
                    </div>
                    <div className="text-green-600 font-medium">+20 Spikes</div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">Daily Login Streak (3 days)</p>
                      <p className="text-xs text-muted-foreground">May 9, 2025</p>
                    </div>
                    <div className="text-green-600 font-medium">+5 Spikes</div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">Completed Weekly Challenge</p>
                      <p className="text-xs text-muted-foreground">May 8, 2025</p>
                    </div>
                    <div className="text-green-600 font-medium">+50 Spikes</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transaction history yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Start earning Spikes by completing activities</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/spikes" component={SpikesPage} />
  );
}