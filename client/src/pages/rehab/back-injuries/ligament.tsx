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
  title: "Spinal Ligament Injury Recovery",
  duration: "8-16 weeks",
  phases: [
    {
      name: "Phase 1: Acute Protection & Pain Management",
      days: "Weeks 1-2",
      goals: ["Control inflammation and pain", "Protect healing ligaments", "Prevent muscle guarding", "Maintain basic mobility"],
      exercises: [
        {
          name: "Controlled Rest",
          sets: "First 48-72 hours",
          duration: "As needed",
          description: "Avoid aggravating movements, use pain as a guide. Short walks every 2 hours to prevent stiffness."
        },
        {
          name: "Ice/Heat Therapy",
          sets: "4-6 times daily",
          duration: "15-20 minutes",
          description: "Ice for first 48-72 hours, then alternate ice/heat. Use barrier between skin and modality."
        },
        {
          name: "Diaphragmatic Breathing",
          sets: "Every 2 hours",
          duration: "10 deep breaths",
          description: "Lying on back with knees bent. Breathe deep into belly, expand ribcage 360°. Reduces muscle tension."
        },
        {
          name: "Pelvic Tilts",
          sets: "3-4 times daily",
          duration: "10-15 reps",
          description: "Lying supine, gently flatten low back to floor, then arch slightly. Very small, pain-free movements."
        },
        {
          name: "Supine Knee Rocks",
          sets: "3 times daily",
          duration: "10 reps each direction",
          description: "Knees bent, feet flat. Gently rock knees side to side through a small, comfortable range."
        },
        {
          name: "Cat-Cow (Modified)",
          sets: "2-3 times daily",
          duration: "8-10 cycles",
          description: "On all fours, very gentle spinal flexion/extension. Prioritize mobility over range."
        }
      ]
    },
    {
      name: "Phase 2: Core Activation & Gentle Mobility",
      days: "Weeks 3-4",
      goals: ["Activate deep core stabilizers", "Restore pain-free range of motion", "Begin postural correction", "Build movement confidence"],
      exercises: [
        {
          name: "Dead Bug (Modified)",
          sets: "2 times daily",
          duration: "2-3 sets x 8 reps each side",
          description: "Lying supine, knees at 90°. Lower one leg toward floor while maintaining neutral spine. Alternate sides."
        },
        {
          name: "Bird Dog (Modified)",
          sets: "2 times daily",
          duration: "2-3 sets x 8 reps each side",
          description: "On all fours, extend opposite arm and leg. Hold 3-5 seconds. Focus on spine stability, not height."
        },
        {
          name: "Glute Bridges",
          sets: "2 times daily",
          duration: "3 sets x 12-15 reps",
          description: "Lying supine, feet flat. Lift hips by squeezing glutes. Hold 3 seconds at top. Keep spine neutral."
        },
        {
          name: "Prone Press-Ups (McKenzie)",
          sets: "Every 2 hours",
          duration: "10 reps",
          description: "Lying face down, press upper body up keeping hips on floor. Only if this reduces symptoms (centralization)."
        },
        {
          name: "Seated Spinal Rotation",
          sets: "2-3 times daily",
          duration: "10 reps each side",
          description: "Sitting tall, gently rotate torso left and right. Keep pelvis stable. Move through comfortable range."
        },
        {
          name: "Wall Slides",
          sets: "2 times daily",
          duration: "2 sets x 10 reps",
          description: "Back against wall, arms overhead. Slide arms up and down wall. Focus on maintaining neutral spine."
        }
      ]
    },
    {
      name: "Phase 3: Progressive Strengthening",
      days: "Weeks 5-8",
      goals: ["Build core endurance", "Strengthen posterior chain", "Improve functional movement patterns", "Increase load tolerance"],
      exercises: [
        {
          name: "McGill Big 3 Circuit",
          sets: "Daily",
          duration: "3 rounds",
          description: "Curl-ups, side planks (both sides), bird dogs. Hold each 10 seconds, 10 reps per exercise. Gold standard for spine stability."
        },
        {
          name: "Hip Hinge Pattern",
          sets: "Every other day",
          duration: "3 sets x 12 reps",
          description: "Romanian deadlift pattern with bodyweight or light resistance. Master the hip hinge to protect spine."
        },
        {
          name: "Pallof Press",
          sets: "3 times weekly",
          duration: "3 sets x 10 reps each side",
          description: "Anti-rotation core exercise using band or cable. Press out, hold 2-3 seconds, return. Builds rotational stability."
        },
        {
          name: "Farmer's Carries",
          sets: "3 times weekly",
          duration: "3 sets x 30-40 seconds",
          description: "Walk with weights at sides, maintain tall posture. Progress weight gradually. Builds total-body stability."
        },
        {
          name: "Goblet Squats",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Hold weight at chest, squat with neutral spine. Focus on depth control and spine position."
        },
        {
          name: "Back Extensions (Bodyweight)",
          sets: "2-3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "On GHD or floor. Controlled extension from neutral, don't hyperextend. Build posterior chain endurance."
        }
      ]
    },
    {
      name: "Phase 4: Return to Full Activity",
      days: "Weeks 9-16",
      goals: ["Achieve full functional capacity", "Sport-specific conditioning", "Injury prevention habits", "Maintain spine health long-term"],
      exercises: [
        {
          name: "Deadlift Progression",
          sets: "2-3 times weekly",
          duration: "4 sets x 6-8 reps",
          description: "Progress from trap bar to conventional. Perfect form before adding weight. Key posterior chain builder."
        },
        {
          name: "Loaded Carries (Various)",
          sets: "2-3 times weekly",
          duration: "3-4 sets x 40-60 seconds",
          description: "Farmer's walks, suitcase carries, overhead carries. Builds resilience for real-world demands."
        },
        {
          name: "Single-Leg Deadlifts",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 each leg",
          description: "Unilateral posterior chain work. Challenges balance and spine stability simultaneously."
        },
        {
          name: "Sport-Specific Movement Training",
          sets: "3-4 times weekly",
          duration: "20-30 minutes",
          description: "Gradual return to sport-specific movements. Start at 50% intensity, progress 10-15% weekly."
        },
        {
          name: "Plyometric Progression",
          sets: "2 times weekly",
          duration: "3 sets x 5-8 reps",
          description: "Box jumps, broad jumps, bounding. Low volume, high quality. Only when pain-free under load."
        },
        {
          name: "Maintenance Core Circuit",
          sets: "3-4 times weekly",
          duration: "15-20 minutes",
          description: "Daily McGill Big 3, breathing drills, hip mobility. Non-negotiable for long-term spine health."
        }
      ]
    }
  ]
};

export default function BackLigamentRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "back-ligament",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your spinal ligament recovery program has been assigned and will guide your training until completion.",
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
                    This comprehensive program will guide your spinal ligament recovery and return to full activity.
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
                  Spinal ligament injuries require careful management. If you experience radiating leg pain, numbness, weakness, 
                  or changes in bladder/bowel function, seek immediate medical attention. These symptoms may indicate nerve involvement. 
                  Progress through phases only when pain-free with current activities. Avoid heavy lifting and twisting movements until cleared.
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
                Progress to the next phase only when you can complete all exercises pain-free and meet the phase goals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
