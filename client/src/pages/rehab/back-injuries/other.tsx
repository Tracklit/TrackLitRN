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
  title: "General Back Injury Recovery",
  duration: "6-12 weeks",
  phases: [
    {
      name: "Phase 1: Pain Relief & Protection",
      days: "Weeks 1-2",
      goals: ["Reduce pain and muscle spasm", "Identify aggravating factors", "Maintain movement within tolerance", "Prevent deconditioning"],
      exercises: [
        {
          name: "Pain-Free Walking",
          sets: "Every 2-3 hours",
          duration: "5-15 minutes",
          description: "Short frequent walks. Movement is medicine for back pain. Avoid prolonged sitting or standing."
        },
        {
          name: "Supported Lying Positions",
          sets: "As needed for relief",
          duration: "10-20 minutes",
          description: "Side lying with pillow between knees, or supine with knees bent. Find positions that reduce symptoms."
        },
        {
          name: "Gentle Knee Rocks",
          sets: "3-4 times daily",
          duration: "10-15 reps each direction",
          description: "Lying on back, knees bent. Gently rock knees side to side through comfortable range."
        },
        {
          name: "Pelvic Tilts",
          sets: "4-5 times daily",
          duration: "10-15 reps",
          description: "Lying supine, alternately flatten and arch low back. Small, controlled movements."
        },
        {
          name: "Cat-Cow Stretch",
          sets: "3-4 times daily",
          duration: "10 slow cycles",
          description: "On all fours, gently arch and round spine. Move within comfort, don't push into pain."
        },
        {
          name: "Diaphragmatic Breathing",
          sets: "Throughout day",
          duration: "10 breaths per session",
          description: "Breathe into belly, expand ribcage. Reduces muscle tension and activates parasympathetic system."
        }
      ]
    },
    {
      name: "Phase 2: Core Reactivation",
      days: "Weeks 3-4",
      goals: ["Activate deep stabilizers", "Build movement confidence", "Improve body awareness", "Begin postural correction"],
      exercises: [
        {
          name: "Abdominal Bracing",
          sets: "Throughout day",
          duration: "Hold 10 sec, 20+ reps daily",
          description: "Gently contract abs 20-30% while breathing normally. Practice during all activities."
        },
        {
          name: "Glute Bridges",
          sets: "2 times daily",
          duration: "3 sets x 12-15 reps",
          description: "Lying supine, feet flat. Squeeze glutes to lift hips. Hold 3 seconds at top."
        },
        {
          name: "Dead Bug (Basic)",
          sets: "2 times daily",
          duration: "2-3 sets x 8 each side",
          description: "Lying on back, arms up, knees at 90°. Lower opposite arm/leg while maintaining flat back."
        },
        {
          name: "Bird Dog",
          sets: "2 times daily",
          duration: "2-3 sets x 8 each side",
          description: "On all fours, extend opposite arm and leg. Hold 5 seconds. Maintain neutral spine throughout."
        },
        {
          name: "Wall Angels",
          sets: "2 times daily",
          duration: "2 sets x 10 reps",
          description: "Stand with back against wall, arms in 'W' position. Slide arms up into 'Y' keeping contact with wall."
        },
        {
          name: "Hip Flexor Stretch",
          sets: "After sitting",
          duration: "30 seconds each side",
          description: "Half-kneeling position, tuck pelvis under, lean forward gently. Tight hip flexors contribute to back pain."
        }
      ]
    },
    {
      name: "Phase 3: Functional Strengthening",
      days: "Weeks 5-8",
      goals: ["Build strength endurance", "Improve functional capacity", "Progress to resistance training", "Develop movement competency"],
      exercises: [
        {
          name: "McGill Big 3",
          sets: "Daily",
          duration: "3 rounds of each",
          description: "Curl-ups, side planks, bird dogs. 10-second holds, 10 reps each. Gold standard for spine stability."
        },
        {
          name: "Hip Hinge Pattern",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "Romanian deadlift pattern. Push hips back, slight knee bend, neutral spine. Start bodyweight, add load slowly."
        },
        {
          name: "Goblet Squat",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Hold weight at chest, squat to depth you can maintain neutral spine. Front load helps posture."
        },
        {
          name: "Farmer's Carries",
          sets: "2-3 times weekly",
          duration: "3 sets x 30-40 seconds",
          description: "Walk with weights at sides. Maintain tall posture. Builds total-body stability for real-world function."
        },
        {
          name: "Pallof Press",
          sets: "3 times weekly",
          duration: "3 sets x 10 each side",
          description: "Anti-rotation exercise with band/cable. Press away from body, resist rotation. Core stability essential."
        },
        {
          name: "Step-Ups",
          sets: "2 times weekly",
          duration: "3 sets x 10 each leg",
          description: "Use appropriate height. Drive through heel, control descent. Single-leg strength supports spine."
        }
      ]
    },
    {
      name: "Phase 4: Return to Full Activity",
      days: "Weeks 9-12",
      goals: ["Full return to work/sport", "Develop resilience", "Establish maintenance routine", "Prevent future episodes"],
      exercises: [
        {
          name: "Compound Lifts",
          sets: "3 times weekly",
          duration: "4 sets x 8-10 reps",
          description: "Deadlifts, squats, rows. Progress load gradually with perfect form. Build real-world strength."
        },
        {
          name: "Single-Leg Training",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 each leg",
          description: "Split squats, single-leg deadlifts, lunges. Address asymmetries and build balance."
        },
        {
          name: "Rotational Exercises",
          sets: "2 times weekly",
          duration: "3 sets x 10 each side",
          description: "Cable chops, medicine ball throws. Controlled rotation with core stability. Sport-specific."
        },
        {
          name: "Sport/Activity-Specific Training",
          sets: "As appropriate",
          duration: "Progressive return",
          description: "Gradual return to sport or work demands. Start at 50% intensity, progress 10-15% weekly."
        },
        {
          name: "Cardiovascular Training",
          sets: "3-5 times weekly",
          duration: "20-45 minutes",
          description: "Walking, cycling, swimming. Build aerobic base. Healthy cardiovascular system supports recovery."
        },
        {
          name: "Daily Maintenance Routine",
          sets: "Every day",
          duration: "10-15 minutes",
          description: "McGill Big 3, hip mobility, walking. Non-negotiable for long-term back health. Prevention is key."
        }
      ]
    }
  ]
};

export default function BackOtherRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "back-general",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your back recovery program has been assigned and will guide your training until completion.",
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
                    This comprehensive program will guide your back recovery and return to full activity.
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
                  This general back pain program is suitable for non-specific low back pain, muscle strains, and facet joint issues. 
                  If you experience radiating leg pain below the knee, numbness/tingling, progressive weakness, or any bowel/bladder 
                  changes, seek immediate medical evaluation. Most back pain improves with movement - avoid prolonged bed rest.
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
