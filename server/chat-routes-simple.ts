import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { messageReactions } from "@shared/schema";
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

// Debug endpoint for chat groups
router.get("/api/chat/groups/debug", async (req: Request, res: Response) => {
  console.log('=== DEBUG CHAT GROUPS API CALLED ===');
  
  if (!req.isAuthenticated()) {
    console.log('User not authenticated');
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    console.log('Debug User ID:', userId);
    
    // Test direct database query
    const groups = await db.execute(sql`
      SELECT 
        cg.id,
        cg.name,
        cg.description,
        cg.image as avatar_url,
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
    
    console.log('DEBUG Raw groups from database:', groups.rows);
    console.log('DEBUG Number of groups found:', groups.rows.length);
    
    groups.rows.forEach((group, index) => {
      console.log(`DEBUG Group ${index + 1}:`, JSON.stringify(group, null, 2));
    });
    
    res.json({ debug: true, groups: groups.rows });
  } catch (error) {
    console.error("DEBUG Error fetching chat groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Get chat groups for user - FIXED VERSION
router.get("/api/chat/groups", async (req: Request, res: Response) => {
  console.log('=== CHAT GROUPS API CALLED - FIXED ===');
  
  // Completely disable caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': `"${Date.now()}-${Math.random()}"`,
    'Last-Modified': new Date().toUTCString()
  });
  
  if (!req.isAuthenticated()) {
    console.log('User not authenticated');
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    console.log('FIXED: Fetching groups for user ID:', userId);
    
    // Fixed SQL query - use subquery to get distinct groups first, then order
    const groups = await db.execute(sql`
      SELECT 
        cg.id,
        cg.name,
        cg.description,
        cg.image,
        cg.creator_id,
        cg.is_private,
        cg.created_at::text,
        cg.last_message,
        cg.last_message_at::text,
        COALESCE(cg.message_count, 0) as message_count
      FROM chat_groups cg
      WHERE cg.id IN (
        SELECT DISTINCT cgm.group_id 
        FROM chat_group_members cgm 
        WHERE cgm.user_id = ${userId}
      )
      ORDER BY cg.last_message_at DESC NULLS LAST
    `);
    
    console.log('FIXED: Raw database results count:', groups.rows.length);
    console.log('FIXED: Raw database results:', JSON.stringify(groups.rows, null, 2));
    
    // Transform results with explicit avatar_url mapping
    const processedGroups = groups.rows.map((group: any) => {
      const result = {
        id: group.id,
        name: group.name,
        description: group.description,
        avatar_url: group.image, // Map image to avatar_url
        creator_id: group.creator_id,
        is_private: group.is_private,
        created_at: group.created_at,
        last_message: group.last_message,
        last_message_at: group.last_message_at,
        message_count: group.message_count
      };
      
      console.log(`FIXED: Group ${group.id} - image: "${group.image}" -> avatar_url: "${result.avatar_url}"`);
      return result;
    });
    
    console.log('FIXED: Final processed groups:', JSON.stringify(processedGroups, null, 2));
    
    res.json(processedGroups);
  } catch (error) {
    console.error("FIXED: Error fetching chat groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Create new chat group
router.post("/api/chat/groups", upload.single('image'), async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    const { name, description, isPrivate = false, members } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Parse members if provided
    let inviteMembers = [];
    if (members) {
      try {
        inviteMembers = JSON.parse(members);
      } catch (e) {
        console.error("Error parsing members:", e);
      }
    }

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Collect all member IDs (creator + invited members)
    const allMemberIds = [userId];
    const validInviteMembers = [];

    // Process invited members
    for (const member of inviteMembers) {
      if (member.username && member.username !== req.user!.username) {
        // Look up user by username
        const userResult = await db.execute(sql`
          SELECT id, name, username FROM users WHERE username = ${member.username}
        `);
        
        if (userResult.rows.length > 0) {
          const foundUser = userResult.rows[0] as any;
          allMemberIds.push(Number(foundUser.id));
          validInviteMembers.push(foundUser);
        }
      }
    }

    // Create group with direct SQL - cast arrays to proper types
    const groupResult = await db.execute(sql`
      INSERT INTO chat_groups (name, description, image, creator_id, admin_ids, member_ids, is_private, invite_code)
      VALUES (${name.trim()}, ${description || ''}, ${imageUrl}, ${userId}, ARRAY[${userId}]::integer[], ARRAY[${sql.join(allMemberIds, sql`, `)}]::integer[], ${isPrivate === 'true'}, ${inviteCode})
      RETURNING *
    `);

    const group = groupResult.rows[0];

    // Add creator as member
    await db.execute(sql`
      INSERT INTO chat_group_members (group_id, user_id, role)
      VALUES (${group.id}, ${userId}, 'creator')
    `);

    // Add invited members
    for (const member of validInviteMembers) {
      await db.execute(sql`
        INSERT INTO chat_group_members (group_id, user_id, role)
        VALUES (${group.id}, ${member.id}, 'member')
      `);

      // Create system message announcing the new member
      await db.execute(sql`
        INSERT INTO chat_group_messages (group_id, sender_id, sender_name, text, message_type, created_at)
        VALUES (${group.id}, ${userId}, 'System', ${`${member.name} was added to the group`}, 'system', NOW())
      `);
    }

    res.json(group);
  } catch (error) {
    console.error("Error creating chat group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get specific group details
router.get("/api/chat/groups/:groupId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Get group details
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];

    // Check if user is a member (handle both array and null cases)
    const memberIds = (group as any).member_ids || [];
    const isMember = Array.isArray(memberIds) ? memberIds.includes(userId) : false;
    const isCreator = (group as any).creator_id === userId;
    
    if (!isMember && !isCreator) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    res.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

// Update group details
router.patch("/api/chat/groups/:groupId", upload.single('image'), async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;
    const { name, description, isPrivate } = req.body;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Check if user is admin or creator
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    const adminIds = (group as any).admin_ids ? (Array.isArray((group as any).admin_ids) ? (group as any).admin_ids : []) : [];
    const isAdmin = group.creator_id === userId || adminIds.includes(userId);

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can update group details" });
    }

    // Handle image upload
    let imageUrl = group.image;
    console.log('File upload received:', req.file);
    console.log('Current group image:', group.image);
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('New image URL:', imageUrl);
    } else {
      console.log('No file uploaded in request');
    }

    // Update group
    const updateResult = await db.execute(sql`
      UPDATE chat_groups 
      SET name = ${name || group.name}, 
          description = ${description || group.description}, 
          image = ${imageUrl},
          is_private = ${isPrivate === 'true' ? true : (isPrivate === 'false' ? false : group.is_private)}
      WHERE id = ${groupId}
      RETURNING *
    `);

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Failed to update group" });
  }
});

// Get group members with details
router.get("/api/chat/groups/:groupId/members", async (req: Request, res: Response) => {
  // Force no caching for debugging
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Check if user is a member
    const groupResult = await db.execute(sql`
      SELECT member_ids FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    if (!(group as any).member_ids.includes(userId)) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    // Get member details
    const membersResult = await db.execute(sql`
      SELECT 
        cgm.user_id,
        cgm.role,
        cgm.joined_at,
        u.name,
        u.username,
        u.profile_image_url
      FROM chat_group_members cgm
      INNER JOIN users u ON cgm.user_id = u.id
      WHERE cgm.group_id = ${groupId}
      ORDER BY 
        CASE cgm.role 
          WHEN 'creator' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        cgm.joined_at ASC
    `);

    console.log('=== GROUP MEMBERS API CALLED ===');
    console.log('Group ID:', groupId);
    console.log('Raw members result:', JSON.stringify(membersResult.rows, null, 2));
    
    // Debug profile image URLs specifically
    membersResult.rows.forEach((member: any) => {
      console.log(`Member ${member.name} (ID: ${member.user_id}): profile_image_url = "${member.profile_image_url}"`);
    });
    
    res.json(membersResult.rows);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// Add member to group
router.post("/api/chat/groups/:groupId/members", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user!.id;
    const { userId } = req.body;

    if (isNaN(groupId) || !userId) {
      return res.status(400).json({ error: "Invalid group ID or user ID" });
    }

    // Check if current user is admin or creator
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    const adminIds = (group as any).admin_ids ? (Array.isArray((group as any).admin_ids) ? (group as any).admin_ids : []) : [];
    const isAdmin = group.creator_id === currentUserId || adminIds.includes(currentUserId);

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Check if user is already a member
    if ((group as any).member_ids.includes(userId)) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Add user to group members array
    await db.execute(sql`
      UPDATE chat_groups 
      SET member_ids = array_append(member_ids, ${userId})
      WHERE id = ${groupId}
    `);

    // Add member record
    await db.execute(sql`
      INSERT INTO chat_group_members (group_id, user_id, role)
      VALUES (${groupId}, ${userId}, 'member')
    `);

    // Get the added user's name for the system message
    const addedUserResult = await db.execute(sql`
      SELECT name, username FROM users WHERE id = ${userId}
    `);
    
    if (addedUserResult.rows.length > 0) {
      const addedUser = addedUserResult.rows[0];
      
      // Create system message announcing the new member
      await db.execute(sql`
        INSERT INTO chat_group_messages (group_id, sender_id, sender_name, text, message_type, created_at)
        VALUES (${groupId}, ${currentUserId}, 'System', ${`${addedUser.name} was added to the group`}, 'system', NOW())
      `);
    }

    res.json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Remove member from group
router.delete("/api/chat/groups/:groupId/members/:userId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const targetUserId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    if (isNaN(groupId) || isNaN(targetUserId)) {
      return res.status(400).json({ error: "Invalid group ID or user ID" });
    }

    // Check if current user is admin or creator
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    const adminIds = group.admin_ids ? (Array.isArray(group.admin_ids) ? group.admin_ids : []) : [];
    const isAdmin = group.creator_id === currentUserId || adminIds.includes(currentUserId);

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    // Cannot remove creator
    if (group.creator_id === targetUserId) {
      return res.status(400).json({ error: "Cannot remove group creator" });
    }

    // Remove user from group members array
    await db.execute(sql`
      UPDATE chat_groups 
      SET member_ids = array_remove(member_ids, ${targetUserId}),
          admin_ids = array_remove(admin_ids, ${targetUserId})
      WHERE id = ${groupId}
    `);

    // Get the removed user's name for the system message
    const removedUserResult = await db.execute(sql`
      SELECT name, username FROM users WHERE id = ${targetUserId}
    `);

    // Remove member record
    await db.execute(sql`
      DELETE FROM chat_group_members 
      WHERE group_id = ${groupId} AND user_id = ${targetUserId}
    `);

    // Create system message announcing the member removal
    if (removedUserResult.rows.length > 0) {
      const removedUser = removedUserResult.rows[0];
      
      await db.execute(sql`
        INSERT INTO chat_group_messages (group_id, sender_id, sender_name, text, message_type, created_at)
        VALUES (${groupId}, ${currentUserId}, 'System', ${`${removedUser.name} was removed from the group`}, 'system', NOW())
      `);
    }

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ error: "Failed to remove member" });
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

    // Get messages with sender info and reply-to message data - ORDER BY ASC for chronological order (oldest first)
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
        u.name,
        u.username,
        u.profile_image_url,
        -- Reply-to message data
        reply_msg.text as reply_to_text,
        reply_msg.message_type as reply_to_message_type,
        reply_user.name as reply_to_user_name,
        reply_user.id as reply_to_user_id
      FROM chat_group_messages cgm
      INNER JOIN users u ON cgm.sender_id = u.id
      LEFT JOIN chat_group_messages reply_msg ON cgm.reply_to_id = reply_msg.id
      LEFT JOIN users reply_user ON reply_msg.sender_id = reply_user.id
      WHERE cgm.group_id = ${groupId}
      ORDER BY cgm.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Get reactions for all messages
    const messageIds = messages.rows.map((msg: any) => msg.id);
    let reactionsData: any[] = [];
    
    if (messageIds.length > 0) {
      // Use a simple IN clause instead of ANY to avoid type issues
      const placeholders = messageIds.map(() => '?').join(',');
      const reactionsResult = await db.execute(sql`
        SELECT 
          message_id,
          emoji,
          user_id,
          created_at
        FROM message_reactions 
        WHERE message_id IN (${sql.raw(messageIds.join(','))}) AND message_type = 'group'
        ORDER BY created_at ASC
      `);
      reactionsData = reactionsResult.rows;
    }

    // Group reactions by message ID and emoji
    const reactionsByMessage = reactionsData.reduce((acc: any, reaction: any) => {
      const messageId = reaction.message_id;
      if (!acc[messageId]) {
        acc[messageId] = {};
      }
      if (!acc[messageId][reaction.emoji]) {
        acc[messageId][reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      acc[messageId][reaction.emoji].count++;
      acc[messageId][reaction.emoji].users.push(reaction.user_id);
      return acc;
    }, {});

    // Transform messages to include user object structure, reply-to data, and reactions
    const transformedMessages = messages.rows.map((msg: any) => ({
      id: msg.id,
      group_id: msg.group_id,
      user_id: msg.user_id,
      text: msg.text,
      created_at: msg.created_at,
      message_type: msg.message_type,
      media_url: msg.media_url,
      reply_to_id: msg.reply_to_id,
      is_edited: msg.is_edited,
      edited_at: msg.edited_at,
      reactions: reactionsByMessage[msg.id] ? Object.values(reactionsByMessage[msg.id]) : [],
      user: {
        id: msg.user_id,
        name: msg.name,
        username: msg.username,
        profile_image_url: msg.profile_image_url
      },
      reply_to_message: msg.reply_to_id ? {
        id: msg.reply_to_id,
        text: msg.reply_to_text,
        message_type: msg.reply_to_message_type,
        user: {
          id: msg.reply_to_user_id,
          name: msg.reply_to_user_name
        }
      } : null
    }));

    res.json(transformedMessages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send group message
router.post("/api/chat/groups/:groupId/messages", upload.single('image'), async (req: Request, res: Response) => {
  console.log('=== GROUP MESSAGE ROUTE HIT ===');
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;
    const { text, replyToId, messageType = "text" } = req.body;
    const file = req.file;

    console.log('Message upload debug:', {
      text: text,
      file: file ? { filename: file.filename, size: file.size } : null,
      messageType,
      hasText: !!text?.trim(),
      hasFile: !!file
    });

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Validate that we have either text or a file
    if (!text?.trim() && !file) {
      console.log('Validation failed: no text and no file');
      return res.status(400).json({ error: "Message text or image is required" });
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

    // Determine message type and media URL
    const finalMessageType = file ? "image" : "text";
    const mediaUrl = file ? `/uploads/${file.filename}` : null;
    const messageText = text?.trim() || "";

    // Insert message
    const messageResult = await db.execute(sql`
      INSERT INTO chat_group_messages (group_id, sender_id, sender_name, sender_profile_image, text, message_type, media_url, reply_to_id)
      VALUES (${groupId}, ${userId}, ${user.name || 'Unknown'}, ${user.profile_image_url || null}, ${messageText}, ${finalMessageType}, ${mediaUrl}, ${replyToId || null})
      RETURNING *
    `);

    const message = messageResult.rows[0];

    // Update group's last message info
    const lastMessageText = text?.trim() || (file ? "📷 Photo" : "");
    await db.execute(sql`
      UPDATE chat_groups 
      SET 
        last_message = ${lastMessageText},
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

// Edit group message
router.patch("/api/chat/groups/:groupId/messages/:messageId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const messageId = parseInt(req.params.messageId);
    const userId = req.user!.id;
    const { text } = req.body;

    if (isNaN(groupId) || isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid group ID or message ID" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // Check if message exists and user owns it
    const messageCheck = await db.execute(sql`
      SELECT * FROM chat_group_messages 
      WHERE id = ${messageId} AND group_id = ${groupId} AND sender_id = ${userId}
    `);

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: "Message not found or unauthorized" });
    }

    // Update the message
    const updateResult = await db.execute(sql`
      UPDATE chat_group_messages 
      SET text = ${text.trim()}, edited_at = NOW()
      WHERE id = ${messageId}
      RETURNING *
    `);

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error editing group message:", error);
    res.status(500).json({ error: "Failed to edit message" });
  }
});

// Add reaction to group message
router.post("/api/chat/groups/:groupId/messages/:messageId/reactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const messageId = parseInt(req.params.messageId);
    const userId = req.user!.id;
    const { emoji = "👍" } = req.body;

    if (isNaN(groupId) || isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid group ID or message ID" });
    }

    // Check if message exists in the group
    const messageCheck = await db.execute(sql`
      SELECT id FROM chat_group_messages 
      WHERE id = ${messageId} AND group_id = ${groupId}
    `);

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    // For now, just update the message to indicate it has a reaction
    // In a full implementation, you'd have a separate reactions table
    await db.execute(sql`
      UPDATE chat_group_messages 
      SET text = COALESCE(text, '') || ' 👍'
      WHERE id = ${messageId}
    `);

    res.json({ action: "added", messageId, emoji });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ error: "Failed to add reaction" });
  }
});

// Message Reactions Routes (legacy)
router.post("/messages/:messageId/:messageType/reactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { messageId, messageType } = req.params;
    const { emoji = "👍" } = req.body;
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
          eq(messageReactions.messageId, parseInt(messageId)),
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
          messageId: parseInt(messageId),
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
});

router.get("/messages/:messageId/:messageType/reactions", async (req: Request, res: Response) => {
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
});

export default router;