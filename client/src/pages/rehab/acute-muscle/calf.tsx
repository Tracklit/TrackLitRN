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
  title: "Acute Calf Strain Recovery",
  duration: "3-8 weeks",
  phases: [
    {
      name: "Phase 1: Immediate Care & Protection",
      days: "Days 1-5",
      goals: ["Control pain and swelling", "Protect healing tissue", "Maintain ankle mobility", "Prevent muscle shortening"],
      exercises: [
        {
          name: "RICE Protocol",
          sets: "First 48-72 hours",
          duration: "Continuous",
          description: "Rest, Ice (15-20 min every 2-3 hrs), Compression from toes to knee, Elevation above heart"
        },
        {
          name: "Protected Walking",
          sets: "As needed",
          duration: "Throughout day",
          description: "Use crutches or walking boot if needed. Heel wedge can reduce strain on calf"
        },
        {
          name: "Gentle Ankle Pumps",
          sets: "Every 1-2 hours",
          duration: "20-30 reps",
          description: "Point and flex foot gently within pain-free range to maintain circulation"
        },
        {
          name: "Ankle Circles",
          sets: "4-5 times daily",
          duration: "10 circles each direction",
          description: "Small, controlled circles to maintain ankle mobility"
        },
        {
          name: "Isometric Calf Activation",
          sets: "3-4 times daily",
          duration: "10 x 3-5 second holds",
          description: "Seated with foot flat, gently press ball of foot into floor without lifting heel"
        },
        {
          name: "Elevation & Compression",
          sets: "Continuous when resting",
          duration: "Throughout day",
          description: "Keep leg elevated and compression on to minimize swelling"
        }
      ]
    },
    {
      name: "Phase 2: Early Mobility & Activation",
      days: "Days 6-14",
      goals: ["Restore walking without limp", "Begin calf activation", "Improve ankle range of motion", "Progress weight bearing"],
      exercises: [
        {
          name: "Heel Raises (Bilateral)",
          sets: "3 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Both feet on ground, rise onto toes slowly, lower with control. Use wall for balance"
        },
        {
          name: "Seated Calf Raises",
          sets: "2-3 times daily",
          duration: "3 sets x 15 reps",
          description: "Seated with feet flat, raise heels off ground. Target soleus muscle"
        },
        {
          name: "Standing Calf Stretch",
          sets: "After each exercise session",
          duration: "3 x 30 seconds each leg",
          description: "Wall stretch with straight knee (gastrocnemius) and bent knee (soleus)"
        },
        {
          name: "Towel/Belt Stretch",
          sets: "Morning and evening",
          duration: "3 x 30 seconds",
          description: "Sitting with leg straight, pull toes toward shin using towel around ball of foot"
        },
        {
          name: "Stationary Bike",
          sets: "1-2 times daily",
          duration: "10-15 minutes",
          description: "No resistance, seat high, pedal with ball of foot to maintain smooth motion"
        },
        {
          name: "Gentle Massage",
          sets: "Daily",
          duration: "10 minutes",
          description: "Light effleurage strokes from ankle toward knee, avoid deep pressure on injury site"
        }
      ]
    },
    {
      name: "Phase 3: Progressive Strengthening",
      days: "Weeks 3-4",
      goals: ["Build calf strength", "Eccentric loading", "Improve balance and proprioception", "Progress to single leg work"],
      exercises: [
        {
          name: "Single-Leg Heel Raises",
          sets: "Every other day",
          duration: "3 sets x 10-12 reps",
          description: "Progress from double to single leg. Hold wall for balance initially"
        },
        {
          name: "Eccentric Calf Lowering",
          sets: "3 times weekly",
          duration: "3 sets x 10 reps",
          description: "Rise on both feet, lower slowly on injured leg only (4-count descent)"
        },
        {
          name: "Step Drops",
          sets: "3 times weekly",
          duration: "3 sets x 10 reps each leg",
          description: "Stand on step edge, lower heel below step level with control, both straight and bent knee"
        },
        {
          name: "Balance Training",
          sets: "Daily",
          duration: "3 x 30-60 seconds each leg",
          description: "Single leg balance, progress to eyes closed and unstable surfaces"
        },
        {
          name: "Walking Program",
          sets: "Daily",
          duration: "20-30 minutes",
          description: "Brisk walking on flat surfaces, focus on normal gait pattern"
        },
        {
          name: "Deep Tissue Massage",
          sets: "3-4 times weekly",
          duration: "15-20 minutes",
          description: "Progressive pressure on calf complex, focus on trigger points and adhesions"
        }
      ]
    },
    {
      name: "Phase 4: Return to Running & Sport",
      days: "Weeks 5-8",
      goals: ["Return to running", "Sport-specific conditioning", "Power development", "Injury prevention"],
      exercises: [
        {
          name: "Plyometric Progression",
          sets: "2-3 times weekly",
          duration: "3 sets x 8-12 reps",
          description: "Pogos, ankle hops, bounding - progress from double to single leg"
        },
        {
          name: "Running Progression",
          sets: "Every other day",
          duration: "Progressive duration",
          description: "Week 5: Jog/walk intervals. Week 6: Easy continuous running. Week 7-8: Tempo and speed work"
        },
        {
          name: "Hill Work",
          sets: "2 times weekly",
          duration: "15-20 minutes",
          description: "Hill walking progressing to hill running. Excellent calf strengthening"
        },
        {
          name: "Jumping Rope",
          sets: "3 times weekly",
          duration: "3-5 minutes",
          description: "Light jumping to build calf endurance and reactive strength"
        },
        {
          name: "Sport-Specific Drills",
          sets: "Progressive integration",
          duration: "Variable",
          description: "Gradually reintroduce cutting, pivoting, and sport movements at 50-100% intensity"
        },
        {
          name: "Maintenance Program",
          sets: "Ongoing",
          duration: "3 times weekly",
          description: "Continue calf raises, stretching, and eccentric work to prevent re-injury"
        }
      ]
    }
  ]
};

export default function CalfRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "acute-calf",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your calf recovery program has been assigned and will guide your training until completion.",
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
          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
            Acute Injury
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
                    This comprehensive program will guide your calf recovery and return to full activity.
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
                  Calf strains commonly occur in the gastrocnemius (upper calf) or soleus (lower calf) muscles. 
                  If you heard a "pop" during injury, experience severe pain, or notice significant bruising extending to the ankle, 
                  seek medical evaluation to rule out a complete tear or Achilles involvement. Progress phases only when pain-free.
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
              Track your progression through each phase of recovery
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
                Calf injuries are prone to re-injury if returned to activity too soon. Be patient and complete each phase fully.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
