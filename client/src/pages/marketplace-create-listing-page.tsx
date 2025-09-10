import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign, Clock, Users } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { insertMarketplaceListingSchema, insertProgramListingSchema, insertConsultingListingSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

// Form schemas
const programListingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(6, "Description must be at least 6 characters"),
  previewImageUrl: z.string().optional(),
  price: z.number().min(0.01, "Price must be at least $0.01"),
  currency: z.string().default('USD'),
  tags: z.array(z.string()).default([]),
  badges: z.array(z.string()).default([]),
  visibility: z.enum(['draft', 'public', 'unlisted']).default('draft'),
  programId: z.number().min(1, "Please select a program"),
  durationWeeks: z.number().min(1, "Duration must be at least 1 week"),
  category: z.string().optional().default("General"),
});

const consultingListingFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(6, "Description must be at least 6 characters"),
  previewImageUrl: z.string().optional(),
  price: z.number().min(0.01, "Price must be at least $0.01"),
  currency: z.string().default('USD'),
  tags: z.array(z.string()).default([]),
  badges: z.array(z.string()).default([]),
  visibility: z.enum(['draft', 'public', 'unlisted']).default('draft'),
  slotLengthMin: z.number().min(15, "Minimum slot length is 15 minutes"),
  pricePerSlot: z.number().min(1, "Minimum price is $1.00"),
  maxParticipants: z.number().min(1, "Must allow at least 1 participant"),
  deliveryFormat: z.string().min(1, "Please select delivery format"),
  sessionDurationMinutes: z.number().min(15, "Minimum session duration is 15 minutes"),
  category: z.string().optional().default("General"),
  requirements: z.string().optional(),
  whatYouGet: z.string().optional(),
});

type ProgramListingForm = z.infer<typeof programListingFormSchema>;
type ConsultingListingForm = z.infer<typeof consultingListingFormSchema>;

export default function MarketplaceCreateListingPage() {
  const [listingType, setListingType] = useState<'program' | 'consulting'>('program');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch available programs for the current user
  const { data: programs } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await fetch('/api/programs');
      if (!response.ok) throw new Error('Failed to fetch programs');
      return response.json();
    }
  });

  // Program listing form
  const programForm = useForm<ProgramListingForm>({
    resolver: zodResolver(programListingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      previewImageUrl: '',
      price: 99.99,
      currency: 'USD',
      tags: [],
      badges: [],
      visibility: 'draft' as const,
      programId: 0,
      durationWeeks: 8,
      category: 'General',
    }
  });

  // Consulting listing form
  const consultingForm = useForm<ConsultingListingForm>({
    resolver: zodResolver(consultingListingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      previewImageUrl: '',
      price: 75.00,
      currency: 'USD',
      tags: [],
      badges: [],
      visibility: 'draft' as const,
      slotLengthMin: 60,
      pricePerSlot: 75.00,
      maxParticipants: 1,
      deliveryFormat: 'video-call',
      sessionDurationMinutes: 60,
      category: 'General',
      requirements: '',
      whatYouGet: '',
    }
  });

  // Auto-populate price when program is selected
  useEffect(() => {
    const selectedProgramId = programForm.watch('programId');
    const selectedProgram = programs?.find((p: any) => p.id === selectedProgramId);
    
    if (selectedProgram) {
      // Convert from spikes/cents to dollars if needed
      const priceInDollars = selectedProgram.priceType === 'money' ? selectedProgram.price / 100 : selectedProgram.price;
      if (selectedProgram.price > 0) {
        programForm.setValue('price', priceInDollars);
      }
      programForm.setValue('title', selectedProgram.title);
      programForm.setValue('description', selectedProgram.description || '');
    }
  }, [programForm.watch('programId'), programs, programForm]);

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (data: { listing: any; typeSpecific: any }) => {
      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create listing');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Listing created!",
        description: "Your listing has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings'] });
      setLocation(`/marketplace/listings/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create listing",
        variant: "destructive"
      });
    }
  });

  const handleSubmitProgram = (data: ProgramListingForm) => {
    const { programId, durationWeeks, category, price, previewImageUrl, description, ...listingData } = data;
    
    createListingMutation.mutate({
      listing: { 
        ...listingData, 
        type: 'program',
        priceCents: Math.round(price * 100), // Convert dollars to cents for API
        subtitle: description, // Map description back to subtitle for API
        heroUrl: previewImageUrl || ''
      },
      typeSpecific: {
        programId,
        durationWeeks,
        category,
      }
    });
  };

  const handleSubmitConsulting = (data: ConsultingListingForm) => {
    const { 
      slotLengthMin, 
      pricePerSlot, 
      maxParticipants, 
      deliveryFormat, 
      sessionDurationMinutes, 
      category,
      description,
      requirements,
      whatYouGet,
      price,
      previewImageUrl,
      ...listingData 
    } = data;
    
    createListingMutation.mutate({
      listing: { 
        ...listingData, 
        type: 'consulting',
        priceCents: Math.round(price * 100), // Convert dollars to cents for API
        subtitle: description, // Map description back to subtitle for API
        heroUrl: previewImageUrl || ''
      },
      typeSpecific: {
        slotLengthMin,
        pricePerSlotCents: Math.round(pricePerSlot * 100), // Convert to cents
        maxParticipants,
        deliveryFormat,
        sessionDurationMinutes,
        category,
        description,
        requirements,
        whatYouGet,
      }
    });
  };

  const levels = ['beginner', 'intermediate', 'advanced'];
  const categories = ['General', 'sprint', 'distance', 'jump', 'throw', 'combined', 'strength'];
  const deliveryFormats = ['video-call', 'in-person', 'phone-call'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/marketplace">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Create New Listing</h1>
            <p className="text-gray-300">Share your expertise with the TrackLit community</p>
          </div>
        </div>

        {/* Listing Type Selection */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">What would you like to offer?</CardTitle>
            <CardDescription className="text-gray-300">
              Choose the type of listing you want to create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={listingType} onValueChange={(value) => setListingType(value as 'program' | 'consulting')}>
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger value="program" className="data-[state=active]:bg-white/20 text-white">
                  Training Program
                </TabsTrigger>
                <TabsTrigger value="consulting" className="data-[state=active]:bg-white/20 text-white">
                  Consulting Session
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Program Listing Form */}
        {listingType === 'program' && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Training Program Details</CardTitle>
              <CardDescription className="text-gray-300">
                Create a listing for your training program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...programForm}>
                <form onSubmit={programForm.handleSubmit(handleSubmitProgram)} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={programForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Elite Sprint Development" className="bg-white/10 border-white/20 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={programForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} placeholder="Master explosive speed and technique with this comprehensive program..." className="bg-white/10 border-white/20 text-white min-h-[100px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <FormLabel className="text-white">Preview Image</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760} // 10MB
                        requiresSubscription={false}
                        onGetUploadParameters={async () => {
                          const response = await fetch('/api/marketplace/upload-url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          });
                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || 'Failed to get upload URL');
                          }
                          const { uploadURL, publicURL } = await response.json();
                          return { method: 'PUT', url: uploadURL, publicURL };
                        }}
                        onComplete={async (result) => {
                          // Extract public URL from upload result
                          const publicURL = (result as any).publicURL || result.uploadURL.split('?')[0];
                          
                          try {
                            // Make the image publicly accessible
                            const response = await fetch('/api/marketplace/images', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ imageURL: publicURL })
                            });
                            
                            if (response.ok) {
                              programForm.setValue('previewImageUrl', publicURL);
                              toast({
                                title: "Image uploaded successfully!",
                                description: "Your preview image is now publicly accessible."
                              });
                            } else {
                              const errorData = await response.json();
                              throw new Error(errorData.error || 'Failed to set image as public');
                            }
                          } catch (error) {
                            console.error('Error setting image as public:', error);
                            toast({
                              title: "Upload warning",
                              description: "Image uploaded but may not be publicly visible. Please try again.",
                              variant: "destructive"
                            });
                            // Still set the URL for retry
                            programForm.setValue('previewImageUrl', publicURL);
                          }
                        }}
                        buttonClassName="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Upload Preview Image
                      </ObjectUploader>
                      
                      {programForm.watch('previewImageUrl') && (
                        <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-4">
                          <p className="text-white text-sm mb-2">Preview Image:</p>
                          <img 
                            src={programForm.watch('previewImageUrl')} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              console.error('Image failed to load:', programForm.watch('previewImageUrl'));
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', programForm.watch('previewImageUrl'));
                            }}
                          />
                          <p className="text-gray-300 text-xs mt-2 break-all">
                            {programForm.watch('previewImageUrl')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Program Selection */}
                  <FormField
                    control={programForm.control}
                    name="programId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Select Program</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Choose a program to sell" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs?.map((program: any) => (
                              <SelectItem key={program.id} value={program.id.toString()}>
                                {program.title} ({program.duration} weeks)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={programForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            <DollarSign className="h-4 w-4 inline mr-2" />
                            Price (USD)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-white/10 border-white/20 text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={programForm.control}
                      name="durationWeeks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Duration (weeks)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="bg-white/10 border-white/20 text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Category */}
                  <FormField
                    control={programForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Visibility */}
                  <FormField
                    control={programForm.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Visibility</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={createListingMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {createListingMutation.isPending ? "Creating..." : "Create Program Listing"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Consulting Listing Form */}
        {listingType === 'consulting' && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Consulting Session Details</CardTitle>
              <CardDescription className="text-gray-300">
                Create a listing for your coaching services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...consultingForm}>
                <form onSubmit={consultingForm.handleSubmit(handleSubmitConsulting)} className="space-y-6">
                  {/* Basic Info */}
                  <FormField
                    control={consultingForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Title</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="1-on-1 Technique Analysis" className="bg-white/10 border-white/20 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={consultingForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''}
                            placeholder="Describe what you'll provide in this session..."
                            className="bg-white/10 border-white/20 text-white min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel className="text-white">Preview Image</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760} // 10MB
                        requiresSubscription={false}
                        onGetUploadParameters={async () => {
                          const response = await fetch('/api/marketplace/upload-url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          });
                          if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.message || 'Failed to get upload URL');
                          }
                          const { uploadURL, publicURL } = await response.json();
                          return { method: 'PUT', url: uploadURL, publicURL };
                        }}
                        onComplete={async (result) => {
                          // Extract public URL from upload result
                          const publicURL = (result as any).publicURL || result.uploadURL.split('?')[0];
                          
                          try {
                            // Make the image publicly accessible
                            const response = await fetch('/api/marketplace/images', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ imageURL: publicURL })
                            });
                            
                            if (response.ok) {
                              consultingForm.setValue('previewImageUrl', publicURL);
                              toast({
                                title: "Image uploaded successfully!",
                                description: "Your preview image is now publicly accessible."
                              });
                            } else {
                              const errorData = await response.json();
                              throw new Error(errorData.error || 'Failed to set image as public');
                            }
                          } catch (error) {
                            console.error('Error setting image as public:', error);
                            toast({
                              title: "Upload warning",
                              description: "Image uploaded but may not be publicly visible. Please try again.",
                              variant: "destructive"
                            });
                            // Still set the URL for retry
                            consultingForm.setValue('previewImageUrl', publicURL);
                          }
                        }}
                        buttonClassName="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Upload Preview Image
                      </ObjectUploader>
                      
                      {consultingForm.watch('previewImageUrl') && (
                        <div className="bg-white/10 backdrop-blur-sm border-white/20 rounded-lg p-4">
                          <p className="text-white text-sm mb-2">Preview Image:</p>
                          <img 
                            src={consultingForm.watch('previewImageUrl')} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              console.error('Image failed to load:', consultingForm.watch('previewImageUrl'));
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', consultingForm.watch('previewImageUrl'));
                            }}
                          />
                          <p className="text-gray-300 text-xs mt-2 break-all">
                            {consultingForm.watch('previewImageUrl')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={consultingForm.control}
                      name="pricePerSlot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            <DollarSign className="h-4 w-4 inline mr-2" />
                            Price per Session (USD)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-white/10 border-white/20 text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Session Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={consultingForm.control}
                      name="sessionDurationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            <Clock className="h-4 w-4 inline mr-2" />
                            Duration (minutes)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="bg-white/10 border-white/20 text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={consultingForm.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            <Users className="h-4 w-4 inline mr-2" />
                            Max Participants
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="bg-white/10 border-white/20 text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={consultingForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            <DollarSign className="h-4 w-4 inline mr-2" />
                            Price (USD)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-white/10 border-white/20 text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={consultingForm.control}
                      name="deliveryFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Delivery Format</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {deliveryFormats.map(format => (
                                <SelectItem key={format} value={format}>
                                  {format.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={consultingForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={consultingForm.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="What should participants bring or prepare?"
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={consultingForm.control}
                      name="whatYouGet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">What You Get</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ''}
                              placeholder="What will participants receive from this session?"
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Visibility */}
                  <FormField
                    control={consultingForm.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Visibility</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={createListingMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    {createListingMutation.isPending ? "Creating..." : "Create Consulting Listing"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}