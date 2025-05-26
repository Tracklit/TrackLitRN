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
  title: "Chronic Foot Pain & Plantar Fasciitis Recovery",
  duration: "6-12 weeks",
  phases: [
    {
      name: "Phase 1: Pain Management & Mobility",
      days: "Weeks 1-2",
      goals: ["Reduce pain and inflammation", "Improve ankle mobility", "Begin gentle strengthening"],
      exercises: [
        {
          name: "Ice Massage",
          sets: "2-3 times daily",
          duration: "5-10 minutes",
          description: "Roll frozen water bottle under foot to reduce inflammation"
        },
        {
          name: "Towel Stretch",
          sets: "3 sets",
          duration: "30 seconds hold",
          description: "Pull toes toward shin using towel, especially in morning"
        },
        {
          name: "Alphabet Draws",
          sets: "2-3 sets",
          duration: "Full alphabet",
          description: "Draw letters with big toe to improve ankle mobility"
        },
        {
          name: "Marble Pickups",
          sets: "2 sets",
          duration: "10-15 marbles",
          description: "Strengthen intrinsic foot muscles by picking up marbles with toes"
        }
      ]
    },
    {
      name: "Phase 2: Strengthening & Flexibility",
      days: "Weeks 3-6",
      goals: ["Strengthen foot and calf muscles", "Improve flexibility", "Correct movement patterns"],
      exercises: [
        {
          name: "Calf Raises",
          sets: "3 sets",
          duration: "12-15 reps",
          description: "Both double and single leg variations, progress to eccentric emphasis"
        },
        {
          name: "Resistance Band Exercises",
          sets: "2-3 sets",
          duration: "10-12 reps each direction",
          description: "Plantar flexion, dorsiflexion, inversion, eversion"
        },
        {
          name: "Wall Calf Stretch",
          sets: "3 sets each leg",
          duration: "45 seconds",
          description: "Both straight knee and bent knee variations"
        },
        {
          name: "Short Foot Exercise",
          sets: "3 sets",
          duration: "10 second holds",
          description: "Create arch by pulling toes toward heel without curling toes"
        },
        {
          name: "Balance Training",
          sets: "3 sets",
          duration: "30-60 seconds",
          description: "Single leg balance, progress to eyes closed and unstable surfaces"
        }
      ]
    },
    {
      name: "Phase 3: Dynamic Strengthening",
      days: "Weeks 7-10",
      goals: ["Dynamic stability", "Sport-specific movements", "Load tolerance"],
      exercises: [
        {
          name: "Hopping Progressions",
          sets: "2-3 sets",
          duration: "10-15 reps",
          description: "Forward/backward, side-to-side, progress to single leg"
        },
        {
          name: "Plyometric Exercises",
          sets: "2-3 sets",
          duration: "8-12 reps",
          description: "Jump squats, lateral bounds, controlled landing practice"
        },
        {
          name: "Agility Ladder Drills",
          sets: "3-4 sets",
          duration: "30 seconds",
          description: "Various footwork patterns to improve coordination"
        },
        {
          name: "Hill Walking",
          sets: "1 session",
          duration: "15-20 minutes",
          description: "Uphill walking to strengthen posterior chain"
        },
        {
          name: "Sport-Specific Drills",
          sets: "Gradually increase",
          duration: "Variable",
          description: "Begin sport-specific movements at 50-70% intensity"
        }
      ]
    },
    {
      name: "Phase 4: Return to Full Activity",
      days: "Weeks 11-12+",
      goals: ["Full sport participation", "Injury prevention", "Long-term maintenance"],
      exercises: [
        {
          name: "Running Progression",
          sets: "Build gradually",
          duration: "Week by week increase",
          description: "Start with 50% pace/distance, increase by 10% weekly"
        },
        {
          name: "Cutting and Direction Changes",
          sets: "Multiple sets",
          duration: "Sport-specific",
          description: "Progress from controlled to reactive movements"
        },
        {
          name: "Maintenance Strengthening",
          sets: "3 times/week",
          duration: "Ongoing",
          description: "Continue calf raises, balance training, and flexibility"
        },
        {
          name: "Proper Footwear Assessment",
          sets: "Ongoing",
          duration: "Daily",
          description: "Ensure appropriate shoes for activities and foot mechanics"
        }
      ]
    }
  ]
};

export default function FootRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "chronic-foot",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your foot recovery program has been assigned and will guide your training until completion.",
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
    <div className="min-h-screen" style={{ backgroundColor: '#010a18' }}>
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
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
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
                    This comprehensive program will guide your recovery and prevent future foot issues.
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
                  Chronic foot conditions often require patience and consistency. If pain persists or worsens despite following this program, 
                  consider consulting a podiatrist or sports medicine physician for additional evaluation. Proper footwear and biomechanical 
                  assessment may be necessary for optimal outcomes.
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
                  ? 'border-orange-500/50 bg-orange-900/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === currentPhase 
                          ? 'bg-orange-500 text-white' 
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
              Chronic conditions require patience - progress may be gradual but consistent
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
                Recovery timeline varies with chronic conditions. Consistency is more important than speed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}