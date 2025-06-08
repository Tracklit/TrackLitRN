import OpenAI from "openai";
import { db } from "./db";
import { users, aiVideoAnalyses, aiPromptUsage, spikeTransactions } from "../shared/schema";
import { eq, and, gte } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Pricing configuration
const AI_ANALYSIS_CONFIG = {
  COST_PER_PROMPT: 50, // Spikes cost per prompt (more than API cost for profit margin)
  FREE_TIER_MONTHLY_LIMIT: 1,
  PRO_TIER_WEEKLY_LIMIT: 5,
  STAR_TIER_UNLIMITED: true,
};

// Pre-made analysis prompts for different aspects
const ANALYSIS_PROMPTS = {
  sprint_form: `Analyze this sprint video for running form and technique. Focus on:
- Body posture and alignment
- Arm swing mechanics and coordination
- Leg drive and knee lift
- Overall running efficiency
- Common form errors and corrections
Provide specific, actionable coaching feedback.`,

  block_start: `Analyze this sprint start from the blocks. Evaluate:
- Starting position and body angle
- First step mechanics and power
- Acceleration phase technique
- Drive phase form
- Transition to upright running
Give detailed technical feedback for improvement.`,

  stride_length: `Analyze the stride length characteristics in this sprint video:
- Optimal stride length for the athlete's height and speed
- Stride length consistency throughout the race
- Overstriding or understriding issues
- Relationship between stride length and frequency
Provide recommendations for stride optimization.`,

  stride_frequency: `Examine the stride frequency (cadence) in this sprint performance:
- Steps per second analysis
- Consistency of rhythm
- Optimal cadence for this distance
- Comparison to elite sprint standards
- Areas for frequency improvement
Give specific training recommendations.`,

  ground_contact_time: `Assess ground contact time and foot strike patterns:
- Duration of foot-ground contact
- Foot strike location (forefoot, midfoot)
- Push-off mechanics and efficiency
- Comparison to optimal contact times
- Impact on sprint performance
Provide technical improvement suggestions.`,

  flight_time: `Analyze flight time and aerial mechanics:
- Time spent in flight phase
- Body position during flight
- Flight time vs ground contact ratio
- Efficiency of flight phase
- Optimal flight characteristics
Give coaching points for enhancement.`,
};

export class SprinthiaAnalysisService {
  // Check user's tier and available prompts
  async checkUserLimits(userId: number) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) throw new Error("User not found");

    const userRecord = user[0];
    const subscriptionTier = userRecord.subscriptionTier || 'free';

    // Get current week/month usage
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const monthStart = this.getMonthStart(now);

    let usage = await db.select().from(aiPromptUsage)
      .where(and(
        eq(aiPromptUsage.userId, userId),
        eq(aiPromptUsage.weekStart, weekStart),
        eq(aiPromptUsage.monthStart, monthStart)
      ))
      .limit(1);

    if (!usage.length) {
      // Create new usage record
      const newUsage = await db.insert(aiPromptUsage).values({
        userId,
        weekStart,
        monthStart,
        promptsUsedThisWeek: 0,
        promptsUsedThisMonth: 0,
      }).returning();
      usage = newUsage;
    }

    const currentUsage = usage[0];

    // Check tier limits
    switch (subscriptionTier) {
      case 'star':
        return { 
          canUsePrompt: true, 
          tier: 'star',
          remainingPrompts: 'unlimited',
          costSpikes: 0,
          isFreeTier: false
        };
      
      case 'pro':
        const weeklyUsed = currentUsage.promptsUsedThisWeek || 0;
        const canUsePro = weeklyUsed < AI_ANALYSIS_CONFIG.PRO_TIER_WEEKLY_LIMIT;
        const userSpikes = userRecord.spikes || 0;
        return {
          canUsePrompt: canUsePro || userSpikes >= AI_ANALYSIS_CONFIG.COST_PER_PROMPT,
          tier: 'pro',
          remainingPrompts: Math.max(0, AI_ANALYSIS_CONFIG.PRO_TIER_WEEKLY_LIMIT - weeklyUsed),
          costSpikes: canUsePro ? 0 : AI_ANALYSIS_CONFIG.COST_PER_PROMPT,
          isFreeTier: canUsePro
        };
      
      case 'free':
      default:
        const monthlyUsed = currentUsage.promptsUsedThisMonth || 0;
        const canUseFree = monthlyUsed < AI_ANALYSIS_CONFIG.FREE_TIER_MONTHLY_LIMIT;
        const userSpikesDefault = userRecord.spikes || 0;
        return {
          canUsePrompt: canUseFree || userSpikesDefault >= AI_ANALYSIS_CONFIG.COST_PER_PROMPT,
          tier: 'free',
          remainingPrompts: Math.max(0, AI_ANALYSIS_CONFIG.FREE_TIER_MONTHLY_LIMIT - monthlyUsed),
          costSpikes: canUseFree ? 0 : AI_ANALYSIS_CONFIG.COST_PER_PROMPT,
          isFreeTier: canUseFree
        };
    }
  }

  // Perform AI analysis of video
  async analyzeVideo(
    userId: number, 
    videoName: string, 
    analysisType: keyof typeof ANALYSIS_PROMPTS,
    customPrompt?: string,
    videoTimestamp?: number
  ) {
    // Check user limits
    const limits = await this.checkUserLimits(userId);
    
    if (!limits.canUsePrompt) {
      throw new Error(`Insufficient prompts or Spikes. Cost: ${AI_ANALYSIS_CONFIG.COST_PER_PROMPT} Spikes`);
    }

    // Get the prompt
    const prompt = customPrompt || ANALYSIS_PROMPTS[analysisType];
    if (!prompt) {
      throw new Error("Invalid analysis type");
    }

    try {
      // Call OpenAI API for video analysis
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are Sprinthia, an expert sprint coach and biomechanics analyst. You have extensive knowledge of sprint technique, training methods, and performance optimization. Provide detailed, technical, and actionable feedback on sprint performance. Always be encouraging but precise in your analysis.`
          },
          {
            role: "user",
            content: `Video: ${videoName}${videoTimestamp ? ` (at ${videoTimestamp}s)` : ''}\n\n${prompt}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const analysis = response.choices[0].message.content || "No analysis generated";

      // Deduct spikes if needed
      if (limits.costSpikes > 0) {
        await this.deductSpikes(userId, limits.costSpikes);
      }

      // Update usage tracking
      await this.updateUsageTracking(userId, limits.tier);

      // Save analysis to database
      const savedAnalysis = await db.insert(aiVideoAnalyses).values({
        userId,
        videoName,
        analysisType,
        prompt,
        response: analysis,
        videoTimestamp,
        costSpikes: limits.costSpikes,
        isFreeTier: limits.isFreeTier,
      }).returning();

      return {
        analysis,
        costSpikes: limits.costSpikes,
        remainingPrompts: limits.remainingPrompts,
        analysisId: savedAnalysis[0].id
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate analysis. Please try again.');
    }
  }

  // Get user's analysis history
  async getUserAnalyses(userId: number, limit: number = 20) {
    return await db.select({
      id: aiVideoAnalyses.id,
      videoName: aiVideoAnalyses.videoName,
      analysisType: aiVideoAnalyses.analysisType,
      response: aiVideoAnalyses.response,
      videoTimestamp: aiVideoAnalyses.videoTimestamp,
      costSpikes: aiVideoAnalyses.costSpikes,
      createdAt: aiVideoAnalyses.createdAt,
    })
    .from(aiVideoAnalyses)
    .where(eq(aiVideoAnalyses.userId, userId))
    .orderBy(aiVideoAnalyses.createdAt)
    .limit(limit);
  }

  // Get available analysis types with descriptions
  getAnalysisTypes() {
    return [
      {
        type: 'sprint_form',
        title: 'Sprint Form Analysis',
        description: 'Comprehensive analysis of running technique and body mechanics'
      },
      {
        type: 'block_start',
        title: 'Block Start Analysis', 
        description: 'Detailed evaluation of starting technique and acceleration'
      },
      {
        type: 'stride_length',
        title: 'Stride Length',
        description: 'Assessment of stride length optimization and efficiency'
      },
      {
        type: 'stride_frequency',
        title: 'Stride Frequency',
        description: 'Analysis of cadence and rhythm consistency'
      },
      {
        type: 'ground_contact_time',
        title: 'Ground Contact Time',
        description: 'Evaluation of foot strike patterns and ground contact efficiency'
      },
      {
        type: 'flight_time',
        title: 'Flight Time',
        description: 'Analysis of aerial mechanics and flight phase optimization'
      }
    ];
  }

  // Helper functions
  private async deductSpikes(userId: number, amount: number) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) throw new Error("User not found");

    const currentSpikes = user[0].spikes || 0;
    const newBalance = Math.max(0, currentSpikes - amount);
    
    await db.update(users)
      .set({ spikes: newBalance })
      .where(eq(users.id, userId));

    // Record transaction
    await db.insert(spikeTransactions).values({
      userId,
      type: 'debit',
      amount: -amount,
      balance: newBalance,
      description: 'Sprinthia AI Video Analysis',
      category: 'ai_analysis',
    });
  }

  private async updateUsageTracking(userId: number, tier: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const monthStart = this.getMonthStart(now);

    // Get current usage
    const currentUsage = await db.select().from(aiPromptUsage)
      .where(and(
        eq(aiPromptUsage.userId, userId),
        eq(aiPromptUsage.weekStart, weekStart),
        eq(aiPromptUsage.monthStart, monthStart)
      ))
      .limit(1);

    if (currentUsage.length > 0) {
      const usage = currentUsage[0];
      // Update usage counters
      await db.update(aiPromptUsage)
        .set({
          promptsUsedThisWeek: tier === 'pro' ? (usage.promptsUsedThisWeek || 0) + 1 : usage.promptsUsedThisWeek,
          promptsUsedThisMonth: tier === 'free' ? (usage.promptsUsedThisMonth || 0) + 1 : usage.promptsUsedThisMonth,
          lastUsedAt: now,
        })
        .where(eq(aiPromptUsage.id, usage.id));
    }
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }

  private getMonthStart(date: Date): string {
    const d = new Date(date);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    return monthStart.toISOString().split('T')[0];
  }
}

export const sprinthiaService = new SprinthiaAnalysisService();