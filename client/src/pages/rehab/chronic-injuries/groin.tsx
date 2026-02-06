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
  title: "Chronic Groin Pain & Adductor Tendinopathy Recovery",
  duration: "10-20 weeks",
  phases: [
    {
      name: "Phase 1: Pain Management & Initial Loading",
      days: "Weeks 1-3",
      goals: ["Reduce chronic pain levels", "Identify movement triggers", "Begin gentle adductor loading", "Address hip mobility deficits"],
      exercises: [
        {
          name: "Activity Modification",
          sets: "Ongoing",
          duration: "Throughout phase",
          description: "Reduce kicking, sprinting, and side-stepping activities by 50-70%. Avoid positions that reproduce pain"
        },
        {
          name: "Isometric Adductor Squeeze",
          sets: "Daily",
          duration: "5 sets x 45-second holds at 50% effort",
          description: "Supine with pillow/ball between knees, gradual squeeze and hold. Isometrics reduce tendon pain"
        },
        {
          name: "Supine Hip Adduction",
          sets: "2 times daily",
          duration: "3 sets x 12-15 reps",
          description: "Lying on back, slide leg out to side and return to midline with control"
        },
        {
          name: "Hip Flexor Mobility",
          sets: "Daily",
          duration: "3 x 60 seconds each side",
          description: "Half-kneeling hip flexor stretch, maintain neutral spine, progress to couch stretch"
        },
        {
          name: "Hip Internal/External Rotation",
          sets: "Daily",
          duration: "3 sets x 10 each direction",
          description: "90/90 hip stretches, controlled articular rotations - improve hip mobility"
        },
        {
          name: "Stationary Bike",
          sets: "Daily",
          duration: "20-30 minutes",
          description: "Low resistance, narrow stance, maintain fitness without aggravating groin"
        }
      ]
    },
    {
      name: "Phase 2: Progressive Loading & Strengthening",
      days: "Weeks 4-8",
      goals: ["Copenhagen protocol initiation", "Build adductor strength", "Improve hip stability", "Begin running on flat terrain"],
      exercises: [
        {
          name: "Copenhagen Side Plank (Short Lever)",
          sets: "Every other day",
          duration: "3 sets x 6-10 reps each side",
          description: "Bent knee version: side plank with top knee on bench, lift bottom leg. Progress hold time"
        },
        {
          name: "Standing Cable/Band Adduction",
          sets: "3 times weekly",
          duration: "3 sets x 12-15 reps each leg",
          description: "Standing hip adduction with resistance, controlled through full range"
        },
        {
          name: "Lateral Lunge Progressions",
          sets: "2-3 times weekly",
          duration: "3 sets x 8-10 each side",
          description: "Bodyweight side lunges, focus on controlled eccentric loading of adductors"
        },
        {
          name: "Sumo Squat",
          sets: "3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Wide stance squat targeting adductors, progress weight as tolerated"
        },
        {
          name: "Hip Strengthening Circuit",
          sets: "3 times weekly",
          duration: "3 sets each exercise",
          description: "Glute bridges, clamshells, fire hydrants, banded side steps - address hip weakness"
        },
        {
          name: "Running Introduction",
          sets: "Week 6-8, 3 times weekly",
          duration: "15-20 minutes",
          description: "Straight-line jogging only, flat surfaces, no cutting or kicking"
        }
      ]
    },
    {
      name: "Phase 3: Advanced Strengthening & Sport Preparation",
      days: "Weeks 9-14",
      goals: ["Full Copenhagen protocol", "Multi-directional movement", "Cutting and kicking introduction", "Build sport-specific tolerance"],
      exercises: [
        {
          name: "Copenhagen Side Plank (Long Lever)",
          sets: "3 times weekly",
          duration: "3 sets x 8-12 reps each side",
          description: "Full version: straight leg on bench. Progress to dynamic lowering and lifting"
        },
        {
          name: "Weighted Adductor Exercises",
          sets: "2-3 times weekly",
          duration: "4 sets x 8-10 reps",
          description: "Machine adduction or cable work with progressive resistance"
        },
        {
          name: "Single-Leg Romanian Deadlift",
          sets: "3 times weekly",
          duration: "3 sets x 10 each leg",
          description: "Focus on pelvic stability and posterior chain strength"
        },
        {
          name: "Cutting Progressions",
          sets: "2-3 times weekly",
          duration: "Progressive intensity",
          description: "Week 9-10: Light cutting at 50%. Week 11-14: Progress to 80-90% intensity"
        },
        {
          name: "Kicking Progressions",
          sets: "3 times weekly",
          duration: "Progressive intensity",
          description: "Start with short passes, progress distance and power over 4-6 weeks"
        },
        {
          name: "Agility Ladder Drills",
          sets: "2-3 times weekly",
          duration: "15-20 minutes",
          description: "Multi-directional footwork patterns, progress speed gradually"
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport & Long-Term Prevention",
      days: "Weeks 15-20+",
      goals: ["Full sport participation", "Maintain adductor capacity", "Injury prevention programming", "Manage load long-term"],
      exercises: [
        {
          name: "Full Training Integration",
          sets: "Progressive",
          duration: "Week by week",
          description: "Week 15-16: 75% training. Week 17-18: Full training with monitoring. Week 19+: Competition ready"
        },
        {
          name: "Maintenance Copenhagen Protocol",
          sets: "2 times weekly ongoing",
          duration: "3 sets x 8-10 reps",
          description: "Continue Copenhagen exercises year-round - shown to reduce groin injury by 41%"
        },
        {
          name: "Weekly Strength Maintenance",
          sets: "2 times weekly",
          duration: "25-30 minutes",
          description: "Sumo squats, lateral lunges, cable adduction - maintain adductor strength"
        },
        {
          name: "Dynamic Warm-Up Protocol",
          sets: "Before all training",
          duration: "10-15 minutes",
          description: "Adductor activation, hip circles, lateral movements, progressive kicks"
        },
        {
          name: "Load Monitoring",
          sets: "Ongoing",
          duration: "Weekly review",
          description: "Track high-intensity kicking volume, cutting loads, avoid sudden spikes in activity"
        },
        {
          name: "Hip Mobility Maintenance",
          sets: "Daily",
          duration: "5-10 minutes",
          description: "Continue hip flexor stretching and rotation work to maintain mobility"
        }
      ]
    }
  ]
};

export default function ChronicGroinRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "chronic-groin",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your chronic groin recovery program has been assigned.",
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
                    This program uses the Copenhagen protocol, the gold standard for groin injury prevention and treatment.
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
                  Chronic groin pain has many potential causes: adductor tendinopathy, sports hernia (athletic pubalgia), hip impingement, 
                  or osteitis pubis. If you experience pain at the pubic bone, clicking in the hip, or symptoms that haven't improved after 
                  6-8 weeks of this program, seek evaluation from a sports medicine physician. Imaging (MRI) may be needed to clarify the diagnosis.
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
              Chronic groin issues require patience - the Copenhagen protocol is your long-term solution
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
                The Copenhagen protocol has Level 1 evidence for groin injury prevention (41% reduction). Make it a permanent part of your training even after full recovery.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
