import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PracticeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>Today's Training Session</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Warm-up</Text>
          <Text style={styles.cardText}>• 10 minutes light jogging</Text>
          <Text style={styles.cardText}>• Dynamic stretching routine</Text>
          <Text style={styles.cardText}>• High knees and butt kicks</Text>
          <TouchableOpacity style={styles.completeButton}>
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sprint Work</Text>
          <Text style={styles.cardText}>• 6 x 50m accelerations</Text>
          <Text style={styles.cardText}>• 4 x 100m at 90% effort</Text>
          <Text style={styles.cardText}>• 2 x 200m tempo runs</Text>
          <TouchableOpacity style={styles.completeButton}>
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Strength Training</Text>
          <Text style={styles.cardText}>• 3 sets of squats</Text>
          <Text style={styles.cardText}>• 3 sets of deadlifts</Text>
          <Text style={styles.cardText}>• Core conditioning</Text>
          <TouchableOpacity style={styles.completeButton}>
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cool Down</Text>
          <Text style={styles.cardText}>• 5 minutes easy walking</Text>
          <Text style={styles.cardText}>• Static stretching</Text>
          <Text style={styles.cardText}>• Foam rolling</Text>
          <TouchableOpacity style={styles.completeButton}>
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 4,
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
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#9ca3af',
    lineHeight: 24,
    marginBottom: 4,
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PracticeScreen;