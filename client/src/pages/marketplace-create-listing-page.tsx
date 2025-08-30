import { useState } from "react";
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
import { insertMarketplaceListingSchema, insertProgramListingSchema, insertConsultingListingSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

// Form schemas
const programListingFormSchema = insertMarketplaceListingSchema.extend({
  programId: z.number().min(1, "Please select a program"),
  durationWeeks: z.number().min(1, "Duration must be at least 1 week"),
  level: z.string().min(1, "Please select a level"),
  category: z.string().min(1, "Please select a category"),
  compareAtPriceCents: z.number().optional(),
}).omit({ type: true });

const consultingListingFormSchema = insertMarketplaceListingSchema.extend({
  slotLengthMin: z.number().min(15, "Minimum slot length is 15 minutes"),
  pricePerSlotCents: z.number().min(100, "Minimum price is $1.00"),
  maxParticipants: z.number().min(1, "Must allow at least 1 participant"),
  deliveryFormat: z.string().min(1, "Please select delivery format"),
  sessionDurationMinutes: z.number().min(15, "Minimum session duration is 15 minutes"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().optional(),
  requirements: z.string().optional(),
  whatYouGet: z.string().optional(),
}).omit({ type: true });

type ProgramListingForm = z.infer<typeof programListingFormSchema>;
type ConsultingListingForm = z.infer<typeof consultingListingFormSchema>;

export default function MarketplaceCreateListingPage() {
  const [listingType, setListingType] = useState<'program' | 'consulting'>('program');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      subtitle: '',
      heroUrl: '',
      priceCents: 9999,
      currency: 'USD',
      tags: [],
      badges: [],
      visibility: 'draft',
      programId: 0,
      durationWeeks: 8,
      level: '',
      category: '',
    }
  });

  // Consulting listing form
  const consultingForm = useForm<ConsultingListingForm>({
    resolver: zodResolver(consultingListingFormSchema),
    defaultValues: {
      title: '',
      subtitle: '',
      heroUrl: '',
      priceCents: 7500,
      currency: 'USD',
      tags: [],
      badges: [],
      visibility: 'draft',
      slotLengthMin: 60,
      pricePerSlotCents: 7500,
      maxParticipants: 1,
      deliveryFormat: 'video-call',
      sessionDurationMinutes: 60,
      category: '',
      description: '',
      requirements: '',
      whatYouGet: '',
    }
  });

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
    const { programId, durationWeeks, level, category, compareAtPriceCents, ...listingData } = data;
    
    createListingMutation.mutate({
      listing: { ...listingData, type: 'program' },
      typeSpecific: {
        programId,
        durationWeeks,
        level,
        category,
        compareAtPriceCents,
      }
    });
  };

  const handleSubmitConsulting = (data: ConsultingListingForm) => {
    const { 
      slotLengthMin, 
      pricePerSlotCents, 
      maxParticipants, 
      deliveryFormat, 
      sessionDurationMinutes, 
      category,
      description,
      requirements,
      whatYouGet,
      ...listingData 
    } = data;
    
    createListingMutation.mutate({
      listing: { ...listingData, type: 'consulting' },
      typeSpecific: {
        slotLengthMin,
        pricePerSlotCents,
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
  const categories = ['sprint', 'distance', 'jump', 'throw', 'combined', 'strength'];
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
                      name="subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Subtitle</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Master explosive speed and technique" className="bg-white/10 border-white/20 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={programForm.control}
                    name="heroUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Hero Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/image.jpg" className="bg-white/10 border-white/20 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      name="priceCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Price (cents)</FormLabel>
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
                    <FormField
                      control={programForm.control}
                      name="compareAtPriceCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Compare at Price (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              className="bg-white/10 border-white/20 text-white" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Level and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={programForm.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {levels.map(level => (
                                <SelectItem key={level} value={level}>
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={consultingForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1-on-1 Technique Analysis" className="bg-white/10 border-white/20 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={consultingForm.control}
                      name="subtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Subtitle</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Personalized coaching session" className="bg-white/10 border-white/20 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={consultingForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe what you'll provide in this session..."
                            className="bg-white/10 border-white/20 text-white min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={consultingForm.control}
                    name="heroUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Hero Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/image.jpg" className="bg-white/10 border-white/20 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Session Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      name="priceCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            <DollarSign className="h-4 w-4 inline mr-2" />
                            Price (cents)
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