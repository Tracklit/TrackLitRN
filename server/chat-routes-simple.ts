import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get chat groups for user
router.get("/api/chat/groups", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    
    // Direct SQL query to get groups
    const groups = await db.execute(sql`
      SELECT 
        cg.id,
        cg.name,
        cg.description,
        cg.avatar_url,
        cg.creator_id,
        cg.is_private,
        cg.created_at,
        cg.last_message,
        cg.last_message_at,
        cg.message_count
      FROM chat_groups cg
      INNER JOIN chat_group_members cgm ON cg.id = cgm.group_id
      WHERE cgm.user_id = ${userId}
      ORDER BY cg.last_message_at DESC
    `);
    
    res.json(groups.rows);
  } catch (error) {
    console.error("Error fetching chat groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Create new chat group
router.post("/api/chat/groups", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    const { name, description, isPrivate = false } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create group with direct SQL
    const groupResult = await db.execute(sql`
      INSERT INTO chat_groups (name, description, creator_id, admin_ids, member_ids, is_private, invite_code)
      VALUES (${name.trim()}, ${description || ''}, ${userId}, ARRAY[${userId}], ARRAY[${userId}], ${isPrivate}, ${inviteCode})
      RETURNING *
    `);

    const group = groupResult.rows[0];

    // Add creator as member
    await db.execute(sql`
      INSERT INTO chat_group_members (group_id, user_id, role)
      VALUES (${group.id}, ${userId}, 'creator')
    `);

    res.json(group);
  } catch (error) {
    console.error("Error creating chat group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get direct messages for conversation
router.get("/api/chat/direct/:conversationId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    // Get messages with direct SQL
    const messages = await db.execute(sql`
      SELECT 
        dm.id,
        dm.conversation_id,
        dm.sender_id,
        dm.receiver_id,
        dm.text,
        dm.created_at,
        dm.is_read,
        u.name as sender_name,
        u.profile_image_url as sender_profile_image
      FROM telegram_direct_messages dm
      INNER JOIN users u ON dm.sender_id = u.id
      WHERE dm.conversation_id = ${conversationId}
      ORDER BY dm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    res.json(messages.rows);
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send direct message
router.post("/api/chat/direct/:conversationId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user!.id;
    const { text, receiverId } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    // Insert message with direct SQL
    const messageResult = await db.execute(sql`
      INSERT INTO telegram_direct_messages (conversation_id, sender_id, receiver_id, text)
      VALUES (${conversationId}, ${userId}, ${receiverId}, ${text.trim()})
      RETURNING *
    `);

    const message = messageResult.rows[0];
    res.json(message);
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get group messages
router.get("/api/chat/groups/:groupId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Check if user is a member of this group using the member_ids array
    const groupCheck = await db.execute(sql`
      SELECT member_ids FROM chat_groups 
      WHERE id = ${groupId} AND ${userId} = ANY(member_ids)
    `);

    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get messages with sender info
    const messages = await db.execute(sql`
      SELECT 
        cgm.id,
        cgm.group_id,
        cgm.sender_id as user_id,
        cgm.text,
        cgm.created_at,
        cgm.message_type,
        cgm.media_url,
        cgm.reply_to_id,
        cgm.is_deleted as is_edited,
        cgm.edited_at,
        u.name as sender_name,
        u.username as sender_username,
        u.profile_image_url as sender_profile_image
      FROM chat_group_messages cgm
      INNER JOIN users u ON cgm.sender_id = u.id
      WHERE cgm.group_id = ${groupId}
      ORDER BY cgm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    res.json(messages.rows);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send group message
router.post("/api/chat/groups/:groupId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;
    const { text, replyToId, messageType = "text", mediaUrl } = req.body;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Check if user is a member of this group using the member_ids array
    const groupCheck = await db.execute(sql`
      SELECT member_ids FROM chat_groups 
      WHERE id = ${groupId} AND ${userId} = ANY(member_ids)
    `);

    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get user info for the message
    const userResult = await db.execute(sql`
      SELECT name, profile_image_url FROM users WHERE id = ${userId}
    `);
    const user = userResult.rows[0];

    // Insert message
    const messageResult = await db.execute(sql`
      INSERT INTO chat_group_messages (group_id, sender_id, sender_name, sender_profile_image, text, message_type, media_url, reply_to_id)
      VALUES (${groupId}, ${userId}, ${user.name || 'Unknown'}, ${user.profile_image_url || null}, ${text.trim()}, ${messageType}, ${mediaUrl || null}, ${replyToId || null})
      RETURNING *
    `);

    const message = messageResult.rows[0];

    // Update group's last message info
    await db.execute(sql`
      UPDATE chat_groups 
      SET 
        last_message = ${text.trim()},
        last_message_at = NOW(),
        message_count = message_count + 1
      WHERE id = ${groupId}
    `);

    res.json(message);
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;