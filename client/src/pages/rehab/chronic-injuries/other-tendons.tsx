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
  title: "Other Tendon Injuries Recovery Program",
  description: "Comprehensive rehabilitation for chronic tendinopathies (IT band, tibialis, peroneal, hip flexor, etc.)",
  duration: "8-16 weeks",
  phases: [
    {
      name: "Phase 1: Pain Management & Load Modification",
      days: "Weeks 1-3",
      goals: ["Identify and modify provocative activities", "Reduce pain and inflammation", "Begin isometric loading", "Maintain general fitness"],
      exercises: [
        {
          name: "Activity Modification",
          sets: "Ongoing",
          duration: "Throughout phase",
          description: "Reduce training volume by 50-70%, identify specific movements that aggravate symptoms, modify or temporarily eliminate these activities"
        },
        {
          name: "Isometric Loading",
          sets: "Daily",
          duration: "5 sets x 45-second holds",
          description: "Hold muscle contraction at mid-range for affected tendon. Example: wall sit for patellar, side-lying hip abduction hold for IT band"
        },
        {
          name: "Ice/Heat Application",
          sets: "2-3 times daily",
          duration: "15-20 minutes",
          description: "Ice for acute flare-ups, heat before exercise. Monitor response - some tendons respond better to heat"
        },
        {
          name: "Gentle Range of Motion",
          sets: "2 times daily",
          duration: "10 reps each direction",
          description: "Pain-free movement through available range to maintain mobility without loading"
        },
        {
          name: "Cross-Training Cardio",
          sets: "4-5 times weekly",
          duration: "20-30 minutes",
          description: "Swimming, cycling, elliptical - activities that don't aggravate specific tendon. Maintain cardiovascular fitness"
        },
        {
          name: "Foam Rolling Adjacent Areas",
          sets: "Daily",
          duration: "2-3 minutes per area",
          description: "Roll muscles above and below affected tendon - avoid rolling directly on irritated tendon"
        }
      ]
    },
    {
      name: "Phase 2: Progressive Tendon Loading",
      days: "Weeks 4-7",
      goals: ["Progress from isometric to isotonic loading", "Improve tendon capacity", "Address muscle imbalances", "Begin low-intensity sport-specific movement"],
      exercises: [
        {
          name: "Heavy Slow Resistance Training",
          sets: "3 times weekly",
          duration: "4 sets x 8-10 reps",
          description: "Slow concentric and eccentric phases (3-4 seconds each) for affected tendon's muscle group. Progressive loading is key"
        },
        {
          name: "Eccentric Training Protocol",
          sets: "Daily",
          duration: "3 sets x 15 reps",
          description: "Emphasize slow lowering phase (6 seconds). Specific exercises depend on tendon: heel drops for Achilles, decline squats for patellar"
        },
        {
          name: "Isolated Strengthening",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps",
          description: "Target specific muscle-tendon unit: hip flexor raises for iliopsoas, clamshells for hip abductors, ankle inversions for tibialis posterior"
        },
        {
          name: "Balance and Proprioception",
          sets: "Daily",
          duration: "10 minutes",
          description: "Single-leg balance progressions on various surfaces, eyes open then closed"
        },
        {
          name: "Sport-Specific Warm-Up Drills",
          sets: "Before training",
          duration: "10-15 minutes",
          description: "Light jogging, dynamic stretches, activation exercises targeting affected area"
        },
        {
          name: "Walking/Light Jogging",
          sets: "4-5 times weekly",
          duration: "20-30 minutes",
          description: "Flat surfaces, comfortable pace. Monitor symptoms - slight discomfort OK if resolves quickly"
        }
      ]
    },
    {
      name: "Phase 3: Sport-Specific Reconditioning",
      days: "Weeks 8-12",
      goals: ["Build strength endurance", "Progressive running and sport drills", "Single-leg plyometric preparation", "Address movement patterns"],
      exercises: [
        {
          name: "Progressive Running Program",
          sets: "3-4 times weekly",
          duration: "Build to 30-45 minutes",
          description: "Week 8-9: Easy running with walk breaks. Week 10-12: Continuous running, add tempo intervals"
        },
        {
          name: "Strength Training Progression",
          sets: "3 times weekly",
          duration: "4 sets x 6-8 reps",
          description: "Increase load progressively. Include compound movements: squats, deadlifts, lunges with focus on quality"
        },
        {
          name: "Plyometric Introduction",
          sets: "2 times weekly",
          duration: "3 sets x 10 reps",
          description: "Low-level plyometrics: pogo hops, box step-ups, bounding walks. Progress based on tolerance"
        },
        {
          name: "Sport-Specific Drills",
          sets: "2-3 times weekly",
          duration: "15-20 minutes",
          description: "Running drills: A-skips, high knees, lateral shuffles, cutting. Progress intensity weekly"
        },
        {
          name: "Single-Leg Exercises",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 each leg",
          description: "Single-leg squats, Romanian deadlifts, step-downs - build unilateral strength and control"
        },
        {
          name: "Flexibility and Mobility Work",
          sets: "Daily",
          duration: "10-15 minutes",
          description: "Dynamic stretches before activity, static stretches after. Focus on kinetic chain flexibility"
        }
      ]
    },
    {
      name: "Phase 4: Return to Full Activity & Prevention",
      days: "Weeks 13-16+",
      goals: ["Full sport participation", "High-intensity training", "Long-term maintenance program", "Injury prevention strategies"],
      exercises: [
        {
          name: "Full Training Integration",
          sets: "Progressive",
          duration: "Week by week",
          description: "Week 13-14: 75% volume. Week 15: 90%. Week 16+: Full participation with monitoring"
        },
        {
          name: "High-Intensity Plyometrics",
          sets: "2 times weekly",
          duration: "20-25 minutes",
          description: "Depth jumps, reactive bounding, sport-specific jumping patterns"
        },
        {
          name: "Sprint and Speed Work",
          sets: "1-2 times weekly",
          duration: "Progressive",
          description: "Gradual reintroduction of sprinting, acceleration/deceleration drills"
        },
        {
          name: "Maintenance Strength Program",
          sets: "2-3 times weekly, ongoing",
          duration: "30-40 minutes",
          description: "Continue heavy loading 2x/week for affected tendon plus full-body strength work"
        },
        {
          name: "Pre-Activity Activation",
          sets: "Before all training",
          duration: "10 minutes",
          description: "Specific warm-up targeting affected area: bands, activation exercises, dynamic prep"
        },
        {
          name: "Load Management",
          sets: "Ongoing",
          duration: "Weekly review",
          description: "Monitor training volume, avoid sudden increases >10% weekly, maintain adequate recovery between sessions"
        }
      ]
    }
  ]
};

export default function ChronicOtherTendonsRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "chronic-other-tendons",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your tendon recovery program has been assigned.",
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
          <p className="text-gray-400 mb-4">{rehabProgram.description}</p>
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
                    Universal tendinopathy protocol adaptable for IT band, tibialis posterior, peroneal, hip flexor, and other tendons.
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
                  Tendinopathy rehabilitation requires progressive loading - complete rest is often counterproductive. 
                  Some discomfort during exercise (up to 4/10 pain) is acceptable if it settles within 24 hours. If pain 
                  significantly increases or persists beyond 24 hours, reduce load and consult a healthcare provider. 
                  Recovery timelines vary significantly based on tendon location, duration of symptoms, and individual factors. 
                  This protocol can be adapted for various tendons including IT band syndrome, tibialis posterior tendinopathy, 
                  peroneal tendinopathy, hip flexor tendinopathy, and similar conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applicable Conditions */}
        <Card className="mb-8 bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-300 mb-3">Applicable Tendon Conditions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                "IT Band Syndrome",
                "Tibialis Posterior Tendinopathy",
                "Peroneal Tendinopathy",
                "Hip Flexor (Iliopsoas) Tendinopathy",
                "Gluteal Tendinopathy",
                "Proximal Hamstring Tendinopathy",
                "Posterior Tibial Tendon Dysfunction",
                "Rectus Femoris Tendinopathy",
                "Other Chronic Tendon Injuries"
              ].map((condition, index) => (
                <Badge key={index} variant="outline" className="text-blue-200 border-blue-500/50 justify-center py-2">
                  {condition}
                </Badge>
              ))}
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
              Tendinopathy recovery typically requires 8-16 weeks - patience and consistent loading are key
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
                Key progress indicators: decreased morning stiffness, reduced pain during activity, improved exercise tolerance, 
                and ability to increase load without symptom flare. Track these markers weekly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
