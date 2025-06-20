#!/usr/bin/env node

import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function testMediaPipeUpload() {
  try {
    // First, log in to get session cookie
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');

    // Create a simple test video file using one of the attached assets
    const testVideoPath = './attached_assets/ScreenRecording_06-18-2025 10-28-46_1_1750235376392.mov';
    if (!fs.existsSync(testVideoPath)) {
      console.log('❌ Test video file not found at:', testVideoPath);
      return;
    }
    console.log('📹 Using test video file:', testVideoPath);

    // Upload the test video
    const form = new FormData();
    form.append('file', fs.createReadStream(testVideoPath));
    form.append('name', 'MediaPipe Test Video');
    form.append('description', 'Testing MediaPipe pose detection and overlay system');

    console.log('📤 Uploading test video...');
    const uploadResponse = await fetch('http://localhost:5000/api/video-analysis/upload', {
      method: 'POST',
      headers: {
        'Cookie': cookies
      },
      body: form
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.statusText} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('✅ Video uploaded successfully:', uploadResult);

    // Wait for processing to complete
    console.log('⏳ Waiting for MediaPipe processing...');
    let processedVideo = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const videoResponse = await fetch(`http://localhost:5000/api/video-analysis/${uploadResult.id}`, {
        headers: { 'Cookie': cookies }
      });

      if (videoResponse.ok) {
        const video = await videoResponse.json();
        if (video.status === 'completed' && video.analysisData) {
          processedVideo = video;
          break;
        }
        console.log(`Attempt ${attempts + 1}: Status = ${video.status}`);
      }
      
      attempts++;
    }

    if (!processedVideo) {
      throw new Error('Video processing timed out');
    }

    console.log('✅ Video processing completed');
    
    // Analyze the MediaPipe data structure
    let analysisData;
    try {
      analysisData = typeof processedVideo.analysisData === 'string' 
        ? JSON.parse(processedVideo.analysisData) 
        : processedVideo.analysisData;
    } catch (e) {
      console.log('📝 Analysis data is text format:', processedVideo.analysisData.substring(0, 200));
      return;
    }

    console.log('🔍 Analysis data structure:');
    console.log('- Keys:', Object.keys(analysisData));
    
    if (analysisData.mediapipe_data) {
      console.log('✅ Found mediapipe_data in combined format');
      const mediapipeData = analysisData.mediapipe_data;
      if (mediapipeData.frame_data && Array.isArray(mediapipeData.frame_data)) {
        console.log(`📊 MediaPipe frames: ${mediapipeData.frame_data.length}`);
        console.log(`🎯 FPS: ${mediapipeData.fps}`);
        console.log(`⏱️  Duration: ${mediapipeData.duration}s`);
        
        if (mediapipeData.frame_data.length > 0) {
          const firstFrame = mediapipeData.frame_data[0];
          if (firstFrame.pose_landmarks) {
            console.log(`🦴 Pose landmarks per frame: ${firstFrame.pose_landmarks.length}`);
            console.log('✅ MediaPipe pose overlay system ready');
          }
        }
      }
    } else if (analysisData.frame_data) {
      console.log('✅ Found direct MediaPipe format');
      console.log(`📊 MediaPipe frames: ${analysisData.frame_data.length}`);
    } else {
      console.log('❌ No MediaPipe pose data found');
      console.log('Available keys:', Object.keys(analysisData));
    }

    // Clean up
    if (fs.existsSync(testVideoPath)) {
      fs.unlinkSync(testVideoPath);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMediaPipeUpload();