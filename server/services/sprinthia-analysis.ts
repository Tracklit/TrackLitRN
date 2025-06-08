import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisRequest {
  analysisType: 'sprint_form' | 'block_start' | 'stride_length' | 'stride_frequency' | 'ground_contact_time' | 'flight_time';
  videoUrl: string;
  customPrompt?: string;
}

export interface AnalysisResponse {
  analysis: string;
  recommendations: string[];
  technicalPoints: string[];
  strengths: string[];
  areasForImprovement: string[];
}

// Pre-made analysis prompts for different video analysis types
const ANALYSIS_PROMPTS = {
  sprint_form: `You are Sprinthia, an expert sprint coach and biomechanics analyst. Analyze the sprint form in this video with precision and detail.

Focus on these key elements:
- Body posture and alignment throughout the sprint
- Arm swing mechanics and coordination
- Leg drive and knee lift
- Foot strike patterns and ground contact
- Hip position and forward lean
- Overall running efficiency and rhythm

Provide specific technical feedback on:
1. What the athlete is doing well (strengths)
2. Areas that need improvement with actionable advice
3. Specific drills or exercises to address weaknesses
4. Technical cues the athlete can focus on

Format your response as a comprehensive analysis that an athlete can understand and implement.`,

  block_start: `You are Sprinthia, a world-class sprint start specialist. Analyze the block start technique in this video with expert precision.

Examine these critical elements:
- Block setup and positioning
- "Set" position - body angles and alignment
- Reaction time and first movement
- First step mechanics and power generation
- Acceleration phase technique (first 10-15 steps)
- Transition from blocks to upright running

Provide detailed feedback on:
1. Block positioning and setup efficiency
2. "Set" position optimization
3. Drive phase execution and power transfer
4. Step frequency and length progression
5. Common technical errors observed
6. Specific drills to improve start technique

Deliver actionable coaching points that will directly improve start performance.`,

  stride_length: `You are Sprinthia, a biomechanics expert specializing in sprint stride optimization. Analyze the stride length patterns in this video.

Focus your analysis on:
- Stride length consistency throughout the sprint
- Optimal stride length for the athlete's body type
- Ground contact positioning relative to center of mass
- Overstriding or understriding patterns
- Stride length changes during acceleration vs. maximum velocity phases
- Efficiency of stride length for speed generation

Provide specific insights on:
1. Current stride length effectiveness
2. Comparison to optimal patterns for sprint performance
3. Technical adjustments to improve stride efficiency
4. Training methods to develop better stride mechanics
5. How stride length affects overall sprint performance

Give practical recommendations for optimizing stride length.`,

  stride_frequency: `You are Sprinthia, a sprint performance analyst focusing on stride frequency optimization. Analyze the stride turnover and frequency patterns in this video.

Examine these key aspects:
- Steps per second during different phases
- Stride frequency consistency and rhythm
- Ground contact time vs. flight time ratio
- Leg turnover efficiency and coordination
- Frequency changes during acceleration to maximum velocity
- Coordination between stride frequency and stride length

Analyze and report on:
1. Current stride frequency patterns and effectiveness
2. Optimal frequency ranges for this athlete's sprint phase
3. Areas where frequency can be improved
4. Balance between stride length and frequency
5. Training methods to enhance turnover speed
6. Technical cues for better frequency control

Provide actionable advice for improving stride frequency without sacrificing power.`,

  ground_contact_time: `You are Sprinthia, a biomechanics specialist focusing on ground contact efficiency. Analyze the ground contact time and foot strike patterns in this video.

Focus on these critical elements:
- Ground contact duration throughout the sprint
- Foot strike patterns (forefoot, midfoot positioning)
- Force application direction and efficiency
- Push-off mechanics and timing
- Contact time variation between acceleration and max velocity phases
- Stiffness and reactivity of ground contacts

Provide detailed analysis of:
1. Current ground contact time effectiveness
2. Optimal contact patterns for sprint performance
3. Force application quality and direction
4. Areas for improving contact efficiency
5. Drills and exercises to reduce contact time while maintaining power
6. Technical cues for better ground interaction

Give specific recommendations for optimizing ground contact mechanics.`,

  flight_time: `You are Sprinthia, a sprint technique specialist analyzing flight phase mechanics. Examine the flight time and airborne positioning in this video.

Analyze these key components:
- Flight time duration and consistency
- Body position and posture during flight phase
- Leg positioning and cycling mechanics
- Preparation for next ground contact
- Flight time balance with ground contact time
- Efficiency of airborne phase for speed maintenance

Evaluate and provide feedback on:
1. Current flight time patterns and effectiveness
2. Body positioning during flight phase
3. Leg recovery and preparation mechanics
4. Balance between flight time and contact time
5. Areas for improving flight phase efficiency
6. Training methods to optimize airborne mechanics

Deliver practical coaching points for better flight phase execution.`
};

export async function analyzeVideo(request: AnalysisRequest): Promise<AnalysisResponse> {
  const prompt = request.customPrompt || ANALYSIS_PROMPTS[request.analysisType];
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are Sprinthia, a world-renowned sprint coach and biomechanics expert. You have trained Olympic champions and world record holders. Your analysis is precise, actionable, and based on the latest sports science research. Always provide specific, implementable advice that athletes can use to improve their performance.`
        },
        {
          role: 'user',
          content: `${prompt}

Video to analyze: ${request.videoUrl}

Please provide a comprehensive analysis formatted as follows:
1. Overall Assessment
2. Key Strengths
3. Areas for Improvement
4. Specific Technical Recommendations
5. Training Drills and Exercises
6. Performance Metrics to Monitor

Make your analysis specific, actionable, and motivating for the athlete.`
        }
      ]
    });

    const analysisText = response.choices[0].message.content || 'Analysis completed but no content returned.';
    
    // Parse the analysis into structured components
    const sections = analysisText.split(/\d+\.\s+/);
    
    return {
      analysis: analysisText,
      recommendations: extractRecommendations(analysisText),
      technicalPoints: extractTechnicalPoints(analysisText),
      strengths: extractStrengths(analysisText),
      areasForImprovement: extractImprovements(analysisText)
    };
    
  } catch (error) {
    console.error('Error analyzing video with Sprinthia:', error);
    throw new Error('Failed to analyze video. Please try again.');
  }
}

function extractRecommendations(text: string): string[] {
  const recommendations: string[] = [];
  const lines = text.split('\n');
  
  let inRecommendationsSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('drill') || line.toLowerCase().includes('exercise')) {
      inRecommendationsSection = true;
    }
    
    if (inRecommendationsSection && line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim())) {
      recommendations.push(line.trim().replace(/^[-•\d.]\s*/, ''));
    }
  }
  
  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

function extractTechnicalPoints(text: string): string[] {
  const technicalPoints: string[] = [];
  const technicalKeywords = ['technique', 'form', 'mechanics', 'position', 'angle', 'timing', 'coordination'];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (technicalKeywords.some(keyword => lowerLine.includes(keyword)) && 
        (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))) {
      technicalPoints.push(line.trim().replace(/^[-•\d.]\s*/, ''));
    }
  }
  
  return technicalPoints.slice(0, 4);
}

function extractStrengths(text: string): string[] {
  const strengths: string[] = [];
  const lines = text.split('\n');
  
  let inStrengthsSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('strength') || line.toLowerCase().includes('doing well') || line.toLowerCase().includes('positive')) {
      inStrengthsSection = true;
    }
    
    if (inStrengthsSection && (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))) {
      strengths.push(line.trim().replace(/^[-•\d.]\s*/, ''));
    }
    
    // Stop at next major section
    if (inStrengthsSection && (line.toLowerCase().includes('improvement') || line.toLowerCase().includes('weakness'))) {
      break;
    }
  }
  
  return strengths.slice(0, 4);
}

function extractImprovements(text: string): string[] {
  const improvements: string[] = [];
  const lines = text.split('\n');
  
  let inImprovementsSection = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('improvement') || line.toLowerCase().includes('focus') || line.toLowerCase().includes('work on')) {
      inImprovementsSection = true;
    }
    
    if (inImprovementsSection && (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))) {
      improvements.push(line.trim().replace(/^[-•\d.]\s*/, ''));
    }
  }
  
  return improvements.slice(0, 4);
}

// Pricing configuration
export const PRICING_CONFIG = {
  PROMPT_COST_USD: 0.05, // Estimated cost per prompt to AI service
  SPIKES_PER_PROMPT: 10, // Cost in spikes (should be > prompt cost for profit)
  TIER_LIMITS: {
    free: { monthlyPrompts: 1, weeklyPrompts: 0 },
    pro: { monthlyPrompts: Infinity, weeklyPrompts: 5 },
    star: { monthlyPrompts: Infinity, weeklyPrompts: Infinity }
  }
};