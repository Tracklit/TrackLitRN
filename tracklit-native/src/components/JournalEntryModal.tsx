import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

interface JournalEntryModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  onSave: (entry: JournalEntry) => void;
}

interface JournalEntry {
  title: string;
  notes: string;
  mood: number;
  isPublic: boolean;
  date: string;
}

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  visible,
  onClose,
  date,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(5);
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your journal entry');
      return;
    }

    setIsSaving(true);
    try {
      const entry: JournalEntry = {
        title: title.trim(),
        notes: notes.trim(),
        mood,
        isPublic,
        date,
      };
      
      await onSave(entry);
      
      // Reset form
      setTitle('');
      setNotes('');
      setMood(5);
      setIsPublic(false);
      
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setTitle('');
    setNotes('');
    setMood(5);
    setIsPublic(false);
    onClose();
  };

  const getMoodLabel = (value: number) => {
    if (value <= 2) return 'Poor';
    if (value <= 4) return 'Fair';
    if (value <= 6) return 'Good';
    if (value <= 8) return 'Great';
    return 'Excellent';
  };

  const getMoodColor = (value: number) => {
    if (value <= 2) return '#ef4444';
    if (value <= 4) return '#f97316';
    if (value <= 6) return '#eab308';
    if (value <= 8) return '#22c55e';
    return '#10b981';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Journal Entry</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Display */}
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{date}</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a title for your journal entry"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
            </View>

            {/* Notes Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did your training go today? Share your thoughts..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>

            {/* Mood Slider */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Overall Mood</Text>
              <View style={styles.moodContainer}>
                <View style={styles.moodHeader}>
                  <Text style={[styles.moodValue, { color: getMoodColor(mood) }]}>
                    {mood}/10
                  </Text>
                  <Text style={[styles.moodLabel, { color: getMoodColor(mood) }]}>
                    {getMoodLabel(mood)}
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={mood}
                  onValueChange={setMood}
                  minimumTrackTintColor={getMoodColor(mood)}
                  maximumTrackTintColor="#374151"
                  thumbStyle={styles.sliderThumb}
                  trackStyle={styles.sliderTrack}
                />
                <View style={styles.moodScale}>
                  <Text style={styles.moodScaleText}>1</Text>
                  <Text style={styles.moodScaleText}>10</Text>
                </View>
              </View>
            </View>

            {/* Public Toggle */}
            <View style={styles.inputContainer}>
              <View style={styles.toggleContainer}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.label}>Make Public</Text>
                  <Text style={styles.toggleDescription}>
                    Share this entry with your coach and teammates
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: '#374151', true: '#10b981' }}
                  thumbColor={isPublic ? '#ffffff' : '#9ca3af'}
                  ios_backgroundColor="#374151"
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 17,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#10b981',
    fontSize: 17,
    fontWeight: '600',
  },
  dateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dateText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    height: 50,
  },
  notesInput: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    height: 120,
  },
  moodContainer: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moodValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#ffffff',
    width: 20,
    height: 20,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
  },
  moodScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moodScaleText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
});

export default JournalEntryModal;