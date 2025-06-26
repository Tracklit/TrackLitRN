import { Request, Response } from "express";
import { db } from "./db";
import { messageReactions, chatGroupMessages } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Add reaction to a message
export const addReaction = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { messageId, messageType, emoji = "👍" } = req.body;
    const userId = req.user!.id;

    if (!messageId || !messageType) {
      return res.status(400).json({ error: "Missing messageId or messageType" });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.messageType, messageType),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      )
      .limit(1);

    if (existingReaction.length > 0) {
      // Remove existing reaction (toggle off)
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existingReaction[0].id));
      
      return res.json({ action: "removed", messageId, emoji });
    } else {
      // Add new reaction
      const [newReaction] = await db
        .insert(messageReactions)
        .values({
          messageId,
          messageType,
          userId,
          emoji
        })
        .returning();

      return res.json({ action: "added", reaction: newReaction });
    }
  } catch (error) {
    console.error("Error toggling message reaction:", error);
    res.status(500).json({ error: "Failed to toggle reaction" });
  }
};

// Get reactions for a message
export const getReactions = async (req: Request, res: Response) => {
  try {
    const { messageId, messageType } = req.params;

    if (!messageId || !messageType) {
      return res.status(400).json({ error: "Missing messageId or messageType" });
    }

    const reactions = await db
      .select({
        id: messageReactions.id,
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
        createdAt: messageReactions.createdAt
      })
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, parseInt(messageId)),
          eq(messageReactions.messageType, messageType)
        )
      )
      .orderBy(messageReactions.createdAt);

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: any, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.userId);
      return acc;
    }, {});

    res.json(Object.values(groupedReactions));
  } catch (error) {
    console.error("Error getting message reactions:", error);
    res.status(500).json({ error: "Failed to get reactions" });
  }
};