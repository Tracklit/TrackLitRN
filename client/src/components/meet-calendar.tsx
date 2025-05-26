import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Meet } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Crown } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface MeetCalendarProps {
  onMeetSelect?: (meet: Meet) => void;
}

export function MeetCalendar({ onMeetSelect }: MeetCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Fetch meets
  const { data: meets = [], isLoading } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    // Create calendar grid
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayMeets = meets.filter(meet => {
        const meetDate = new Date(meet.date);
        return meetDate.getDate() === day && 
               meetDate.getMonth() === month && 
               meetDate.getFullYear() === year;
      });
      
      days.push({
        day,
        date,
        meets: dayMeets,
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    return days;
  }, [currentDate, meets]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className="overflow-hidden bg-[#010a18] border border-blue-800/60 shadow-md">
      <CardContent className="p-4">
        {/* Pro Badge */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-400" />
            Meet Calendar
          </h3>
          <Badge className="bg-amber-600 hover:bg-amber-700 text-white">
            <Crown className="h-3 w-3 mr-1" />
            PRO
          </Badge>
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className="text-blue-300 hover:text-white hover:bg-blue-800/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-bold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className="text-blue-300 hover:text-white hover:bg-blue-800/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-blue-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((dayData, index) => (
            <div
              key={index}
              className={`min-h-[80px] p-1 border border-blue-800/30 rounded ${
                dayData?.isToday ? 'bg-blue-900/40' : 'bg-[#081020]'
              }`}
            >
              {dayData && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    dayData.isToday ? 'text-amber-400' : 'text-white'
                  }`}>
                    {dayData.day}
                  </div>
                  
                  {dayData.meets.map(meet => (
                    <div
                      key={meet.id}
                      className="mb-1 p-1 bg-blue-800/40 rounded cursor-pointer hover:bg-blue-700/50 transition-colors"
                      onClick={() => onMeetSelect?.(meet)}
                    >
                      <div className="text-xs text-white font-medium truncate">
                        {meet.name}
                      </div>
                      <div className="text-xs text-blue-300 flex items-center">
                        <MapPin className="h-2 w-2 mr-1" />
                        <span className="truncate">{meet.location?.split(',')[0]}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-blue-800/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-blue-300">
              <div className="w-3 h-3 bg-blue-900/40 rounded mr-2"></div>
              Today
            </div>
            <div className="flex items-center text-blue-300">
              <div className="w-3 h-3 bg-blue-800/40 rounded mr-2"></div>
              Meet Event
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}