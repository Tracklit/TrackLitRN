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
  title: "Disc Injury Recovery (Herniation/Bulge)",
  duration: "12-24 weeks",
  phases: [
    {
      name: "Phase 1: Pain Management & Centralization",
      days: "Weeks 1-3",
      goals: ["Reduce acute pain and inflammation", "Centralize symptoms (move pain from leg to back)", "Find directional preference", "Protect disc during healing"],
      exercises: [
        {
          name: "Directional Preference Assessment",
          sets: "With PT guidance",
          duration: "Initial evaluation",
          description: "Determine if extension or flexion reduces symptoms. Most disc herniations respond to extension (McKenzie approach)."
        },
        {
          name: "Prone Lying",
          sets: "Multiple times daily",
          duration: "10-20 minutes",
          description: "Lie face down, flat on floor. Allows disc to migrate anteriorly. Foundation of McKenzie protocol."
        },
        {
          name: "Prone on Elbows",
          sets: "Every 2 hours",
          duration: "5-10 minutes",
          description: "Face down, prop on elbows. Gentle extension. Progress to this after prone lying is comfortable."
        },
        {
          name: "Press-Ups (McKenzie Extension)",
          sets: "Every 2 hours",
          duration: "10 repetitions",
          description: "From prone, press upper body up keeping hips on floor. Only if this centralizes symptoms. Key exercise for disc recovery."
        },
        {
          name: "Walking",
          sets: "Every 2-3 hours",
          duration: "5-10 minutes",
          description: "Short walks to prevent stiffness and maintain circulation. Keep spine neutral, avoid prolonged sitting."
        },
        {
          name: "Nerve Flossing (Sciatic)",
          sets: "2-3 times daily",
          duration: "10-15 gentle reps",
          description: "Seated, extend knee while looking up, flex knee while looking down. Mobilizes nerve without stretching. Only if tolerated."
        }
      ]
    },
    {
      name: "Phase 2: Stabilization & Motor Control",
      days: "Weeks 4-8",
      goals: ["Build core stability", "Restore neutral spine control", "Reduce nerve sensitivity", "Improve posture and body mechanics"],
      exercises: [
        {
          name: "Abdominal Bracing",
          sets: "Throughout day",
          duration: "10-second holds, 20 reps",
          description: "Gently brace core as if preparing for impact. 20-30% effort. Foundation of all movement."
        },
        {
          name: "Dead Bug Progression",
          sets: "2 times daily",
          duration: "3 sets x 8 each side",
          description: "Lying supine, maintain neutral spine while moving limbs. Progress from arm-only to arm+leg. Core stability essential."
        },
        {
          name: "Bird Dog",
          sets: "2 times daily",
          duration: "3 sets x 10 each side",
          description: "On all fours, extend opposite arm/leg. Hold 5-10 seconds. No spine movement. Key stabilization exercise."
        },
        {
          name: "Side Plank (Modified)",
          sets: "Daily",
          duration: "3 sets x 10-second holds each side",
          description: "From knees initially, progress to feet. Maintain straight line from head to knees/feet. Lateral stability."
        },
        {
          name: "McGill Curl-Up",
          sets: "Daily",
          duration: "3 sets x 10 reps",
          description: "Hands under low back, one knee bent. Lift head and shoulders 1-2 inches. No spine flexion, pure ab activation."
        },
        {
          name: "Hip Hinge Practice",
          sets: "Daily",
          duration: "3 sets x 15 reps",
          description: "Stand facing wall, push hips back until butt touches wall. Spine stays neutral. Learn to bend from hips, not back."
        }
      ]
    },
    {
      name: "Phase 3: Progressive Loading",
      days: "Weeks 9-16",
      goals: ["Build posterior chain strength", "Increase spinal load tolerance", "Improve functional capacity", "Return to daily activities without limitations"],
      exercises: [
        {
          name: "Glute Bridge Progressions",
          sets: "3 times weekly",
          duration: "4 sets x 12-15 reps",
          description: "Progress: bilateral → marching → single-leg. Build glute strength to support spine."
        },
        {
          name: "Romanian Deadlift",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Start with light weight, perfect hip hinge. Keep bar close to body, spine neutral. Key posterior chain builder."
        },
        {
          name: "Goblet Squat",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Hold weight at chest, squat with neutral spine. Counterweight helps maintain posture."
        },
        {
          name: "Pallof Press",
          sets: "3 times weekly",
          duration: "3 sets x 10 each side",
          description: "Anti-rotation core exercise. Resist rotation while pressing cable/band away from body."
        },
        {
          name: "Farmer's Carry",
          sets: "2-3 times weekly",
          duration: "3-4 sets x 40 meters",
          description: "Walk with heavy weights at sides. Maintain tall posture. Builds spine stability under load."
        },
        {
          name: "Step-Ups",
          sets: "2 times weekly",
          duration: "3 sets x 10 each leg",
          description: "Use appropriate height box. Drive through heel, maintain spine position throughout."
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport/Activity",
      days: "Weeks 17-24",
      goals: ["Full return to sport/work", "Develop resilience to varied loads", "Maintain spinal health habits", "Prevent recurrence"],
      exercises: [
        {
          name: "Trap Bar Deadlift",
          sets: "2 times weekly",
          duration: "4 sets x 6-8 reps",
          description: "Progress load gradually. Trap bar is spine-friendly alternative to conventional deadlift."
        },
        {
          name: "Split Squat/Lunge Progressions",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 each leg",
          description: "Progress: static split squat → reverse lunge → walking lunge → Bulgarian. Unilateral strength."
        },
        {
          name: "Rotational Power Development",
          sets: "2 times weekly",
          duration: "3 sets x 8 each side",
          description: "Medicine ball throws, cable chops. Controlled rotation with core stability. Sport-specific."
        },
        {
          name: "Running/Sport-Specific Return",
          sets: "Progressive",
          duration: "Per sport demands",
          description: "Gradual return to running: walk-jog intervals → continuous jog → tempo runs → sprints. 10-15% weekly volume increase."
        },
        {
          name: "Plyometric Progression",
          sets: "1-2 times weekly",
          duration: "Low volume, 3 sets x 5 reps",
          description: "Box jumps, broad jumps. Start low, progress height/distance. Only when pain-free under load."
        },
        {
          name: "Daily Spine Hygiene Routine",
          sets: "Daily, non-negotiable",
          duration: "15-20 minutes",
          description: "McGill Big 3, hip mobility, nerve flossing if needed, walking. Lifetime maintenance for disc health."
        }
      ]
    }
  ]
};

export default function BackDiscRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "back-disc",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your disc injury recovery program has been assigned and will guide your training until completion.",
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
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
            Back Injury
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
              <span>McKenzie Method Based</span>
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
                    This comprehensive program follows the McKenzie method and will guide your disc injury recovery.
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
        <Card className="mb-8 bg-red-900/20 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-300 mb-2">Critical Warning - Seek Immediate Medical Care If:</h3>
                <ul className="text-red-200 text-sm leading-relaxed list-disc ml-4 space-y-1">
                  <li>Loss of bladder or bowel control (Cauda Equina Syndrome - medical emergency)</li>
                  <li>Progressive weakness in legs or feet</li>
                  <li>Numbness in the "saddle" area (inner thighs, groin)</li>
                  <li>Severe or worsening neurological symptoms</li>
                </ul>
                <p className="text-yellow-200 text-sm mt-3">
                  If exercises increase leg pain (peripheralize symptoms), stop and reassess with a healthcare provider. 
                  The goal is to centralize pain (move it from leg toward the spine).
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
                Progress to the next phase only when symptoms have centralized and you can complete all exercises pain-free.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
