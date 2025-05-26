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
  Pause,
  SkipForward,
  Star
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
  title: "Acute Hamstring Strain Recovery",
  duration: "4-8 weeks",
  phases: [
    {
      name: "Phase 1: Immediate Care & Early Mobilization",
      days: "Week 1",
      goals: ["Control pain and swelling", "Prevent muscle shortening", "Begin gentle movement", "Protect healing tissue"],
      exercises: [
        {
          name: "RICE Protocol",
          sets: "First 24-48 hours",
          duration: "Continuous",
          description: "Rest, Ice (15-20 min every 2-3 hrs), Compression bandaging, Elevation when possible"
        },
        {
          name: "NSAIDs (if cleared by physician)",
          sets: "As prescribed",
          duration: "3-5 days max",
          description: "Ibuprofen 400mg 3x daily with food OR Naproxen as directed to reduce inflammation"
        },
        {
          name: "Compression Bandaging",
          sets: "Daily application",
          duration: "First week",
          description: "Elastic wrap from knee to mid-thigh, snug but not cutting circulation"
        },
        {
          name: "Very Gentle Range of Motion",
          sets: "Every 2 hours",
          duration: "5-10 slow reps",
          description: "Sitting knee flexion/extension within pain-free range, stop at first sign of discomfort"
        },
        {
          name: "Isometric Glute Activation",
          sets: "3-4 times daily",
          duration: "10 x 5-second holds",
          description: "Lying prone, gently squeeze glutes without moving legs. Unloaded muscle activation"
        },
        {
          name: "Gentle Massage Therapy",
          sets: "2-3 times daily",
          duration: "5-10 minutes",
          description: "Light effleurage strokes above and below injury site, avoid direct pressure on strain"
        }
      ]
    },
    {
      name: "Phase 2: Progressive Loading & Mobility",
      days: "Week 2",
      goals: ["Increase range of motion", "Begin strengthening", "Reduce bandaging dependence", "Progress massage intensity"],
      exercises: [
        {
          name: "Transition Bandaging",
          sets: "As needed",
          duration: "Reduce to activity only",
          description: "Switch to elastic therapeutic tape or reduce compression wrap usage to activity periods only"
        },
        {
          name: "NSAIDs Reduction",
          sets: "Taper dosage",
          duration: "Days 5-7",
          description: "Gradually reduce anti-inflammatory medication as acute inflammation subsides"
        },
        {
          name: "Active Range of Motion",
          sets: "4-5 times daily",
          duration: "2-3 sets of 15 reps",
          description: "Seated and standing knee flexion/extension, progress range as tolerated"
        },
        {
          name: "Isometric Hamstring Holds",
          sets: "3 times daily",
          duration: "3 sets x 10 holds, 8-10 seconds each",
          description: "Prone position, gentle hamstring contraction at multiple knee angles"
        },
        {
          name: "Gentle Stationary Bike",
          sets: "1-2 times daily",
          duration: "10-15 minutes",
          description: "No resistance, focus on smooth pedaling motion within comfortable range"
        },
        {
          name: "Progressive Massage Therapy",
          sets: "Daily",
          duration: "10-15 minutes",
          description: "Light cross-fiber friction massage around injury site, deeper pressure to surrounding muscles"
        }
      ]
    },
    {
      name: "Phase 3: Dynamic Strengthening",
      days: "Week 3-4",
      goals: ["Restore muscle strength", "Improve eccentric control", "Begin dynamic movement patterns"],
      exercises: [
        {
          name: "Discontinue Bandaging",
          sets: "Assessment day 14-18",
          duration: "Permanent",
          description: "Remove compression support once swelling subsided and strength improving"
        },
        {
          name: "Eccentric Hamstring Strengthening",
          sets: "Every other day",
          duration: "3 sets x 6-10 reps",
          description: "Assisted Nordic curls, single-leg Romanian deadlifts with body weight"
        },
        {
          name: "Dynamic Stretching",
          sets: "2-3 times daily",
          duration: "10-15 repetitions",
          description: "Leg swings, walking high knees, butt kicks (controlled amplitude)"
        },
        {
          name: "Progressive Walking/Jogging",
          sets: "Daily",
          duration: "15-25 minutes",
          description: "Week 3: brisk walking. Week 4: walk-jog intervals (2 min walk, 30 sec jog)"
        },
        {
          name: "Deep Tissue Massage",
          sets: "3-4 times weekly",
          duration: "15-20 minutes",
          description: "Deeper pressure, trigger point release, myofascial work on entire posterior chain"
        }
      ]
    },
    {
      name: "Phase 4: Return to Sport Preparation",
      days: "Week 5-8",
      goals: ["Sport-specific movement patterns", "High-intensity eccentric strength", "Injury prevention protocols"],
      exercises: [
        {
          name: "Advanced Eccentric Training",
          sets: "3 times weekly",
          duration: "4 sets x 8-12 reps",
          description: "Full Nordic curls, single-leg RDLs with weight, eccentric leg curls"
        },
        {
          name: "Sprint Progression",
          sets: "Every other day",
          duration: "Progressive intensity",
          description: "Week 5-6: 70% sprints x 4-6 reps. Week 7-8: 85-95% sprints x 6-8 reps"
        },
        {
          name: "Plyometric Progression",
          sets: "2-3 times weekly",
          duration: "3-4 sets x 6-10 reps",
          description: "Bounds, hops, reactive jumps. Progress from bilateral to unilateral"
        },
        {
          name: "Maintenance Massage",
          sets: "1-2 times weekly",
          duration: "20-30 minutes",
          description: "Focus on maintaining tissue quality and preventing re-injury"
        }
      ]
    }
  ]
};

// Daily Programs for Pro/Star Users
const dailyPrograms = {
  week1: [
    { day: 1, focus: "Initial Assessment & RICE", exercises: ["RICE Protocol", "Very Gentle ROM", "Compression Bandaging"], intensity: "Very Light" },
    { day: 2, focus: "Pain Management", exercises: ["Continue RICE", "Isometric Glute Activation", "Gentle Massage"], intensity: "Very Light" },
    { day: 3, focus: "Early Mobilization", exercises: ["Gentle ROM", "Light Massage", "NSAIDs as needed"], intensity: "Light" },
    { day: 4, focus: "Progressive Movement", exercises: ["Increased ROM", "Glute Activation", "Massage Therapy"], intensity: "Light" },
    { day: 5, focus: "Preparation for Phase 2", exercises: ["Active ROM", "Pain Assessment", "Bandaging Evaluation"], intensity: "Light" },
    { day: 6, focus: "Assessment Day", exercises: ["Range Testing", "Strength Assessment", "Plan Phase 2"], intensity: "Assessment" },
    { day: 7, focus: "Recovery", exercises: ["Light Massage", "Gentle Movement", "Rest"], intensity: "Recovery" }
  ],
  week2: [
    { day: 8, focus: "Phase 2 Initiation", exercises: ["Active ROM", "Isometric Holds", "Reduced Bandaging"], intensity: "Light-Moderate" },
    { day: 9, focus: "Strength Building", exercises: ["Isometric Training", "Bike Work", "Progressive Massage"], intensity: "Moderate" },
    { day: 10, focus: "Mobility Focus", exercises: ["Dynamic ROM", "Bike Training", "Cross-fiber Massage"], intensity: "Moderate" },
    { day: 11, focus: "Progressive Loading", exercises: ["Isometric Progression", "Extended Bike", "Deep Massage"], intensity: "Moderate" },
    { day: 12, focus: "Strength Assessment", exercises: ["Strength Testing", "ROM Evaluation", "Massage"], intensity: "Moderate" },
    { day: 13, focus: "Phase 3 Preparation", exercises: ["Advanced ROM", "Strength Prep", "Assessment"], intensity: "Moderate" },
    { day: 14, focus: "Recovery & Evaluation", exercises: ["Light Activity", "Massage", "Phase 3 Planning"], intensity: "Recovery" }
  ]
};

export default function HamstringRehabPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showDailyPrograms, setShowDailyPrograms] = useState(false);

  const isProOrStar = user?.isPremium || user?.role === 'star';

  const handleSkipAhead = (phaseIndex: number) => {
    setCurrentPhase(phaseIndex);
    toast({
      title: "Phase Updated",
      description: `Moved to ${rehabProgram.phases[phaseIndex].name}. Please consult your physician or coach before advancing phases.`,
    });
  };

  const assignProgramMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rehab/assign-program", {
        programType: "acute-hamstring",
        programData: rehabProgram,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rehab Program Assigned!",
        description: "Your hamstring recovery program has been assigned and will override your current training until completion.",
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
          <Badge variant="secondary" className="bg-red-500/20 text-red-300">
            Acute Muscle Injury
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
              <span>Daily Guided Exercises</span>
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
                    This will replace your current training program with this rehabilitation protocol until recovery is complete.
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

        {/* Pro/Star Daily Programs */}
        {isProOrStar && (
          <Card className="mb-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-purple-300">Pro/Star Daily Programs</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDailyPrograms(!showDailyPrograms)}
                  className="border-purple-500/30 hover:bg-purple-900/20"
                >
                  {showDailyPrograms ? 'Hide' : 'Show'} Daily Programs
                </Button>
              </div>
              
              {showDailyPrograms && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-purple-200 mb-3">Week 1 - Initial Recovery</h4>
                    <div className="space-y-2">
                      {dailyPrograms.week1.map((day) => (
                        <div key={day.day} className="bg-gray-800/30 p-3 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-200">Day {day.day}</span>
                            <span className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded">
                              {day.intensity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{day.focus}</p>
                          <div className="text-xs text-gray-400">
                            {day.exercises.join(' • ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-purple-200 mb-3">Week 2 - Progressive Loading</h4>
                    <div className="space-y-2">
                      {dailyPrograms.week2.map((day) => (
                        <div key={day.day} className="bg-gray-800/30 p-3 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-200">Day {day.day}</span>
                            <span className="text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                              {day.intensity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{day.focus}</p>
                          <div className="text-xs text-gray-400">
                            {day.exercises.join(' • ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Warning */}
        <Card className="mb-8 bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-300 mb-2">Important Medical Disclaimer</h3>
                <p className="text-yellow-200 text-sm leading-relaxed">
                  This program is for educational purposes and should complement, not replace, professional medical care. 
                  Stop exercises if pain increases. Consult your healthcare provider before starting this program, 
                  especially for Grade 2-3 strains or if symptoms persist beyond expected timeframes.
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
                  ? 'border-blue-500/50 bg-blue-900/20' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === currentPhase 
                          ? 'bg-blue-500 text-white' 
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
                  <div className="flex items-center gap-2">
                    {index > currentPhase && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSkipAhead(index)}
                        className="text-orange-400 border-orange-500/30 hover:bg-orange-900/20 text-xs"
                      >
                        <SkipForward className="h-3 w-3 mr-1" />
                        Skip Ahead
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPhase(index === currentPhase ? -1 : index)}
                      className="text-gray-400 hover:text-white"
                    >
                      {index === currentPhase ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
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
                    <h4 className="font-semibold text-white mb-4">Daily Exercises:</h4>
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
              Track your progress through each phase of recovery
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
                This is a visual representation. Your actual recovery may vary based on individual factors.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}