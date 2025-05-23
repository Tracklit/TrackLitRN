import { useState } from 'react';
import { Meet } from '@shared/schema';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, Clock, MapPin, Share2, Mail, Copy, Users } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface CalendarMeetShareModalProps {
  meet: Meet | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarMeetShareModal({ 
  meet, 
  isOpen, 
  onClose 
}: CalendarMeetShareModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  if (!meet) return null;

  const meetUrl = `${window.location.origin}/meets/${meet.id}`;
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TrackLit: ${meet.name}`,
          text: `Join me at ${meet.name} on ${formatDateTime(meet.date)} at ${meet.location}`,
          url: meetUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetUrl);
    toast({
      title: "Link Copied",
      description: "Meet link copied to clipboard",
    });
  };

  const handleEmailShare = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    // Simulate email sharing (in a real app, this would call an API)
    setTimeout(() => {
      setIsSharing(false);
      toast({
        title: "Share Successful",
        description: `Meet details shared with ${email}`,
      });
      setEmail('');
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            Share Meet
          </DialogTitle>
          <DialogDescription>
            Share this meet with teammates and coaches
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <h3 className="font-medium text-lg">{meet.name}</h3>
          <div className="space-y-2 mt-2">
            <div className="flex items-center text-sm text-slate-600">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDateTime(meet.date)}
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <MapPin className="h-4 w-4 mr-2" />
              {meet.location}
            </div>
          </div>
        </div>

        {!user?.isPremium ? (
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg mt-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Premium feature: </span>
                Upgrade to share meets via email and personalized messages.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleEmailShare}
                disabled={isSharing}
                size="sm"
              >
                {isSharing ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyLink}
            className="mt-3 sm:mt-0 flex-1 sm:flex-none"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button
            type="button"
            onClick={handleNativeShare}
            className="mt-3 sm:mt-0 flex-1 sm:flex-none"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}