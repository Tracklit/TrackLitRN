const { analyzeVideoWithPrompt } = require('./server/openai.ts');
const path = require('path');

async function testVideoAnalysis() {
  try {
    console.log('Testing video analysis with frame extraction...');
    
    // Test with an existing video file
    const videoPath = './uploads/video-analysis/1749419380963-42dwk5yyd.mov';
    
    const analysis = await analyzeVideoWithPrompt(
      'Sprint Test Video',
      'Testing the sprint analysis system',
      'sprint-form',
      videoPath
    );
    
    console.log('Analysis Result:');
    console.log(analysis);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testVideoAnalysis();