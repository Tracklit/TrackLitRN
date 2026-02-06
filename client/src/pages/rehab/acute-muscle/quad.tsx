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
  title: "Acute Quadriceps Strain Recovery",
  duration: "4-8 weeks",
  phases: [
    {
      name: "Phase 1: Immediate Care & Protection",
      days: "Days 1-7",
      goals: ["Control pain and swelling", "Protect healing tissue", "Maintain hip mobility", "Begin gentle activation"],
      exercises: [
        {
          name: "RICE Protocol",
          sets: "First 48-72 hours",
          duration: "Continuous",
          description: "Rest, Ice (20 min every 2-3 hrs), Compression wrap from knee to upper thigh, Elevation"
        },
        {
          name: "Pain-Free Range of Motion",
          sets: "Every 2-3 hours",
          duration: "10-15 gentle reps",
          description: "Seated knee flexion/extension within pain-free limits, avoid full stretch"
        },
        {
          name: "Isometric Quad Sets",
          sets: "4-5 times daily",
          duration: "10 x 5-second holds",
          description: "Sitting or lying, gently tighten quad without moving leg, press knee into surface"
        },
        {
          name: "Hip Circles",
          sets: "2-3 times daily",
          duration: "10 circles each direction",
          description: "Standing on uninjured leg, gentle hip circles to maintain mobility"
        },
        {
          name: "Ankle Pumps",
          sets: "Throughout day",
          duration: "20-30 reps per session",
          description: "Prevent blood pooling and maintain circulation in affected leg"
        },
        {
          name: "Light Effleurage Massage",
          sets: "2-3 times daily",
          duration: "5-10 minutes",
          description: "Very light strokes above and below injury site to promote circulation"
        }
      ]
    },
    {
      name: "Phase 2: Early Strengthening & Mobility",
      days: "Week 2",
      goals: ["Increase range of motion", "Begin progressive loading", "Improve muscle activation", "Reduce inflammation"],
      exercises: [
        {
          name: "Active Range of Motion",
          sets: "4-5 times daily",
          duration: "3 sets of 15 reps",
          description: "Seated and prone knee flexion/extension, progress range gradually"
        },
        {
          name: "Straight Leg Raises",
          sets: "3 times daily",
          duration: "3 sets x 10-15 reps",
          description: "Lying supine, tighten quad and lift straight leg 6-8 inches, hold 3 seconds"
        },
        {
          name: "Wall Slides",
          sets: "2-3 times daily",
          duration: "3 sets x 10 reps",
          description: "Back against wall, slide down to comfortable knee bend (30-45°), hold briefly"
        },
        {
          name: "Stationary Bike (No Resistance)",
          sets: "1-2 times daily",
          duration: "10-15 minutes",
          description: "High seat position, smooth pedaling motion, focus on range not power"
        },
        {
          name: "Gentle Quad Stretch",
          sets: "After each exercise session",
          duration: "3 x 20-30 second holds",
          description: "Standing or side-lying, gentle pull heel toward buttock, stop before pain"
        },
        {
          name: "Cross-Fiber Massage",
          sets: "Daily",
          duration: "10-15 minutes",
          description: "Light to moderate pressure around injury site, deeper on surrounding tissue"
        }
      ]
    },
    {
      name: "Phase 3: Progressive Strengthening",
      days: "Weeks 3-4",
      goals: ["Build muscle strength", "Improve eccentric control", "Progress to functional movements", "Full range of motion"],
      exercises: [
        {
          name: "Mini Squats",
          sets: "Every other day",
          duration: "3 sets x 12-15 reps",
          description: "Partial depth squats (45-60°), focus on controlled descent"
        },
        {
          name: "Step-Ups",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 each leg",
          description: "Low step (4-6 inches), progress height as strength improves"
        },
        {
          name: "Eccentric Leg Press",
          sets: "2-3 times weekly",
          duration: "3 sets x 8-10 reps",
          description: "Slow 4-count lowering phase, use both legs to push up, single leg to lower"
        },
        {
          name: "Walking Lunges",
          sets: "3 times weekly",
          duration: "2 sets x 10 each leg",
          description: "Shallow lunges initially, progress depth as tolerated"
        },
        {
          name: "Bike with Light Resistance",
          sets: "Daily",
          duration: "20-30 minutes",
          description: "Add light resistance, maintain smooth cadence, increase duration"
        },
        {
          name: "Deep Tissue Massage",
          sets: "3-4 times weekly",
          duration: "15-20 minutes",
          description: "Focus on quad, hip flexors, and IT band. Release trigger points"
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport",
      days: "Weeks 5-8",
      goals: ["Sport-specific conditioning", "Power development", "Agility and speed work", "Injury prevention"],
      exercises: [
        {
          name: "Full Squats & Lunges",
          sets: "3-4 times weekly",
          duration: "4 sets x 8-12 reps",
          description: "Full depth movements with progressive weight loading"
        },
        {
          name: "Single-Leg Exercises",
          sets: "3 times weekly",
          duration: "3 sets x 10 each leg",
          description: "Bulgarian split squats, single-leg press, pistol squat progressions"
        },
        {
          name: "Plyometric Training",
          sets: "2-3 times weekly",
          duration: "3-4 sets x 8-10 reps",
          description: "Box jumps, squat jumps, split jumps - progress from bilateral to unilateral"
        },
        {
          name: "Sprint Progressions",
          sets: "Every other day",
          duration: "Progressive intensity",
          description: "Week 5-6: 70% effort. Week 7-8: 85-100% effort with full recovery"
        },
        {
          name: "Agility Drills",
          sets: "3 times weekly",
          duration: "15-20 minutes",
          description: "Ladder drills, cone drills, cutting patterns at increasing speeds"
        },
        {
          name: "Maintenance Massage",
          sets: "1-2 times weekly",
          duration: "20-30 minutes",
          description: "Maintain tissue quality, focus on recovery and prevention"
        }
      ]
    }
  ]
};

export default function QuadRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "acute-quad",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your quadriceps recovery program has been assigned and will guide your training until completion.",
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
                    This comprehensive program will guide your quadriceps recovery and return to full activity.
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
                  Quadriceps strains can range from mild (Grade 1) to severe (Grade 3). This program is designed for Grade 1-2 strains. 
                  If you experience severe pain, inability to bear weight, visible deformity, or significant bruising, seek immediate medical 
                  evaluation. Progress through phases only when previous phase goals are achieved pain-free.
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
