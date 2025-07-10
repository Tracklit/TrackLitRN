import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Calculator, Book, MapPin, Dumbbell } from "lucide-react";

function SimpleApp() {
  // Mock data for demonstration
  const mockCards = [
    {
      id: 'today',
      date: new Date(),
      title: 'Today',
      isWorkout: true,
      workouts: [
        { type: 'Short Distance', content: '3x60m starts, 2x100m builds' },
        { type: 'Pre-Activation', content: 'Dynamic warm-up routine' }
      ]
    },
    {
      id: 'tomorrow',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      title: 'Tomorrow',
      isWorkout: false,
      isMeet: true,
      meetName: 'Spring Invitational',
      meetLocation: 'Stadium Track'
    },
    {
      id: 'day2',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      title: 'Day 3',
      isWorkout: true,
      workouts: [
        { type: 'Medium Distance', content: '4x200m @ 95%' },
        { type: 'Long Distance', content: '8x400m tempo' }
      ]
    },
    {
      id: 'day3',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      title: 'Day 4',
      isWorkout: false,
      isRest: true
    }
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <div className="relative">
          {/* Header */}
          <div className="bg-white shadow-sm p-4">
            <h1 className="text-2xl font-bold text-center">Training Schedule</h1>
            <p className="text-center text-gray-600 mt-1">Vertical Card Layout Demo</p>
          </div>

          {/* Programs Dropdown - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
              Your Programs
            </Button>
          </div>

          {/* Cards Container */}
          <div 
            className="max-w-md mx-auto h-[calc(100vh-120px)] overflow-y-auto scroll-smooth p-4"
            style={{
              scrollSnapType: 'y mandatory',
              scrollPadding: '20px',
            }}
          >
            {mockCards.map((card) => (
              <Card 
                key={card.id}
                className="min-h-[400px] mb-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-lg"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                }}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">{card.title}</h3>
                      <p className="text-white/80 text-sm">{formatDate(card.date)}</p>
                    </div>
                    
                    {/* Action Icons */}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                      >
                        <Calculator className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                      >
                        <Book className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  {card.isMeet ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-5 w-5 text-yellow-300" />
                        <span className="text-lg font-semibold">Meet Day</span>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="font-semibold text-lg">{card.meetName}</h4>
                        <p className="text-white/80">{card.meetLocation}</p>
                      </div>
                    </div>
                  ) : card.isWorkout ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Dumbbell className="h-5 w-5 text-green-300" />
                        <span className="text-lg font-semibold">Training Day</span>
                      </div>
                      <div className="space-y-3">
                        {card.workouts?.map((workout, index) => (
                          <div key={index} className="bg-white/10 rounded-lg p-3">
                            <h5 className="font-medium text-sm text-white/80">{workout.type}</h5>
                            <p className="text-white">{workout.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-white/60" />
                      <h4 className="text-xl font-semibold mb-2">Rest Day</h4>
                      <p className="text-white/80">No training scheduled</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default SimpleApp;