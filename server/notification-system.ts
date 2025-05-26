import { db } from "./db";
import { notifications, users, programSessions, meets, loginStreaks } from "@shared/schema";
import type { InsertNotification } from "@shared/schema";
import { eq, and, gte, lt, desc, sql } from "drizzle-orm";

export interface NotificationTemplate {
  type: string;
  category: 'athlete_wellness' | 'feature_discovery' | 'weekly_report' | 'social' | 'admin_broadcast';
  title: string;
  message: string;
  actionUrl?: string;
  frequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'one_time' | 'conditional';
  conditions?: {
    minDaysSinceLastWorkout?: number;
    minDaysSinceRegistration?: number;
    requiresCoach?: boolean;
    requiresPremium?: boolean;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  };
}

export class NotificationAutomationSystem {
  private templates: NotificationTemplate[] = [
    // ========== ATHLETE WELLNESS REMINDERS ==========
    {
      type: 'rest_reminder',
      category: 'athlete_wellness',
      title: '💤 Recovery Check-In',
      message: 'How are you feeling today? Getting proper rest is crucial for performance. Consider logging your sleep quality in your journal.',
      actionUrl: '/journal',
      frequency: 'weekly',
      conditions: { timeOfDay: 'morning' }
    },
    {
      type: 'hydration_reminder',
      category: 'athlete_wellness',
      title: '💧 Stay Hydrated',
      message: 'Remember to drink water throughout the day! Proper hydration improves performance and recovery.',
      frequency: 'daily',
      conditions: { timeOfDay: 'afternoon' }
    },
    {
      type: 'coach_communication',
      category: 'athlete_wellness',
      title: '💬 Connect with Your Coach',
      message: 'When did you last check in with your coach? Regular communication helps optimize your training.',
      actionUrl: '/messages',
      frequency: 'weekly',
      conditions: { requiresCoach: true, timeOfDay: 'evening' }
    },
    {
      type: 'nutrition_reminder',
      category: 'athlete_wellness',
      title: '🥗 Fuel Your Performance',
      message: 'Are you eating enough protein and carbs for recovery? Consider tracking your nutrition in your training journal.',
      actionUrl: '/journal',
      frequency: 'bi_weekly',
      conditions: { timeOfDay: 'morning' }
    },
    {
      type: 'massage_therapy',
      category: 'athlete_wellness',
      title: '🤲 Recovery Therapy Check',
      message: 'Have you scheduled your massage or physiotherapy session this week? Your body will thank you!',
      frequency: 'weekly',
      conditions: { timeOfDay: 'evening' }
    },
    {
      type: 'sleep_reminder',
      category: 'athlete_wellness',
      title: '😴 Wind Down Time',
      message: 'Getting 7-9 hours of quality sleep tonight will help you crush tomorrow\'s training. Sweet dreams!',
      frequency: 'daily',
      conditions: { timeOfDay: 'evening' }
    },
    {
      type: 'injury_prevention',
      category: 'athlete_wellness',
      title: '🏃‍♂️ Injury Prevention Check',
      message: 'Any aches or pains? Don\'t ignore early warning signs. Check out our Rehab Center for preventive exercises.',
      actionUrl: '/rehab',
      frequency: 'weekly',
      conditions: { minDaysSinceLastWorkout: 2 }
    },

    // ========== FEATURE DISCOVERY ==========
    {
      type: 'journal_feature',
      category: 'feature_discovery',
      title: '📝 Discover: Training Journal',
      message: 'Track your workouts, thoughts, and progress with voice notes! Your journal helps identify patterns and improvements.',
      actionUrl: '/journal',
      frequency: 'one_time',
      conditions: { minDaysSinceRegistration: 3 }
    },
    {
      type: 'start_gun_feature',
      category: 'feature_discovery',
      title: '🔫 Try the Start Gun Simulator',
      message: 'Practice your reaction time with our authentic start gun simulator. Perfect your starts anywhere!',
      actionUrl: '/practice',
      frequency: 'one_time',
      conditions: { minDaysSinceRegistration: 7 }
    },
    {
      type: 'spikes_system',
      category: 'feature_discovery',
      title: '⚡ Earn Spikes Rewards',
      message: 'Did you know you earn Spikes automatically for every workout and meet? Check your balance and achievements!',
      actionUrl: '/spikes',
      frequency: 'one_time',
      conditions: { minDaysSinceRegistration: 5 }
    },
    {
      type: 'meet_creation',
      category: 'feature_discovery',
      title: '🏃‍♀️ Create Your First Meet',
      message: 'Ready to compete? Create a meet to track your performance and share results with coaches and teammates.',
      actionUrl: '/meets',
      frequency: 'one_time',
      conditions: { minDaysSinceRegistration: 10 }
    },
    {
      type: 'rehab_center',
      category: 'feature_discovery',
      title: '🩺 Explore Rehab Programs',
      message: 'Prevent injuries and recover faster with our evidence-based rehabilitation programs designed by experts.',
      actionUrl: '/rehab',
      frequency: 'one_time',
      conditions: { minDaysSinceRegistration: 14 }
    },
    {
      type: 'athlete_search',
      category: 'feature_discovery',
      title: '👥 Connect with Athletes',
      message: 'Find training partners and friends! Search for athletes in your area and send friend requests.',
      actionUrl: '/athletes',
      frequency: 'one_time',
      conditions: { minDaysSinceRegistration: 7 }
    },

    // ========== WEEKLY REPORTS ==========
    {
      type: 'weekly_summary',
      category: 'weekly_report',
      title: '📊 Your Weekly Training Report',
      message: 'Check out your training highlights, spike earnings, and progress from this week!',
      actionUrl: '/spikes',
      frequency: 'weekly',
      conditions: { timeOfDay: 'evening' }
    },
    {
      type: 'monthly_achievements',
      category: 'weekly_report',
      title: '🏆 Monthly Achievement Summary',
      message: 'See all the achievements you\'ve unlocked this month and discover new goals to chase!',
      actionUrl: '/spikes',
      frequency: 'monthly',
      conditions: { timeOfDay: 'morning' }
    },

    // ========== SOCIAL NOTIFICATIONS ==========
    {
      type: 'friend_request_received',
      category: 'social',
      title: '👋 New Friend Request',
      message: 'You have a new friend request waiting for you!',
      actionUrl: '/athletes',
      frequency: 'conditional'
    },
    {
      type: 'message_received',
      category: 'social',
      title: '💬 New Message',
      message: 'You have a new message from a friend!',
      actionUrl: '/messages',
      frequency: 'conditional'
    },
    {
      type: 'workout_reaction',
      category: 'social',
      title: '👍 Workout Reaction',
      message: 'Someone reacted to your workout! Check it out.',
      actionUrl: '/programs',
      frequency: 'conditional'
    }
  ];

  async processAutomatedNotifications(): Promise<void> {
    console.log('🔄 Processing automated notifications...');
    
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      await this.processUserNotifications(user);
    }
    
    console.log('✅ Automated notifications processed');
  }

  private async processUserNotifications(user: typeof users.$inferSelect): Promise<void> {
    for (const template of this.templates) {
      if (template.category === 'social' || template.category === 'admin_broadcast') {
        continue; // These are handled separately
      }

      const shouldSend = await this.shouldSendNotification(user, template);
      if (shouldSend) {
        await this.sendNotification(user.id, template);
      }
    }
  }

  private async shouldSendNotification(
    user: typeof users.$inferSelect, 
    template: NotificationTemplate
  ): Promise<boolean> {
    // Check if user already received this notification recently
    const recentNotification = await this.getRecentNotification(user.id, template.type);
    if (recentNotification && !this.isTimeForNextNotification(recentNotification.createdAt, template.frequency)) {
      return false;
    }

    // Check conditions
    if (template.conditions) {
      const conditionsMet = await this.checkConditions(user, template.conditions);
      if (!conditionsMet) {
        return false;
      }
    }

    // Check time of day if specified
    if (template.conditions?.timeOfDay) {
      const currentHour = new Date().getHours();
      const timeOfDay = this.getTimeOfDay(currentHour);
      if (timeOfDay !== template.conditions.timeOfDay) {
        return false;
      }
    }

    return true;
  }

  private async checkConditions(
    user: typeof users.$inferSelect,
    conditions: NonNullable<NotificationTemplate['conditions']>
  ): Promise<boolean> {
    // Check registration time
    if (conditions.minDaysSinceRegistration) {
      const daysSinceRegistration = this.getDaysSince(user.createdAt);
      if (daysSinceRegistration < conditions.minDaysSinceRegistration) {
        return false;
      }
    }

    // Check last workout
    if (conditions.minDaysSinceLastWorkout) {
      const lastWorkout = await this.getLastWorkoutDate(user.id);
      if (lastWorkout) {
        const daysSinceWorkout = this.getDaysSince(lastWorkout);
        if (daysSinceWorkout < conditions.minDaysSinceLastWorkout) {
          return false;
        }
      }
    }

    // Check premium requirement
    if (conditions.requiresPremium && !user.isPremium) {
      return false;
    }

    // Check coach requirement (simplified - could be enhanced with actual coach relationships)
    if (conditions.requiresCoach && user.role === 'athlete') {
      // Could check if user has an assigned coach
      return true; // For now, assume all athletes might have coaches
    }

    return true;
  }

  private async getRecentNotification(userId: number, type: string) {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.type, type)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(1);
    
    return notification || null;
  }

  private isTimeForNextNotification(lastSent: Date | null, frequency: NotificationTemplate['frequency']): boolean {
    if (!lastSent) return true;

    const daysSince = this.getDaysSince(lastSent);
    
    switch (frequency) {
      case 'daily': return daysSince >= 1;
      case 'weekly': return daysSince >= 7;
      case 'bi_weekly': return daysSince >= 14;
      case 'monthly': return daysSince >= 30;
      case 'one_time': return false; // Never send again
      case 'conditional': return true; // Always check conditions
      default: return false;
    }
  }

  private getDaysSince(date: Date | null): number {
    if (!date) return 0;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  private async getLastWorkoutDate(userId: number): Promise<Date | null> {
    // For now, return null as we need to check the actual schema structure
    // This will be enhanced once the program sessions table structure is confirmed
    return null;
  }

  async sendNotification(userId: number, template: NotificationTemplate, customData?: any): Promise<void> {
    const notification: InsertNotification = {
      userId,
      type: template.type,
      title: template.title,
      message: customData?.message || template.message,
      actionUrl: template.actionUrl,
      relatedId: customData?.relatedId,
      relatedType: customData?.relatedType,
      isRead: false
    };

    await db.insert(notifications).values(notification);
    console.log(`📧 Sent notification: ${template.title} to user ${userId}`);
  }

  // Social notification handlers
  async sendFriendRequestNotification(toUserId: number, fromUserId: number, fromUsername: string): Promise<void> {
    await this.sendNotification(toUserId, {
      type: 'friend_request_received',
      category: 'social',
      title: '👋 New Friend Request',
      message: `${fromUsername} sent you a friend request!`,
      actionUrl: '/athletes',
      frequency: 'conditional'
    }, {
      relatedId: fromUserId,
      relatedType: 'user'
    });
  }

  async sendMessageNotification(toUserId: number, fromUserId: number, fromUsername: string): Promise<void> {
    await this.sendNotification(toUserId, {
      type: 'message_received',
      category: 'social',
      title: '💬 New Message',
      message: `${fromUsername} sent you a message!`,
      actionUrl: '/messages',
      frequency: 'conditional'
    }, {
      relatedId: fromUserId,
      relatedType: 'user'
    });
  }

  async sendWorkoutReactionNotification(toUserId: number, fromUsername: string, reactionType: string): Promise<void> {
    const reactionEmoji = reactionType === 'fire' ? '🔥' : reactionType === 'strong' ? '💪' : '👍';
    
    await this.sendNotification(toUserId, {
      type: 'workout_reaction',
      category: 'social',
      title: `${reactionEmoji} Workout Reaction`,
      message: `${fromUsername} reacted ${reactionEmoji} to your workout!`,
      actionUrl: '/programs',
      frequency: 'conditional'
    });
  }

  // Admin broadcast system
  async sendAdminBroadcast(title: string, message: string, targetUserIds?: number[]): Promise<void> {
    let userIds: number[];
    
    if (targetUserIds && targetUserIds.length > 0) {
      userIds = targetUserIds;
    } else {
      // Send to all users
      const allUsers = await db.select({ id: users.id }).from(users);
      userIds = allUsers.map(user => user.id);
    }

    const notifications: InsertNotification[] = userIds.map(userId => ({
      userId,
      type: 'admin_broadcast',
      title,
      message,
      isRead: false
    }));

    await db.insert(notifications).values(notificationData);
    console.log(`📢 Admin broadcast sent to ${userIds.length} users: ${title}`);
  }

  // Weekly report generation
  async generateWeeklyReport(userId: number): Promise<void> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get user's weekly stats
    const completedSessions = await db
      .select()
      .from(programSessions)
      .where(and(
        eq(programSessions.userId, userId),
        eq(programSessions.isCompleted, true),
        gte(programSessions.completedAt, weekAgo)
      ));

    const weeklyMeets = await db
      .select()
      .from(meets)
      .where(and(
        eq(meets.userId, userId),
        gte(meets.date, weekAgo)
      ));

    const sessionCount = completedSessions.length;
    const meetCount = weeklyMeets.length;
    
    const message = `This week: ${sessionCount} training session${sessionCount !== 1 ? 's' : ''} and ${meetCount} meet${meetCount !== 1 ? 's' : ''}. Keep up the great work! 🏃‍♂️`;

    await this.sendNotification(userId, {
      type: 'weekly_summary',
      category: 'weekly_report',
      title: '📊 Your Weekly Training Report',
      message,
      actionUrl: '/spikes',
      frequency: 'weekly'
    });
  }
}

// Export singleton instance
export const notificationSystem = new NotificationAutomationSystem();