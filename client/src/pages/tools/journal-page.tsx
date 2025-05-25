import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/breadcrumb";
import { Search, Calendar, ChevronDown, ChevronUp, BookOpen, Edit, Trash2, BadgeInfo, MoreVertical, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define the journal entry type
interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  notes: string;
  type: string;
  content: any; // This will store mood ratings and workout details
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export function Component() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch journal entries
  const { data: journalEntries = [], isLoading, error } = useQuery({
    queryKey: ["/api/journal"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Filter journal entries based on search term
  const filteredEntries = (journalEntries as JournalEntry[]).filter(entry => 
    entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort entries by date
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
  });
  
  // Setup mutation for updating entries
  const updateMutation = useMutation({
    mutationFn: async (entry: JournalEntry) => {
      const response = await fetch(`/api/journal/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update journal entry');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Journal Entry Updated",
        description: "Your entry has been updated successfully.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 5000
      });
    }
  });
  
  // Setup mutation for deleting entries
  const deleteMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await fetch(`/api/journal/${entryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete journal entry');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Journal Entry Deleted",
        description: "Your entry has been removed successfully.",
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
        duration: 5000
      });
    }
  });
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "desc" ? "asc" : "desc");
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Open edit dialog
  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry({ ...entry });
    setIsEditDialogOpen(true);
  };
  
  // Handler for saving edited entry
  const handleSaveEdit = () => {
    if (!editingEntry) return;
    updateMutation.mutate(editingEntry);
    setIsEditDialogOpen(false);
    setEditingEntry(null);
  };
  
  // Handler for canceling edit
  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingEntry(null);
  };
  
  // Handler for deleting entry
  const handleDeleteEntry = (entryId: number) => {
    deleteMutation.mutate(entryId);
  };
  
  return (
    <div className="container mx-auto px-4 pb-16">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Workout Tools', href: '/training-tools' },
        { label: 'Journal', href: '/tools/journal' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Workout Journal
          </h1>
          <p className="text-muted-foreground mt-1">
            View and search your workout notes
          </p>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center justify-between">
            <span>Your Workout Journal</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleSortDirection}
              className="flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              Sort: {sortDirection === "desc" ? "Newest First" : "Oldest First"}
              {sortDirection === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CardTitle>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search journal entries..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading your journal entries...</p>
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No journal entries found. Complete a workout to add entries to your journal.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{entry.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.createdAt)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{entry.type}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    {/* Display mood rating if it exists */}
                    {entry.content?.moodRating !== undefined && (
                      <div className="flex items-center gap-2 mb-3 bg-muted/20 p-2 rounded-md">
                        <span className="text-sm font-medium">Mood:</span>
                        <div className="flex items-center">
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ 
                              background: entry.content.moodRating <= 3 ? '#ef4444' : 
                                        entry.content.moodRating <= 5 ? '#f59e0b' : 
                                        '#22c55e'
                            }}
                          >
                            {entry.content.moodRating}
                          </div>
                          <span className="text-xs ml-1">/10</span>
                        </div>
                        <Activity className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    )}
                    
                    {/* Notes content */}
                    <p className="text-sm whitespace-pre-wrap">{entry.notes || "No notes for this entry."}</p>
                    
                    {/* Workout details if available */}
                    {entry.content?.shortDistanceWorkout && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Workout Details:</p>
                        <ul className="text-xs mt-1 space-y-1">
                          {entry.content.shortDistanceWorkout && (
                            <li className="flex items-start gap-1">
                              <span className="font-medium">Short:</span> 
                              <span>{entry.content.shortDistanceWorkout}</span>
                            </li>
                          )}
                          {entry.content.mediumDistanceWorkout && (
                            <li className="flex items-start gap-1">
                              <span className="font-medium">Medium:</span> 
                              <span>{entry.content.mediumDistanceWorkout}</span>
                            </li>
                          )}
                          {entry.content.longDistanceWorkout && (
                            <li className="flex items-start gap-1">
                              <span className="font-medium">Long:</span> 
                              <span>{entry.content.longDistanceWorkout}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-end pt-0 pb-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {entry.type === "training" ? (
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => toast({
                              title: "Training Log",
                              description: "This entry was generated from your training session.",
                              duration: 3000
                            })}
                          >
                            <BadgeInfo className="h-4 w-4" />
                            <span>Generated from Training</span>
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => openEditDialog(entry)}
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-red-600 cursor-pointer"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
        <BadgeInfo className="h-3.5 w-3.5" />
        <p>Journal entries from your training sessions include mood ratings and workout details.</p>
      </div>
      
      {/* Edit Journal Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
            <DialogDescription>
              Make changes to your journal entry here.
            </DialogDescription>
          </DialogHeader>
          
          {editingEntry && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="title" className="text-right font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  className="col-span-3"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({...editingEntry, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="text-right font-medium">
                  Type
                </label>
                <Input
                  id="type"
                  className="col-span-3"
                  value={editingEntry.type}
                  onChange={(e) => setEditingEntry({...editingEntry, type: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="notes" className="text-right font-medium">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  className="col-span-3 min-h-[150px]"
                  value={editingEntry.notes || ""}
                  onChange={(e) => setEditingEntry({...editingEntry, notes: e.target.value})}
                />
              </div>
              {editingEntry.content?.moodRating !== undefined && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="mood" className="text-right font-medium">
                    Mood Rating
                  </label>
                  <div className="col-span-3 flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ 
                        background: editingEntry.content.moodRating <= 3 ? '#ef4444' : 
                                  editingEntry.content.moodRating <= 5 ? '#f59e0b' : 
                                  '#22c55e'
                      }}
                    >
                      {editingEntry.content.moodRating}
                    </div>
                    <span className="text-sm">/10</span>
                    <span className="text-sm text-muted-foreground ml-2">(Set during workout)</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}