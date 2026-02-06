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
  title: "Ankle Fracture Recovery",
  duration: "12-20 weeks",
  phases: [
    {
      name: "Phase 1: Immobilization & Protection",
      days: "Weeks 1-6 (cast/boot period)",
      goals: ["Protect healing fracture", "Manage swelling", "Maintain fitness where possible", "Prevent muscle atrophy"],
      exercises: [
        {
          name: "Non-Weight Bearing Compliance",
          sets: "Continuous",
          duration: "Per surgeon orders",
          description: "Use crutches or knee scooter as prescribed. NO weight on injured ankle. Premature loading risks malunion or hardware failure."
        },
        {
          name: "Elevation Protocol",
          sets: "Throughout day",
          duration: "Ankle above heart level",
          description: "Elevate leg on pillows when sitting/lying. Critical for reducing swelling. Especially important first 2 weeks."
        },
        {
          name: "Toe Wiggling",
          sets: "Every 2-3 hours",
          duration: "20-30 reps",
          description: "Wiggle toes inside cast/boot. Promotes circulation, prevents blood clots, maintains some muscle activity."
        },
        {
          name: "Quad Sets",
          sets: "4-5 times daily",
          duration: "3 sets x 10 reps",
          description: "Tighten thigh muscles, press knee into surface, hold 5 seconds. Maintains quad activation."
        },
        {
          name: "Hip Exercises",
          sets: "2-3 times daily",
          duration: "2 sets x 10 each",
          description: "Hip abduction, adduction, flexion while lying. Maintains hip strength for crutch walking."
        },
        {
          name: "Upper Body & Core Training",
          sets: "3-4 times weekly",
          duration: "30-45 minutes",
          description: "Seated exercises, arm bike, core work on back. Maintain overall fitness without ankle stress."
        }
      ]
    },
    {
      name: "Phase 2: Protected Weight-Bearing & Early Motion",
      days: "Weeks 6-10",
      goals: ["Begin weight-bearing progression", "Restore ankle range of motion", "Reduce swelling", "Transition out of boot"],
      exercises: [
        {
          name: "Weight-Bearing Progression",
          sets: "Per surgeon protocol",
          duration: "Progressive loading",
          description: "TTWB → PWB (25-50%) → WBAT → FWB. Use bathroom scale to measure. Progress only as directed."
        },
        {
          name: "Ankle Pumps",
          sets: "Every 2 hours",
          duration: "3 sets x 20 reps",
          description: "Move foot up and down through available range. Promotes circulation, begins ROM recovery."
        },
        {
          name: "Ankle Alphabet",
          sets: "3-4 times daily",
          duration: "Write A-Z, 2 rounds",
          description: "Use big toe to 'write' alphabet in air. Multi-directional ankle movement. Fun way to work on ROM."
        },
        {
          name: "Heel Slides (Ankle Focus)",
          sets: "4-5 times daily",
          duration: "3 sets x 15 reps",
          description: "Sitting with leg extended, slide heel toward body bending ankle. Use towel under heel on slick surface."
        },
        {
          name: "Calf Stretching",
          sets: "4-5 times daily",
          duration: "3-4 x 30 second holds",
          description: "Towel stretch to foot, pull toes toward shin. Gastrocnemius and soleus stretches. Gentle, sustained."
        },
        {
          name: "Seated Calf Raises (Partial)",
          sets: "2-3 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Sitting, lift heels off floor. Bodyweight only initially. Begin calf strengthening gently."
        }
      ]
    },
    {
      name: "Phase 3: Progressive Strengthening",
      days: "Weeks 10-16",
      goals: ["Achieve full weight-bearing", "Normalize gait pattern", "Build strength and balance", "Progress to higher-level activities"],
      exercises: [
        {
          name: "Standing Calf Raises",
          sets: "Daily",
          duration: "3-4 sets x 15-20 reps",
          description: "Bilateral first, progress to single-leg. Key exercise for ankle strength. Control the descent."
        },
        {
          name: "Resistance Band Exercises",
          sets: "Daily",
          duration: "3 sets x 15-20 reps each direction",
          description: "Dorsiflexion, plantarflexion, inversion, eversion against band. Builds strength in all planes."
        },
        {
          name: "Balance Training",
          sets: "Daily",
          duration: "Total 5-10 minutes",
          description: "Single-leg stance: eyes open → eyes closed → unstable surface. Critical for proprioception. Use support initially."
        },
        {
          name: "Step-Ups",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 each leg",
          description: "Start with low step (4 inches), progress height. Control descent. Forward and lateral step-ups."
        },
        {
          name: "Gait Training",
          sets: "Focus during all walking",
          duration: "Continuous awareness",
          description: "Full heel-to-toe pattern. Push off through big toe. Equal stride length. May need PT guidance."
        },
        {
          name: "Stationary Bike",
          sets: "3-4 times weekly",
          duration: "20-30 minutes",
          description: "Build cardiovascular fitness. Ankle works through ROM with minimal impact stress."
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport/Running",
      days: "Weeks 16-20+",
      goals: ["Plyometric tolerance", "Running progression", "Sport-specific activities", "Full return to sport"],
      exercises: [
        {
          name: "Single-Leg Calf Raises",
          sets: "3-4 times weekly",
          duration: "4 sets x 12-15 reps",
          description: "Match injured side to uninjured side. Goal: equal strength and endurance bilaterally."
        },
        {
          name: "Hop Progressions",
          sets: "2-3 times weekly",
          duration: "Low volume initially",
          description: "Two-leg hops → single-leg hops → directional hops → continuous hopping. Progress when pain-free and stable."
        },
        {
          name: "Running Progression",
          sets: "3-4 times weekly",
          duration: "6-8 week program",
          description: "Walk → walk/jog → continuous jog → tempo → intervals → sprints. Progress 10-15% weekly. Stop if ankle swells."
        },
        {
          name: "Agility Drills",
          sets: "2-3 times weekly",
          duration: "15-20 minutes",
          description: "Ladder drills, cone work, cutting patterns. Start at 50% speed, progress to full speed over 3-4 weeks."
        },
        {
          name: "Sport-Specific Training",
          sets: "Progressive",
          duration: "As tolerated",
          description: "Return to sport-specific movements and practice. Non-contact → limited contact → full practice → competition."
        },
        {
          name: "Maintenance & Prevention",
          sets: "Ongoing",
          duration: "15-20 min, 3x/week",
          description: "Continue balance, calf, and ankle strengthening. Use ankle brace for sports if needed. Prevention is key."
        }
      ]
    }
  ]
};

export default function AnkleFractureRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "bone-ankle",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your ankle fracture recovery program has been assigned and will guide your training until completion.",
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
                    This comprehensive program will guide your ankle fracture recovery and return to full activity.
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
                  <li><strong>Follow weight-bearing restrictions exactly</strong> - premature loading can cause malunion or hardware failure</li>
                  <li>Report increased pain, new swelling, or numbness/tingling in foot immediately</li>
                  <li>Keep cast/boot clean and dry - report any skin issues</li>
                  <li>Attend all follow-up X-rays to confirm bone healing</li>
                </ul>
                <p className="text-yellow-200 text-sm mt-3">
                  Ankle fractures can involve lateral malleolus, medial malleolus, posterior malleolus, or combinations (bi/trimalleolar). 
                  Timeline and restrictions vary based on fracture pattern and whether surgery was performed.
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
