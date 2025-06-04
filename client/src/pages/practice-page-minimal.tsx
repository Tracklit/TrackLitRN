import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

export default function PracticePageMinimal() {
  const [moodValue, setMoodValue] = useState(5);
  const [diaryNotes, setDiaryNotes] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Practice Page</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg space-y-6">
          <h2 className="text-xl font-semibold text-white">Training Session</h2>
          
          {/* Mood Rating */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-300">How you felt today: {moodValue}/10</label>
            <Slider
              value={[moodValue]}
              onValueChange={(value) => setMoodValue(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Journal Notes */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-300">Journal Notes</label>
            <Textarea
              value={diaryNotes}
              onChange={(e) => setDiaryNotes(e.target.value)}
              placeholder="How did today's training go?"
              className="min-h-[100px] bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Save Button */}
          <Button 
            onClick={() => setShowSaveModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Save Workout
          </Button>
        </div>

        {/* Save Confirmation Modal */}
        <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
          <DialogContent className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <div className="relative bg-[#010a18] p-6 rounded-lg max-w-md w-full mx-4 pointer-events-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-white mb-4">
                  Save Workout
                </DialogTitle>
              </DialogHeader>
              
              <div className="bg-gray-800 p-4 rounded-md">
                <h3 className="font-medium mb-2 text-white">Training Session</h3>
                
                {/* Display the mood rating */}
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-medium text-gray-300">How you felt today:</p>
                  <div className="flex items-center">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ 
                        background: moodValue <= 3 ? '#ef4444' : 
                                  moodValue <= 5 ? '#f59e0b' : 
                                  '#22c55e'
                      }}
                    >
                      {moodValue}
                    </div>
                    <span className="text-xs ml-1 text-gray-300">/10</span>
                  </div>
                </div>
                
                <p className="text-sm font-medium mb-1 text-gray-300">Journal Notes:</p>
                <p className="text-sm text-gray-400">
                  {diaryNotes || "No notes added for this session."}
                </p>
              </div>
              
              <div className="flex gap-2 justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log("Workout saved:", { mood: moodValue, notes: diaryNotes });
                    setShowSaveModal(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}