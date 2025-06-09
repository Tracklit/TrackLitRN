import OpenAI from "openai";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Helper function to extract frames from video
async function extractVideoFrames(videoPath: string, outputDir: string, numFrames: number = 3): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Clear any existing frames
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
      if (file.endsWith('.jpg')) {
        fs.unlinkSync(path.join(outputDir, file));
      }
    });

    const frameFiles: string[] = [];
    
    console.log(`Extracting ${numFrames} frames from: ${videoPath}`);
    
    ffmpeg(videoPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('FFmpeg progress:', progress.percent || 'unknown', '%');
      })
      .on('end', () => {
        console.log('FFmpeg extraction completed');
        // Get the extracted frame files
        const files = fs.readdirSync(outputDir)
          .filter(file => file.endsWith('.jpg'))
          .sort()
          .slice(0, numFrames)
          .map(file => path.join(outputDir, file));
        
        console.log(`Successfully extracted ${files.length} frames:`, files);
        resolve(files);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .output(path.join(outputDir, 'frame-%03d.jpg'))
      .outputOptions([
        '-vf', `fps=1/${Math.ceil(10/numFrames)}`, // Extract 1 frame every N seconds
        '-frames:v', numFrames.toString(),
        '-q:v', '2' // High quality
      ])
      .run();
  });
}

export async function getChatCompletion(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Sprinthia, an expert AI sprint coach specializing in track and field performance analysis. Provide detailed, technical, and actionable feedback on sprint technique and biomechanics. Always structure your responses with clear sections and use bullet points for easy reading."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Analysis could not be completed at this time.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate analysis. Please try again.");
  }
}

export async function analyzeVideoWithPrompt(
  videoName: string,
  videoDescription: string,
  analysisType: string,
  videoPath?: string
): Promise<string> {
  console.log(`Starting video analysis for: ${videoName}, type: ${analysisType}`);
  
  const analysisPrompts: Record<string, string> = {
    "sprint-form": "Analyze the sprint form and running technique. Focus on body posture, arm swing, leg drive, and overall biomechanics. Provide detailed feedback on what the athlete is doing well and specific areas for improvement.",
    "block-start": "Analyze the starting blocks technique. Examine the setup position, reaction time, first few steps, and acceleration phase. Provide technical feedback on starting mechanics and suggestions for improvement.",
    "stride-length": "Analyze the stride length patterns throughout the sprint. Examine the relationship between stride length and speed phases, compare early acceleration vs. maximum velocity phases, and provide recommendations for optimal stride length.",
    "stride-frequency": "Analyze the stride frequency and cadence. Calculate approximate steps per second during different phases, examine rhythm consistency, and provide feedback on optimal turnover rate.",
    "ground-contact": "Analyze the ground contact time and foot strike patterns. Examine how long the foot stays in contact with the ground during different phases, foot placement, and provide technical feedback on contact efficiency.",
    "flight-time": "Analyze the flight time and airborne phases between steps. Examine the relationship between ground contact and flight phases, overall stride efficiency, and provide recommendations for optimal flight mechanics."
  };

  const basePrompt = analysisPrompts[analysisType];
  if (!basePrompt) {
    throw new Error("Invalid analysis type");
  }

  if (videoPath && fs.existsSync(videoPath)) {
    console.log(`Video file found: ${videoPath}`);
    
    try {
      // Use simple shell command to extract frames directly
      const tempDir = path.join(path.dirname(videoPath), `temp_frames_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });
      
      console.log(`Created temp directory: ${tempDir}`);
      
      // Use direct ffmpeg command to extract 3 frames
      const { exec } = await import('child_process');
      const extractCommand = `ffmpeg -i "${videoPath}" -vf "fps=1/3" -frames:v 3 -q:v 2 "${tempDir}/frame-%03d.jpg" 2>/dev/null`;
      
      console.log(`Executing: ${extractCommand}`);
      
      await new Promise((resolve, reject) => {
        exec(extractCommand, (error: any, stdout: any, stderr: any) => {
          if (error) {
            console.error('FFmpeg extraction error:', error);
            reject(error);
          } else {
            console.log('FFmpeg extraction completed');
            resolve(stdout);
          }
        });
      });
      
      // Check for extracted frames
      const frameFiles = fs.readdirSync(tempDir)
        .filter(file => file.endsWith('.jpg'))
        .map(file => path.join(tempDir, file))
        .sort();
      
      console.log(`Found ${frameFiles.length} extracted frames:`, frameFiles);
      
      if (frameFiles.length > 0) {
        // Convert frames to base64
        const imageContent = frameFiles.map(framePath => {
          const frameBuffer = fs.readFileSync(framePath);
          const base64Image = frameBuffer.toString('base64');
          return {
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          };
        });
        
        console.log(`Sending ${imageContent.length} frames to OpenAI for analysis`);
        
        // Use OpenAI's vision model to analyze the video frames
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are Sprinthia, an expert AI sprint coach. Analyze the video frames showing sprint technique and provide detailed technical feedback. Structure your responses with clear sections and bullet points."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `${basePrompt}

Video: ${videoName}
Description: ${videoDescription || "No description provided"}

Analyze these ${imageContent.length} frames from the sprint video and provide technical feedback.

## Overall Assessment
## Key Strengths  
## Areas for Improvement
## Recommendations
## Next Steps

Use bullet points for clarity.`
                },
                ...imageContent
              ]
            }
          ],
          max_tokens: 1200,
          temperature: 0.7,
        });
        
        // Clean up temp directory and original video file
        frameFiles.forEach(file => {
          try { fs.unlinkSync(file); } catch (e) {}
        });
        try { fs.rmdirSync(tempDir); } catch (e) {}
        
        // Delete the original video file after successful analysis
        try { 
          fs.unlinkSync(videoPath);
          console.log(`Deleted original video file: ${videoPath}`);
        } catch (e) {
          console.warn(`Could not delete video file: ${videoPath}`, e);
        }
        
        console.log("Video analysis with frames completed successfully");
        return response.choices[0].message.content || "Analysis could not be completed.";
      } else {
        // No frames extracted - clean up video file and return specific message
        console.log("No frames extracted from video");
        try { 
          fs.unlinkSync(videoPath);
          console.log(`Deleted video file after no frames extracted: ${videoPath}`);
        } catch (e) {
          console.warn(`Could not delete video file after no frames: ${videoPath}`, e);
        }
        throw new Error("Unable to extract frames from the video. Please ensure the video file is valid and contains visual content.");
      }
    } catch (error) {
      console.error("Frame extraction failed:", error);
      
      // Clean up video file even on failure
      try { 
        fs.unlinkSync(videoPath);
        console.log(`Deleted video file after analysis failure: ${videoPath}`);
      } catch (e) {
        console.warn(`Could not delete video file after failure: ${videoPath}`, e);
      }
      
      // Return the specific error message instead of fallback
      const errorMessage = error instanceof Error ? error.message : "Unable to process video file";
      throw new Error(`Video analysis failed: ${errorMessage}`);
    }
  }
  
  // This should never be reached, but adding for TypeScript compliance
  throw new Error("Video analysis could not be completed - no valid processing path available");
}