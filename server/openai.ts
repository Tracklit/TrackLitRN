import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

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
  analysisType: string
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

  const fullPrompt = `${basePrompt}

Video Information:
- Video Name: ${videoName}
- Description: ${videoDescription || "No description provided"}

Please provide a comprehensive analysis as Sprinthia, the AI sprint coach. Be specific, technical, and actionable in your feedback. Structure your response with the following sections:

## Overall Assessment
[Provide a brief summary of the athlete's performance]

## Key Strengths
[List what the athlete is doing well]

## Areas for Improvement
[Identify specific technical issues]

## Recommendations
[Provide actionable coaching tips and drills]

## Next Steps
[Suggest what to focus on in training]

Use bullet points within each section for clarity and easy reading.`;

  return await getChatCompletion(fullPrompt);
}