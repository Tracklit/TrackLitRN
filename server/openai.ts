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
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development'
});

// Helper function to clean markdown formatting from AI responses
function cleanMarkdownFormatting(text: string): string {
  if (!text) return text;
  
  // Remove markdown headers (# and ##)
  text = text.replace(/^#{1,6}\s*/gm, '');
  
  // Remove bold markdown (**text** and __text__)
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  
  // Remove italic markdown (*text* and _text_)
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');
  
  // Clean up any remaining stray * or # characters that might be at start of lines
  text = text.replace(/^[\*#]+\s*/gm, '');
  
  return text.trim();
}

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
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI service is not configured. Please add OPENAI_API_KEY environment variable.");
  }
  
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

    const content = response.choices[0].message.content || "Analysis could not be completed at this time.";
    return cleanMarkdownFormatting(content);
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
        
        try {
          // Use OpenAI's vision model to analyze the video frames
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are Sprinthia, an expert AI sprint coach and biomechanics analyst. You can analyze video frames showing athletic movement and running technique. Always provide specific, detailed technical feedback even if the video quality is not perfect. Focus on what you can observe and provide constructive analysis."
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `${basePrompt}

Video: ${videoName}
Description: ${videoDescription || "No description provided"}

Please analyze these ${imageContent.length} frames from the video. Even if the image quality is not perfect, provide your best technical assessment based on what you can observe. Look for:

- Body positioning and posture
- Arm and leg movement patterns  
- Running form and technique
- Any visible biomechanical elements

Provide specific, actionable feedback in this format:

## Overall Assessment
[Provide your analysis of what you can see]

## Key Observations
- [List specific technical observations]

## Areas for Improvement  
- [Suggest improvements based on visible form]

## Recommendations
- [Give specific training advice]

Be specific and technical in your analysis. Do not say you cannot analyze - instead, work with what you can observe.`
                  },
                  ...imageContent
                ]
              }
            ],
            max_tokens: 1500,
            temperature: 0.3,
          });
          
          const analysisResult = response.choices[0].message.content || "Analysis could not be completed.";
          console.log("Video analysis completed. Response length:", analysisResult.length);
          console.log("Analysis preview:", analysisResult.substring(0, 200) + "...");
          
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
          
          return cleanMarkdownFormatting(analysisResult);
          
        } catch (apiError: any) {
          console.error("OpenAI API Error:", {
            message: apiError.message,
            status: apiError.status,
            type: apiError.type,
            code: apiError.code
          });
          
          // Clean up temp directory and original video file even on API failure
          frameFiles.forEach(file => {
            try { fs.unlinkSync(file); } catch (e) {}
          });
          try { fs.rmdirSync(tempDir); } catch (e) {}
          try { 
            fs.unlinkSync(videoPath);
            console.log(`Deleted video file after API error: ${videoPath}`);
          } catch (e) {}
          
          // Return specific error based on API response
          if (apiError.message?.includes('insufficient_quota')) {
            return "Video analysis is temporarily unavailable due to API limits. Please try again later or contact support.";
          } else if (apiError.message?.includes('invalid_request_error')) {
            return "The video format is not supported for analysis. Please try with a different video file.";
          } else {
            return `Video analysis failed: ${apiError.message || 'Unknown API error'}`;
          }
        }
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

interface TrainingProgramParams {
  title: string;
  description: string;
  totalLengthWeeks: number;
  blocks: number;
  workoutsPerWeek: number;
  gymWorkoutsPerWeek: number;
  blockFocus: 'speed' | 'speed-maintenance' | 'speed-endurance' | 'mixed' | 'short-to-long' | 'long-to-short';
  specificRequirements: string;
  previousContent?: string;
}

export async function generateTrainingProgram(params: TrainingProgramParams): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI service is not configured. Please add OPENAI_API_KEY environment variable.");
  }
  
  try {
    const blockFocusDescriptions = {
      'speed': 'maximum speed development with high-intensity sprint work',
      'speed-maintenance': 'maintaining current speed levels with moderate intensity',
      'speed-endurance': 'building ability to maintain speed over longer distances',
      'mixed': 'balanced combination of speed, endurance, and power training',
      'short-to-long': 'progressive development from short sprints to longer distances',
      'long-to-short': 'starting with longer distances and progressing to pure speed work'
    };

    const systemPrompt = `You are Sprinthia, an elite track and field AI coach specializing in sprint training program design. You create detailed, periodized training programs for athletes of all levels.

Key principles:
- Base programs on proven coaching methodologies and exercise science
- Include proper warm-up, main work, and cool-down for each session
- Progress intelligently through training blocks
- Balance high-intensity work with recovery
- Specify sets, reps, distances, and rest intervals
- Include both track and gym components when requested
- Consider athlete development and injury prevention

Format your response as a detailed training program with:
1. Program overview and goals
2. Block-by-block breakdown
3. Weekly structure for each block
4. Specific workout details for each session
5. Recovery and regeneration guidelines

Be specific with exercises, distances, intensities, and progressions.`;

    const userPrompt = `Create a comprehensive track and field training program with these specifications:

Program Details:
- Title: ${params.title}
- Description: ${params.description}
- Total Length: ${params.totalLengthWeeks} weeks
- Training Blocks: ${params.blocks}
- Workouts per Week: ${params.workoutsPerWeek}
- Gym Sessions per Week: ${params.gymWorkoutsPerWeek}
- Block Focus: ${blockFocusDescriptions[params.blockFocus]}

Specific Requirements:
${params.specificRequirements}

Please create a detailed, progressive training program that includes:
- Clear periodization across all ${params.blocks} blocks
- Specific workout details for each session type
- Appropriate volume and intensity progressions
- Integration of track and gym work
- Recovery protocols and regeneration strategies
- Performance testing and milestone checkpoints

Make the program practical and implementable while maintaining high coaching standards.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const generatedProgram = response.choices[0].message.content;
    
    if (!generatedProgram) {
      throw new Error("No program content generated");
    }

    return cleanMarkdownFormatting(generatedProgram);
  } catch (error) {
    console.error("Error generating training program:", error);
    throw new Error("Failed to generate training program. Please try again.");
  }
}

export async function regenerateTrainingProgram(params: TrainingProgramParams): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI service is not configured. Please add OPENAI_API_KEY environment variable.");
  }
  
  try {
    const blockFocusDescriptions = {
      'speed': 'maximum speed development with high-intensity sprint work',
      'speed-maintenance': 'maintaining current speed levels with moderate intensity',
      'speed-endurance': 'building ability to maintain speed over longer distances',
      'mixed': 'balanced combination of speed, endurance, and power training',
      'short-to-long': 'progressive development from short sprints to longer distances',
      'long-to-short': 'starting with longer distances and progressing to pure speed work'
    };

    const systemPrompt = `You are Sprinthia, an elite track and field AI coach specializing in sprint training program design. You are regenerating a training program to provide fresh alternatives while maintaining coaching excellence.

Your task is to create a NEW training program that:
- Maintains the same overall structure and goals
- Uses different exercises, progressions, or methodologies
- Provides variety while keeping scientific principles
- Offers alternative approaches to achieve the same training objectives
- Ensures the new program is distinctly different from the previous version

Base programs on proven coaching methodologies but explore different exercise selections, training methods, or periodization approaches.`;

    const userPrompt = `Regenerate a training program with these specifications (create a NEW version different from the previous):

Program Details:
- Title: ${params.title}
- Description: ${params.description}
- Total Length: ${params.totalLengthWeeks} weeks
- Training Blocks: ${params.blocks}
- Workouts per Week: ${params.workoutsPerWeek}
- Gym Sessions per Week: ${params.gymWorkoutsPerWeek}
- Block Focus: ${blockFocusDescriptions[params.blockFocus]}

Specific Requirements:
${params.specificRequirements}

Previous Program (DO NOT COPY - use as reference for creating something different):
${params.previousContent}

Create a completely NEW program that:
- Achieves the same training goals through different methods
- Uses alternative exercises and progressions
- Maintains the same overall structure but with fresh content
- Provides variety while keeping scientific training principles
- Is distinctly different from the previous version

Focus on offering new exercise selections, different training methodologies, or alternative periodization approaches while maintaining coaching excellence.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.8 // Slightly higher temperature for more variety
    });

    const regeneratedProgram = response.choices[0].message.content;
    
    if (!regeneratedProgram) {
      throw new Error("No program content generated");
    }

    return cleanMarkdownFormatting(regeneratedProgram);
  } catch (error) {
    console.error("Error regenerating training program:", error);
    throw new Error("Failed to regenerate training program. Please try again.");
  }
}