import { useState } from "react";
import { UseMutationResult, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrainingProgram } from "@shared/schema";
import { FileTextIcon, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface GoogleSheetImportDialogProps {
  onSuccess?: (programId: number) => void;
  className?: string;
  buttonText?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const googleSheetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  googleSheetUrl: z.string().url("Please enter a valid Google Sheet URL"),
  category: z.string().min(1, "Category is required"),
  level: z.string().optional(),
  visibility: z.enum(["private", "public", "premium"]).default("private"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 day"),
});

type GoogleSheetFormData = z.infer<typeof googleSheetSchema>;

interface ImportGoogleSheetResponse {
  program: TrainingProgram;
  importedSessions: number;
}

export function GoogleSheetImportDialog({
  onSuccess,
  className,
  buttonText = "Import from Google Sheet",
  variant = "default",
  size = "default",
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: GoogleSheetImportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const form = useForm<GoogleSheetFormData>({
    resolver: zodResolver(googleSheetSchema),
    defaultValues: {
      title: "",
      description: "",
      googleSheetUrl: "",
      category: "sprint",
      level: "intermediate",
      visibility: "private",
      duration: 30,
    },
  });

  const importSheetMutation = useMutation({
    mutationFn: async (data: GoogleSheetFormData) => {
      const response = await apiRequest(
        "POST",
        "/api/programs/import-sheet",
        data
      );
      return response.json() as Promise<ImportGoogleSheetResponse>;
    },
    onSuccess: (data) => {
      toast({
        title: "Program imported successfully!",
        description: `Imported ${data.importedSessions} sessions from Google Sheet.`,
      });
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      
      if (onSuccess) {
        onSuccess(data.program.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to import program",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: GoogleSheetFormData) {
    importSheetMutation.mutate(data);
  }

  return (
    <>
      {!externalOpen && (
        <Button 
          variant={variant} 
          size={size} 
          className={className}
          onClick={() => setOpen(true)}
          data-testid="button-import-google-sheet"
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      )}

      {/* Import Drawer */}
      <div className={`fixed inset-0 z-[100] flex transition-all duration-300 ease-out ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />
        
        {/* Drawer Content */}
        <div className={`relative ml-auto w-full max-w-md h-full bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-2xl transform transition-all duration-500 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col overflow-hidden`}>
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pt-20 pb-24 space-y-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center z-10"
              data-testid="button-close-drawer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Import Program from Google Sheet</h2>
              <p className="text-sm text-white/70">
                Import a training program from a Google Sheet. The sheet should be structured with
                specific columns for different workout types.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Program Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E.g. Summer Sprint Program" 
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...field} 
                          data-testid="input-program-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your training program"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...field}
                          data-testid="input-program-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="googleSheetUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Google Sheet URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://docs.google.com/spreadsheets/d/..." 
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          {...field} 
                          data-testid="input-google-sheet-url"
                        />
                      </FormControl>
                      <FormDescription className="text-white/60">
                        Make sure the sheet is publicly accessible or shared with view permissions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger 
                              className="bg-white/10 border-white/20 text-white"
                              data-testid="select-category"
                            >
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sprint">Sprint</SelectItem>
                            <SelectItem value="distance">Distance</SelectItem>
                            <SelectItem value="jumps">Jumps</SelectItem>
                            <SelectItem value="throws">Throws</SelectItem>
                            <SelectItem value="multi">Multi Event</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger 
                              className="bg-white/10 border-white/20 text-white"
                              data-testid="select-level"
                            >
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="elite">Elite</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Visibility</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger 
                              className="bg-white/10 border-white/20 text-white"
                              data-testid="select-visibility"
                            >
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Duration (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            {...field}
                            data-testid="input-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={importSheetMutation.isPending}
                    className="flex-1 bg-white text-blue-900 hover:bg-white/90"
                    data-testid="button-import-submit"
                  >
                    {importSheetMutation.isPending ? "Importing..." : "Import Program"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}