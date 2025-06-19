import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { analyzeVideoWithOpenAI } from './openai';

interface BiomechanicalData {
  video_info: {
    duration: number;
    total_frames: number;
    fps: number;
    analyzed_frames: number;
  };
  stride_analysis: {
    stride_count: number;
    average_stride_time: number;
    stride_rate: number;
    asymmetry: number;
  };
  joint_angles: {
    [key: string]: {
      min: number;
      max: number;
      mean: number;
      std: number;
      range: number;
    };
  };
  contact_events: Array<{
    frame: number;
    timestamp: number;
    foot: string;
    type: string;
    ankle_position: any;
  }>;
  frame_data: Array<any>;
}

interface VideoAnalysisResult {
  biomechanical_data: BiomechanicalData;
  ai_analysis: string;
  structured_metrics: {
    performance_score: number;
    key_insights: string[];
    recommendations: string[];
  };
}

export class MediaPipeService {
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, 'video-analysis-mediapipe.py');
  }

  async analyzeBiomechanics(videoPath: string): Promise<BiomechanicalData> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [this.pythonScriptPath, videoPath]);
      
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('MediaPipe analysis failed:', stderr);
          reject(new Error(`MediaPipe analysis failed with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (parseError) {
          console.error('Failed to parse MediaPipe output:', parseError);
          reject(new Error('Failed to parse biomechanical analysis results'));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start MediaPipe process:', error);
        reject(new Error(`Failed to start biomechanical analysis: ${error.message}`));
      });
    });
  }

  formatBiomechanicalDataForAI(data: BiomechanicalData): string {
    const { stride_analysis, joint_angles, video_info } = data;
    
    // Create structured prompt with biomechanical data
    let prompt = `BIOMECHANICAL ANALYSIS DATA:\n\n`;
    
    // Video information
    prompt += `Video Duration: ${video_info.duration.toFixed(2)} seconds\n`;
    prompt += `Analyzed Frames: ${video_info.analyzed_frames} of ${video_info.total_frames}\n\n`;
    
    // Stride analysis
    prompt += `STRIDE ANALYSIS:\n`;
    prompt += `- Stride Count: ${stride_analysis.stride_count}\n`;
    prompt += `- Stride Rate: ${stride_analysis.stride_rate.toFixed(1)} steps/minute\n`;
    prompt += `- Average Stride Time: ${stride_analysis.average_stride_time.toFixed(3)} seconds\n`;
    prompt += `- Left/Right Asymmetry: ${stride_analysis.asymmetry.toFixed(1)}%\n\n`;
    
    // Joint angle analysis
    prompt += `JOINT ANGLE ANALYSIS:\n`;
    
    if (joint_angles.left_knee) {
      prompt += `Left Knee Angle:\n`;
      prompt += `  - Range: ${joint_angles.left_knee.min.toFixed(1)}° to ${joint_angles.left_knee.max.toFixed(1)}°\n`;
      prompt += `  - Average: ${joint_angles.left_knee.mean.toFixed(1)}°\n`;
      prompt += `  - Range of Motion: ${joint_angles.left_knee.range.toFixed(1)}°\n\n`;
    }
    
    if (joint_angles.right_knee) {
      prompt += `Right Knee Angle:\n`;
      prompt += `  - Range: ${joint_angles.right_knee.min.toFixed(1)}° to ${joint_angles.right_knee.max.toFixed(1)}°\n`;
      prompt += `  - Average: ${joint_angles.right_knee.mean.toFixed(1)}°\n`;
      prompt += `  - Range of Motion: ${joint_angles.right_knee.range.toFixed(1)}°\n\n`;
    }
    
    if (joint_angles.left_hip) {
      prompt += `Left Hip Angle:\n`;
      prompt += `  - Range: ${joint_angles.left_hip.min.toFixed(1)}° to ${joint_angles.left_hip.max.toFixed(1)}°\n`;
      prompt += `  - Average: ${joint_angles.left_hip.mean.toFixed(1)}°\n\n`;
    }
    
    if (joint_angles.right_hip) {
      prompt += `Right Hip Angle:\n`;
      prompt += `  - Range: ${joint_angles.right_hip.min.toFixed(1)}° to ${joint_angles.right_hip.max.toFixed(1)}°\n`;
      prompt += `  - Average: ${joint_angles.right_hip.mean.toFixed(1)}°\n\n`;
    }

    return prompt;
  }

  generateStructuredMetrics(data: BiomechanicalData): {
    performance_score: number;
    key_insights: string[];
    recommendations: string[];
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    let performanceScore = 100;

    const { stride_analysis, joint_angles } = data;

    // Analyze stride rate
    if (stride_analysis.stride_rate > 0) {
      if (stride_analysis.stride_rate < 160) {
        insights.push(`Stride rate of ${stride_analysis.stride_rate.toFixed(0)} spm is below optimal range`);
        recommendations.push("Increase stride frequency with metronome training");
        performanceScore -= 10;
      } else if (stride_analysis.stride_rate > 200) {
        insights.push(`Stride rate of ${stride_analysis.stride_rate.toFixed(0)} spm may be too high`);
        recommendations.push("Focus on stride length over frequency");
        performanceScore -= 5;
      } else {
        insights.push(`Stride rate of ${stride_analysis.stride_rate.toFixed(0)} spm is within optimal range`);
      }
    }

    // Analyze asymmetry
    if (stride_analysis.asymmetry > 5) {
      insights.push(`Significant left/right asymmetry detected (${stride_analysis.asymmetry.toFixed(1)}%)`);
      recommendations.push("Work on single-leg strength and mobility exercises");
      performanceScore -= Math.min(15, stride_analysis.asymmetry);
    } else if (stride_analysis.asymmetry > 2) {
      insights.push(`Mild asymmetry present (${stride_analysis.asymmetry.toFixed(1)}%)`);
      recommendations.push("Monitor asymmetry and consider corrective exercises");
      performanceScore -= 5;
    }

    // Analyze knee angles
    if (joint_angles.left_knee && joint_angles.right_knee) {
      const leftRange = joint_angles.left_knee.range;
      const rightRange = joint_angles.right_knee.range;
      const avgRange = (leftRange + rightRange) / 2;

      if (avgRange < 30) {
        insights.push("Limited knee range of motion detected");
        recommendations.push("Incorporate dynamic stretching and mobility work");
        performanceScore -= 10;
      } else if (avgRange > 80) {
        insights.push("Excessive knee flexion may indicate overstriding");
        recommendations.push("Focus on midfoot striking and cadence");
        performanceScore -= 8;
      }
    }

    // Ensure score doesn't go below 0
    performanceScore = Math.max(0, performanceScore);

    return {
      performance_score: Math.round(performanceScore),
      key_insights: insights,
      recommendations: recommendations
    };
  }

  async generateAIAnalysis(biomechanicalData: BiomechanicalData): Promise<string> {
    const dataPrompt = this.formatBiomechanicalDataForAI(biomechanicalData);
    
    const analysisPrompt = `${dataPrompt}

ANALYSIS REQUEST:
Based on the biomechanical data above, provide a comprehensive athletic performance analysis in 2-3 paragraphs. Focus on:

1. Overall movement efficiency and form quality
2. Specific areas of strength and areas needing improvement
3. Actionable recommendations for performance enhancement

Please provide practical, evidence-based feedback that an athlete and coach can implement immediately.`;

    try {
      // Use existing OpenAI service but with structured biomechanical data
      const aiResponse = await analyzeVideoWithOpenAI(analysisPrompt, null);
      return aiResponse;
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Provide fallback analysis based on the data
      return this.generateFallbackAnalysis(biomechanicalData);
    }
  }

  private generateFallbackAnalysis(data: BiomechanicalData): string {
    const { stride_analysis, joint_angles } = data;
    
    let analysis = `Based on the biomechanical analysis of your movement, `;
    
    if (stride_analysis.stride_rate > 0) {
      analysis += `your stride rate of ${stride_analysis.stride_rate.toFixed(0)} steps per minute `;
      if (stride_analysis.stride_rate >= 170 && stride_analysis.stride_rate <= 190) {
        analysis += `falls within the optimal range for efficient running. `;
      } else {
        analysis += `could be optimized for better efficiency. `;
      }
    }
    
    if (stride_analysis.asymmetry > 3) {
      analysis += `The analysis detected ${stride_analysis.asymmetry.toFixed(1)}% asymmetry between your left and right sides, which suggests potential imbalances that could affect performance and injury risk. `;
    }
    
    analysis += `Your joint movement patterns show `;
    
    if (joint_angles.left_knee && joint_angles.right_knee) {
      const avgKneeRange = (joint_angles.left_knee.range + joint_angles.right_knee.range) / 2;
      if (avgKneeRange < 40) {
        analysis += `limited knee flexion range, which may indicate stiffness or overstriding. `;
      } else {
        analysis += `good knee flexion patterns for efficient stride mechanics. `;
      }
    }
    
    analysis += `To improve your performance, focus on maintaining consistent stride rhythm, addressing any asymmetries through targeted strengthening exercises, and ensuring proper warm-up routines to optimize joint mobility.`;
    
    return analysis;
  }

  async analyzeVideoComplete(videoPath: string): Promise<VideoAnalysisResult> {
    try {
      // Step 1: Extract biomechanical data using MediaPipe
      console.log('Starting biomechanical analysis with MediaPipe...');
      const biomechanicalData = await this.analyzeBiomechanics(videoPath);
      
      // Step 2: Generate structured metrics
      console.log('Generating structured performance metrics...');
      const structuredMetrics = this.generateStructuredMetrics(biomechanicalData);
      
      // Step 3: Generate AI analysis using OpenAI
      console.log('Generating AI-powered analysis...');
      const aiAnalysis = await this.generateAIAnalysis(biomechanicalData);
      
      return {
        biomechanical_data: biomechanicalData,
        ai_analysis: aiAnalysis,
        structured_metrics: structuredMetrics
      };
      
    } catch (error) {
      console.error('Complete video analysis failed:', error);
      throw new Error(`Video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const mediaPipeService = new MediaPipeService();