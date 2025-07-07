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

// Get unread message counts per group for user
router.get("/api/chat/groups/unread-counts", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    
    // Get unread message counts for each group where user is a member
    const unreadCounts = await db.execute(sql`
      SELECT 
        cgm.group_id,
        COALESCE(COUNT(messages.id), 0) as unread_count
      FROM chat_group_members cgm
      LEFT JOIN chat_group_messages messages ON (
        messages.group_id = cgm.group_id 
        AND messages.sender_id != ${userId}
        AND messages.created_at > COALESCE(cgm.last_seen_at, cgm.joined_at, NOW() - INTERVAL '24 hours')
      )
      WHERE cgm.user_id = ${userId}
      GROUP BY cgm.group_id
    `);
    
    // Transform to object for easy lookup
    const unreadCountsMap = unreadCounts.rows.reduce((acc: any, row: any) => {
      acc[row.group_id] = Number(row.unread_count);
      return acc;
    }, {});
    
    res.json(unreadCountsMap);
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    res.status(500).json({ error: "Failed to fetch unread counts" });
  }
});

// Get unified chat channels (groups + direct messages) for user - TELEGRAM STYLE
router.get("/api/chat/groups", async (req: Request, res: Response) => {
  console.log('=== UNIFIED CHAT CHANNELS API CALLED ===');
  
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
    console.log('UNIFIED: Fetching channels for user ID:', userId);
    
    // Get chat groups using existing structure with member_ids arrays
    const groups = await db.execute(sql`
      SELECT 
        'group' as channel_type,
        id,
        name,
        description,
        image,
        creator_id as created_by,
        admin_ids,
        member_ids,
        is_private,
        created_at::text,
        last_message,
        last_message_at::text,
        COALESCE(message_count, 0) as message_count,
        null as other_user_id
      FROM chat_groups
      WHERE ${userId} = ANY(member_ids) OR is_private = false
    `);
    
    // Get direct message conversations as channels
    const conversations = await db.execute(sql`
      SELECT 
        'direct' as channel_type,
        c.id,
        CASE 
          WHEN c."user1_id" = ${userId} THEN u2.name
          ELSE u1.name
        END as name,
        'Direct message' as description,
        CASE 
          WHEN c."user1_id" = ${userId} THEN u2."profile_image_url"
          ELSE u1."profile_image_url"
        END as image,
        null as created_by,
        ARRAY[]::integer[] as admin_ids,
        ARRAY[${userId}]::integer[] as member_ids,
        true as is_private,
        c."created_at"::text,
        (
          SELECT dm.content 
          FROM direct_messages dm 
          WHERE (dm."sender_id" = c."user1_id" AND dm."receiver_id" = c."user2_id") 
             OR (dm."sender_id" = c."user2_id" AND dm."receiver_id" = c."user1_id")
          ORDER BY dm."created_at" DESC 
          LIMIT 1
        ) as last_message,
        c."last_message_at"::text,
        (
          SELECT COUNT(*)::integer 
          FROM direct_messages dm 
          WHERE (dm."sender_id" = c."user1_id" AND dm."receiver_id" = c."user2_id") 
             OR (dm."sender_id" = c."user2_id" AND dm."receiver_id" = c."user1_id")
        ) as message_count,
        CASE 
          WHEN c."user1_id" = ${userId} THEN c."user2_id"
          ELSE c."user1_id"
        END as other_user_id
      FROM conversations c
      LEFT JOIN users u1 ON c."user1_id" = u1.id
      LEFT JOIN users u2 ON c."user2_id" = u2.id
      WHERE c."user1_id" = ${userId} OR c."user2_id" = ${userId}
    `);
    
    console.log('UNIFIED: Found', groups.rows.length, 'groups and', conversations.rows.length, 'direct conversations');
    console.log('UNIFIED: Raw conversations:', conversations.rows);
    
    // Process all channels
    const processedChannels = [...groups.rows, ...conversations.rows].map((channel: any) => {
      const isMember = channel.channel_type === 'direct' ? true : (channel.member_ids?.includes(userId) || false);
      const isAdmin = channel.channel_type === 'direct' ? false : (channel.admin_ids?.includes(userId) || false);
      const isOwner = channel.channel_type === 'direct' ? false : (channel.created_by === userId);
      
      const result = {
        channel_type: channel.channel_type,
        id: channel.id,
        name: channel.name,
        description: channel.description,
        avatar_url: channel.image,
        created_by: channel.created_by,
        admin_ids: channel.admin_ids || [],
        is_private: channel.is_private,
        created_at: channel.created_at,
        last_message: channel.last_message,
        last_message_at: channel.last_message_at,
        message_count: channel.message_count,
        is_member: isMember,
        is_admin: isAdmin,
        is_owner: isOwner,
        other_user_id: channel.other_user_id,
        members: []
      };
      
      return result;
    });
    
    // Sort by last message time (most recent first)
    processedChannels.sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.created_at || 0).getTime();
      const timeB = new Date(b.last_message_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });
    
    console.log('UNIFIED: Final processed channels:', processedChannels.length);
    console.log('UNIFIED: Channel IDs:', processedChannels.map(c => ({ id: c.id, name: c.name, type: c.channel_type })));
    
    res.json(processedChannels);
  } catch (error) {
    console.error("UNIFIED: Error fetching chat channels:", error);
    res.status(500).json({ error: "Failed to fetch channels" });
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
    const { name, description, isPrivate, is_private } = req.body;
    console.log('Update group request body:', req.body);
    
    // Handle both isPrivate and is_private field names
    const privateValue = isPrivate !== undefined ? isPrivate : is_private;

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

    // Update group - handle boolean conversion properly
    const finalPrivateValue = privateValue === 'true' || privateValue === true ? true : 
                              privateValue === 'false' || privateValue === false ? false : 
                              (group as any).is_private;
    
    console.log('Final privacy value:', finalPrivateValue, 'from input:', privateValue);
    
    const updateResult = await db.execute(sql`
      UPDATE chat_groups 
      SET name = ${name || (group as any).name}, 
          description = ${description || (group as any).description}, 
          image = ${imageUrl},
          is_private = ${finalPrivateValue}
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

// Get messages for channels - handles both groups and direct messages
router.get("/api/chat/channels/:channelId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const channelId = parseInt(req.params.channelId);
    const channelType = req.query.type as string; // 'group' or 'direct'
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(channelId)) {
      return res.status(400).json({ error: "Invalid channel ID" });
    }

    let messages;
    
    if (channelType === 'direct') {
      // Get direct messages for conversation
      messages = await db.execute(sql`
        SELECT 
          dm.id,
          dm.conversation_id,
          dm.sender_id,
          dm.receiver_id,
          dm.text,
          dm.created_at,
          dm.is_read,
          u.name as sender_name,
          u.profile_image_url as sender_profile_image,
          'direct' as message_type
        FROM direct_messages dm
        INNER JOIN users u ON dm.sender_id = u.id
        WHERE dm.conversation_id = ${channelId}
        ORDER BY dm.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
    } else {
      // Get group messages
      messages = await db.execute(sql`
        SELECT 
          cgm.id,
          cgm.group_id,
          cgm.sender_id,
          cgm.text,
          cgm.created_at,
          cgm.sender_name,
          cgm.sender_profile_image,
          cgm.message_type,
          cgm.reply_to_id,
          cgm.reply_to_text,
          cgm.reply_to_sender_name,
          cgm.image_url,
          cgm.video_url,
          cgm.audio_url,
          cgm.audio_duration,
          cgm.is_voice_message,
          cgm.is_system_message,
          cgm.is_edited,
          cgm.edited_at,
          cgm.is_deleted,
          cgm.deleted_at,
          cgm.reaction_counts,
          cgm.user_reactions
        FROM chat_group_messages cgm
        WHERE cgm.group_id = ${channelId}
        ORDER BY cgm.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
    }

    res.json(messages.rows);
  } catch (error) {
    console.error("Error fetching channel messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Legacy endpoint for direct messages - kept for backward compatibility
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
      FROM direct_messages dm
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
// Add group message reaction route
router.post("/api/chat/groups/:groupId/messages/:messageId/reactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { groupId, messageId } = req.params;
    const { emoji = "👍" } = req.body;
    const userId = req.user!.id;
    const messageType = "group";

    if (!messageId || !groupId) {
      return res.status(400).json({ error: "Missing messageId or groupId" });
    }

    console.log(`Checking reaction: messageId=${messageId}, userId=${userId}, emoji=${emoji}`);

    // Check if user already reacted with this emoji using raw SQL
    const existingReactionResult = await db.execute(sql`
      SELECT id FROM message_reactions 
      WHERE message_id = ${parseInt(messageId)} 
      AND message_type = ${messageType} 
      AND user_id = ${userId} 
      AND emoji = ${emoji}
      LIMIT 1
    `);

    console.log(`Found ${existingReactionResult.rows.length} existing reactions`);

    if (existingReactionResult.rows.length > 0) {
      // Remove existing reaction (toggle off)
      const reactionId = existingReactionResult.rows[0].id;
      await db.execute(sql`
        DELETE FROM message_reactions WHERE id = ${reactionId}
      `);
      
      console.log(`Removed reaction with ID ${reactionId}`);
      return res.json({ action: "removed", messageId, emoji });
    } else {
      // Add new reaction
      const newReactionResult = await db.execute(sql`
        INSERT INTO message_reactions (message_id, message_type, user_id, emoji, created_at)
        VALUES (${parseInt(messageId)}, ${messageType}, ${userId}, ${emoji}, NOW())
        RETURNING *
      `);

      console.log(`Added new reaction:`, newReactionResult.rows[0]);
      return res.json({ action: "added", reaction: newReactionResult.rows[0] });
    }
  } catch (error) {
    console.error("Error toggling group message reaction:", error);
    res.status(500).json({ error: "Failed to toggle reaction" });
  }
});

// Keep the generic route for backwards compatibility
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

// Mark group messages as read when user enters a group
router.patch("/api/chat/groups/:groupId/mark-read", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    const groupId = parseInt(req.params.groupId);
    
    // Update the user's last_seen_at timestamp for this group
    await db.execute(sql`
      UPDATE chat_group_members 
      SET last_seen_at = NOW()
      WHERE group_id = ${groupId} AND user_id = ${userId}
    `);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking group messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// Block user in direct chat
router.post("/api/chat/direct/:conversationId/block", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    const conversationId = parseInt(req.params.conversationId);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    
    // Get the conversation to find the other user
    const conversation = await db.execute(sql`
      SELECT user1_id, user2_id 
      FROM conversations 
      WHERE id = ${conversationId} 
      AND (user1_id = ${userId} OR user2_id = ${userId})
    `);
    
    if (conversation.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const conv = conversation.rows[0] as any;
    const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
    
    // Create or update blocked user entry
    await db.execute(sql`
      INSERT INTO blocked_users (blocker_id, blocked_id, created_at)
      VALUES (${userId}, ${otherUserId}, NOW())
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
    `);
    
    res.json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

export default router;