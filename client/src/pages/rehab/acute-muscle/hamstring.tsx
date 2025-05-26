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
  title: "Acute Hamstring Strain Recovery",
  duration: "3-6 weeks",
  phases: [
    {
      name: "Phase 1: Pain Reduction & Protection",
      days: "Days 1-5",
      goals: ["Reduce pain and inflammation", "Protect healing tissue", "Maintain mobility"],
      exercises: [
        {
          name: "Gentle Hamstring Stretch",
          sets: "2-3",
          duration: "15-30 seconds",
          description: "Lie on back, lift straight leg to comfortable stretch"
        },
        {
          name: "Ice Application",
          sets: "3-4 times daily",
          duration: "15-20 minutes",
          description: "Apply ice pack to reduce inflammation"
        },
        {
          name: "Walking",
          sets: "As tolerated",
          duration: "5-10 minutes",
          description: "Pain-free walking to maintain mobility"
        }
      ]
    },
    {
      name: "Phase 2: Early Strengthening",
      days: "Days 6-14",
      goals: ["Begin gentle strengthening", "Improve flexibility", "Progressive loading"],
      exercises: [
        {
          name: "Prone Hamstring Curls",
          sets: "2-3 sets",
          duration: "8-12 reps",
          description: "Lie face down, bend knee against gravity or light resistance"
        },
        {
          name: "Glute Bridges",
          sets: "2-3 sets",
          duration: "10-15 reps",
          description: "Strengthen glutes and posterior chain"
        },
        {
          name: "Seated Hamstring Stretch",
          sets: "3 sets",
          duration: "30-45 seconds",
          description: "Progressive stretching to improve flexibility"
        },
        {
          name: "Stationary Bike",
          sets: "1 session",
          duration: "10-15 minutes",
          description: "Low resistance, comfortable pace"
        }
      ]
    },
    {
      name: "Phase 3: Progressive Strengthening",
      days: "Days 15-21",
      goals: ["Increase strength", "Introduce eccentric exercises", "Prepare for running"],
      exercises: [
        {
          name: "Nordic Hamstring Curls",
          sets: "2-3 sets",
          duration: "3-6 reps",
          description: "Eccentric strengthening with partner or TRX assistance"
        },
        {
          name: "Single Leg Romanian Deadlifts",
          sets: "2-3 sets",
          duration: "8-10 reps each leg",
          description: "Progress from bodyweight to light weights"
        },
        {
          name: "Walking Lunges",
          sets: "2-3 sets",
          duration: "10-12 each leg",
          description: "Dynamic strengthening and stability"
        },
        {
          name: "Light Jogging",
          sets: "1 session",
          duration: "5-10 minutes",
          description: "50% pace, stop if pain occurs"
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport",
      days: "Days 22+",
      goals: ["Sport-specific training", "High-intensity exercises", "Injury prevention"],
      exercises: [
        {
          name: "Sprint Progressions",
          sets: "Build gradually",
          duration: "50-70-85-95%",
          description: "Progressive speed increases over multiple sessions"
        },
        {
          name: "Plyometric Exercises",
          sets: "2-3 sets",
          duration: "6-8 reps",
          description: "Jump squats, bounding, reactive movements"
        },
        {
          name: "Agility Drills",
          sets: "Multiple sets",
          duration: "Sport-specific",
          description: "Cutting, direction changes, sport movements"
        },
        {
          name: "Strength Maintenance",
          sets: "2-3 times/week",
          duration: "Ongoing",
          description: "Continue eccentric and strength exercises"
        }
      ]
    }
  ]
};

export default function HamstringRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "acute-hamstring",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your hamstring recovery program has been assigned and will override your current training until completion.",
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
    <div className="min-h-screen" style={{ backgroundColor: '#010a18' }}>
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
          <Badge variant="secondary" className="bg-red-500/20 text-red-300">
            Acute Muscle Injury
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
              <span>Daily Guided Exercises</span>
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
                    This will replace your current training program with this rehabilitation protocol until recovery is complete.
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
                <h3 className="font-semibold text-yellow-300 mb-2">Important Medical Disclaimer</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  This program is for educational purposes and should complement, not replace, professional medical care. 
                  Stop exercises if pain increases. Consult your healthcare provider before starting this program, 
                  especially for Grade 2-3 strains or if symptoms persist beyond expected timeframes.
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
                  ? 'border-blue-500/50 bg-blue-900/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === currentPhase 
                          ? 'bg-blue-500 text-white' 
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
                    <h4 className="font-semibold text-white mb-4">Daily Exercises:</h4>
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
              Track your progress through each phase of recovery
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
                This is a visual representation. Your actual recovery may vary based on individual factors.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}