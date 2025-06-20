#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';

async function debugMediaPipeFlow() {
  try {
    console.log('🔍 Starting comprehensive MediaPipe debug...');
    
    // 1. Test Python MediaPipe script directly
    console.log('\n1. Testing MediaPipe Python script directly...');
    const testVideo = './attached_assets/ScreenRecording_06-18-2025 10-28-46_1_1750235376392.mov';
    
    if (!fs.existsSync(testVideo)) {
      console.log('❌ Test video not found');
      return;
    }
    
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      const { stdout, stderr } = await execAsync(`python3 server/video-analysis-mediapipe.py "${testVideo}"`);
      console.log('✅ MediaPipe script executed successfully');
      console.log('📊 Output length:', stdout.length);
      
      const mediapipeResult = JSON.parse(stdout);
      console.log('📋 MediaPipe structure:');
      console.log('- FPS:', mediapipeResult.fps);
      console.log('- Total frames:', mediapipeResult.total_frames);
      console.log('- Duration:', mediapipeResult.duration);
      console.log('- Frame data length:', mediapipeResult.frame_data?.length);
      
      if (mediapipeResult.frame_data && mediapipeResult.frame_data.length > 0) {
        const firstFrame = mediapipeResult.frame_data[0];
        console.log('- First frame pose landmarks:', firstFrame.pose_landmarks?.length);
        console.log('✅ MediaPipe processing working correctly');
      }
    } catch (error) {
      console.log('❌ MediaPipe script failed:', error.message);
    }
    
    // 2. Login and test upload API
    console.log('\n2. Testing upload API...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', password: 'password123' })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    
    // 3. Test database state
    console.log('\n3. Checking database state...');
    const dbCheck = await fetch('http://localhost:5000/api/video-analysis', {
      headers: { 'Cookie': cookies }
    });
    
    if (dbCheck.ok) {
      const videos = await dbCheck.json();
      console.log('📊 Current videos in database:', videos.length);
      
      if (videos.length > 0) {
        const latestVideo = videos[0];
        console.log('📹 Latest video:');
        console.log('- ID:', latestVideo.id);
        console.log('- Status:', latestVideo.status);
        console.log('- Analysis data type:', typeof latestVideo.analysisData);
        console.log('- Analysis data length:', latestVideo.analysisData?.length);
        
        if (latestVideo.analysisData) {
          try {
            const parsed = JSON.parse(latestVideo.analysisData);
            console.log('- Parsed data keys:', Object.keys(parsed));
            
            if (parsed.mediapipe_data) {
              console.log('✅ MediaPipe data found in combined format');
              console.log('- MediaPipe frames:', parsed.mediapipe_data.frame_data?.length);
            } else if (parsed.frame_data) {
              console.log('✅ MediaPipe data found in direct format');
              console.log('- MediaPipe frames:', parsed.frame_data?.length);
            } else {
              console.log('❌ No MediaPipe pose data found');
            }
          } catch (e) {
            console.log('❌ Failed to parse analysis data:', e.message);
          }
        }
      }
    }
    
    console.log('\n🔍 Debug complete - check logs above for issues');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugMediaPipeFlow();