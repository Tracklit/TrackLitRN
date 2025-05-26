import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Send, Zap, Users, Calendar } from "lucide-react";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/broadcast-notification", {
        title: title.trim(),
        message: message.trim()
      });

      if (response.ok) {
        toast({
          title: "Broadcast Sent!",
          description: "Your notification has been sent to all users",
        });
        setTitle("");
        setMessage("");
      } else {
        throw new Error("Failed to send broadcast");
      }
    } catch (error) {
      toast({
        title: "Broadcast Failed",
        description: "There was an error sending your notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAutomation = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/trigger-notifications", {});
      
      if (response.ok) {
        toast({
          title: "Automation Triggered",
          description: "Automated notifications have been processed manually",
        });
      } else {
        throw new Error("Failed to trigger automation");
      }
    } catch (error) {
      toast({
        title: "Trigger Failed",
        description: "There was an error triggering automated notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📧 Notification Management</h1>
        <p className="text-muted-foreground">Manage automated notifications and send broadcasts to your user base</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Broadcast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Send Broadcast
            </CardTitle>
            <CardDescription>
              Send a custom notification to all users in your platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., New Feature Update!"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message to all users..."
                className="mt-1 min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleBroadcast} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Sending..." : "Send to All Users"}
            </Button>
          </CardContent>
        </Card>

        {/* Automation Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Automation Controls
            </CardTitle>
            <CardDescription>
              Manage automated notification systems
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800">Automated System Active</h4>
                <p className="text-sm text-blue-600 mt-1">
                  Notifications run automatically every 6 hours
                </p>
              </div>

              <Button 
                onClick={handleTriggerAutomation}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? "Processing..." : "Trigger Manual Run"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Types Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Active Notification Types
            </CardTitle>
            <CardDescription>
              Overview of all automated notification categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">💪 Athlete Wellness</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Rest & recovery reminders</li>
                  <li>• Hydration check-ins</li>
                  <li>• Coach communication prompts</li>
                  <li>• Nutrition guidance</li>
                  <li>• Sleep optimization</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">🚀 Feature Discovery</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Training journal introduction</li>
                  <li>• Start gun simulator</li>
                  <li>• Spikes rewards system</li>
                  <li>• Meet creation guidance</li>
                  <li>• Rehab center exploration</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-2">📊 Reports & Social</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Weekly training summaries</li>
                  <li>• Monthly achievements</li>
                  <li>• Friend request alerts</li>
                  <li>• Message notifications</li>
                  <li>• Workout reactions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}