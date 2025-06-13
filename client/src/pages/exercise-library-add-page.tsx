import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageContainer } from "@/components/page-container";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, Youtube, ArrowLeft, Crown, Users, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";

interface LibraryLimits {
  uploads: {
    current: number;
    limit: number;
    canUpload: boolean;
  };
  youtube: {
    current: number;
    limit: number;
    canAdd: boolean;
  };
}

export default function ExerciseLibraryAddPage() {
  const [, setLocation] = useLocation();
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get library limits
  const { data: limits } = useQuery<LibraryLimits>({
    queryKey: ["/api/exercise-library/limits"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/exercise-library/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-library/limits"] });
      toast({ title: "Success", description: "Video uploaded successfully!" });
      setLocation("/tools/exercise-library");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Upload Failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // YouTube mutation
  const youtubeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/exercise-library/youtube', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-library/limits"] });
      toast({ title: "Success", description: "YouTube video added successfully!" });
      setLocation("/tools/exercise-library");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Add Failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('isPublic', isPublic.toString());
    uploadMutation.mutate(formData);
  };

  const handleYouTube = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      youtubeUrl: formData.get('youtubeUrl'),
      tags: formData.get('tags'),
      isPublic: isPublic
    };
    youtubeMutation.mutate(data);
  };

  const getSubscriptionTier = () => {
    if (!userData) return 'free';
    if ((userData as any).isPremium) return 'star';
    if ((userData as any).isProUser) return 'pro';
    return 'free';
  };

  const getSubscriptionIcon = () => {
    const tier = getSubscriptionTier();
    if (tier === 'star') return <Crown className="h-4 w-4 text-yellow-500" />;
    if (tier === 'pro') return <Users className="h-4 w-4 text-blue-500" />;
    return <Lock className="h-4 w-4 text-gray-400" />;
  };

  const canUpload = limits?.uploads?.canUpload ?? false;
  const canAddYoutube = limits?.youtube?.canAdd ?? false;
  const uploadProgress = limits ? (limits.uploads.current / limits.uploads.limit) * 100 : 0;
  const youtubeProgress = limits ? (limits.youtube.current / limits.youtube.limit) * 100 : 0;

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">

          <div>
            <h1 className="text-2xl font-bold">Add Video to Library</h1>
            <p className="text-muted-foreground">
              Upload a video file or add a YouTube link to your exercise library
            </p>
          </div>
        </div>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSubscriptionIcon()}
              {getSubscriptionTier().charAt(0).toUpperCase() + getSubscriptionTier().slice(1)} Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {limits && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Video Uploads</span>
                    <span>{limits.uploads.current} / {limits.uploads.limit === -1 ? '∞' : limits.uploads.limit}</span>
                  </div>
                  {limits.uploads.limit !== -1 && (
                    <Progress value={uploadProgress} className="h-2" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>YouTube Links</span>
                    <span>{limits.youtube.current} / {limits.youtube.limit === -1 ? '∞' : limits.youtube.limit}</span>
                  </div>
                  {limits.youtube.limit !== -1 && (
                    <Progress value={youtubeProgress} className="h-2" />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Video Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Video</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" disabled={!canUpload}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                  {!canUpload && <Badge variant="secondary" className="ml-2">Limit Reached</Badge>}
                </TabsTrigger>
                <TabsTrigger value="youtube" disabled={!canAddYoutube}>
                  <Youtube className="h-4 w-4 mr-2" />
                  YouTube Link
                  {!canAddYoutube && <Badge variant="secondary" className="ml-2">Limit Reached</Badge>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-file">Video File</Label>
                    <Input
                      id="upload-file"
                      name="file"
                      type="file"
                      accept="video/*,image/*"
                      required
                      disabled={uploadMutation.isPending}
                    />
                    <p className="text-sm text-muted-foreground">
                      Max file size: 100MB. Supported formats: MP4, MOV, AVI, WebM, JPG, PNG, GIF
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upload-name">Exercise Name</Label>
                    <Input
                      id="upload-name"
                      name="name"
                      placeholder="Enter exercise name"
                      required
                      disabled={uploadMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upload-description">Description</Label>
                    <Textarea
                      id="upload-description"
                      name="description"
                      placeholder="Describe the exercise..."
                      disabled={uploadMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upload-tags">Tags</Label>
                    <Input
                      id="upload-tags"
                      name="tags"
                      placeholder="sprint, strength, technique (comma separated)"
                      disabled={uploadMutation.isPending}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="upload-public"
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
                      disabled={uploadMutation.isPending}
                    />
                    <Label htmlFor="upload-public">Make this exercise public</Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={uploadMutation.isPending || !canUpload}
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload Video"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="youtube" className="space-y-4">
                <form onSubmit={handleYouTube} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url">YouTube URL</Label>
                    <Input
                      id="youtube-url"
                      name="youtubeUrl"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                      disabled={youtubeMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube-name">Exercise Name</Label>
                    <Input
                      id="youtube-name"
                      name="name"
                      placeholder="Enter exercise name"
                      required
                      disabled={youtubeMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube-description">Description</Label>
                    <Textarea
                      id="youtube-description"
                      name="description"
                      placeholder="Describe the exercise..."
                      disabled={youtubeMutation.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube-tags">Tags</Label>
                    <Input
                      id="youtube-tags"
                      name="tags"
                      placeholder="sprint, strength, technique (comma separated)"
                      disabled={youtubeMutation.isPending}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="youtube-public"
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(Boolean(checked))}
                      disabled={youtubeMutation.isPending}
                    />
                    <Label htmlFor="youtube-public">Make this exercise public</Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={youtubeMutation.isPending || !canAddYoutube}
                  >
                    {youtubeMutation.isPending ? "Adding..." : "Add YouTube Video"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}