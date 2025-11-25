import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tracklit.app',
  appName: 'TrackLit',
  webDir: 'dist/public'
  server: {
    url: 'https://tracklit.replit.app', // Replace with your actual Replit URL
    cleartext: true
  }
};

export default config;
