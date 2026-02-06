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
  title: "Chronic Quadriceps Tendinopathy & Patellar Pain Recovery",
  duration: "8-16 weeks",
  phases: [
    {
      name: "Phase 1: Load Management & Symptom Control",
      days: "Weeks 1-3",
      goals: ["Reduce pain and irritability", "Identify load thresholds", "Begin isometric loading", "Address contributing factors"],
      exercises: [
        {
          name: "Activity Modification",
          sets: "Ongoing",
          duration: "Throughout phase",
          description: "Reduce jumping/running volume by 50-70%, avoid deep squats, lunges, and stair climbing that aggravate symptoms"
        },
        {
          name: "Isometric Quad Holds (Wall Sit)",
          sets: "Daily",
          duration: "5 sets x 45-second holds at 70° knee flexion",
          description: "Wall sit position provides analgesic effect. Hold at position where pain is minimal"
        },
        {
          name: "Spanish Squat Isometrics",
          sets: "Daily",
          duration: "4 sets x 45 seconds",
          description: "With band around knees attached to anchor, lean back and hold squat position. Reduces patellar tendon load"
        },
        {
          name: "Leg Extension Isometrics",
          sets: "2 times daily",
          duration: "4 sets x 30-45 seconds at 60° flexion",
          description: "Seated leg extension machine, hold at mid-range position. Build time under tension"
        },
        {
          name: "Hip Strengthening",
          sets: "Every other day",
          duration: "3 sets x 12-15 reps each",
          description: "Lateral band walks, clamshells, side-lying hip abduction - address hip weakness"
        },
        {
          name: "VMO Activation",
          sets: "Daily",
          duration: "3 sets x 15 reps",
          description: "Terminal knee extensions with band, short arc quads - target vastus medialis"
        }
      ]
    },
    {
      name: "Phase 2: Progressive Tendon Loading",
      days: "Weeks 4-7",
      goals: ["Progressive isotonic loading", "Eccentric emphasis", "Improve quad strength", "Begin controlled impact"],
      exercises: [
        {
          name: "Decline Squat Protocol",
          sets: "Every other day",
          duration: "4 sets x 15 reps (3-second eccentric)",
          description: "On 25° decline board, bodyweight squats to 90°. Key exercise for patellar tendinopathy"
        },
        {
          name: "Leg Press (Eccentric Focus)",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Emphasis on slow 4-count lowering phase, moderate load, avoid deep flexion past 90°"
        },
        {
          name: "Step-Down Progressions",
          sets: "3 times weekly",
          duration: "3 sets x 10 each leg",
          description: "Forward step-downs from 4-6 inch step, controlled descent, progress height gradually"
        },
        {
          name: "Split Squat Progression",
          sets: "2-3 times weekly",
          duration: "3 sets x 8-10 each leg",
          description: "Rear foot elevated split squats, maintain upright torso to reduce patellar load"
        },
        {
          name: "Cycling Program",
          sets: "4-5 times weekly",
          duration: "20-30 minutes",
          description: "Stationary bike with moderate resistance, high seat position, good quad loading without impact"
        },
        {
          name: "Soft Tissue Work",
          sets: "Daily",
          duration: "10-15 minutes",
          description: "Foam rolling quads, IT band, and hip flexors. Avoid rolling directly over painful tendon"
        }
      ]
    },
    {
      name: "Phase 3: Functional Strengthening",
      days: "Weeks 8-12",
      goals: ["Heavy slow resistance training", "Return to running", "Build power capacity", "Prepare for sport demands"],
      exercises: [
        {
          name: "Heavy Slow Resistance (HSR)",
          sets: "3 times weekly",
          duration: "4 sets x 6-8 reps at 70-85% 1RM",
          description: "Leg press and leg extension with 3-sec concentric, 4-sec eccentric. Progressive overload each week"
        },
        {
          name: "Barbell Back Squat",
          sets: "2 times weekly",
          duration: "4 sets x 6-8 reps",
          description: "Progress load weekly, focus on controlled tempo, appropriate depth for your tolerance"
        },
        {
          name: "Single-Leg Press",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 each leg",
          description: "Address any bilateral asymmetries, maintain slow eccentric emphasis"
        },
        {
          name: "Running Progression",
          sets: "3 times weekly",
          duration: "Progressive",
          description: "Week 8-9: Walk/jog intervals. Week 10-12: Build to continuous running 20-30 min"
        },
        {
          name: "Box Jumps (Landing Focus)",
          sets: "2 times weekly",
          duration: "3 sets x 8 reps",
          description: "Jump onto box (not over), step down. Focus on soft landing mechanics"
        },
        {
          name: "Proprioception Training",
          sets: "3 times weekly",
          duration: "10-15 minutes",
          description: "Single-leg balance, BOSU squats, perturbation training for knee stability"
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport & Prevention",
      days: "Weeks 13-16+",
      goals: ["Full sport participation", "Plyometric and power training", "Injury prevention maintenance", "Load management education"],
      exercises: [
        {
          name: "Plyometric Progression",
          sets: "2-3 times weekly",
          duration: "Progressive volume",
          description: "Week 13: Low intensity (pogos, jumps). Week 15+: Full sport-specific plyometrics"
        },
        {
          name: "Sport-Specific Training",
          sets: "Progressive integration",
          duration: "As tolerated",
          description: "Gradual return to full training: Week 13: 50%, Week 14: 75%, Week 15+: 100%"
        },
        {
          name: "Maintenance Strength Program",
          sets: "2 times weekly",
          duration: "30-40 minutes",
          description: "Continue squats, leg press, and single-leg work to maintain quad strength and tendon capacity"
        },
        {
          name: "Pre-Activity Preparation",
          sets: "Before training/competition",
          duration: "10-15 minutes",
          description: "Isometric wall sits, activation exercises, dynamic stretching as warm-up protocol"
        },
        {
          name: "Load Monitoring",
          sets: "Ongoing",
          duration: "Weekly review",
          description: "Track training volume, monitor for symptom flare-ups, adjust load as needed"
        },
        {
          name: "Periodized Strength Training",
          sets: "Year-round",
          duration: "Ongoing",
          description: "Continue structured leg strength training in your annual plan to prevent recurrence"
        }
      ]
    }
  ]
};

export default function ChronicQuadRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "chronic-quad",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your chronic quad/patellar recovery program has been assigned.",
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
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            Chronic Injury
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
                    This program addresses chronic quad/patellar tendon issues using evidence-based loading protocols.
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
                  Patellar and quadriceps tendinopathy ("jumper's knee") typically develops from overload and requires progressive loading 
                  to improve, not complete rest. If you experience locking, giving way, or significant swelling, consult a sports medicine 
                  physician to rule out other knee pathology. Some discomfort during loading (up to 3-4/10) is acceptable as long as it 
                  doesn't increase the next day.
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
              Tendon rehabilitation requires patience - improvement often takes 12+ weeks
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
                Heavy Slow Resistance training has shown equal or better outcomes than eccentric-only protocols for tendinopathy. Stay consistent with the loading program.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
