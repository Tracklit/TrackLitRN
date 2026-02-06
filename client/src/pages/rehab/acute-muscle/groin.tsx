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
  title: "Acute Groin (Adductor) Strain Recovery",
  duration: "4-10 weeks",
  phases: [
    {
      name: "Phase 1: Protection & Pain Management",
      days: "Days 1-7",
      goals: ["Control pain and inflammation", "Protect injured adductors", "Maintain hip mobility", "Prevent muscle atrophy"],
      exercises: [
        {
          name: "RICE Protocol",
          sets: "First 48-72 hours",
          duration: "Continuous",
          description: "Rest, Ice (15-20 min every 2-3 hrs to inner thigh), Compression shorts recommended, Elevation when possible"
        },
        {
          name: "Protected Mobility",
          sets: "Throughout day",
          duration: "As needed",
          description: "Avoid wide stance, side stepping, or activities that stress inner thigh. Use crutches if limping"
        },
        {
          name: "Gentle Hip Flexor Stretching",
          sets: "3-4 times daily",
          duration: "3 x 20-30 seconds",
          description: "Kneeling hip flexor stretch - avoid adductor stretch initially"
        },
        {
          name: "Isometric Adductor Squeeze",
          sets: "4-5 times daily",
          duration: "10 x 5-second holds at 25% effort",
          description: "Lying on back, place pillow/ball between knees, gently squeeze without pain"
        },
        {
          name: "Glute Activation",
          sets: "3-4 times daily",
          duration: "3 sets x 10 reps",
          description: "Glute bridges without leg separation, focus on glute engagement over adductors"
        },
        {
          name: "Pain-Free Hip ROM",
          sets: "3 times daily",
          duration: "10 reps each direction",
          description: "Lying supine, gentle hip circles staying within comfortable range"
        }
      ]
    },
    {
      name: "Phase 2: Early Strengthening & Mobility",
      days: "Week 2",
      goals: ["Progress adductor activation", "Restore hip range of motion", "Begin weight-bearing exercises", "Reduce protection"],
      exercises: [
        {
          name: "Progressive Adductor Squeeze",
          sets: "3-4 times daily",
          duration: "3 sets x 10 holds at 50% effort",
          description: "Increase squeeze intensity gradually, 8-10 second holds"
        },
        {
          name: "Side-Lying Hip Adduction",
          sets: "2-3 times daily",
          duration: "3 sets x 12-15 reps",
          description: "Lying on injured side, lift bottom leg toward ceiling against gravity"
        },
        {
          name: "Standing Adductor Stretch",
          sets: "After exercise sessions",
          duration: "3 x 30 seconds each side",
          description: "Wide stance, shift weight to one side, feel gentle stretch on opposite inner thigh"
        },
        {
          name: "Stationary Bike",
          sets: "Daily",
          duration: "15-20 minutes",
          description: "Seat adjusted to limit hip abduction, no resistance, comfortable pedaling"
        },
        {
          name: "Bodyweight Squats",
          sets: "Every other day",
          duration: "3 sets x 10-12 reps",
          description: "Narrow to shoulder-width stance, controlled depth, avoid wide sumo stance"
        },
        {
          name: "Soft Tissue Work",
          sets: "Daily",
          duration: "10-15 minutes",
          description: "Foam rolling outer thighs and glutes, gentle massage around (not directly on) injury site"
        }
      ]
    },
    {
      name: "Phase 3: Progressive Loading & Functional Movement",
      days: "Weeks 3-5",
      goals: ["Build adductor strength", "Multi-directional movement", "Sport-specific preparation", "Balance and proprioception"],
      exercises: [
        {
          name: "Copenhagen Adductor Exercise (Modified)",
          sets: "3 times weekly",
          duration: "3 sets x 6-10 reps each side",
          description: "Side plank with top leg on bench, bottom leg lifts. Start with bent knee version"
        },
        {
          name: "Lateral Lunges",
          sets: "3 times weekly",
          duration: "3 sets x 8-10 each side",
          description: "Controlled side lunge, push through heel to return. Progress depth gradually"
        },
        {
          name: "Sumo/Wide Squat",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Wider stance squat targeting adductors, add weight as tolerated"
        },
        {
          name: "Cable/Band Adduction",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps each leg",
          description: "Standing hip adduction with cable or resistance band"
        },
        {
          name: "Single-Leg Balance",
          sets: "Daily",
          duration: "3 x 30-60 seconds each leg",
          description: "Progress to unstable surfaces and add perturbations"
        },
        {
          name: "Light Jogging",
          sets: "Every other day",
          duration: "15-20 minutes",
          description: "Straight-line jogging only, no cutting or direction changes yet"
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport",
      days: "Weeks 6-10",
      goals: ["Full sport participation", "Multi-directional agility", "Power and speed development", "Long-term prevention"],
      exercises: [
        {
          name: "Advanced Copenhagen",
          sets: "3 times weekly",
          duration: "3-4 sets x 8-12 reps",
          description: "Full Copenhagen plank with straight leg, add holds and pulses"
        },
        {
          name: "Cutting & Direction Changes",
          sets: "3 times weekly",
          duration: "Progressive intensity",
          description: "Week 6-7: 50-70% effort. Week 8+: Sport-speed cutting and pivoting"
        },
        {
          name: "Sprint Progression",
          sets: "Every other day",
          duration: "Progressive intensity",
          description: "Start at 70% and progress to full speed. Include accelerations and decelerations"
        },
        {
          name: "Sport-Specific Drills",
          sets: "4-5 times weekly",
          duration: "30-45 minutes",
          description: "Gradually reintroduce all sport movements - kicking, jumping, pivoting"
        },
        {
          name: "Plyometric Training",
          sets: "2-3 times weekly",
          duration: "3 sets x 8-10 reps",
          description: "Lateral bounds, skater jumps, multi-directional hops"
        },
        {
          name: "Maintenance Program",
          sets: "Ongoing 2-3 times weekly",
          duration: "15-20 minutes",
          description: "Copenhagen exercises, adductor stretching, and strength work to prevent recurrence"
        }
      ]
    }
  ]
};

export default function GroinRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "acute-groin",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your groin/adductor recovery program has been assigned and will guide your training until completion.",
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
                    This comprehensive program will guide your groin/adductor recovery and return to full activity.
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
                  Groin strains involve the adductor muscles and have high recurrence rates (up to 30%). If you experience pain near the 
                  pubic bone, have difficulty bearing weight, or notice significant swelling/bruising, seek medical evaluation to rule out 
                  avulsion fractures or sports hernia. The Copenhagen adductor protocol has strong evidence for both treatment and prevention.
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
                Groin injuries have high recurrence rates. Continuing the Copenhagen protocol even after return to sport significantly reduces re-injury risk.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
