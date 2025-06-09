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
      .screenshots({
        count: numFrames,
        folder: outputDir,
        filename: 'frame-%03i.jpg',
        size: '640x480'
      });
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

  try {
    if (videoPath && fs.existsSync(videoPath)) {
      console.log(`Analyzing video: ${videoPath}`);
      
      // Create temporary directory for frames
      const tempDir = path.join(path.dirname(videoPath), 'temp_frames');
      
      try {
        // Extract frames from video using FFmpeg
        const frameFiles = await extractVideoFrames(videoPath, tempDir, 5);
        console.log(`Extracted ${frameFiles.length} frames from video`);
        
        if (frameFiles.length === 0) {
          console.log("No frames extracted, falling back to text-only analysis");
          throw new Error("No frames could be extracted from video");
        }
        
        // Convert frames to base64
        const frameImages = frameFiles.map(framePath => {
          const frameBuffer = fs.readFileSync(framePath);
          return frameBuffer.toString('base64');
        });
        
        // Create image content for OpenAI API
        const imageContent = frameImages.map((base64Image, index) => ({
          type: "image_url" as const,
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        }));
        
        // Use OpenAI's vision model to analyze the video frames
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are Sprinthia, an expert AI sprint coach specializing in track and field performance analysis. Analyze the provided sequence of video frames showing sprint technique and provide detailed, technical, and actionable feedback on sprint biomechanics. Always structure your responses with clear sections and use bullet points for easy reading."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `${basePrompt}

Video Information:
- Video Name: ${videoName}
- Description: ${videoDescription || "No description provided"}

I'm providing you with ${frameImages.length} sequential frames extracted from a sprint video. Please analyze these frames to assess the athlete's running technique, focusing on movement patterns, biomechanics, and technical execution.

Structure your response with the following sections:

## Overall Assessment
[Provide a brief summary of the athlete's performance based on the frame sequence]

## Key Strengths
[List what the athlete is doing well in their technique]

## Areas for Improvement
[Identify specific technical issues visible across the frames]

## Recommendations
[Provide actionable coaching tips and drills]

## Next Steps
[Suggest what to focus on in training]

Use bullet points within each section for clarity and easy reading.`
                },
                ...imageContent
              ]
            }
          ],
          max_tokens: 1200,
          temperature: 0.7,
        });
        
        // Clean up temporary frames
        frameFiles.forEach(framePath => {
          try {
            fs.unlinkSync(framePath);
          } catch (err) {
            console.warn(`Could not delete frame: ${framePath}`);
          }
        });
        
        // Remove temp directory if empty
        try {
          fs.rmdirSync(tempDir);
        } catch (err) {
          console.warn(`Could not remove temp directory: ${tempDir}`);
        }

        console.log("OpenAI frame sequence analysis completed successfully");
        return response.choices[0].message.content || "Analysis could not be completed at this time.";
        
      } catch (frameError) {
        console.error("Error extracting frames:", frameError);
        // Clean up temp directory on error
        try {
          if (fs.existsSync(tempDir)) {
            const files = fs.readdirSync(tempDir);
            files.forEach(file => fs.unlinkSync(path.join(tempDir, file)));
            fs.rmdirSync(tempDir);
          }
        } catch (cleanupError) {
          console.warn("Error cleaning up temp directory:", cleanupError);
        }
        // Fall through to text-only analysis
        console.log("Falling back to text-only analysis due to frame extraction failure");
      }
    } else {
      // Fallback to text-only analysis if video file not found
      const fullPrompt = `${basePrompt}

Video Information:
- Video Name: ${videoName}
- Description: ${videoDescription || "No description provided"}

Note: Video file analysis is currently unavailable. Providing general technical guidance based on the analysis type requested.

Please provide comprehensive technical guidance as Sprinthia, the AI sprint coach. Structure your response with clear sections and bullet points for easy reading.`;

      return await getChatCompletion(fullPrompt);
    }
  } catch (error) {
    console.error("Video analysis error:", error);
    // Fallback to text-only analysis
    const fullPrompt = `${basePrompt}

Video Information:
- Video Name: ${videoName}
- Description: ${videoDescription || "No description provided"}

Please provide comprehensive technical guidance as Sprinthia, the AI sprint coach. Structure your response with clear sections and bullet points for easy reading.`;

    return await getChatCompletion(fullPrompt);
  }
}