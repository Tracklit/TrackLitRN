import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { 
  useAchievements, 
  useLoginStreak, 
  useSpikeTransactions, 
  useCheckDailyLogin,
  useClaimAchievement 
} from "@/hooks/use-spikes";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Trophy, CalendarCheck, MessageSquare, Medal, Gift, Crown, Award, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';

export default function SpikesPage() {
  const { user } = useAuth();
  const { data: achievements, isLoading: isLoadingAchievements } = useAchievements();
  const { data: loginStreak, isLoading: isLoadingStreak } = useLoginStreak();
  const { data: transactions, isLoading: isLoadingTransactions } = useSpikeTransactions();
  const { mutate: checkDailyLogin, isPending: isCheckingLogin } = useCheckDailyLogin();
  const { mutate: claimAchievement, isPending: isClaimingAchievement } = useClaimAchievement();
  
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
                {isLoadingAchievements ? (
                  <Card className="min-h-[150px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Achievement Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className="h-5 w-5 mr-2 text-amber-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {achievements?.filter(a => a.isCompleted).length || 0} / {achievements?.length || 0} Achievements
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Complete achievements to earn Spikes
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => document.getElementById('achievements-tab')?.click()}
                        >
                          View All
                        </Button>
                      </div>
                      <Progress 
                        value={achievements?.length ? 
                          (achievements.filter(a => a.isCompleted).length / achievements.length) * 100 : 0
                        } 
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
                    <CardDescription>Earn Spikes by logging in consistently</CardDescription>
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
                            <span className="text-xs text-green-600">Completed</span>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Progress: {achievement.progress}/{achievement.requirementValue}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs h-5 px-2"
                                  disabled={achievement.progress < achievement.requirementValue || isClaimingAchievement}
                                  onClick={() => claimAchievement(achievement.id)}
                                >
                                  {isClaimingAchievement ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Claim'}
                                </Button>
                              </div>
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
                    <CardDescription>Earn Spikes through training</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workoutAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${achievement.isCompleted ? 'bg-amber-100' : 'bg-muted'}`}>
                          <Clock className={`h-5 w-5 ${achievement.isCompleted ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{achievement.name}</h3>
                            <span className="text-sm font-medium text-amber-500">+{achievement.spikeReward} Spikes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.isCompleted ? (
                            <span className="text-xs text-green-600">Completed</span>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Progress: {achievement.progress}/{achievement.requirementValue}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs h-5 px-2"
                                  disabled={achievement.progress < achievement.requirementValue || isClaimingAchievement}
                                  onClick={() => claimAchievement(achievement.id)}
                                >
                                  {isClaimingAchievement ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Claim'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Meet & Competition Achievements</CardTitle>
                    <CardDescription>Earn Spikes by creating competitions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {meetAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${achievement.isCompleted ? 'bg-amber-100' : 'bg-muted'}`}>
                          <Medal className={`h-5 w-5 ${achievement.isCompleted ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{achievement.name}</h3>
                            <span className="text-sm font-medium text-amber-500">+{achievement.spikeReward} Spikes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.isCompleted ? (
                            <span className="text-xs text-green-600">Completed</span>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Progress: {achievement.progress}/{achievement.requirementValue}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs h-5 px-2"
                                  disabled={achievement.progress < achievement.requirementValue || isClaimingAchievement}
                                  onClick={() => claimAchievement(achievement.id)}
                                >
                                  {isClaimingAchievement ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Claim'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Group & Club Achievements</CardTitle>
                    <CardDescription>Earn Spikes through social activities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groupAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start">
                        <div className={`p-2 rounded-md mr-3 ${achievement.isCompleted ? 'bg-amber-100' : 'bg-muted'}`}>
                          <MessageSquare className={`h-5 w-5 ${achievement.isCompleted ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">{achievement.name}</h3>
                            <span className="text-sm font-medium text-amber-500">+{achievement.spikeReward} Spikes</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          {achievement.isCompleted ? (
                            <span className="text-xs text-green-600">Completed</span>
                          ) : (
                            <div className="mt-1">
                              <Progress value={(achievement.progress / achievement.requirementValue) * 100} className="h-1" />
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Progress: {achievement.progress}/{achievement.requirementValue}
                                </span>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs h-5 px-2"
                                  disabled={achievement.progress < achievement.requirementValue || isClaimingAchievement}
                                  onClick={() => claimAchievement(achievement.id)}
                                >
                                  {isClaimingAchievement ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Claim'}
                                </Button>
                              </div>
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
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Achievements Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                There seems to be an issue loading your achievements. Please try refreshing the page.
              </p>
            </div>
          )}
        </TabsContent>

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
              {isLoadingTransactions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.createdAt ? 
                            new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'Date unknown'}
                        </p>
                      </div>
                      <div className={transaction.amount > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} Spikes
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="flex justify-center mb-4">
                    <Coins className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
                  <p className="text-muted-foreground">
                    Start earning Spikes through daily logins, completing workouts, and achievements!
                  </p>
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