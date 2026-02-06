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
  title: "Knee Fracture Recovery",
  duration: "12-24 weeks",
  phases: [
    {
      name: "Phase 1: Immobilization & Protection",
      days: "Weeks 1-6 (or until cleared by surgeon)",
      goals: ["Protect healing bone", "Manage pain and swelling", "Maintain upper body fitness", "Prevent muscle atrophy where safe"],
      exercises: [
        {
          name: "Weight-Bearing Status Compliance",
          sets: "Continuous",
          duration: "Per surgeon orders",
          description: "Follow prescribed weight-bearing restrictions exactly. Use crutches, walker, or wheelchair as directed. Premature loading risks nonunion."
        },
        {
          name: "Ankle Pumps",
          sets: "Every 2 hours while awake",
          duration: "20-30 reps",
          description: "Flex and extend ankle to promote circulation and prevent blood clots (DVT). Critical during immobilization."
        },
        {
          name: "Quad Sets (if allowed)",
          sets: "5-6 times daily",
          duration: "10 x 5-second holds",
          description: "Gently tighten quadriceps without moving the knee. Check with surgeon first. Maintains neural connection."
        },
        {
          name: "Straight Leg Raises (if allowed)",
          sets: "3-4 times daily",
          duration: "2-3 sets x 10 reps",
          description: "With brace locked or immobilizer in place. Tighten quad, lift leg 6 inches, hold 3 seconds. Only if surgeon permits."
        },
        {
          name: "Hip Abduction/Adduction",
          sets: "2-3 times daily",
          duration: "2 sets x 10 each direction",
          description: "Lying flat, slide leg out to side and back. Keep knee immobilized. Maintains hip strength."
        },
        {
          name: "Upper Body Training",
          sets: "3-4 times weekly",
          duration: "30-45 minutes",
          description: "Maintain fitness with seated exercises: arm bike, seated press, rows, core work. Stay active without stressing knee."
        }
      ]
    },
    {
      name: "Phase 2: Early Motion & Weight-Bearing Progression",
      days: "Weeks 6-12",
      goals: ["Restore knee range of motion", "Progress weight-bearing as allowed", "Begin closed-chain strengthening", "Reduce swelling"],
      exercises: [
        {
          name: "Passive/Active-Assisted ROM",
          sets: "4-5 times daily",
          duration: "10-15 minutes",
          description: "Use strap or hands to assist knee bending. Goal: 90° flexion by week 8, full flexion by week 12. Progress gradually."
        },
        {
          name: "Heel Slides",
          sets: "4-5 times daily",
          duration: "3 sets x 15-20 reps",
          description: "Lying on back, slide heel toward buttocks, bending knee. Can use strap for assistance. Key ROM exercise."
        },
        {
          name: "Stationary Bike (High Seat)",
          sets: "1-2 times daily",
          duration: "10-15 minutes",
          description: "Seat high to limit flexion initially. Focus on achieving full revolutions. Progress by lowering seat."
        },
        {
          name: "Weight-Bearing Progression",
          sets: "Per surgeon protocol",
          duration: "Progressive",
          description: "Progress from TTWB → PWB → WBAT → FWB as cleared. Use scale to measure allowed weight on injured leg."
        },
        {
          name: "Mini Squats (Partial Weight-Bearing)",
          sets: "2-3 times daily",
          duration: "2-3 sets x 10-15 reps",
          description: "Hold onto support, squat to 30-45° only. Control descent, don't bounce. Progress depth as healing allows."
        },
        {
          name: "Standing Calf Raises",
          sets: "2 times daily",
          duration: "3 sets x 15-20 reps",
          description: "Using support for balance. Helps with circulation, ankle strength, and gait pattern."
        }
      ]
    },
    {
      name: "Phase 3: Progressive Strengthening",
      days: "Weeks 12-18",
      goals: ["Build quadriceps and hamstring strength", "Achieve full weight-bearing", "Normalize gait pattern", "Full range of motion"],
      exercises: [
        {
          name: "Leg Press",
          sets: "3 times weekly",
          duration: "3-4 sets x 10-15 reps",
          description: "Start with light weight, limited ROM. Progress weight and depth gradually. Bilateral initially, then single-leg."
        },
        {
          name: "Step-Ups",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 each leg",
          description: "Start with low step (4-6 inches), progress height. Focus on control, drive through heel."
        },
        {
          name: "Romanian Deadlift",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Hip hinge pattern builds hamstring and glute strength. Start bodyweight, add load gradually."
        },
        {
          name: "Hamstring Curls",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "Machine or band resistance. Balance quad-to-hamstring strength ratio. Control both concentric and eccentric."
        },
        {
          name: "Balance Training",
          sets: "Daily",
          duration: "3-5 minutes",
          description: "Single-leg stance, progress to unstable surfaces. Eyes open → eyes closed. Restores proprioception."
        },
        {
          name: "Gait Training",
          sets: "Focus during all walking",
          duration: "Continuous",
          description: "Work with PT on normalizing gait. Full heel-to-toe pattern, equal stride length, no limp. May need mirror feedback."
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport/Activity",
      days: "Weeks 18-24+",
      goals: ["Sport-specific conditioning", "Achieve limb symmetry", "Plyometric tolerance", "Full return to activities"],
      exercises: [
        {
          name: "Full Squats & Lunges",
          sets: "3-4 times weekly",
          duration: "4 sets x 8-12 reps",
          description: "Full depth, progressive loading. Split squats, walking lunges, Bulgarian split squats."
        },
        {
          name: "Single-Leg Press & Squats",
          sets: "2-3 times weekly",
          duration: "3 sets x 8-10 each leg",
          description: "Test limb symmetry. Injured leg should be within 10-15% of uninjured leg strength."
        },
        {
          name: "Plyometric Progression",
          sets: "2 times weekly",
          duration: "Start low volume",
          description: "Box jumps (low height), squat jumps, lateral hops. Progress height and complexity. Landing mechanics crucial."
        },
        {
          name: "Running Progression",
          sets: "3-4 times weekly",
          duration: "Progressive program",
          description: "Walk → walk/jog intervals → continuous jog → tempo runs → sprints. 10-15% weekly volume increase."
        },
        {
          name: "Sport-Specific Drills",
          sets: "3-4 times weekly",
          duration: "20-30 minutes",
          description: "Cutting, pivoting, change of direction. Start at 50% speed, progress to full speed over 4-6 weeks."
        },
        {
          name: "Return-to-Sport Testing",
          sets: "Before clearance",
          duration: "Comprehensive assessment",
          description: "Single-leg hop tests, strength testing, functional movement screen. Must pass criteria before full sport return."
        }
      ]
    }
  ]
};

export default function KneeFractureRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "bone-knee",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your knee fracture recovery program has been assigned and will guide your training until completion.",
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
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            Bone Fracture
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
              <span>Surgeon-Guided Protocol</span>
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
                    This comprehensive program will guide your knee fracture recovery and return to full activity.
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
                <h3 className="font-semibold text-red-300 mb-2">Critical Fracture Guidelines</h3>
                <ul className="text-red-200 text-sm leading-relaxed list-disc ml-4 space-y-1">
                  <li><strong>Follow weight-bearing restrictions exactly</strong> - premature loading can cause nonunion or hardware failure</li>
                  <li>Attend all follow-up X-rays to confirm bone healing</li>
                  <li>Report increased pain, swelling, numbness, or new symptoms immediately</li>
                  <li>Do not progress phases without surgeon clearance</li>
                </ul>
                <p className="text-yellow-200 text-sm mt-3">
                  Timeline varies based on fracture type, location, surgical fixation, and individual healing. 
                  Patella fractures, tibial plateau fractures, and distal femur fractures have different protocols.
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
                Phase progression requires surgeon clearance based on X-ray evidence of bone healing. Do not self-progress.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
