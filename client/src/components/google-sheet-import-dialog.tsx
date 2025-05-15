import { useState } from "react";
import { UseMutationResult, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrainingProgram } from "@shared/schema";
import { FileTextIcon } from "lucide-react";
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
}: GoogleSheetImportDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Program from Google Sheet</DialogTitle>
          <DialogDescription>
            Import a training program from a Google Sheet. The sheet should be structured with
            specific columns for different workout types.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Title</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Summer Sprint Program" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your training program"
                      {...field}
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
                  <FormLabel>Google Sheet URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://docs.google.com/spreadsheets/d/..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
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
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Duration (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={importSheetMutation.isPending}
              >
                {importSheetMutation.isPending ? "Importing..." : "Import Program"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}