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
  title: "General Bone Fracture Recovery",
  duration: "8-16 weeks (varies by bone)",
  phases: [
    {
      name: "Phase 1: Immobilization & Protection",
      days: "Weeks 1-4 (varies by fracture)",
      goals: ["Protect healing bone", "Manage pain and swelling", "Maintain overall fitness", "Prevent complications"],
      exercises: [
        {
          name: "Immobilization Compliance",
          sets: "Continuous",
          duration: "Per medical orders",
          description: "Follow cast, splint, or brace instructions exactly. Don't remove or modify without medical approval. Bone healing takes time."
        },
        {
          name: "Elevation & Ice",
          sets: "Throughout day",
          duration: "20 min ice, frequent elevation",
          description: "Keep injured area elevated above heart level when possible. Ice for swelling control (barrier between ice and skin)."
        },
        {
          name: "Adjacent Joint Movement",
          sets: "Every 2-3 hours",
          duration: "10-15 reps each joint",
          description: "Move joints above and below fracture site if allowed. Prevents stiffness, maintains circulation."
        },
        {
          name: "Muscle Activation (Isometrics)",
          sets: "4-5 times daily",
          duration: "10 x 5-second holds",
          description: "Gently contract muscles around fracture without moving joint. Maintains neural connection to muscle."
        },
        {
          name: "Uninjured Limb Training",
          sets: "3-4 times weekly",
          duration: "Full workout",
          description: "Train opposite limb and core. 'Cross-education' effect helps maintain strength on injured side too."
        },
        {
          name: "Cardiovascular Maintenance",
          sets: "3-5 times weekly",
          duration: "20-40 minutes",
          description: "Use arm bike, seated exercises, or whatever doesn't stress fracture site. Maintain fitness during recovery."
        }
      ]
    },
    {
      name: "Phase 2: Early Motion",
      days: "Weeks 4-8 (when cleared)",
      goals: ["Begin gentle range of motion", "Progress weight-bearing if applicable", "Reduce swelling", "Prevent muscle atrophy"],
      exercises: [
        {
          name: "Active-Assisted Range of Motion",
          sets: "4-5 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Use uninjured limb or tools to assist movement. Gentle, within tolerance. Progress range gradually."
        },
        {
          name: "Active Range of Motion",
          sets: "4-5 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Move through available range without assistance. No forcing or pushing through pain."
        },
        {
          name: "Weight-Bearing Progression",
          sets: "Per medical protocol",
          duration: "As directed",
          description: "If lower limb: progress from NWB → TTWB → PWB → WBAT → FWB as bone heals. Use scale to measure."
        },
        {
          name: "Gentle Stretching",
          sets: "3-4 times daily",
          duration: "30-second holds",
          description: "Stretch surrounding muscles that have tightened during immobilization. Gentle, sustained stretches."
        },
        {
          name: "Pool Exercises (if available)",
          sets: "3-4 times weekly",
          duration: "20-30 minutes",
          description: "Water provides support and resistance. Excellent for early motion with reduced stress on healing bone."
        },
        {
          name: "Light Resistance (Isometric to Isotonic)",
          sets: "2-3 times daily",
          duration: "2-3 sets x 10-15 reps",
          description: "Progress from isometric holds to movement against light resistance. Very gradual loading progression."
        }
      ]
    },
    {
      name: "Phase 3: Strengthening",
      days: "Weeks 8-12",
      goals: ["Rebuild strength progressively", "Achieve full range of motion", "Normalize movement patterns", "Return to daily activities"],
      exercises: [
        {
          name: "Progressive Resistance Training",
          sets: "3 times weekly",
          duration: "3-4 sets x 10-15 reps",
          description: "Begin with body weight or light resistance. Progress load 5-10% weekly as tolerated. Focus on form."
        },
        {
          name: "Compound Movements",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Multi-joint exercises appropriate for injury location. Squats, presses, rows, etc. Modified as needed."
        },
        {
          name: "Balance & Proprioception",
          sets: "Daily",
          duration: "5-10 minutes",
          description: "Single-leg stance, unstable surfaces, eyes closed progressions. Especially important after lower limb fractures."
        },
        {
          name: "Functional Movement Training",
          sets: "Daily practice",
          duration: "Throughout day",
          description: "Practice movements needed for daily life and work. Lifting, reaching, climbing stairs, etc."
        },
        {
          name: "Cardiovascular Progression",
          sets: "3-5 times weekly",
          duration: "30-45 minutes",
          description: "Progress to full cardiovascular training. Walking, cycling, swimming, elliptical as appropriate for injury."
        },
        {
          name: "Flexibility Work",
          sets: "Daily",
          duration: "10-15 minutes",
          description: "Full-body stretching routine. Address areas that tightened during immobilization and recovery period."
        }
      ]
    },
    {
      name: "Phase 4: Return to Full Activity",
      days: "Weeks 12-16+",
      goals: ["Sport/work-specific conditioning", "Equal strength to uninjured side", "Confidence in full activity", "Prevention of re-injury"],
      exercises: [
        {
          name: "Sport/Activity-Specific Training",
          sets: "Progressive",
          duration: "Per activity demands",
          description: "Return to specific movements required for sport or work. Start at 50% intensity, progress 10-15% weekly."
        },
        {
          name: "Plyometric Training (if appropriate)",
          sets: "2 times weekly",
          duration: "Low volume initially",
          description: "Jumping, hopping, throwing as appropriate. Builds reactive strength. Only when bone is fully healed."
        },
        {
          name: "Agility & Speed Work",
          sets: "2-3 times weekly",
          duration: "15-20 minutes",
          description: "Direction changes, acceleration, deceleration. Progress from slow to full speed over several weeks."
        },
        {
          name: "Symmetry Testing",
          sets: "Periodic assessment",
          duration: "Comprehensive testing",
          description: "Compare injured to uninjured side. Goal: within 10-15% for strength, full ROM, equal function."
        },
        {
          name: "Gradual Return to Competition/Work",
          sets: "Progressive",
          duration: "2-4 weeks",
          description: "Practice → scrimmage → competition. Light duty → modified duty → full duty. Don't rush this phase."
        },
        {
          name: "Ongoing Maintenance Program",
          sets: "Lifelong",
          duration: "2-3 sessions weekly",
          description: "Continue strength, flexibility, and conditioning work. Previously fractured bone benefits from continued loading."
        }
      ]
    }
  ]
};

export default function BoneOtherRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "bone-general",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your bone fracture recovery program has been assigned and will guide your training until completion.",
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
              <span>Medical-Guided Protocol</span>
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
                    This general fracture recovery program provides guidance that can be adapted to various bone injuries.
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
                <p className="text-yellow-200 text-sm leading-relaxed mb-2">
                  This is a general fracture rehabilitation framework. Healing times and protocols vary significantly based on:
                </p>
                <ul className="text-yellow-200 text-sm list-disc ml-4 space-y-1">
                  <li>Which bone is fractured (weight-bearing vs. non-weight-bearing)</li>
                  <li>Type of fracture (simple, comminuted, displaced, open)</li>
                  <li>Treatment method (cast, surgical fixation, external fixation)</li>
                  <li>Your age, health, and bone density</li>
                </ul>
                <p className="text-red-200 text-sm mt-3">
                  <strong>Always follow your surgeon's or physician's specific instructions.</strong> They will adjust timelines based on X-ray evidence of healing. 
                  Do not progress phases without medical clearance.
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
                Phase progression requires medical clearance based on imaging evidence of bone healing. Do not self-progress.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
