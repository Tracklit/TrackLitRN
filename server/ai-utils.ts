/**
 * Shared utilities for AI response processing across Sprinthia endpoints.
 */

/** Clean AI response by removing JSON wrappers, bibliography sections, etc. */
export function cleanAIResponse(response: string, userMessage: string): string {
  if (!response) return response;

  let cleaned = response;

  // More aggressive JSON removal - handle various JSON wrapper formats
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/```\s*$/i, '');

  // Remove JSON object wrapper with any field name
  cleaned = cleaned.replace(/^\{\s*"[^"]+"\s*:\s*"/i, '');
  cleaned = cleaned.replace(/"\s*,?\s*"[^"]*"\s*:\s*\[[\s\S]*?\]\s*\}\s*$/i, '');

  // Remove array brackets
  cleaned = cleaned.replace(/^\[\s*/, '').replace(/\s*\]\s*$/, '');

  // Remove any remaining JSON structure at start/end
  cleaned = cleaned.replace(/^\{\s*/i, '').replace(/\s*\}\s*$/i, '');

  // Remove escaped quotes
  cleaned = cleaned.replace(/\\"/g, '"');

  cleaned = cleaned.trim();

  // Remove bibliography section unless user explicitly asks for sources/references/bibliography
  const askingForSources = /\b(source|reference|bibliograph|citation|study|research|paper)\b/i.test(userMessage);
  if (!askingForSources) {
    // Remove bibliography with various formats (including quoted versions)
    cleaned = cleaned.replace(/\*\*["\u201c\u201d]?bibliography["\u201c\u201d]?:\*\*[\s\S]*$/gi, '');
    cleaned = cleaned.replace(/\*\*["\u201c\u201d]?references["\u201c\u201d]?:\*\*[\s\S]*$/gi, '');
    cleaned = cleaned.replace(/\*\*["\u201c\u201d]?sources["\u201c\u201d]?:\*\*[\s\S]*$/gi, '');
    cleaned = cleaned.replace(/\n\n["\u201c\u201d]?bibliography["\u201c\u201d]?:[\s\S]*$/gi, '');
    cleaned = cleaned.replace(/\n\n["\u201c\u201d]?references["\u201c\u201d]?:[\s\S]*$/gi, '');
    cleaned = cleaned.replace(/\n\n["\u201c\u201d]?sources["\u201c\u201d]?:[\s\S]*$/gi, '');
    // Remove numbered bibliography entries (1. Author, Title...)
    cleaned = cleaned.replace(/\n\n[\d]+\.\s+[A-Z][\s\S]*$/i, '');
    // Remove book/study references
    cleaned = cleaned.replace(/Check out\s+["\u201c\u201d'][^"\u201c\u201d']*["\u201c\u201d'][\s\S]*$/i, '');
    cleaned = cleaned.replace(/Additionally,?\s+(the book|studies|research)[\s\S]*$/i, '');
    cleaned = cleaned.replace(/For (more information|further reading|insights),?\s+see[\s\S]*$/i, '');
    // Remove academic citations in parentheses
    cleaned = cleaned.replace(/\([A-Z][a-z]+,\s+[A-Z]\.[\s\S]*?\d{4}\)[\s\S]*$/i, '');
  }

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  // Remove leading/trailing quotes if present
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned;
}

/** Block focus description map used by program generation/regeneration */
export const blockFocusDescriptions: Record<string, string> = {
  'speed': 'maximum speed development with high-intensity sprint work',
  'speed-maintenance': 'maintaining current speed levels with moderate intensity',
  'speed-endurance': 'building ability to maintain speed over longer distances',
  'mixed': 'balanced combination of speed, endurance, and power training',
  'short-to-long': 'progressive development from short sprints to longer distances',
  'long-to-short': 'starting with longer distances and progressing to pure speed work'
};

/** Build the system prompt for program generation */
export function buildGenerateSystemPrompt(): string {
  return `You are Sprinthia, an elite track and field AI coach specializing in sprint training program design. You create detailed, periodized training programs for athletes of all levels.

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
}

/** Build the user prompt for program generation */
export function buildGenerateUserPrompt(params: {
  title: string;
  description: string;
  totalLengthWeeks: number;
  blocks: number;
  workoutsPerWeek: number;
  gymWorkoutsPerWeek: number;
  blockFocus: string;
  aiPrompt?: string;
}): string {
  return `Create a comprehensive track and field training program with these specifications:

Program Details:
- Title: ${params.title}
- Description: ${params.description}
- Total Length: ${params.totalLengthWeeks} weeks
- Training Blocks: ${params.blocks}
- Workouts per Week: ${params.workoutsPerWeek}
- Gym Sessions per Week: ${params.gymWorkoutsPerWeek}
- Block Focus: ${blockFocusDescriptions[params.blockFocus] || params.blockFocus}

Specific Requirements:
${params.aiPrompt || 'None'}

Please create a detailed, progressive training program that includes:
- Clear periodization across all ${params.blocks} blocks
- Specific workout details for each session type
- Appropriate volume and intensity progressions
- Integration of track and gym work
- Recovery protocols and regeneration strategies
- Performance testing and milestone checkpoints

Make the program practical and implementable while maintaining high coaching standards.`;
}

/** Build the system prompt for program regeneration */
export function buildRegenerateSystemPrompt(): string {
  return `You are Sprinthia, an elite track and field AI coach specializing in sprint training program design. You are regenerating a training program to provide fresh alternatives while maintaining coaching excellence.

Your task is to create a NEW training program that:
- Maintains the same overall structure and goals
- Uses different exercises, progressions, or methodologies
- Provides variety while keeping scientific principles
- Offers alternative approaches to achieve the same training objectives
- Ensures the new program is distinctly different from the previous version

Base programs on proven coaching methodologies but explore different exercise selections, training methods, or periodization approaches.`;
}

/** Build the user prompt for program regeneration */
export function buildRegenerateUserPrompt(params: {
  title: string;
  description: string;
  totalLengthWeeks: number;
  blocks: number;
  workoutsPerWeek: number;
  gymWorkoutsPerWeek: number;
  blockFocus: string;
  aiPrompt?: string;
  previousContent?: string;
}): string {
  return `Regenerate a training program with these specifications (create a NEW version different from the previous):

Program Details:
- Title: ${params.title}
- Description: ${params.description}
- Total Length: ${params.totalLengthWeeks} weeks
- Training Blocks: ${params.blocks}
- Workouts per Week: ${params.workoutsPerWeek}
- Gym Sessions per Week: ${params.gymWorkoutsPerWeek}
- Block Focus: ${blockFocusDescriptions[params.blockFocus] || params.blockFocus}

Specific Requirements:
${params.aiPrompt || 'None'}

Previous Program (DO NOT COPY - use as reference for creating something different):
${params.previousContent || 'None provided'}

Create a completely NEW program that:
- Achieves the same training goals through different methods
- Uses alternative exercises and progressions
- Maintains the same overall structure but with fresh content
- Provides variety while keeping scientific training principles
- Is distinctly different from the previous version

Focus on offering new exercise selections, different training methodologies, or alternative periodization approaches while maintaining coaching excellence.`;
}

/** Call the Aria API and return the response content */
export async function callAriaApi(params: {
  ariaApiUrl: string;
  userId: string;
  userPrompt: string;
  systemPrompt: string;
  conversationHistory?: any[];
}): Promise<string> {
  const requestPayload = {
    user_id: params.userId,
    user_input: params.userPrompt,
    system_prompt: params.systemPrompt,
    conversation_history: params.conversationHistory || []
  };

  const ariaResponse = await fetch(`${params.ariaApiUrl}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });

  if (!ariaResponse.ok) {
    const errorText = await ariaResponse.text();
    console.error(`Aria API error (${ariaResponse.status}):`, errorText);
    throw new Error(`Aria API returned ${ariaResponse.status}`);
  }

  const ariaData = await ariaResponse.json();
  const content = ariaData.recommendation || ariaData.response;

  if (!content) {
    throw new Error("No content generated from Aria API");
  }

  return content;
}
