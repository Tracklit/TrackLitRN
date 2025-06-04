import { createRoot } from "react-dom/client";
import { useState } from "react";
import "./index.css";

// Inline dialog components to avoid any external dependencies
function Dialog({ open, onOpenChange, children }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  children: React.ReactNode;
}) {
  if (!open) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="relative bg-[#010a18] p-6 rounded-lg max-w-md w-full mx-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Button({ onClick, children, className = "", variant = "default" }: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: string;
}) {
  const baseStyles = "px-4 py-2 rounded font-medium transition-colors";
  const variantStyles = variant === "outline" 
    ? "border border-gray-600 text-gray-300 hover:bg-gray-700"
    : "bg-blue-600 hover:bg-blue-700 text-white";
  
  return (
    <button 
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
}

function ModalTest() {
  const [showModal, setShowModal] = useState(false);
  const [moodValue, setMoodValue] = useState(7);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Modal Fix Test</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg space-y-6">
          <h2 className="text-xl font-semibold text-white">Training Session</h2>
          
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-300">Mood: {moodValue}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={moodValue}
              onChange={(e) => setMoodValue(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <Button 
            onClick={() => setShowModal(true)}
            className="w-full"
          >
            Save Workout
          </Button>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Save Workout</h3>
            
            <div className="bg-gray-800 p-4 rounded-md mb-4">
              <h4 className="font-medium mb-2 text-white">Training Session</h4>
              
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-medium text-gray-300">Mood:</p>
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
            
            <div className="flex gap-2 justify-between">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  console.log("Workout saved:", { mood: moodValue });
                  setShowModal(false);
                }}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<ModalTest />);
}