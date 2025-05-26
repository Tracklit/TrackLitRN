import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { 
  useAchievements, 
  useLoginStreak, 
  useSpikeTransactions, 
  useCheckDailyLogin
} from "@/hooks/use-spikes";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Trophy, CalendarCheck, MessageSquare, Medal, Gift, Crown, Award, Clock, RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';

function SpikesPage() {
  const { user } = useAuth();
  const { data: achievements, isLoading: isLoadingAchievements } = useAchievements();
  const { data: loginStreak, isLoading: isLoadingStreak } = useLoginStreak();
  const { data: transactions, isLoading: isLoadingTransactions } = useSpikeTransactions();
  const { mutate: checkDailyLogin, isPending: isCheckingLogin } = useCheckDailyLogin();
  
  const spikeBalance = user?.spikes || 0;
  const currentStreak = loginStreak?.currentStreak || 0;
  const longestStreak = loginStreak?.longestStreak || 0;
  
  // Get categories of achievements
  const loginAchievements = achievements?.filter(a => a.category === 'login') || [];
  const workoutAchievements = achievements?.filter(a => a.category === 'workout') || [];
  const meetAchievements = achievements?.filter(a => a.category === 'meet') || [];
  const groupAchievements = achievements?.filter(a => a.category === 'group') || [];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Spikes"
        description="Your in-app currency for rewards and premium features - automatically earned!"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <img src="/spike-logo-v1.svg" alt="Spike" className="h-6 w-6 mr-2" />
              {spikeBalance} Spikes
            </CardTitle>
            <CardDescription>Spikes are automatically earned by completing activities</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Logo Design Preview */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-sm font-medium mb-3">Choose Your Spike Logo Design:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded hover:bg-gray-100 cursor-pointer">
                  <img src="/spike-logo-v1.svg" alt="Version 1" className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs font-medium">Version 1</p>
                  <p className="text-xs text-muted-foreground">Clean Geometric</p>
                </div>
                <div className="text-center p-3 border rounded hover:bg-gray-100 cursor-pointer">
                  <img src="/spike-logo-v2.svg" alt="Version 2" className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs font-medium">Version 2</p>
                  <p className="text-xs text-muted-foreground">Detailed Threads</p>
                </div>
                <div className="text-center p-3 border rounded hover:bg-gray-100 cursor-pointer">
                  <img src="/spike-logo-v3.svg" alt="Version 3" className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs font-medium">Version 3</p>
                  <p className="text-xs text-muted-foreground">Modern Dynamic</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 mr-2 text-amber-500" />
                    <span className="text-sm font-medium">Pro Tier Status</span>
                  </div>
                  <span className="text-sm text-muted-foreground">1,000 Spikes needed</span>
                </div>
                <Progress value={(spikeBalance / 1000) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">Upgrade to Pro tier to unlock advanced features</p>
              </div>

              {spikeBalance >= 500 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-amber-800">
                        <Gift className="h-5 w-5 mr-2 inline" />
                        Star Tier Available!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-amber-700 text-sm mb-3">
                        You've earned enough Spikes to unlock Star tier benefits!
                      </p>
                      <Progress 
                        value={Math.min((spikeBalance / 1000) * 100, 100)} 
                        className="h-1.5 mt-2" 
                      />
                    </CardContent>
                  </Card>
                )}

                {isLoadingStreak ? (
                  <Card className="min-h-[150px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Login Streak</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CalendarCheck className="h-5 w-5 mr-2 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium">{currentStreak}-day streak</p>
                            <p className="text-xs text-muted-foreground">
                              {currentStreak >= 7 ? 'Awesome commitment!' : 'Come back daily for more Spikes'}
                              {longestStreak > currentStreak && ` (Best: ${longestStreak} days)`}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => checkDailyLogin()}
                          disabled={isCheckingLogin}
                        >
                          {isCheckingLogin ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Check In'
                          )}
                        </Button>
                      </div>
                      <div className="flex justify-between mt-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                          <div
                            key={day}
                            className={`h-2 w-2 rounded-full ${
                              day <= Math.min(currentStreak, 7) ? "bg-amber-500" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                <p className="text-xs text-muted-foreground">Automatically earn 20-100 Spikes per meet</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Complete Training Sessions</h3>
                <p className="text-xs text-muted-foreground">Automatically earn 10-30 Spikes per practice</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <MessageSquare className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Engage in Groups</h3>
                <p className="text-xs text-muted-foreground">Automatically earn 5 Spikes for participation</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <CalendarCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Daily Login</h3>
                <p className="text-xs text-muted-foreground">Automatically earn 5-15 Spikes daily</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Personal Records</h3>
                <p className="text-xs text-muted-foreground">Automatically earn 50 Spikes for each new PR</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-3 mt-0.5">
                <RefreshCw className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Daily & Weekly Challenges</h3>
                <p className="text-xs text-muted-foreground">Automatically earn bonus Spikes for challenges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="achievements" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="achievements" id="achievements-tab">Achievements</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="premium">Premium Features</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          {isLoadingAchievements ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : achievements && achievements.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Login Achievements</CardTitle>
                    <CardDescription>Spikes automatically earned for consistent logins</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loginAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${achievement.isCompleted ? 'bg-amber-100' : 'bg-muted'}`}>
                          <Trophy className={`h-5 w-5 ${achievement.isCompleted ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{achievement.name}</h3>
                            <span className="text-sm font-medium text-amber-500">+{achievement.spikeReward} Spikes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.isCompleted ? (
                            <div className="flex items-center mt-1">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs text-green-600">Completed - Spikes Awarded!</span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                Progress: {achievement.progress}/{achievement.requirementValue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Workout Achievements</CardTitle>
                    <CardDescription>Spikes automatically earned through training</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workoutAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${achievement.isCompleted ? 'bg-amber-100' : 'bg-muted'}`}>
                          <Trophy className={`h-5 w-5 ${achievement.isCompleted ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{achievement.name}</h3>
                            <span className="text-sm font-medium text-amber-500">+{achievement.spikeReward} Spikes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.isCompleted ? (
                            <div className="flex items-center mt-1">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs text-green-600">Completed - Spikes Awarded!</span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                Progress: {achievement.progress}/{achievement.requirementValue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Meet Achievements</CardTitle>
                    <CardDescription>Spikes automatically earned in competitions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {meetAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${achievement.isCompleted ? 'bg-amber-100' : 'bg-muted'}`}>
                          <Trophy className={`h-5 w-5 ${achievement.isCompleted ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{achievement.name}</h3>
                            <span className="text-sm font-medium text-amber-500">+{achievement.spikeReward} Spikes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.isCompleted ? (
                            <div className="flex items-center mt-1">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs text-green-600">Completed - Spikes Awarded!</span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                Progress: {achievement.progress}/{achievement.requirementValue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Group Achievements</CardTitle>
                    <CardDescription>Spikes automatically earned through collaboration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groupAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${achievement.isCompleted ? 'bg-amber-100' : 'bg-muted'}`}>
                          <Trophy className={`h-5 w-5 ${achievement.isCompleted ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{achievement.name}</h3>
                            <span className="text-sm font-medium text-amber-500">+{achievement.spikeReward} Spikes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.isCompleted ? (
                            <div className="flex items-center mt-1">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-xs text-green-600">Completed - Spikes Awarded!</span>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <span className="text-xs text-muted-foreground mt-1 block">
                                Progress: {achievement.progress}/{achievement.requirementValue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
                <p className="text-muted-foreground text-center">
                  Start using the app to unlock achievements and earn Spikes automatically!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewards">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-amber-500" />
                  Pro Tier
                </CardTitle>
                <CardDescription>Unlock advanced features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">1,000 Spikes</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Advanced analytics</li>
                    <li>• Custom workout plans</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={spikeBalance < 1000}
                >
                  {spikeBalance >= 1000 ? 'Upgrade to Pro' : `Need ${1000 - spikeBalance} more Spikes`}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Medal className="h-5 w-5 mr-2 text-purple-500" />
                  Star Tier
                </CardTitle>
                <CardDescription>Premium experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">2,500 Spikes</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Everything in Pro</li>
                    <li>• AI-powered coaching</li>
                    <li>• Exclusive features</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  disabled={spikeBalance < 2500}
                  variant="secondary"
                >
                  {spikeBalance >= 2500 ? 'Upgrade to Star' : `Need ${2500 - spikeBalance} more Spikes`}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Gift className="h-5 w-5 mr-2 text-green-500" />
                  Bonus Features
                </CardTitle>
                <CardDescription>One-time purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Custom Avatar</span>
                    <span className="text-sm font-medium">100 Spikes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Extra Storage</span>
                    <span className="text-sm font-medium">250 Spikes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Priority Queue</span>
                    <span className="text-sm font-medium">150 Spikes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="premium">
          <Card>
            <CardHeader>
              <CardTitle>Premium Features Available</CardTitle>
              <CardDescription>Unlock advanced capabilities with your Spikes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Pro Tier Benefits (1,000 Spikes)</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Advanced performance analytics
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Custom workout plan generator
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Priority customer support
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Extended data history
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Star Tier Benefits (2,500 Spikes)</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500" />
                      AI-powered performance coaching
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500" />
                      Personalized nutrition guidance
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500" />
                      Exclusive community features
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500" />
                      Early access to new features
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {isLoadingTransactions ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your Spike earnings and spending</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-md mr-3 ${transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Coins className={`h-4 w-4 ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} Spikes
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                    <p className="text-muted-foreground">
                      Your Spike earnings and purchases will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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

export default SpikesPage;