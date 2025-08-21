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
  CheckCircle2,
  Bot,
  Zap,
  Crown
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
  duration: number;
  textContent?: string;
}

interface SprinthiaFormData {
  totalLengthWeeks: number;
  blocks: number;
  workoutsPerWeek: number;
  gymWorkoutsPerWeek: number;
  blockFocus: 'speed' | 'speed-maintenance' | 'speed-endurance' | 'mixed' | 'short-to-long' | 'long-to-short';
  aiPrompt: string;
}

function ProgramCreatePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [selectedMethod, setSelectedMethod] = useState<'builder' | 'upload' | 'import' | 'text' | 'sprinthia' | null>(null);
  const [isNavigatingToEdit, setIsNavigatingToEdit] = useState(false);
  const [formData, setFormData] = useState<CreateProgramForm>({
    title: "",
    description: "",
    visibility: "public",
    price: 0,
    priceType: "spikes",
    duration: 4,
    textContent: ""
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Sprinthia form state
  const [sprinthiaData, setSprinthiaData] = useState<SprinthiaFormData>({
    totalLengthWeeks: 4,
    blocks: 2,
    workoutsPerWeek: 4,
    gymWorkoutsPerWeek: 2,
    blockFocus: 'speed',
    aiPrompt: ''
  });
  
  // Sprinthia state
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [generatedProgram, setGeneratedProgram] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [usageLimitType, setUsageLimitType] = useState<'creation' | 'regeneration'>('creation');

  const createProgramMutation = useMutation({
    mutationFn: async (data: CreateProgramForm) => {
      const programData = {
        ...data,
        isTextBased: selectedMethod === 'text',
      };
      const response = await apiRequest("POST", "/api/programs", programData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create program");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      if (selectedMethod === 'text') {
        toast({
          title: "Success",
          description: "Text-based program created successfully!",
        });
        setLocation('/programs');
      } else {
        setIsNavigatingToEdit(true);
        setLocation(`/programs/${data.id}/edit`);
      }
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

    uploadProgramMutation.mutate(formDataToSend);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Program title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.textContent?.trim()) {
      toast({
        title: "Error",
        description: "Program content is required",
        variant: "destructive",
      });
      return;
    }

    createProgramMutation.mutate(formData);
  };

  const updateFormData = (field: keyof CreateProgramForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check subscription limits for Sprinthia
  const checkSprinthiaUsage = () => {
    if (!user) return false;
    
    const tier = user.subscriptionTier || 'free';
    if (tier === 'free') {
      return { allowed: false, reason: 'non-paying' };
    }
    
    // Check program creation limits (these would need to be tracked in the backend)
    const programsCreated = user.sprinthiaProgramsCreated || 0;
    const maxPrograms = tier === 'pro' ? 3 : tier === 'star' ? 12 : 0;
    
    if (programsCreated >= maxPrograms) {
      return { allowed: false, reason: 'creation-limit', current: programsCreated, max: maxPrograms };
    }
    
    return { allowed: true };
  };

  const checkRegenerationUsage = () => {
    if (!user) return false;
    
    const tier = user.subscriptionTier || 'free';
    if (tier === 'free') {
      return { allowed: false, reason: 'non-paying' };
    }
    
    // Check regeneration limits (these would need to be tracked per program)
    const regenerationsUsed = user.sprinthiaRegenerationsUsed || 0;
    const maxRegenerations = tier === 'pro' ? 3 : tier === 'star' ? 12 : 0;
    
    if (regenerationsUsed >= maxRegenerations) {
      return { allowed: false, reason: 'regeneration-limit', current: regenerationsUsed, max: maxRegenerations };
    }
    
    return { allowed: true };
  };

  const generateSprinthiaProgram = async () => {
    const usageCheck = checkSprinthiaUsage();
    if (!usageCheck.allowed) {
      setUsageLimitType('creation');
      setShowUsageLimitModal(true);
      return;
    }

    setIsGeneratingProgram(true);
    try {
      const response = await apiRequest('POST', '/api/sprinthia/generate-program', {
        ...sprinthiaData,
        title: formData.title,
        description: formData.description
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate program');
      }
      
      const result = await response.json();
      setGeneratedProgram(result.content);
      
      toast({
        title: "Program Generated",
        description: "Your AI-powered training program has been created!",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const regenerateProgram = async () => {
    const usageCheck = checkRegenerationUsage();
    if (!usageCheck.allowed) {
      setUsageLimitType('regeneration');
      setShowUsageLimitModal(true);
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await apiRequest('POST', '/api/sprinthia/regenerate-program', {
        ...sprinthiaData,
        title: formData.title,
        description: formData.description,
        previousContent: generatedProgram
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate program');
      }
      
      const result = await response.json();
      setGeneratedProgram(result.content);
      
      toast({
        title: "Program Regenerated",
        description: "Your training program has been updated with new AI suggestions!",
      });
    } catch (error: any) {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const continueToEdit = () => {
    // Copy generated content to formData and switch to text mode
    setFormData(prev => ({ ...prev, textContent: generatedProgram || '' }));
    setSelectedMethod('text');
    setGeneratedProgram(null);
  };

  if (uploadSuccess || isNavigatingToEdit) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {uploadSuccess ? "Program Uploaded Successfully!" : "Program Created Successfully!"}
          </h2>
          <p className="text-muted-foreground mb-4">Redirecting to program editor...</p>
          
          {/* Loading skeleton for edit page */}
          <div className="w-full max-w-2xl mt-8 space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
              
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card 
              className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-md relative"
              onClick={() => setSelectedMethod('upload')}
            >
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                Recommended
              </div>
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
              onClick={() => setSelectedMethod('text')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl mb-2">Text Based</CardTitle>
                <CardDescription>
                  Create a simple text-based program that displays as a scrollable list
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card 
              className="cursor-pointer border-2 hover:border-primary/50 transition-all hover:shadow-md"
              onClick={() => setSelectedMethod('sprinthia')}
            >
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-2">Build With Sprinthia</CardTitle>
                <CardDescription>
                  Build a text based program powered by AI. Once generated, you will be able to manually edit before saving.
                </CardDescription>
                {user?.subscriptionTier === 'free' && (
                  <div className="mt-2">
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium Required
                    </div>
                  </div>
                )}
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

                    <div className="grid grid-cols-1 gap-4">
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

            {selectedMethod === 'text' && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Text Based Program
                  </CardTitle>
                  <CardDescription>
                    Create a simple text-based program that displays as a scrollable list in practice view
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="text-title">Program Title *</Label>
                        <Input
                          id="text-title"
                          placeholder="Enter program title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="text-description">Description</Label>
                        <Textarea
                          id="text-description"
                          placeholder="Brief description of your program"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="text-content">Program Content *</Label>
                        <Textarea
                          id="text-content"
                          placeholder="Enter your complete training program here. Users will see this as a scrollable list in practice view. Include dates, exercises, instructions, and any other details you want to share."
                          value={formData.textContent}
                          onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                          required
                          className="mt-1 min-h-[300px] font-mono text-sm"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          This text will be displayed exactly as you type it. Use line breaks and formatting to organize your content.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="text-visibility">Visibility</Label>
                        <Select 
                          value={formData.visibility} 
                          onValueChange={(value: 'public' | 'premium' | 'private') => 
                            setFormData(prev => ({ ...prev, visibility: value }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createProgramMutation.isPending || !formData.title || !formData.textContent}
                    >
                      {createProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Program...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Text Program
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'sprinthia' && (
              <div className="space-y-6">
                {!generatedProgram ? (
                  <Card className="border-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/50">
                    <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-amber-500/20">
                      <CardTitle className="flex items-center text-amber-100">
                        <Bot className="h-5 w-5 mr-2 text-amber-400" />
                        Build With Sprinthia AI
                      </CardTitle>
                      <CardDescription className="text-amber-200/80">
                        Create an AI-powered training program with custom parameters and intelligent recommendations. Once generated, you will be able to manually edit before saving.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-amber-100">Program Title *</Label>
                            <Input
                              placeholder="Enter program title"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                              className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                            />
                          </div>

                          <div>
                            <Label className="text-amber-100">Total Length (weeks)</Label>
                            <Select 
                              value={sprinthiaData.totalLengthWeeks.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, totalLengthWeeks: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 12 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-slate-700">
                                    {i + 1} week{i !== 0 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Number of Blocks</Label>
                            <Select 
                              value={sprinthiaData.blocks.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, blocks: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 6 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-slate-700">
                                    {i + 1} block{i !== 0 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Workouts Per Week</Label>
                            <Select 
                              value={sprinthiaData.workoutsPerWeek.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, workoutsPerWeek: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 7 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-slate-700">
                                    {i + 1} workout{i !== 0 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Gym Workouts Per Week</Label>
                            <Select 
                              value={sprinthiaData.gymWorkoutsPerWeek.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, gymWorkoutsPerWeek: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 6 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()} className="text-white hover:bg-slate-700">
                                    {i} workout{i !== 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Block Focus</Label>
                            <Select 
                              value={sprinthiaData.blockFocus} 
                              onValueChange={(value: SprinthiaFormData['blockFocus']) => setSprinthiaData(prev => ({ ...prev, blockFocus: value }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="speed" className="text-white hover:bg-slate-700">Speed</SelectItem>
                                <SelectItem value="speed-maintenance" className="text-white hover:bg-slate-700">Speed Maintenance</SelectItem>
                                <SelectItem value="speed-endurance" className="text-white hover:bg-slate-700">Speed Endurance</SelectItem>
                                <SelectItem value="mixed" className="text-white hover:bg-slate-700">Mixed</SelectItem>
                                <SelectItem value="short-to-long" className="text-white hover:bg-slate-700">Short to Long</SelectItem>
                                <SelectItem value="long-to-short" className="text-white hover:bg-slate-700">Long to Short</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-amber-100">Description & AI Prompt</Label>
                          <Textarea
                            placeholder="Describe your program goals and any specific requirements for the AI. Be as detailed as possible to get better results."
                            value={sprinthiaData.aiPrompt}
                            onChange={(e) => setSprinthiaData(prev => ({ ...prev, aiPrompt: e.target.value }))}
                            className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 min-h-[120px]"
                          />
                          <p className="text-sm text-amber-200/70 mt-2">
                            Example: "Create a program for a high school sprinter focusing on 100m and 200m events. Include warm-up routines, sprint drills, and recovery sessions."
                          </p>
                        </div>

                        <div className="flex flex-col gap-3">
                          <Button 
                            onClick={generateSprinthiaProgram}
                            disabled={isGeneratingProgram || !formData.title || !sprinthiaData.aiPrompt}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
                          >
                            {isGeneratingProgram ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Program...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Generate Training Program
                              </>
                            )}
                          </Button>
                          
                          {user && (
                            <div className="text-center text-sm text-amber-200/70">
                              {user.subscriptionTier === 'pro' && `${3 - (user.sprinthiaProgramsCreated || 0)} program creations remaining`}
                              {user.subscriptionTier === 'star' && `${12 - (user.sprinthiaProgramsCreated || 0)} program creations remaining`}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/50">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-b border-green-500/20">
                      <CardTitle className="flex items-center text-green-100">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-400" />
                        Program Generated Successfully
                      </CardTitle>
                      <CardDescription className="text-green-200/80">
                        Your AI-powered training program is ready! Review the content and choose your next action.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                          <pre className="text-sm text-white whitespace-pre-wrap font-mono">{generatedProgram}</pre>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button 
                            onClick={continueToEdit}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Continue to Edit and Save
                          </Button>
                          
                          <Button 
                            onClick={regenerateProgram}
                            disabled={isRegenerating}
                            variant="outline"
                            className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                          >
                            {isRegenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Rewrite
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {user && (
                          <div className="text-center text-sm text-amber-200/70">
                            {user.subscriptionTier === 'pro' && `${3 - (user.sprinthiaRegenerationsUsed || 0)} regenerations remaining`}
                            {user.subscriptionTier === 'star' && `${12 - (user.sprinthiaRegenerationsUsed || 0)} regenerations remaining`}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
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