import { Router } from 'express';
import { storage } from '../storage';
import { analyzeVideo, PRICING_CONFIG } from '../services/sprinthia-analysis';
import { requireAuth } from '../auth';
import { z } from 'zod';
import { eq, and, gte, lte } from 'drizzle-orm';

const router = Router();

// Request validation schemas
const videoAnalysisSchema = z.object({
  videoUrl: z.string().url(),
  videoTitle: z.string().min(1).max(200),
  analysisType: z.enum(['sprint_form', 'block_start', 'stride_length', 'stride_frequency', 'ground_contact_time', 'flight_time']),
  customPrompt: z.string().optional()
});

// Get user's prompt usage and limits
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    // Get current usage
    const weeklyUsage = await storage.getPromptUsage(userId, 'video_analysis', weekStart, 'week');
    const monthlyUsage = await storage.getPromptUsage(userId, 'video_analysis', monthStart, 'month');

    // Get tier limits
    const tierLimits = PRICING_CONFIG.TIER_LIMITS[user.subscriptionTier as keyof typeof PRICING_CONFIG.TIER_LIMITS] || PRICING_CONFIG.TIER_LIMITS.free;

    res.json({
      tier: user.subscriptionTier,
      spikes: user.spikes,
      usage: {
        weekly: weeklyUsage?.usageCount || 0,
        monthly: monthlyUsage?.usageCount || 0
      },
      limits: {
        weeklyPrompts: tierLimits.weeklyPrompts,
        monthlyPrompts: tierLimits.monthlyPrompts
      },
      pricing: {
        spikesPerPrompt: PRICING_CONFIG.SPIKES_PER_PROMPT
      }
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

// Request video analysis
router.post('/analyze', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const validationResult = videoAnalysisSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.issues
      });
    }

    const { videoUrl, videoTitle, analysisType, customPrompt } = validationResult.data;
    
    // Check user tier and usage limits
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    // Get tier limits and current usage
    const tierLimits = PRICING_CONFIG.TIER_LIMITS[user.subscriptionTier as keyof typeof PRICING_CONFIG.TIER_LIMITS] || PRICING_CONFIG.TIER_LIMITS.free;
    const weeklyUsage = await storage.getPromptUsage(userId, 'video_analysis', weekStart, 'week');
    const monthlyUsage = await storage.getPromptUsage(userId, 'video_analysis', monthStart, 'month');

    const currentWeeklyUsage = weeklyUsage?.usageCount || 0;
    const currentMonthlyUsage = monthlyUsage?.usageCount || 0;

    // Check if user has exceeded limits
    let useSpikes = false;
    let spikesRequired = 0;

    if (user.subscriptionTier === 'star') {
      // Star users get unlimited
      useSpikes = false;
    } else if (user.subscriptionTier === 'pro') {
      // Pro users get 5 per week
      if (currentWeeklyUsage >= tierLimits.weeklyPrompts) {
        useSpikes = true;
        spikesRequired = PRICING_CONFIG.SPIKES_PER_PROMPT;
      }
    } else {
      // Free users get 1 per month
      if (currentMonthlyUsage >= tierLimits.monthlyPrompts) {
        useSpikes = true;
        spikesRequired = PRICING_CONFIG.SPIKES_PER_PROMPT;
      }
    }

    // Check if user has enough spikes if required
    if (useSpikes && (user.spikes || 0) < spikesRequired) {
      return res.status(402).json({ 
        error: 'Insufficient spikes',
        required: spikesRequired,
        available: user.spikes || 0
      });
    }

    // Create analysis record
    const analysis = await storage.createVideoAnalysis({
      userId,
      videoUrl,
      videoTitle,
      analysisType,
      prompt: customPrompt || `Analyze ${analysisType.replace('_', ' ')} in this video`,
      spikesUsed: useSpikes ? spikesRequired : 0,
      promptsUsed: 1
    });

    // Start analysis (async)
    analyzeVideoAsync(analysis.id, { analysisType, videoUrl, customPrompt });

    // Update usage tracking
    await storage.updatePromptUsage(userId, 'video_analysis', weekStart, monthStart, useSpikes ? spikesRequired : 0);

    // Deduct spikes if used
    if (useSpikes) {
      await storage.updateUserSpikes(userId, -(spikesRequired));
    }

    res.json({
      analysisId: analysis.id,
      status: 'pending',
      message: 'Analysis started. Check back in a few moments for results.',
      spikesUsed: useSpikes ? spikesRequired : 0
    });

  } catch (error) {
    console.error('Error starting video analysis:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// Get analysis results
router.get('/analysis/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const analysisId = parseInt(req.params.id);

    const analysis = await storage.getVideoAnalysis(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (analysis.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Get user's analysis history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const analyses = await storage.getUserVideoAnalyses(userId, limit, offset);
    
    res.json({
      analyses,
      pagination: {
        page,
        limit,
        hasMore: analyses.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    res.status(500).json({ error: 'Failed to fetch analysis history' });
  }
});

// Async function to process video analysis
async function analyzeVideoAsync(analysisId: number, request: any) {
  try {
    const result = await analyzeVideo(request);
    
    await storage.updateVideoAnalysis(analysisId, {
      aiResponse: result.analysis,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error processing video analysis:', error);
    await storage.updateVideoAnalysis(analysisId, {
      status: 'failed',
      aiResponse: 'Analysis failed. Please try again.'
    });
  }
}

// Helper functions
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export { router as videoAnalysisRouter };