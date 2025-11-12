import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Search, Calendar, ChevronDown, ChevronUp, BookOpen, Edit, Trash2, BadgeInfo, MoreVertical, Activity, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryNotes, setNewEntryNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch journal entries with proper JSON parsing for content
  const { data: journalEntries = [], isLoading, error } = useQuery({
    queryKey: ["/api/journal"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data: any[]) => {
      return data.map(entry => {
        // Parse the content field if it's a string
        if (entry.content && typeof entry.content === 'string') {
          try {
            entry.content = JSON.parse(entry.content);
          } catch (e) {
            console.error("Failed to parse journal entry content:", e);
          }
        }
        return entry;
      });
    }
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
  
  // Setup mutation for creating new entries
  const createMutation = useMutation({
    mutationFn: async (newEntry: { title: string; notes: string }) => {
      return await apiRequest("POST", "/api/journal", {
        title: newEntry.title,
        notes: newEntry.notes,
        type: "manual",
        content: {},
        isPublic: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Journal Entry Created",
        description: "Your new entry has been saved successfully.",
        duration: 3000
      });
      setIsCreateDrawerOpen(false);
      setNewEntryTitle("");
      setNewEntryNotes("");
    },
    onError: (error) => {
      toast({
        title: "Create Failed",
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
    
    // Make sure we have properly formatted dates for the database
    // Deep clone the entry to avoid modifying the state directly
    const entryToSave = JSON.parse(JSON.stringify(editingEntry));
    
    // Convert string dates to proper Date objects before saving
    if (typeof entryToSave.createdAt === 'string') {
      // Keep as string - the API will handle it
    }
    
    if (typeof entryToSave.updatedAt === 'string') {
      // Keep as string - the API will handle it
    }
    
    // Make sure content has proper date format if it exists
    if (entryToSave.content && entryToSave.content.date) {
      // Ensure date is a string in ISO format
      if (typeof entryToSave.content.date === 'object' && entryToSave.content.date instanceof Date) {
        entryToSave.content.date = entryToSave.content.date.toISOString();
      } else if (typeof entryToSave.content.date !== 'string') {
        // If it's not a string or Date, make it a string
        entryToSave.content.date = new Date().toISOString();
      }
    }
    
    console.log("Saving journal entry:", entryToSave);
    updateMutation.mutate(entryToSave);
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
  
  // Handler for creating new entry
  const handleCreateEntry = () => {
    if (!newEntryTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your journal entry.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    createMutation.mutate({
      title: newEntryTitle,
      notes: newEntryNotes
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container max-w-4xl mx-auto px-4 pt-20 pb-16">
        
        {/* Search and Sort Controls */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search journal entries..."
              className="pl-12 h-14 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400 backdrop-blur-xl rounded-2xl focus:ring-2 focus:ring-purple-500/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-journal"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={() => setIsCreateDrawerOpen(true)}
              data-testid="button-new-entry"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
              }}
            >
              <Plus className="h-5 w-5" />
              New Entry
            </button>
            
            <button
              onClick={toggleSortDirection}
              data-testid="button-sort-entries"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 backdrop-blur-xl text-slate-300 rounded-xl transition-colors text-sm"
            >
              <Calendar className="h-4 w-4" />
              {sortDirection === "desc" ? "Newest First" : "Oldest First"}
              {sortDirection === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        {/* Journal Entries */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-6 text-slate-400">Loading your journal entries...</p>
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg">
              {searchTerm ? "No journal entries match your search." : "No journal entries found. Complete a workout to add entries to your journal."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEntries.map((entry) => (
              <div
                key={entry.id}
                className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-slate-600/50"
                data-testid={`card-journal-entry-${entry.id}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {entry.title.replace(/Day \d+ Training -\s?/, '').replace(/\d{4}-\d{2}-\d{2}/, '')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="h-4 w-4" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className="px-3 py-1 text-xs font-semibold rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                        border: 'none'
                      }}
                    >
                      {entry.type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                          data-testid={`button-menu-${entry.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white">
                        <DropdownMenuItem 
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 focus:bg-slate-700 focus:text-white"
                          onClick={() => openEditDialog(entry)}
                          data-testid={`menu-item-edit-${entry.id}`}
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 text-red-400 cursor-pointer hover:bg-red-900/50 focus:bg-red-900/50 focus:text-red-300"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${entry.title}"?`)) {
                              handleDeleteEntry(entry.id);
                            }
                          }}
                          data-testid={`menu-item-delete-${entry.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Mood Rating */}
                {entry.content?.moodRating !== undefined && (
                  <div className="flex items-center gap-3 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                    <Activity className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-medium text-slate-300">Mood:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                        style={{ 
                          background: entry.content.moodRating <= 3 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                                    entry.content.moodRating <= 5 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                                    'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        }}
                      >
                        {entry.content.moodRating}
                      </div>
                      <span className="text-xs text-slate-400">/10</span>
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {entry.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {entry.notes}
                    </p>
                  </div>
                )}
                
                {/* Workout Details */}
                {entry.content?.shortDistanceWorkout && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <div className="space-y-2">
                      {entry.content.shortDistanceWorkout && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="font-semibold text-purple-400 min-w-[70px]">Short:</span>
                          <span className="text-slate-300">{entry.content.shortDistanceWorkout}</span>
                        </div>
                      )}
                      {entry.content.mediumDistanceWorkout && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="font-semibold text-purple-400 min-w-[70px]">Medium:</span>
                          <span className="text-slate-300">{entry.content.mediumDistanceWorkout}</span>
                        </div>
                      )}
                      {entry.content.longDistanceWorkout && (
                        <div className="flex items-start gap-2 text-sm">
                          <span className="font-semibold text-purple-400 min-w-[70px]">Long:</span>
                          <span className="text-slate-300">{entry.content.longDistanceWorkout}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Edit Journal Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px] bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Journal Entry</DialogTitle>
            <DialogDescription className="text-slate-400">
              Make changes to your journal entry here.
            </DialogDescription>
          </DialogHeader>
          
          {editingEntry && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="title" className="text-right font-medium text-slate-300">
                  Title
                </label>
                <Input
                  id="title"
                  className="col-span-3 bg-slate-800 border-slate-700 text-white"
                  value={editingEntry.title}
                  onChange={(e) => setEditingEntry({...editingEntry, title: e.target.value})}
                  data-testid="input-edit-title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="text-right font-medium text-slate-300">
                  Type
                </label>
                <Input
                  id="type"
                  className="col-span-3 bg-slate-800 border-slate-700 text-white"
                  value={editingEntry.type}
                  onChange={(e) => setEditingEntry({...editingEntry, type: e.target.value})}
                  data-testid="input-edit-type"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="notes" className="text-right font-medium text-slate-300">
                  Notes
                </label>
                <Textarea
                  id="notes"
                  className="col-span-3 min-h-[150px] bg-slate-800 border-slate-700 text-white"
                  value={editingEntry.notes || ""}
                  onChange={(e) => setEditingEntry({...editingEntry, notes: e.target.value})}
                  data-testid="textarea-edit-notes"
                />
              </div>
              {editingEntry.content?.moodRating !== undefined && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="mood" className="text-right font-medium text-slate-300">
                    Mood
                  </label>
                  <div className="col-span-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                        style={{ 
                          background: editingEntry.content.moodRating <= 3 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
                                    editingEntry.content.moodRating <= 5 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
                                    'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        }}
                      >
                        {editingEntry.content.moodRating}
                      </div>
                      <span className="text-sm text-slate-400">/10</span>
                    </div>
                    
                    <Slider 
                      value={[editingEntry.content.moodRating]}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                      onValueChange={(value) => {
                        const newContent = {
                          ...editingEntry.content,
                          moodRating: value[0]
                        };
                        setEditingEntry({
                          ...editingEntry,
                          content: newContent
                        });
                      }}
                      data-testid="slider-edit-mood"
                    />
                    
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Poor</span>
                      <span>Average</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="text-white border-none"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
              }}
              data-testid="button-save-edit"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create New Journal Entry Drawer */}
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <DrawerContent className="bg-slate-900 border-slate-700">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="text-white text-2xl">Create New Journal Entry</DrawerTitle>
              <DrawerDescription className="text-slate-400">
                Add a new entry to your journal. The date and time will be automatically recorded.
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="p-4 pb-0">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label htmlFor="new-title" className="text-sm font-medium text-slate-300">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="new-title"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    placeholder="e.g., Morning Run Reflections"
                    value={newEntryTitle}
                    onChange={(e) => setNewEntryTitle(e.target.value)}
                    data-testid="input-new-title"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="new-notes" className="text-sm font-medium text-slate-300">
                    Notes
                  </label>
                  <Textarea
                    id="new-notes"
                    className="min-h-[300px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                    placeholder="Write your thoughts, feelings, and observations about your training..."
                    value={newEntryNotes}
                    onChange={(e) => setNewEntryNotes(e.target.value)}
                    data-testid="textarea-new-notes"
                  />
                  <p className="text-xs text-slate-500">
                    Share your training experiences, goals, and reflections
                  </p>
                </div>
              </div>
            </div>
            
            <DrawerFooter>
              <Button 
                onClick={handleCreateEntry}
                disabled={createMutation.isPending}
                className="text-white border-none h-12 text-base"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)'
                }}
                data-testid="button-save-create"
              >
                {createMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
              <DrawerClose asChild>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setNewEntryTitle("");
                    setNewEntryNotes("");
                  }}
                  className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-12"
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
