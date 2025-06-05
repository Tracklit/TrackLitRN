import { useState } from 'react';
import { useLocation } from 'wouter';
import { BackNavigation } from '@/components/back-navigation';
import { PageTransition } from '@/components/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, Users, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function CreateMeetPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    events: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/meets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          description: formData.description,
          events: formData.events,
          status: 'upcoming'
        }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/meets'] });
        toast({
          title: 'Meet Created',
          description: `${formData.name} has been successfully created.`,
        });
        setLocation('/meets');
      } else {
        throw new Error('Failed to create meet');
      }
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Could not create the meet. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground">
      <main className="pt-16 pb-6">
        <div className="max-w-2xl mx-auto px-4">
          <BackNavigation />
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Create New Meet</h1>
            <p className="text-muted-foreground">Set up a new track and field competition</p>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Calendar className="h-5 w-5 text-primary" />
                Meet Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Meet Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Spring Championship"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City Stadium"
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-foreground">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Start Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="bg-background border-border text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Annual spring track and field championship featuring sprint, distance, and field events..."
                    className="bg-background border-border text-foreground min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="events" className="text-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Events
                  </Label>
                  <Textarea
                    id="events"
                    value={formData.events}
                    onChange={(e) => handleInputChange('events', e.target.value)}
                    placeholder="100m, 200m, 400m, 800m, 1500m, Long Jump, High Jump, Shot Put..."
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/meets')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.date || !formData.location}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create Meet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      </div>
    </PageTransition>
  );
}