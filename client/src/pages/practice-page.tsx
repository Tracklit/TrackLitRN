import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Calculator,
  Dumbbell
} from "lucide-react";
import { PageContainer } from "@/components/page-container";

interface Session {
  dayNumber: number;
  date: string;
  isRestDay?: boolean;
  shortDistanceWorkout?: string;
  mediumDistanceWorkout?: string;
  longDistanceWorkout?: string;
  extraSession?: string;
}

interface Meet {
  id: number;
  name: string;
  location: string;
  date: string;
}

export default function PracticePage() {
  const { user } = useAuth();
  const [currentDayOffset, setCurrentDayOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [useFirstFootTiming, setUseFirstFootTiming] = useState(false);
  const [adjustForTrackType, setAdjustForTrackType] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Touch/swipe states
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [currentTranslateX, setCurrentTranslateX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [nextContentTranslateX, setNextContentTranslateX] = useState<number>(0);
  const [showNextContent, setShowNextContent] = useState<boolean>(false);
  const [nextDayOffset, setNextDayOffset] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Queries
  const { data: assignedPrograms } = useQuery({
    queryKey: ["/api/assigned-programs"],
    enabled: !!user,
  });

  const { data: programSessions } = useQuery({
    queryKey: ["/api/programs", assignedPrograms?.[0]?.programId],
    enabled: !!assignedPrograms?.[0]?.programId,
  });

  const { data: meets } = useQuery({
    queryKey: ["/api/meets"],
    enabled: !!user,
  });

  const { data: athleteProfile } = useQuery({
    queryKey: ["/api/athlete-profile"],
    enabled: !!user,
  });

  const selectedProgram = assignedPrograms?.[0];
  const isLoading = !programSessions && !!selectedProgram;

  // Process session data
  const processSessionData = (sessions: any[], dayOffset: number, dateString: string) => {
    if (!sessions || sessions.length === 0) return null;
    
    const targetSession = sessions.find(s => s.date === dateString);
    if (!targetSession) return { isRestDay: true, date: dateString };
    
    return {
      ...targetSession,
      isRestDay: !targetSession.shortDistanceWorkout && 
                 !targetSession.mediumDistanceWorkout && 
                 !targetSession.longDistanceWorkout
    };
  };

  const currentSession = programSessions ? processSessionData(
    programSessions.sessions, 
    currentDayOffset, 
    selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  ) : null;

  // Format date for display
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Check for meets today
  const currentDayMeets = meets?.filter((meet: Meet) => {
    const meetDate = new Date(meet.date);
    const compareDate = new Date();
    compareDate.setDate(compareDate.getDate() + currentDayOffset);
    return meetDate.toDateString() === compareDate.toDateString();
  }) || [];

  const hasMeetsToday = currentDayMeets.length > 0;

  // Update selected date when offset changes
  useEffect(() => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + currentDayOffset);
    setSelectedDate(newDate);
  }, [currentDayOffset]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Only start dragging if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsDragging(true);
      setCurrentTranslateX(deltaX);
      
      // Prevent page scrolling during horizontal swipe
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || !isDragging) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    
    // Calculate 30% threshold
    const threshold = containerWidth * 0.3;
    
    if (Math.abs(deltaX) > threshold) {
      // Prepare next content
      const direction = deltaX > 0 ? 'prev' : 'next';
      const nextOffset = direction === 'prev' ? currentDayOffset - 1 : currentDayOffset + 1;
      
      setNextDayOffset(nextOffset);
      setShowNextContent(true);
      
      // Position next content off-screen on opposite side
      setNextContentTranslateX(deltaX > 0 ? -containerWidth : containerWidth);
      
      // Animate current content out and next content in
      setTimeout(() => {
        setCurrentTranslateX(deltaX > 0 ? containerWidth : -containerWidth);
        setNextContentTranslateX(0);
        
        // After animation completes, switch content
        setTimeout(() => {
          setCurrentDayOffset(nextOffset);
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + nextOffset);
          setSelectedDate(newDate);
          
          setCurrentTranslateX(0);
          setShowNextContent(false);
          setNextContentTranslateX(0);
        }, 300);
      }, 50);
    } else {
      // Snap back to original position
      setCurrentTranslateX(0);
    }
    
    // Reset touch states
    setTouchStartX(null);
    setTouchStartY(null);
    setIsDragging(false);
  };

  // Helper function to handle date navigation (for date picker)
  const handleDateNavigation = (direction: 'prev' | 'next') => {
    if (isTransitioning) return; // Prevent multiple rapid clicks
    
    setIsTransitioning(true);
    setCurrentDayOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
    
    // Update selected date
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? currentDayOffset - 1 : currentDayOffset + 1));
    setSelectedDate(newDate);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Helper function to get session data for a specific day offset
  const getSessionDataForOffset = (offset: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + offset);
    
    const dateString = targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    return processSessionData(programSessions?.sessions || [], offset, dateString);
  };

  // SessionContent component
  const SessionContent = ({ currentSession, isLoading, currentDayOffset }: {
    currentSession: any;
    isLoading: boolean;
    currentDayOffset: number;
  }) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <div className="p-2 bg-white/10" style={{ borderRadius: "6px" }}>
            <div className="flex items-start">
              <div className="bg-white/20 p-1.5 rounded-full mr-3 mt-0.5">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="h-4 w-16 mb-2 bg-white/20 rounded" />
                <div className="h-3 w-full mb-1 bg-white/20 rounded" />
                <div className="h-3 w-4/5 bg-white/20 rounded" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!currentSession || currentSession.isRestDay) {
      return (
        <div className="text-center py-8">
          <p className="text-white/80 text-sm">
            Rest day - no workout scheduled
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Track workout sections */}
        {currentSession.shortDistanceWorkout && (
          <div>
            <h4 className="font-semibold mb-2 text-white">60m/100m</h4>
            <p className="text-sm text-white/80">
              {currentSession.shortDistanceWorkout}
            </p>
          </div>
        )}
        
        {currentSession.mediumDistanceWorkout && (
          <div>
            <h4 className="font-semibold mb-2 text-white">200m</h4>
            <p className="text-sm text-white/80">
              {currentSession.mediumDistanceWorkout}
            </p>
          </div>
        )}
        
        {currentSession.longDistanceWorkout && (
          <div>
            <h4 className="font-semibold mb-2 text-white">400m</h4>
            <p className="text-sm text-white/80">
              {currentSession.longDistanceWorkout}
            </p>
          </div>
        )}
        
        {currentSession.extraSession && (
          <div>
            <h4 className="font-semibold mb-2 text-white">Extra Session</h4>
            <p className="text-sm text-white/80">
              {currentSession.extraSession}
            </p>
          </div>
        )}
        
        {/* Gym data display */}
        {currentSession.shortDistanceWorkout?.includes('Gym') && (
          <div className="mt-2 p-2 bg-white/10 rounded" style={{ borderRadius: '6px' }}>
            <p className="text-sm text-white/80">
              Gym session details available in full program
            </p>
          </div>
        )}
      </div>
    );
  };

  // JournalContent component
  const JournalContent = () => {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            Training Journal
          </p>
        </div>
      </div>
    );
  };

  // Render current content
  const renderCurrentContent = () => {
    return (
      <>
        {/* Daily Session Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 shadow-lg" style={{ 
          borderRadius: '6px',
          height: '33vh',
          boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              {formattedDate}
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDateNavigation('prev')}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDateNavigation('next')}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-full overflow-y-auto">
            <SessionContent 
              currentSession={currentSession}
              isLoading={isLoading}
              currentDayOffset={currentDayOffset}
            />
          </div>
        </div>
        
        {/* Training Journal */}
        <div className="bg-muted/40 p-3" style={{ borderRadius: '6px' }}>
          <JournalContent />
        </div>
      </>
    );
  };

  // Render next content (for carousel)
  const renderNextContent = () => {
    const nextSession = getSessionDataForOffset(nextDayOffset);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextDayOffset);
    const nextFormattedDate = nextDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    return (
      <>
        {/* Daily Session Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 shadow-lg" style={{ 
          borderRadius: '6px',
          height: '33vh',
          boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              {nextFormattedDate}
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDateNavigation('prev')}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDateNavigation('next')}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-full overflow-y-auto">
            <SessionContent 
              currentSession={nextSession}
              isLoading={false}
              currentDayOffset={nextDayOffset}
            />
          </div>
        </div>
        
        {/* Training Journal */}
        <div className="bg-muted/40 p-3" style={{ borderRadius: '6px' }}>
          <JournalContent />
        </div>
      </>
    );
  };

  return (
    <PageContainer className="pb-24">
      {/* Show meets if any exist for the current day */}
      {hasMeetsToday && (
        <>
          {/* Date navigation - Always visible for meet days */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center justify-between max-w-xs text-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateNavigation('prev')}
                disabled={isTransitioning}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 mx-3">
                <span className="text-sm font-medium min-w-[80px]">
                  {formattedDate}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDateNavigation('next')}
                disabled={isTransitioning}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {hasMeetsToday && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Today's Meets</h3>
          <div className="space-y-3">
            {currentDayMeets.map((meet: Meet) => (
              <Card key={meet.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{meet.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{meet.location}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {new Date(meet.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Only show workout content if no meets are scheduled */}
      {!hasMeetsToday && (
        <>
          {/* Daily Session Content */}
          <div className="relative overflow-hidden">
            {/* Current Content */}
            <div 
              ref={containerRef}
              className={`space-y-4 ${!isDragging ? 'transition-transform duration-300 ease-out' : ''}`}
              style={{
                transform: `translateX(${currentTranslateX}px)`,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {renderCurrentContent()}
            </div>
            
            {/* Next Content (for carousel effect) */}
            {showNextContent && (
              <div 
                className="absolute top-0 left-0 w-full space-y-4 transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(${nextContentTranslateX}px)`,
                }}
              >
                {renderNextContent()}
              </div>
            )}
          </div>
          
          {/* Target Times Calculator - Static outside fade transition */}
          <Collapsible 
            open={calculatorOpen}
            onOpenChange={setCalculatorOpen}
            className="bg-muted/40 p-3 mb-6"
            style={{ borderRadius: '6px' }}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span>Target Times</span>
                </div>
                {calculatorOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2 animate-in fade-in-0 slide-in-from-top-5">
              <div className="flex flex-col space-y-2 bg-muted/30 p-2 rounded-md mb-2" style={{ borderRadius: '6px' }}>
                <div className="text-xs font-medium">Timing Options</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="first-foot" 
                      checked={useFirstFootTiming}
                      onCheckedChange={(checked) => setUseFirstFootTiming(checked === true)}
                    />
                    <label 
                      htmlFor="first-foot" 
                      className="text-xs cursor-pointer"
                    >
                      First foot (-0.55s)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="track-adjust" 
                      checked={adjustForTrackType}
                      onCheckedChange={(checked) => setAdjustForTrackType(checked === true)}
                    />
                    <label 
                      htmlFor="track-adjust" 
                      className="text-xs cursor-pointer"
                    >
                      On Movement
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden border border-amber-500/70" style={{ borderRadius: '6px' }}>
                <div className="bg-[#111827] text-white px-3 py-2">
                  <p className="text-sm text-blue-200">
                    {useFirstFootTiming ? '100% column shows first foot contact (-0.55s)' : 'Target times based on your profile goals'}
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#111827] text-white border-b border-transparent">
                        <th className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-3 py-2 text-left font-bold">
                          Distance
                        </th>
                        <th className="px-3 py-2 text-right font-bold">80%</th>
                        <th className="px-3 py-2 text-right font-bold">90%</th>
                        <th className="px-3 py-2 text-right font-bold">95%</th>
                        <th className="px-3 py-2 text-right font-bold">98%</th>
                        <th className="px-3 py-2 text-right font-bold">100%</th>
                        <th className="px-3 py-2 text-right font-bold">Goal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const distances = [
                          "50m", "60m", "80m", "100m", "120m", 
                          "150m", "200m", "250m", "300m", "400m"
                        ];
                        
                        // Calculate all times for all distances
                        const timesByDistance = new Map();
                        
                        // Profile-based calculations
                        if (athleteProfile?.specialtyEvent && athleteProfile?.personalBests) {
                          const pbData = athleteProfile.personalBests;
                          
                          // Base times from profile
                          if (pbData.fifty) timesByDistance.set("50m", pbData.fifty);
                          if (pbData.sixty) timesByDistance.set("60m", pbData.sixty);
                          if (pbData.eighty) timesByDistance.set("80m", pbData.eighty);
                          if (pbData.hundred) timesByDistance.set("100m", pbData.hundred);
                          if (pbData.onetwenty) timesByDistance.set("120m", pbData.onetwenty);
                          if (pbData.onefifty) timesByDistance.set("150m", pbData.onefifty);
                          if (pbData.twohundred) timesByDistance.set("200m", pbData.twohundred);
                          if (pbData.twofifty) timesByDistance.set("250m", pbData.twofifty);
                          if (pbData.threehundred) timesByDistance.set("300m", pbData.threehundred);
                          if (pbData.fourhundred) timesByDistance.set("400m", pbData.fourhundred);
                        } else {
                          // Default fallback times
                          timesByDistance.set("50m", 6.20);
                          timesByDistance.set("60m", 7.40);
                          timesByDistance.set("80m", 9.80);
                          timesByDistance.set("100m", 12.40);
                          timesByDistance.set("120m", 15.6);
                          timesByDistance.set("150m", 19.5);
                          timesByDistance.set("200m", 26.0);
                          timesByDistance.set("250m", 32.5);
                          timesByDistance.set("300m", 39.0);
                          timesByDistance.set("400m", 52.0);
                        }
                        
                        // Render the rows with alternating backgrounds
                        return distances.map((distance, index) => {
                          const time = timesByDistance.get(distance);
                          if (!time) return null;
                          
                          // Calculate percentages
                          const percent80 = (time / 0.8).toFixed(2);
                          const percent90 = (time / 0.9).toFixed(2);
                          const percent95 = (time / 0.95).toFixed(2);
                          const percent98 = (time / 0.98).toFixed(2);
                          
                          // Apply timing adjustments for 100% column
                          let percent100 = time;
                          if (useFirstFootTiming) percent100 -= 0.55;
                          percent100 = Math.max(percent100, 0).toFixed(2);
                          
                          // Alternating backgrounds for even/odd rows
                          const isEvenRow = index % 2 === 0;
                          const rowBgClass = isEvenRow ? 
                            "bg-[#111827] text-white" : 
                            "bg-[#1e293b] text-white";
                          
                          return (
                            <tr key={distance} className={`${rowBgClass} border-b border-transparent`}>
                              <td className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-3 py-2 font-bold">
                                {distance}
                              </td>
                              <td className="px-3 py-2 text-right">{percent80}s</td>
                              <td className="px-3 py-2 text-right">{percent90}s</td>
                              <td className="px-3 py-2 text-right">{percent95}s</td>
                              <td className="px-3 py-2 text-right">{percent98}s</td>
                              <td className="px-3 py-2 text-right">{percent100}s</td>
                              <td className="px-3 py-2 text-right font-bold">{time.toFixed(2)}s</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
      
      {/* Programs section - only show if no meets today */}
      {!hasMeetsToday && (
        <div className="bg-muted/40 p-3" style={{ borderRadius: '6px' }}>
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                Your Programs
              </p>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};