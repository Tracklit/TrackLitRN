import { useState } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, 
  FileUp,
  BookOpen,
  Loader2,
  Upload,
  CheckCircle2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { GoogleSheetImportDialog } from "@/components/google-sheet-import-dialog";

interface CreateProgramForm {
  title: string;
  description: string;
  visibility: 'public' | 'premium' | 'private';
  price: number;
  priceType: 'spikes' | 'money';
  category: string;
  level: string;
  duration: number;
}

function ProgramCreatePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [selectedMethod, setSelectedMethod] = useState<'builder' | 'upload' | 'import' | null>(null);
  const [formData, setFormData] = useState<CreateProgramForm>({
    title: "",
    description: "",
    visibility: "public",
    price: 0,
    priceType: "spikes",
    category: "sprint",
    level: "beginner",
    duration: 4
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const createProgramMutation = useMutation({
    mutationFn: async (data: CreateProgramForm) => {
      const response = await apiRequest("POST", "/api/programs", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create program");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Program created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      setLocation(`/programs/${data.id}/edit`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadProgramMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/programs/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload program");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Program uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      setUploadSuccess(true);
      setTimeout(() => {
        setLocation(`/programs/${data.id}`);
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Program title is required",
        variant: "destructive",
      });
      return;
    }

    createProgramMutation.mutate(formData);
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Program title is required",
        variant: "destructive",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("file", uploadFile);
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("visibility", formData.visibility);
    formDataToSend.append("price", formData.price.toString());
    formDataToSend.append("priceType", formData.priceType);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("level", formData.level);

    uploadProgramMutation.mutate(formDataToSend);
  };

  const updateFormData = (field: keyof CreateProgramForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (uploadSuccess) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Program Uploaded Successfully!</h2>
          <p className="text-muted-foreground mb-4">Redirecting to program details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
      </div>

      <PageHeader 
        title="Create New Program"
        description="Build a training program for your athletes or share with the community"
      />

      <div className="max-w-4xl mx-auto mt-8">
        {!selectedMethod ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-md"
              onClick={() => setSelectedMethod('builder')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Program Builder</CardTitle>
                <CardDescription>
                  Create a structured training program with custom sessions and exercises
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card 
              className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-md"
              onClick={() => setSelectedMethod('upload')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Upload Document</CardTitle>
                <CardDescription>
                  Share existing training documents in PDF, DOC, or DOCX format
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card 
              className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-md"
              onClick={() => setSelectedMethod('import')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Import from Sheets</CardTitle>
                <CardDescription>
                  Connect your Google Sheets for automatic synchronization
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              className="mb-6"
              onClick={() => setSelectedMethod(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Choose Different Method
            </Button>

            {selectedMethod === 'builder' && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Build Custom Program
                  </CardTitle>
                  <CardDescription>
                    Create a structured training program with custom sessions and exercises
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Program Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateFormData("title", e.target.value)}
                          placeholder="Enter program title..."
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData("description", e.target.value)}
                          placeholder="Describe your training program..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => updateFormData("category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sprint">Sprint</SelectItem>
                            <SelectItem value="middle_distance">Middle Distance</SelectItem>
                            <SelectItem value="long_distance">Long Distance</SelectItem>
                            <SelectItem value="jumping">Jumping</SelectItem>
                            <SelectItem value="throwing">Throwing</SelectItem>
                            <SelectItem value="combined">Combined Events</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="level">Level</Label>
                        <Select
                          value={formData.level}
                          onValueChange={(value) => updateFormData("level", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="duration">Duration (weeks)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="52"
                          value={formData.duration}
                          onChange={(e) => updateFormData("duration", parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select
                          value={formData.visibility}
                          onValueChange={(value) => updateFormData("visibility", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public (Free)</SelectItem>
                            <SelectItem value="premium">Premium (Paid)</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.visibility === 'premium' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label htmlFor="priceType">Price Type</Label>
                          <Select
                            value={formData.priceType}
                            onValueChange={(value) => updateFormData("priceType", value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spikes">Spikes</SelectItem>
                              <SelectItem value="money">Money (USD)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="price">
                            Price ({formData.priceType === 'money' ? '$' : 'Spikes'})
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step={formData.priceType === 'money' ? "0.01" : "1"}
                            value={formData.price}
                            onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createProgramMutation.isPending}
                    >
                      {createProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Program...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Program
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'upload' && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center">
                    <FileUp className="h-5 w-5 mr-2 text-primary" />
                    Upload Program Document
                  </CardTitle>
                  <CardDescription>
                    Share existing training documents in PDF, DOC, or DOCX format
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleFileUpload} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="upload-title">Program Title *</Label>
                        <Input
                          id="upload-title"
                          value={formData.title}
                          onChange={(e) => updateFormData("title", e.target.value)}
                          placeholder="Enter program title..."
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="upload-description">Description</Label>
                        <Textarea
                          id="upload-description"
                          value={formData.description}
                          onChange={(e) => updateFormData("description", e.target.value)}
                          placeholder="Describe your training program..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="file-upload">Program File *</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Supported formats: PDF, DOC, DOCX (Max 10MB)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="upload-category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => updateFormData("category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sprint">Sprint</SelectItem>
                            <SelectItem value="middle_distance">Middle Distance</SelectItem>
                            <SelectItem value="long_distance">Long Distance</SelectItem>
                            <SelectItem value="jumping">Jumping</SelectItem>
                            <SelectItem value="throwing">Throwing</SelectItem>
                            <SelectItem value="combined">Combined Events</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="upload-level">Level</Label>
                        <Select
                          value={formData.level}
                          onValueChange={(value) => updateFormData("level", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="upload-visibility">Visibility</Label>
                        <Select
                          value={formData.visibility}
                          onValueChange={(value) => updateFormData("visibility", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public (Free)</SelectItem>
                            <SelectItem value="premium">Premium (Paid)</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.visibility === 'premium' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label htmlFor="upload-priceType">Price Type</Label>
                          <Select
                            value={formData.priceType}
                            onValueChange={(value) => updateFormData("priceType", value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spikes">Spikes</SelectItem>
                              <SelectItem value="money">Money (USD)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="upload-price">
                            Price ({formData.priceType === 'money' ? '$' : 'Spikes'})
                          </Label>
                          <Input
                            id="upload-price"
                            type="number"
                            min="0"
                            step={formData.priceType === 'money' ? "0.01" : "1"}
                            value={formData.price}
                            onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={uploadProgramMutation.isPending}
                    >
                      {uploadProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading Program...
                        </>
                      ) : (
                        <>
                          <FileUp className="h-4 w-4 mr-2" />
                          Upload Program
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'import' && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-primary" />
                    Import from Google Sheets
                  </CardTitle>
                  <CardDescription>
                    Connect your Google Sheets training program for automatic synchronization
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Import Training Program</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Connect your Google Sheets program to automatically sync training sessions and updates
                    </p>
                    <GoogleSheetImportDialog 
                      buttonText="Import from Google Sheets"
                      variant="default"
                      size="lg"
                      className="min-w-[200px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Component() {
  return <ProtectedRoute path="/programs/create" component={ProgramCreatePage} />;
}

export default ProgramCreatePage;