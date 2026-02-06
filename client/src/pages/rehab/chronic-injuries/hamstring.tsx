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
  title: "Chronic Hamstring Tendinopathy & Recurrent Strain Recovery",
  duration: "8-16 weeks",
  phases: [
    {
      name: "Phase 1: Load Management & Pain Reduction",
      days: "Weeks 1-3",
      goals: ["Reduce chronic pain levels", "Identify and modify aggravating activities", "Begin isometric loading", "Address movement dysfunctions"],
      exercises: [
        {
          name: "Activity Modification",
          sets: "Ongoing",
          duration: "Throughout phase",
          description: "Temporarily reduce running volume by 50%, avoid sprinting and deep hip flexion positions that compress proximal hamstring"
        },
        {
          name: "Isometric Hamstring Holds",
          sets: "Daily",
          duration: "5 sets x 45-second holds",
          description: "Nordic curl position at 30° knee flexion, or bridge position. Isometrics have analgesic effect on tendons"
        },
        {
          name: "Supine Bridge Holds",
          sets: "2 times daily",
          duration: "4 sets x 30-45 seconds",
          description: "Feet elevated on box/step, hold bridge position focusing on hamstring engagement"
        },
        {
          name: "Hip Hinge Pattern Training",
          sets: "Daily",
          duration: "3 sets x 10 reps",
          description: "Romanian deadlift pattern with no weight, focus on hip hinge mechanics and hamstring lengthening"
        },
        {
          name: "Neural Slider/Glides",
          sets: "2 times daily",
          duration: "3 sets x 15 reps",
          description: "Seated sciatic nerve glides: extend knee while looking up, flex knee while looking down"
        },
        {
          name: "Gluteal Strengthening",
          sets: "Every other day",
          duration: "3 sets x 12-15 reps",
          description: "Clamshells, side-lying hip abduction, glute bridges - address glute weakness that overloads hamstrings"
        }
      ]
    },
    {
      name: "Phase 2: Progressive Tendon Loading",
      days: "Weeks 4-7",
      goals: ["Progressive eccentric loading", "Improve hamstring strength through range", "Address hip and trunk stability", "Begin running progression"],
      exercises: [
        {
          name: "Nordic Curl Progression",
          sets: "3 times weekly",
          duration: "4 sets x 6-8 reps",
          description: "Assisted Nordic curls with band or partner support. Focus on slow eccentric (5-count lowering)"
        },
        {
          name: "Single-Leg Romanian Deadlift",
          sets: "3 times weekly",
          duration: "3 sets x 8-10 each leg",
          description: "Progress from bodyweight to weighted. Focus on pelvic stability and hamstring tension"
        },
        {
          name: "Hip Thrust Variations",
          sets: "2-3 times weekly",
          duration: "3 sets x 10-12 reps",
          description: "Barbell or dumbbell hip thrusts, progress to single leg variations"
        },
        {
          name: "Eccentric Leg Curl",
          sets: "2-3 times weekly",
          duration: "3 sets x 8-10 reps",
          description: "Machine leg curl with slow 5-second eccentric phase, use both legs to lift, one to lower"
        },
        {
          name: "Running Progression",
          sets: "3 times weekly",
          duration: "Progressive",
          description: "Week 4-5: Easy jogging 15-20 min. Week 6-7: Build to 30 min with strides at 70% effort"
        },
        {
          name: "Core and Hip Stability",
          sets: "4 times weekly",
          duration: "15-20 minutes",
          description: "Dead bugs, bird dogs, Pallof press, single-leg balance variations"
        }
      ]
    },
    {
      name: "Phase 3: High-Load Strengthening",
      days: "Weeks 8-12",
      goals: ["Build hamstring strength and capacity", "Tolerate high-speed running", "Address any remaining deficits", "Sport-specific preparation"],
      exercises: [
        {
          name: "Full Nordic Curls",
          sets: "2-3 times weekly",
          duration: "4 sets x 5-8 reps",
          description: "Unassisted Nordic curls, focus on controlling descent as far as possible before pushing up"
        },
        {
          name: "Heavy Romanian Deadlifts",
          sets: "2 times weekly",
          duration: "4 sets x 6-8 reps",
          description: "Progressive loading, maintain strict form with hamstring focus"
        },
        {
          name: "Slider Leg Curls",
          sets: "3 times weekly",
          duration: "3 sets x 8-12 reps",
          description: "Supine with feet on sliders, extend and curl legs while maintaining bridge. Progress to single leg"
        },
        {
          name: "Sprint Progression",
          sets: "Every 2-3 days",
          duration: "Progressive intensity",
          description: "Week 8-10: Build to 85% sprints. Week 11-12: Include 95-100% efforts with full recovery"
        },
        {
          name: "Plyometric Training",
          sets: "2 times weekly",
          duration: "3 sets x 8-10 reps",
          description: "Bounds, broad jumps, single-leg hops - build explosive hamstring capacity"
        },
        {
          name: "High-Speed Running Mechanics",
          sets: "2-3 times weekly",
          duration: "20-30 minutes",
          description: "A-skips, B-skips, wicket runs, acceleration mechanics drills"
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport & Maintenance",
      days: "Weeks 13-16+",
      goals: ["Full sport participation", "Maintain hamstring capacity", "Injury prevention programming", "Long-term management"],
      exercises: [
        {
          name: "Full Training Integration",
          sets: "As per sport demands",
          duration: "Progressive",
          description: "Gradual return to full training volume. Week 13: 75%, Week 14: 85%, Week 15+: 100%"
        },
        {
          name: "Maintenance Nordic Protocol",
          sets: "2 times weekly",
          duration: "3 sets x 5-6 reps",
          description: "Continue Nordic curls year-round - reduces hamstring injury risk by up to 70%"
        },
        {
          name: "Weekly Strength Maintenance",
          sets: "2 times weekly",
          duration: "30-40 minutes",
          description: "Single-leg RDL, hip thrusts, leg curls - maintain hamstring strength and capacity"
        },
        {
          name: "Pre-Training Activation",
          sets: "Before every session",
          duration: "5-10 minutes",
          description: "Glute bridges, band walks, leg swings, hamstring walkouts as warm-up routine"
        },
        {
          name: "Sprint Maintenance",
          sets: "2 times weekly",
          duration: "6-8 reps x 40-60m",
          description: "Regular sprint exposure maintains hamstring adaptations and reduces injury risk"
        },
        {
          name: "Load Monitoring",
          sets: "Ongoing",
          duration: "Weekly review",
          description: "Track training load, avoid sudden spikes in volume or intensity that increase injury risk"
        }
      ]
    }
  ]
};

export default function ChronicHamstringRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "chronic-hamstring",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your chronic hamstring recovery program has been assigned and will guide your training.",
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
                    This comprehensive program addresses chronic hamstring issues and prevents future re-injury.
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
                  Chronic hamstring issues often involve proximal hamstring tendinopathy (near the ischial tuberosity) or recurrent strains. 
                  If you experience significant sitting pain, pain radiating down the leg, or numbness/tingling, consult a sports medicine 
                  physician. This program emphasizes the Nordic protocol and progressive eccentric loading, which have the strongest evidence 
                  for hamstring injury prevention and treatment.
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
              Chronic conditions require patience - consistency over intensity
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
                The Nordic protocol should become a permanent part of your training. Studies show it reduces hamstring injuries by up to 70% when maintained year-round.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
