import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Check, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatTime } from '@/lib/utils';

interface MeetInvitation {
  id: number;
  meetId: number;
  inviterId: number;
  inviteeId: number;
  status: string;
  message?: string;
  createdAt: string;
  respondedAt?: string;
  meet: {
    id: number;
    name: string;
    date: string;
    location: string;
    events: string[];
    status: string;
  };
  inviter: {
    id: number;
    name: string;
    username: string;
  };
}

interface MeetInvitationNotificationProps {
  invitation: MeetInvitation;
  onResponse: (invitationId: number, status: 'accepted' | 'declined') => void;
}

export function MeetInvitationNotification({ invitation, onResponse }: MeetInvitationNotificationProps) {
  const [isResponding, setIsResponding] = useState(false);
  const { toast } = useToast();

  const handleResponse = async (status: 'accepted' | 'declined') => {
    setIsResponding(true);
    try {
      const response = await fetch(`/api/meet-invitations/${invitation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to respond to invitation');
      }

      await response.json();
      onResponse(invitation.id, status);
      
      toast({
        title: status === 'accepted' ? 'Invitation Accepted!' : 'Invitation Declined',
        description: status === 'accepted' 
          ? `You've been added to ${invitation.meet.name}` 
          : `You declined the invitation to ${invitation.meet.name}`,
      });
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to respond to invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResponding(false);
    }
  };

  if (invitation.status !== 'pending') {
    return null; // Don't show notifications for already responded invitations
  }

  return (
    <Card className="bg-[#0a1628] border-blue-800/60 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-400" />
              <span className="text-blue-300 text-sm">
                Meet invitation from <span className="font-medium text-white">{invitation.inviter.name}</span>
              </span>
              <Badge variant="outline" className="bg-amber-600/20 text-amber-300 border-amber-600">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>

            <h3 className="text-white font-semibold text-lg mb-2">{invitation.meet.name}</h3>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-blue-300">
                <Calendar className="h-4 w-4" />
                {formatDate(new Date(invitation.meet.date))} at {formatTime(new Date(invitation.meet.date))}
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-300">
                <MapPin className="h-4 w-4" />
                {invitation.meet.location}
              </div>
            </div>

            {invitation.meet.events && invitation.meet.events.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {invitation.meet.events.map((event, index) => (
                  <Badge key={index} className="bg-blue-900/60 text-blue-200 hover:bg-blue-800 text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
            )}

            {invitation.message && (
              <div className="bg-blue-900/30 border border-blue-800/40 rounded-lg p-3 mb-3">
                <p className="text-blue-200 text-sm italic">"{invitation.message}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => handleResponse('accepted')}
            disabled={isResponding}
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
            size="sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button
            onClick={() => handleResponse('declined')}
            disabled={isResponding}
            variant="outline"
            className="border-red-600 text-red-400 hover:bg-red-600/20 flex-1"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}