// Debug script to test video analysis data flow
const fetch = require('node-fetch');

async function testVideoAnalysisFlow() {
  try {
    console.log('=== TESTING VIDEO ANALYSIS DATA FLOW ===\n');
    
    // Test 1: Fetch video analysis list
    console.log('1. Fetching video analysis list...');
    const response = await fetch('http://localhost:5000/api/video-analysis', {
      credentials: 'include',
      headers: {
        'Cookie': 'connect.sid=your-session-id' // Replace with actual session
      }
    });
    
    if (!response.ok) {
      console.log('❌ Failed to fetch videos:', response.status);
      return;
    }
    
    const videos = await response.json();
    console.log(`✅ Found ${videos.length} videos`);
    
    // Test 2: Check each video's data structure
    for (let i = 0; i < Math.min(videos.length, 3); i++) {
      const video = videos[i];
      console.log(`\n--- Video ${i + 1}: ${video.name} ---`);
      console.log(`Status: ${video.status}`);
      console.log(`Analysis Data Type: ${typeof video.analysisData}`);
      console.log(`Analysis Data Length: ${video.analysisData ? video.analysisData.length : 'null'}`);
      
      if (video.analysisData) {
        try {
          const parsed = JSON.parse(video.analysisData);
          console.log(`✅ Analysis data is valid JSON`);
          console.log(`Structure keys: ${Object.keys(parsed).join(', ')}`);
          
          if (parsed.frame_data) {
            console.log(`Frame data: ${parsed.frame_data.length} frames`);
            if (parsed.frame_data.length > 0) {
              const firstFrame = parsed.frame_data[0];
              console.log(`First frame keys: ${Object.keys(firstFrame).join(', ')}`);
              if (firstFrame.pose_landmarks) {
                console.log(`✅ Pose landmarks found: ${firstFrame.pose_landmarks.length} points`);
              } else {
                console.log(`❌ No pose landmarks in first frame`);
              }
            }
          } else {
            console.log(`❌ No frame_data in analysis`);
          }
        } catch (error) {
          console.log(`❌ Failed to parse analysis data: ${error.message}`);
          console.log(`Raw data preview: ${video.analysisData.substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ No analysis data available`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testVideoAnalysisFlow();