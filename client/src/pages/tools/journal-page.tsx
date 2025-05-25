import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb } from "@/components/breadcrumb";
import { Search, Calendar, ChevronDown, ChevronUp, BookOpen, Edit, Trash2, BadgeInfo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Define the workout note type
interface WorkoutNote {
  id: string;
  date: string;
  title: string;
  content: string;
  workoutType: string;
}

// Sample workout notes data (this would normally come from API)
const mockNotes: WorkoutNote[] = [
  {
    id: "1",
    date: "2025-05-25",
    title: "Morning Run",
    content: "5km run at steady pace. Felt good, maintained 5:30/km pace throughout.",
    workoutType: "Running"
  },
  {
    id: "2",
    date: "2025-05-23",
    title: "Sprint Training",
    content: "10x100m sprints with 2 min recovery. Times ranging from 13.2s to 14.1s.",
    workoutType: "Sprints"
  },
  {
    id: "3",
    date: "2025-05-20",
    title: "Endurance Work",
    content: "Long slow distance run, 12km total. Focused on keeping heart rate below 150bpm.",
    workoutType: "Running"
  },
  {
    id: "4",
    date: "2025-05-18",
    title: "Track Session",
    content: "400m repeats x 8 with 2 min rest. Average time 68 seconds.",
    workoutType: "Track"
  },
  {
    id: "5",
    date: "2025-05-15",
    title: "Recovery Day",
    content: "Easy 3km jog followed by stretching routine. Feeling recovered after yesterday's hard session.",
    workoutType: "Recovery"
  }
];

export function Component() {
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState<WorkoutNote[]>(mockNotes);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Filter notes based on search term
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.workoutType.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort notes by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
  });
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "desc" ? "asc" : "desc");
  };
  
  // Toggle expanded note
  const toggleExpandNote = (id: string) => {
    setExpandedNote(expandedNote === id ? null : id);
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
  
  // Handlers for edit and delete actions
  const handleEditNote = (noteId: string) => {
    toast({
      title: "Edit Note",
      description: "Edit functionality will be implemented soon.",
      duration: 3000
    });
  };
  
  const handleDeleteNote = (noteId: string) => {
    // In a real app, we would call an API to delete the note
    // For now, we'll just remove it from the state
    setNotes(notes.filter(note => note.id !== noteId));
    
    toast({
      title: "Note Deleted",
      description: "Your note has been removed successfully.",
      duration: 3000
    });
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
            <span>Your Workout Notes</span>
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
              placeholder="Search notes..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {sortedNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No workout notes found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedNotes.map((note) => (
                <Card key={note.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{note.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(note.date)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{note.workoutType}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-end gap-2 pt-0 pb-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2 text-blue-600"
                      onClick={() => handleEditNote(note.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2 text-red-600"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
        <BadgeInfo className="h-3.5 w-3.5" />
        <p>Your workout notes are automatically collected from your training sessions.</p>
      </div>
    </div>
  );
}