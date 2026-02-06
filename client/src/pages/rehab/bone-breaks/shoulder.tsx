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
  title: "Shoulder Fracture Recovery",
  duration: "12-20 weeks",
  phases: [
    {
      name: "Phase 1: Immobilization & Protection",
      days: "Weeks 1-4 (or per surgeon)",
      goals: ["Protect healing fracture", "Control pain and swelling", "Prevent shoulder stiffness", "Maintain elbow and hand function"],
      exercises: [
        {
          name: "Sling Wearing Protocol",
          sets: "Continuous",
          duration: "Per surgeon orders",
          description: "Wear sling as prescribed. Most proximal humerus fractures require 2-4 weeks. Remove only for exercises if cleared."
        },
        {
          name: "Pendulum Exercises (Codman's)",
          sets: "3-4 times daily",
          duration: "2-3 minutes",
          description: "Lean forward, let arm hang. Small circles and swings. Gravity assists movement. Prevents adhesions without stress on fracture."
        },
        {
          name: "Elbow Range of Motion",
          sets: "4-5 times daily",
          duration: "10-15 reps",
          description: "Out of sling, bend and straighten elbow fully. Forearm rotation. Prevents elbow stiffness from disuse."
        },
        {
          name: "Hand/Wrist Exercises",
          sets: "Every 2-3 hours",
          duration: "10 reps each movement",
          description: "Make a fist, spread fingers, wrist circles. Maintains hand function and circulation. Do frequently."
        },
        {
          name: "Scapular Squeezes",
          sets: "4-5 times daily",
          duration: "10 x 5-second holds",
          description: "Squeeze shoulder blades together gently. Maintains scapular muscle activity without stressing fracture."
        },
        {
          name: "Cardiovascular Maintenance",
          sets: "Daily",
          duration: "20-30 minutes",
          description: "Walking, stationary bike. Maintain fitness without arm movement. Stay active within restrictions."
        }
      ]
    },
    {
      name: "Phase 2: Early Motion",
      days: "Weeks 4-8",
      goals: ["Begin active shoulder motion", "Restore passive range of motion", "Reduce pain with movement", "Wean from sling"],
      exercises: [
        {
          name: "Supine Active-Assisted Flexion",
          sets: "4-5 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Lying down, use good arm to assist injured arm overhead. Gravity eliminated position reduces stress."
        },
        {
          name: "Table Slides",
          sets: "3-4 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Sit at table, slide arm forward on towel. Gravity-assisted flexion. Progress distance as tolerated."
        },
        {
          name: "Wall Walks",
          sets: "3 times daily",
          duration: "3 sets x 5-10 reps",
          description: "Face wall, walk fingers up wall. Note highest point reached. Track progress. Stop before pain."
        },
        {
          name: "External Rotation at Side",
          sets: "3 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Elbow at side bent 90°. Rotate forearm outward using cane or stick for assistance. Key movement for function."
        },
        {
          name: "Pulley Exercises",
          sets: "3-4 times daily",
          duration: "3 sets x 15-20 reps",
          description: "Use overhead pulley. Good arm pulls to assist injured arm. Both flexion and abduction patterns."
        },
        {
          name: "Isometric Strengthening",
          sets: "2-3 times daily",
          duration: "10 x 5-second holds each direction",
          description: "Push against wall in flexion, extension, abduction. No actual movement. Begins muscle activation safely."
        }
      ]
    },
    {
      name: "Phase 3: Strengthening",
      days: "Weeks 8-14",
      goals: ["Build rotator cuff strength", "Progress to active range of motion", "Achieve near-full ROM", "Functional use in daily activities"],
      exercises: [
        {
          name: "Resistance Band External Rotation",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "Elbow at side, rotate outward against band resistance. Key rotator cuff strengthening exercise."
        },
        {
          name: "Resistance Band Internal Rotation",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "Elbow at side, rotate inward against band resistance. Balance internal and external rotation strength."
        },
        {
          name: "Side-Lying External Rotation",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Lie on uninvolved side, small weight in hand, rotate up. Infraspinatus/teres minor isolation."
        },
        {
          name: "Prone Y-T-W Raises",
          sets: "3 times weekly",
          duration: "2-3 sets x 10 reps each",
          description: "Lying face down, lift arms in Y, T, and W positions. Builds scapular stability and posterior shoulder."
        },
        {
          name: "Shoulder Press (Light)",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Start seated with very light weight. Control full range. Progress weight gradually."
        },
        {
          name: "Rows",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "Band or cable rows. Squeeze shoulder blades at end. Builds posterior shoulder and scapular muscles."
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport/Activity",
      days: "Weeks 14-20+",
      goals: ["Full range of motion", "Sport-specific strength", "Overhead activity tolerance", "Return to full sport participation"],
      exercises: [
        {
          name: "Progressive Shoulder Press",
          sets: "2-3 times weekly",
          duration: "4 sets x 8-12 reps",
          description: "Progress to heavier weights. Dumbbells allow more natural movement pattern than barbell."
        },
        {
          name: "Overhead Movements",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Overhead press, push press, jerks if relevant to sport. Progress weight and speed gradually."
        },
        {
          name: "Throwing Progression",
          sets: "Sport-specific",
          duration: "6-8 week program",
          description: "For throwers: begin with two-hand chest pass, progress to one-arm throws. Increase distance and velocity gradually."
        },
        {
          name: "Plyometric Shoulder Work",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 reps",
          description: "Medicine ball throws, push-ups with clap (advanced). Builds reactive strength for sport."
        },
        {
          name: "Swimming/Overhead Sport Return",
          sets: "Progressive",
          duration: "Sport-specific",
          description: "Gradual return to swimming strokes or overhead sports. Start with 25% volume/intensity, build 10-15% weekly."
        },
        {
          name: "Maintenance Program",
          sets: "Ongoing",
          duration: "15-20 minutes, 3x/week",
          description: "Continue rotator cuff and scapular exercises. Prevention of future injury. Non-negotiable for athletes."
        }
      ]
    }
  ]
};

export default function ShoulderFractureRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "bone-shoulder",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your shoulder fracture recovery program has been assigned and will guide your training until completion.",
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
                    This comprehensive program will guide your shoulder fracture recovery and return to full activity.
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
                  Shoulder fractures (proximal humerus, clavicle, scapula) have varying protocols based on fracture type and treatment 
                  (surgical vs. non-operative). Follow your surgeon's specific guidelines for immobilization duration and weight-bearing.
                </p>
                <ul className="text-yellow-200 text-sm list-disc ml-4 space-y-1">
                  <li>Report increased pain, numbness in hand, or visible deformity</li>
                  <li>Pendulum exercises are typically safe early - confirm with your surgeon</li>
                  <li>Shoulder stiffness (frozen shoulder) is a common complication - early gentle motion helps prevent this</li>
                </ul>
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
                Progress to the next phase based on surgeon clearance and achievement of ROM and strength milestones.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
