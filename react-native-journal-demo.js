// React Native Journal Modal Demo
// This demonstrates the journal functionality with proper iOS styling

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
  Slider,
} from 'react-native';

const JournalDemo = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(5);
  const [isPublic, setIsPublic] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    const entry = {
      title: title.trim(),
      notes: notes.trim(),
      mood,
      isPublic,
      date: new Date().toLocaleDateString()
    };
    
    console.log('Journal Entry:', entry);
    Alert.alert('Success', 'Journal entry saved!');
    
    // Reset form
    setTitle('');
    setNotes('');
    setMood(5);
    setIsPublic(false);
    setModalVisible(false);
  };

  const getMoodLabel = (value) => {
    if (value <= 2) return 'Poor';
    if (value <= 4) return 'Fair';
    if (value <= 6) return 'Good';
    if (value <= 8) return 'Great';
    return 'Excellent';
  };

  const getMoodColor = (value) => {
    if (value <= 2) return '#ef4444';
    if (value <= 4) return '#f97316';
    if (value <= 6) return '#eab308';
    if (value <= 8) return '#22c55e';
    return '#10b981';
  };

  return (
    <View style={styles.container}>
      {/* Practice Screen with Journal Button */}
      <View style={styles.header}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>Today's Training Session</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sprint Work</Text>
            <TouchableOpacity 
              style={styles.journalButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.journalButtonText}>✏️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cardText}>• 6 x 50m accelerations</Text>
          <Text style={styles.cardText}>• 4 x 100m at 90% effort</Text>
          <Text style={styles.cardText}>• 2 x 200m tempo runs</Text>
        </View>
      </ScrollView>

      {/* Journal Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Journal Entry</Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Title Input */}
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter a title"
                placeholderTextColor="#9ca3af"
              />

              {/* Notes Input */}
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did your training go?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
              />

              {/* Mood Slider */}
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
                />
              </View>

              {/* Public Toggle */}
              <View style={styles.toggleContainer}>
                <Text style={styles.label}>Make Public</Text>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: '#374151', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  journalButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  journalButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  cardText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  keyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 17,
  },
  saveText: {
    color: '#10b981',
    fontSize: 17,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 20,
  },
  titleInput: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
  },
  notesInput: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
    height: 100,
    textAlignVertical: 'top',
  },
  moodContainer: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
  },
});

export default JournalDemo;

// Key Features of this React Native Journal Implementation:
// 1. Fixed modal movement issue using native React Native components
// 2. Single mood slider (1-10) with dynamic color coding
// 3. iOS-style modal with proper slide presentation
// 4. Keyboard avoidance for proper form interaction
// 5. Native Switch component for iOS-style toggling
// 6. Proper touch targets and iOS design patterns
// 7. Form validation with native Alert dialogs
// 8. State management with proper cleanup

// To test:
// 1. Run this in a React Native environment
// 2. Tap the ✏️ icon on the Sprint Work card
// 3. Modal slides up from bottom (iOS style)
// 4. Fill out form fields without modal movement issues
// 5. Slider works smoothly with dynamic colors
// 6. Save button validates and shows success alert