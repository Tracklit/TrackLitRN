import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const rehabProgram = {
  title: "Chronic Achilles Tendinopathy & Calf Pain Recovery",
  duration: "12-24 weeks",
  phases: [
    {
      name: "Phase 1: Load Management & Pain Control",
      days: "Weeks 1-4",
      goals: ["Reduce pain and morning stiffness", "Identify load tolerance", "Begin isometric loading", "Modify aggravating activities"],
      exercises: [
        {
          name: "Activity Modification",
          sets: "Ongoing",
          duration: "Throughout phase",
          description: "Reduce running volume by 50-70%, avoid hill running, limit walking on uneven terrain, use heel lifts if helpful"
        },
        {
          name: "Isometric Calf Raises",
          sets: "Daily",
          duration: "5 sets x 45-second holds",
          description: "Single leg standing on edge of step, hold at mid-range position. Provides pain relief and begins tendon loading"
        },
        {
          name: "Seated Soleus Raises",
          sets: "2 times daily",
          duration: "4 sets x 15 reps",
          description: "Seated with weight on knees, raise heels. Targets soleus, lower Achilles insertion"
        },
        {
          name: "Gastrocnemius Stretch",
          sets: "After each exercise session",
          duration: "3 x 45 seconds each leg",
          description: "Wall stretch with straight knee, maintain gentle sustained stretch"
        },
        {
          name: "Soleus Stretch",
          sets: "After each exercise session",
          duration: "3 x 45 seconds each leg",
          description: "Wall stretch with bent knee to target lower calf and Achilles"
        },
        {
          name: "Stationary Bike",
          sets: "Daily",
          duration: "20-30 minutes",
          description: "Maintain cardiovascular fitness without Achilles loading, pedal with mid-foot"
        }
      ]
    },
    {
      name: "Phase 2: Progressive Eccentric Loading",
      days: "Weeks 5-10",
      goals: ["Alfredson eccentric protocol", "Improve tendon capacity", "Progress calf strength", "Begin light running"],
      exercises: [
        {
          name: "Eccentric Heel Drops (Straight Knee)",
          sets: "2 times daily",
          duration: "3 sets x 15 reps each leg",
          description: "Rise on both feet, lower on affected leg only with straight knee (6-second descent). KEY EXERCISE"
        },
        {
          name: "Eccentric Heel Drops (Bent Knee)",
          sets: "2 times daily",
          duration: "3 sets x 15 reps each leg",
          description: "Same protocol with bent knee to target soleus portion. Use both straight and bent knee versions"
        },
        {
          name: "Heavy Slow Resistance Training",
          sets: "3 times weekly",
          duration: "4 sets x 6-8 reps",
          description: "Alternative to pure eccentric: seated calf raises with 3-sec up, 4-sec down at 70-85% 1RM"
        },
        {
          name: "Single-Leg Calf Raises",
          sets: "Every other day",
          duration: "3 sets x 10-12 reps",
          description: "Full range single-leg raises on flat ground, progress to step edge"
        },
        {
          name: "Walking Program",
          sets: "Daily",
          duration: "30-45 minutes",
          description: "Comfortable pace on flat terrain, monitor symptoms"
        },
        {
          name: "Light Jogging Introduction",
          sets: "Week 8-10, every other day",
          duration: "10-15 minutes",
          description: "Flat surfaces only, stop if pain increases above 3/10"
        }
      ]
    },
    {
      name: "Phase 3: Strength and Running Progression",
      days: "Weeks 11-18",
      goals: ["Build calf strength and endurance", "Progressive running", "Single-leg plyometric preparation", "Address biomechanics"],
      exercises: [
        {
          name: "Weighted Calf Raises",
          sets: "3 times weekly",
          duration: "4 sets x 8-12 reps",
          description: "Progressive loading with dumbbells or machine, both straight and bent knee variations"
        },
        {
          name: "Single-Leg Hop Progressions",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-15 reps",
          description: "Week 11-12: Double leg. Week 13+: Single leg pogo hops, progress height and intensity"
        },
        {
          name: "Running Progression",
          sets: "3-4 times weekly",
          duration: "Progressive",
          description: "Week 11-14: Build to 30 min easy running. Week 15-18: Add tempo runs and hills gradually"
        },
        {
          name: "Box/Step Jumps",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 reps",
          description: "Jump onto box, step down. Focus on soft landing and push-off mechanics"
        },
        {
          name: "Running Gait Drills",
          sets: "2 times weekly",
          duration: "15-20 minutes",
          description: "A-skips, high knees, butt kicks - improve running mechanics and calf loading patterns"
        },
        {
          name: "Balance and Proprioception",
          sets: "3 times weekly",
          duration: "10-15 minutes",
          description: "Single-leg balance on various surfaces, dynamic balance challenges"
        }
      ]
    },
    {
      name: "Phase 4: Return to Full Activity & Maintenance",
      days: "Weeks 19-24+",
      goals: ["Full sport participation", "High-intensity running and plyometrics", "Long-term tendon maintenance", "Injury prevention"],
      exercises: [
        {
          name: "Full Training Integration",
          sets: "Progressive",
          duration: "Week by week",
          description: "Week 19-20: 75% training volume. Week 21-22: 90%. Week 23+: Full return"
        },
        {
          name: "Sprint and Speed Work",
          sets: "2-3 times weekly",
          duration: "Progressive intensity",
          description: "Gradual return to sprinting and high-intensity running, monitor for symptoms"
        },
        {
          name: "Plyometric Training",
          sets: "2 times weekly",
          duration: "20-30 minutes",
          description: "Bounding, depth jumps, reactive hops - full plyometric program"
        },
        {
          name: "Maintenance Calf Strengthening",
          sets: "2 times weekly, ongoing",
          duration: "15-20 minutes",
          description: "Continue heavy calf raises, eccentric work - reduces recurrence by maintaining tendon capacity"
        },
        {
          name: "Pre-Activity Warm-Up",
          sets: "Before all training",
          duration: "10 minutes",
          description: "Light jogging, dynamic calf stretches, activation exercises"
        },
        {
          name: "Load Monitoring",
          sets: "Ongoing",
          duration: "Weekly review",
          description: "Track weekly running volume, avoid sudden increases >10%, monitor morning stiffness"
        }
      ]
    }
  ]
};

export default function ChronicCalfRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "chronic-calf",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your chronic calf/Achilles recovery program has been assigned.",
      });
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Unable to assign the program. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAssignProgram = () => {
    assignProgramMutation.mutate();
  };

  return (
    <div className="min-h-screen pt-20" style={{ backgroundColor: '#010a18' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/rehab")}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rehab
          </Button>
          <div className="h-6 w-px bg-gray-600" />
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            Chronic Injury
          </Badge>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">{rehabProgram.title}</h1>
          <div className="flex flex-wrap gap-4 text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Duration: {rehabProgram.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>4 Progressive Phases</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Evidence-Based Protocol</span>
            </div>
          </div>
        </div>

        {/* Assign Program Button */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Assign This Program</h3>
                  <p className="text-gray-300 text-sm">
                    This program uses the Alfredson protocol and Heavy Slow Resistance training for Achilles tendinopathy.
                  </p>
                </div>
                <Button 
                  onClick={handleAssignProgram}
                  disabled={assignProgramMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {assignProgramMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Assign Program
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning */}
        <Card className="mb-8 bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-300 mb-2">Important Considerations</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  Achilles tendinopathy (insertional or mid-portion) typically requires 3-6 months for full recovery. Complete rest 
                  is counterproductive - progressive loading is essential for tendon healing. If you experience sudden sharp pain, 
                  a "pop" sensation, or inability to rise on toes, seek immediate medical evaluation to rule out rupture. Some discomfort 
                  during exercise (up to 4/10) is acceptable as long as symptoms settle within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program Phases */}
        <div className="space-y-6">
          {rehabProgram.phases.map((phase, index) => (
            <Card 
              key={index} 
              className={`bg-gray-800/30 border-2 transition-all duration-200 ${
                index === currentPhase 
                  ? 'border-primary/50 bg-primary/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === currentPhase 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      {phase.name}
                    </CardTitle>
                    <CardDescription className="text-gray-300 ml-11">
                      {phase.days}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPhase(index === currentPhase ? -1 : index)}
                    className="text-gray-400 hover:text-white"
                  >
                    {index === currentPhase ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {index === currentPhase && (
                <CardContent>
                  {/* Goals */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-3">Phase Goals:</h4>
                    <div className="grid gap-2">
                      {phase.goals.map((goal, goalIndex) => (
                        <div key={goalIndex} className="flex items-center gap-2 text-gray-300">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exercises */}
                  <div>
                    <h4 className="font-semibold text-white mb-4">Recommended Exercises:</h4>
                    <div className="grid gap-4">
                      {phase.exercises.map((exercise, exerciseIndex) => (
                        <div 
                          key={exerciseIndex}
                          className="bg-gray-700/30 rounded-lg p-4 border border-gray-600"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-white">{exercise.name}</h5>
                            <Badge variant="outline" className="text-xs">
                              {exercise.sets} • {exercise.duration}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm">{exercise.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Progress Tracking */}
        <Card className="mt-8 bg-gray-800/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recovery Progress</CardTitle>
            <CardDescription className="text-gray-300">
              Achilles tendinopathy requires patience - 12-24 weeks is typical for full recovery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Phase {currentPhase + 1} of {rehabProgram.phases.length}</span>
                <span>{Math.round(((currentPhase + 1) / rehabProgram.phases.length) * 100)}% Complete</span>
              </div>
              <Progress 
                value={((currentPhase + 1) / rehabProgram.phases.length) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-400">
                Morning stiffness that improves with movement is a key indicator. Track your morning symptoms - improvement here often precedes activity tolerance improvement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
