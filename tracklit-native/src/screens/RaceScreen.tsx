import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RaceScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Meets</Text>
        <Text style={styles.subtitle}>Upcoming competitions</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Regional Championships</Text>
            <Text style={styles.dateText}>March 15, 2025</Text>
          </View>
          <Text style={styles.cardText}>• 100m Dash - 10:30 AM</Text>
          <Text style={styles.cardText}>• 200m Dash - 2:15 PM</Text>
          <Text style={styles.cardText}>• 4x100m Relay - 4:45 PM</Text>
          <Text style={styles.venueText}>📍 City Athletics Stadium</Text>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Spring Invitational</Text>
            <Text style={styles.dateText}>April 2, 2025</Text>
          </View>
          <Text style={styles.cardText}>• 400m Dash - 11:00 AM</Text>
          <Text style={styles.cardText}>• 800m Run - 1:30 PM</Text>
          <Text style={styles.cardText}>• Long Jump - 3:00 PM</Text>
          <Text style={styles.venueText}>📍 University Track Complex</Text>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>State Qualifier</Text>
            <Text style={styles.dateText}>May 10, 2025</Text>
          </View>
          <Text style={styles.cardText}>• 1500m Run - 9:00 AM</Text>
          <Text style={styles.cardText}>• 5000m Run - 11:30 AM</Text>
          <Text style={styles.cardText}>• Shot Put - 2:00 PM</Text>
          <Text style={styles.venueText}>📍 Metro Sports Complex</Text>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Winter Series #3</Text>
            <Text style={styles.resultText}>100m: 11.24s (2nd place)</Text>
            <Text style={styles.resultText}>200m: 22.89s (1st place) 🥇</Text>
          </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  cardText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 4,
  },
  venueText: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 8,
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default RaceScreen;