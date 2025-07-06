import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>TrackLit Dashboard</Text>
          <Text style={styles.subtitle}>Track & Field Training</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome to TrackLit Native</Text>
            <Text style={styles.cardText}>
              Your comprehensive track and field training platform, now native on mobile.
            </Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Today's Training</Text>
            <Text style={styles.cardText}>
              Check your practice schedule and complete your workouts.
            </Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Progress</Text>
            <Text style={styles.cardText}>
              View your latest performance metrics and improvements.
            </Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
});

export default HomeScreen;