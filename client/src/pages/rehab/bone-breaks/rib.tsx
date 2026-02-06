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
  title: "Rib Fracture Recovery",
  duration: "6-12 weeks",
  phases: [
    {
      name: "Phase 1: Pain Management & Breathing",
      days: "Weeks 1-2",
      goals: ["Control pain for adequate breathing", "Prevent respiratory complications", "Maintain mobility within tolerance", "Protect healing ribs"],
      exercises: [
        {
          name: "Incentive Spirometry",
          sets: "Every hour while awake",
          duration: "10 deep breaths",
          description: "Use spirometer to take deep breaths. Prevents atelectasis (lung collapse) and pneumonia. Critical exercise despite discomfort."
        },
        {
          name: "Supported Coughing",
          sets: "As needed",
          duration: "Proper technique",
          description: "Hold pillow firmly against injured ribs when coughing. Splinting reduces pain and protects fracture site."
        },
        {
          name: "Diaphragmatic Breathing",
          sets: "Every 2 hours",
          duration: "10 slow breaths",
          description: "Breathe into belly rather than chest. Reduces rib cage movement while maintaining oxygen exchange."
        },
        {
          name: "Gentle Walking",
          sets: "3-4 times daily",
          duration: "5-10 minutes",
          description: "Short walks to prevent complications from immobility. Move arms gently, avoid twisting torso."
        },
        {
          name: "Sleep Position Optimization",
          sets: "Nighttime",
          duration: "Throughout sleep",
          description: "Sleep on injured side (counterintuitive but splints the fracture) or propped up at 30-45°. Use pillows for support."
        },
        {
          name: "Arm Pendulums",
          sets: "3 times daily",
          duration: "10-15 gentle swings",
          description: "Gentle arm circles and swings to prevent shoulder stiffness. Keep movements small and pain-free."
        }
      ]
    },
    {
      name: "Phase 2: Mobility & Breathing Expansion",
      days: "Weeks 3-4",
      goals: ["Expand breathing capacity", "Restore normal breathing pattern", "Increase activity tolerance", "Begin shoulder mobility work"],
      exercises: [
        {
          name: "Deep Breathing Exercises",
          sets: "6-8 times daily",
          duration: "10 breaths with expansion",
          description: "Progress from diaphragmatic to full chest expansion. Breathe in for 4 counts, hold 2, exhale 6. Expand rib cage."
        },
        {
          name: "Thoracic Rotation (Gentle)",
          sets: "3 times daily",
          duration: "10 reps each direction",
          description: "Seated, arms crossed. Gently rotate torso left and right. Stay within comfort, don't force range."
        },
        {
          name: "Shoulder ROM Exercises",
          sets: "3 times daily",
          duration: "10 reps each movement",
          description: "Flexion, abduction, external rotation. Overhead reaching. Prevents shoulder stiffness from guarding."
        },
        {
          name: "Walking Program",
          sets: "3-4 times daily",
          duration: "15-20 minutes",
          description: "Gradually increase duration. Focus on full breaths while walking. Build cardiovascular endurance."
        },
        {
          name: "Side Bending (Gentle)",
          sets: "2-3 times daily",
          duration: "8-10 reps each side",
          description: "Standing, gently lean to each side. Stretches intercostal muscles. Move within comfortable range only."
        },
        {
          name: "Posture Correction",
          sets: "Throughout day",
          duration: "Awareness practice",
          description: "Avoid hunched, protective posture. Stand tall, shoulders back. Good posture aids breathing and healing."
        }
      ]
    },
    {
      name: "Phase 3: Strengthening & Conditioning",
      days: "Weeks 5-8",
      goals: ["Rebuild core stability", "Strengthen respiratory muscles", "Return to light activities", "Progress cardiovascular fitness"],
      exercises: [
        {
          name: "Core Stabilization",
          sets: "Daily",
          duration: "2-3 sets each exercise",
          description: "Bird dogs, dead bugs, modified planks. Progress gradually. Core strength supports rib cage."
        },
        {
          name: "Resistance Band Exercises",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "Rows, chest press, shoulder work. Light resistance initially, progress as tolerated. Avoid heavy strain."
        },
        {
          name: "Stationary Cycling",
          sets: "3-4 times weekly",
          duration: "20-30 minutes",
          description: "Low-impact cardiovascular exercise. Upright position supports breathing. Increase intensity gradually."
        },
        {
          name: "Breathing Muscle Training",
          sets: "2 times daily",
          duration: "10-15 minutes",
          description: "Can use breathing trainer device. Strengthens diaphragm and intercostals. Important for athletes."
        },
        {
          name: "Swimming/Pool Walking",
          sets: "2-3 times weekly",
          duration: "20-30 minutes",
          description: "Water supports body, reduces rib stress. Excellent for cardiovascular fitness during recovery."
        },
        {
          name: "Light Upper Body Weights",
          sets: "2-3 times weekly",
          duration: "3 sets x 12 reps",
          description: "Begin with very light weights. Focus on full ROM and breathing during lifts. No breath-holding."
        }
      ]
    },
    {
      name: "Phase 4: Return to Full Activity",
      days: "Weeks 9-12+",
      goals: ["Full return to sport/activity", "Complete rib cage mobility", "Impact tolerance", "Confidence in full exertion"],
      exercises: [
        {
          name: "Progressive Resistance Training",
          sets: "3-4 times weekly",
          duration: "Full program",
          description: "Return to normal lifting program. Progress loads gradually. Monitor for any rib pain with heavy lifts."
        },
        {
          name: "Running Progression",
          sets: "3-4 times weekly",
          duration: "Progressive program",
          description: "Start with walk/jog intervals. Progress to continuous running. Full breaths during running essential."
        },
        {
          name: "Contact Sport Preparation",
          sets: "Sport-specific",
          duration: "2-4 weeks",
          description: "If returning to contact sports, use protective padding initially. Progress contact gradually with coach guidance."
        },
        {
          name: "High-Intensity Intervals",
          sets: "1-2 times weekly",
          duration: "20-30 minutes",
          description: "Challenges respiratory system. Important for athletes. Ensure full breathing capacity before starting."
        },
        {
          name: "Rotational Power Exercises",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 reps",
          description: "Medicine ball throws, cable rotations. Challenges rib cage stability. Progress from light to explosive."
        },
        {
          name: "Sport-Specific Return",
          sets: "Progressive",
          duration: "Full practice",
          description: "Gradual return to full sport participation. Start with 50% intensity, progress over 2-3 weeks to full activity."
        }
      ]
    }
  ]
};

export default function RibFractureRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "bone-rib",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your rib fracture recovery program has been assigned and will guide your training until completion.",
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
              <span>Breathing-Focused Protocol</span>
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
                    This comprehensive program focuses on breathing exercises critical for rib fracture recovery.
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
                <h3 className="font-semibold text-red-300 mb-2">Seek Emergency Care Immediately If:</h3>
                <ul className="text-red-200 text-sm leading-relaxed list-disc ml-4 space-y-1">
                  <li>Severe shortness of breath or difficulty breathing</li>
                  <li>Coughing up blood</li>
                  <li>Feeling like you can't take a full breath</li>
                  <li>Blue lips or fingernails</li>
                  <li>New or worsening chest pain, especially with breathing</li>
                </ul>
                <p className="text-yellow-200 text-sm mt-3">
                  Rib fractures can be associated with lung injuries (pneumothorax, hemothorax). 
                  <strong> Deep breathing exercises are critical</strong> - pain from not breathing deeply causes more complications than the fracture itself.
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
                Progress to the next phase when breathing is comfortable and pain is well-controlled with activity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
