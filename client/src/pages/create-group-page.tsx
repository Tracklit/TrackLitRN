import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Group name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Group created successfully",
      });
      setLocation("/groups");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for creating groups
  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Handle form submission
  const onSubmit = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="mr-4 text-gray-400 hover:text-white"
            onClick={() => setLocation("/groups")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Group</h1>
            <p className="text-gray-400 mt-1">Set up a new training group</p>
          </div>
        </div>

        <Card className="bg-black border border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-400" />
              Group Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter group name" 
                          {...field}
                          className="bg-gray-900 border-gray-700 focus:border-purple-500"
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the purpose of this group..."
                          {...field}
                          className="bg-gray-900 border-gray-700 focus:border-purple-500 min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation("/groups")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGroupMutation.isPending}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                  >
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Component() {
  return <CreateGroupPage />;
}