import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Calendar, Clock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Meet } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface CustomizePreparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meet: Meet;
}

interface PreparationStep {
  id: string;
  title: string;
  description: string;
  category: string;
  daysBeforeMeet: number;
  hoursBeforeMeet: number;
}

const CATEGORIES = [
  { value: 'nutrition', label: 'Nutrition', color: 'bg-green-900/30 text-green-200' },
  { value: 'exercise', label: 'Exercise', color: 'bg-blue-900/30 text-blue-200' },
  { value: 'rest', label: 'Rest', color: 'bg-purple-900/30 text-purple-200' },
  { value: 'warmup', label: 'Warm-up', color: 'bg-orange-900/30 text-orange-200' },
  { value: 'hydration', label: 'Hydration', color: 'bg-cyan-900/30 text-cyan-200' },
  { value: 'mental', label: 'Mental Prep', color: 'bg-pink-900/30 text-pink-200' },
  { value: 'equipment', label: 'Equipment', color: 'bg-gray-700/30 text-gray-200' },
];

const DEFAULT_STEPS: PreparationStep[] = [
  {
    id: '1',
    title: 'Nutrition preparation',
    description: 'Focus on complex carbs, lean protein, and hydration',
    category: 'nutrition',
    daysBeforeMeet: 2,
    hoursBeforeMeet: 0
  },
  {
    id: '2',
    title: 'Check equipment',
    description: 'Prepare uniform, spikes, gear, and competition items',
    category: 'equipment',
    daysBeforeMeet: 1,
    hoursBeforeMeet: 0
  },
  {
    id: '3',
    title: 'Early sleep',
    description: 'Get 8+ hours of restful sleep',
    category: 'rest',
    daysBeforeMeet: 0,
    hoursBeforeMeet: 12
  },
  {
    id: '4',
    title: 'Pre-competition meal',
    description: 'Light, familiar meal 3-4 hours before competition',
    category: 'nutrition',
    daysBeforeMeet: 0,
    hoursBeforeMeet: 4
  },
  {
    id: '5',
    title: 'Dynamic warm-up',
    description: 'Complete warmup routine including drills and strides',
    category: 'warmup',
    daysBeforeMeet: 0,
    hoursBeforeMeet: 1
  },
];

export function CustomizePreparationModal({ isOpen, onClose, meet }: CustomizePreparationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<PreparationStep[]>(DEFAULT_STEPS);
  const [editingStep, setEditingStep] = useState<PreparationStep | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state for editing/adding steps
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDays, setFormDays] = useState(0);
  const [formHours, setFormHours] = useState(0);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
    setFormDays(0);
    setFormHours(0);
    setEditingStep(null);
    setIsAddingNew(false);
  };

  const startEditing = (step: PreparationStep) => {
    setEditingStep(step);
    setFormTitle(step.title);
    setFormDescription(step.description);
    setFormCategory(step.category);
    setFormDays(step.daysBeforeMeet);
    setFormHours(step.hoursBeforeMeet);
    setIsAddingNew(false);
  };

  const startAdding = () => {
    resetForm();
    setIsAddingNew(true);
  };

  const saveStep = () => {
    if (!formTitle.trim() || !formCategory) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in title and category',
        variant: 'destructive'
      });
      return;
    }

    const newStep: PreparationStep = {
      id: editingStep?.id || Date.now().toString(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      daysBeforeMeet: formDays,
      hoursBeforeMeet: formHours
    };

    if (editingStep) {
      setSteps(prev => prev.map(s => s.id === editingStep.id ? newStep : s));
    } else {
      setSteps(prev => [...prev, newStep]);
    }

    resetForm();
  };

  const removeStep = (id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const savePreparationPlan = useMutation({
    mutationFn: async () => {
      // Convert steps to reminders
      const meetDate = new Date(meet.date);
      const reminders = steps.map(step => {
        const reminderDate = new Date(meetDate);
        reminderDate.setDate(reminderDate.getDate() - step.daysBeforeMeet);
        reminderDate.setHours(reminderDate.getHours() - step.hoursBeforeMeet);

        return {
          meetId: meet.id,
          title: step.title,
          description: step.description,
          category: step.category,
          date: reminderDate,
          isCompleted: false
        };
      });

      // Save each reminder
      for (const reminder of reminders) {
        const response = await apiRequest('POST', '/api/reminders', reminder);
        if (!response.ok) {
          throw new Error('Failed to save preparation plan');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meet.id}/reminders`] });
      toast({
        title: 'Preparation Plan Saved',
        description: 'Your custom preparation plan has been created'
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Saving Plan',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getCategoryColor = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-700/30 text-gray-200';
  };

  const formatTiming = (days: number, hours: number) => {
    if (days > 0 && hours > 0) {
      return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''} before`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} before`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} before`;
    } else {
      return 'At meet time';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0c1525] border-blue-800/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Customize Preparation Plan</DialogTitle>
          <p className="text-sm text-blue-300">Create a personalized preparation timeline for {meet.name}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Steps */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Preparation Steps</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {steps.map(step => (
                <div key={step.id} className="flex items-center justify-between p-3 bg-[#081020] border border-blue-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{step.title}</h4>
                      <Badge className={getCategoryColor(step.category)}>
                        {CATEGORIES.find(c => c.value === step.category)?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-300 mb-1">{step.description}</p>
                    <div className="flex items-center text-xs text-blue-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTiming(step.daysBeforeMeet, step.hoursBeforeMeet)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(step)}
                      className="text-blue-300 hover:text-white hover:bg-blue-800/30"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={startAdding}
              className="w-full mt-3 border-blue-700 text-blue-300 hover:bg-blue-900/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Preparation Step
            </Button>
          </div>

          {/* Step Editor */}
          {(editingStep || isAddingNew) && (
            <div className="p-4 bg-[#081020] border border-blue-800/50 rounded-lg space-y-3">
              <h4 className="font-medium text-white">
                {editingStep ? 'Edit Step' : 'Add New Step'}
              </h4>

              <div>
                <Label htmlFor="step-title" className="text-white">Title</Label>
                <Input
                  id="step-title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Dynamic warm-up"
                  className="bg-[#0c1525] border-blue-800/50 text-white"
                />
              </div>

              <div>
                <Label htmlFor="step-description" className="text-white">Description</Label>
                <Textarea
                  id="step-description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed description of this preparation step"
                  className="bg-[#0c1525] border-blue-800/50 text-white"
                  rows={2}
                />
              </div>

              <div>
                <Label className="text-white">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="bg-[#0c1525] border-blue-800/50 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0c1525] border-blue-800/50">
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value} className="text-white hover:bg-blue-800/30">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="step-days" className="text-white">Days Before</Label>
                  <Input
                    id="step-days"
                    type="number"
                    min="0"
                    max="30"
                    value={formDays}
                    onChange={(e) => setFormDays(parseInt(e.target.value) || 0)}
                    className="bg-[#0c1525] border-blue-800/50 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="step-hours" className="text-white">Hours Before</Label>
                  <Input
                    id="step-hours"
                    type="number"
                    min="0"
                    max="23"
                    value={formHours}
                    onChange={(e) => setFormHours(parseInt(e.target.value) || 0)}
                    className="bg-[#0c1525] border-blue-800/50 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={saveStep}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {editingStep ? 'Update Step' : 'Add Step'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="border-blue-700 text-blue-300 hover:bg-blue-900/30"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-blue-700 text-blue-300 hover:bg-blue-900/30"
          >
            Cancel
          </Button>
          <Button
            onClick={() => savePreparationPlan.mutate()}
            disabled={savePreparationPlan.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {savePreparationPlan.isPending ? 'Saving...' : 'Save Preparation Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}