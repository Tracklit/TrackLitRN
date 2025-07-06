import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProgramsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Training Programs</Text>
        <Text style={styles.subtitle}>Choose your training plan</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sprint Specialist</Text>
          <Text style={styles.cardText}>Focus on 100m and 200m events</Text>
          <Text style={styles.cardText}>• 12-week program</Text>
          <Text style={styles.cardText}>• 5 sessions per week</Text>
          <Text style={styles.cardText}>• Speed and power focused</Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select Program</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mid-Distance</Text>
          <Text style={styles.cardText}>800m and 1500m specialization</Text>
          <Text style={styles.cardText}>• 16-week program</Text>
          <Text style={styles.cardText}>• 6 sessions per week</Text>
          <Text style={styles.cardText}>• Endurance and speed</Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select Program</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Long Distance</Text>
          <Text style={styles.cardText}>5000m and 10000m events</Text>
          <Text style={styles.cardText}>• 20-week program</Text>
          <Text style={styles.cardText}>• 7 sessions per week</Text>
          <Text style={styles.cardText}>• Aerobic base building</Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select Program</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Field Events</Text>
          <Text style={styles.cardText}>Jumps and throws training</Text>
          <Text style={styles.cardText}>• 14-week program</Text>
          <Text style={styles.cardText}>• 4 sessions per week</Text>
          <Text style={styles.cardText}>• Technical and strength</Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select Program</Text>
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
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 4,
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProgramsScreen;