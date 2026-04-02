import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { messageReactions, chatGroups, chatGroupMembers, users } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { uploadToBlob, isBlobStorageAvailable, BlobContainer } from "./azure-storage";

const router = Router();

const tableColumnsCache = new Map<string, Set<string>>();

const getTableColumns = async (tableName: string): Promise<Set<string>> => {
  const cached = tableColumnsCache.get(tableName);
  if (cached) {
    return cached;
  }
  const result = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
  `);
  const columns = new Set<string>(result.rows.map((row: any) => String(row.column_name)));
  tableColumnsCache.set(tableName, columns);
  return columns;
};

const getChatGroupColumns = async (): Promise<Set<string>> =>
  getTableColumns("chat_groups");

const getChatGroupMemberTable = async () => {
  const chatGroupMemberColumns = await getTableColumns("chat_group_members");
  if (chatGroupMemberColumns.size > 0) {
    return { tableName: "chat_group_members", columns: chatGroupMemberColumns };
  }

  const legacyGroupMemberColumns = await getTableColumns("group_members");
  if (legacyGroupMemberColumns.size > 0) {
    return { tableName: "group_members", columns: legacyGroupMemberColumns };
  }

  return { tableName: null, columns: new Set<string>() };
};

const getChatGroupMessageTable = async () => {
  const chatGroupMessageColumns = await getTableColumns("chat_group_messages");
  if (chatGroupMessageColumns.size > 0) {
    return { tableName: "chat_group_messages", columns: chatGroupMessageColumns };
  }

  const legacyMessageColumns = await getTableColumns("messages");
  if (legacyMessageColumns.size > 0) {
    return { tableName: "messages", columns: legacyMessageColumns };
  }

  return { tableName: null, columns: new Set<string>() };
};

type SqlExecutor = {
  execute: typeof db.execute;
  insert: typeof db.insert;
};

const toNumberArray = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const inner = trimmed.startsWith("{") && trimmed.endsWith("}")
      ? trimmed.slice(1, -1)
      : trimmed.startsWith("[") && trimmed.endsWith("]")
        ? trimmed.slice(1, -1)
        : trimmed;

    if (!inner) {
      return [];
    }

    return inner
      .split(",")
      .map((entry) => Number(entry.replace(/"/g, "").trim()))
      .filter((entry) => Number.isFinite(entry));
  }

  return [];
};

const toNullableNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBooleanFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "t" || normalized === "1";
  }
  return false;
};

type CompatibleGroup = {
  row: any;
  createdBy: number | null;
  adminIds: number[];
  memberIds: number[];
  isPrivate: boolean;
  isMember: boolean;
  isOwner: boolean;
};

async function getCompatibleGroup(groupId: number, userId?: number): Promise<CompatibleGroup | null> {
  const groupColumns = await getChatGroupColumns();
  const { tableName: memberTable, columns: memberColumns } = await getChatGroupMemberTable();

  const memberUserIdColumn = memberColumns.has("user_id")
    ? "user_id"
    : memberColumns.has("athlete_id")
      ? "athlete_id"
      : null;

  const createdByColumn = groupColumns.has("creator_id")
    ? "cg.creator_id"
    : groupColumns.has("created_by")
      ? "cg.created_by"
      : null;

  const adminIdsColumn = groupColumns.has("admin_ids") ? "cg.admin_ids" : null;
  const memberIdsColumn = groupColumns.has("member_ids") ? "cg.member_ids" : null;
  const isPrivateColumn = groupColumns.has("is_private")
    ? "cg.is_private"
    : groupColumns.has("is_direct")
      ? "cg.is_direct"
      : null;

  const memberJoin = !memberIdsColumn && memberTable && memberUserIdColumn
    ? sql`
      LEFT JOIN (
        SELECT group_id, array_agg(${sql.raw(memberUserIdColumn)}) as member_ids
        FROM ${sql.raw(memberTable)}
        GROUP BY group_id
      ) members ON members.group_id = cg.id
    `
    : sql``;

  const adminJoin = !adminIdsColumn && memberTable && memberUserIdColumn && memberColumns.has("role")
    ? sql`
      LEFT JOIN (
        SELECT group_id, array_agg(${sql.raw(memberUserIdColumn)}) as admin_ids
        FROM ${sql.raw(memberTable)}
        WHERE role IN ('creator', 'admin')
        GROUP BY group_id
      ) admin_members ON admin_members.group_id = cg.id
    `
    : sql``;

  const result = await db.execute(sql`
    SELECT
      cg.*,
      ${memberIdsColumn
        ? sql.raw(memberIdsColumn)
        : memberTable && memberUserIdColumn
          ? sql.raw("COALESCE(members.member_ids, ARRAY[]::integer[])")
          : sql.raw("ARRAY[]::integer[]")} as compatible_member_ids,
      ${adminIdsColumn
        ? sql.raw(adminIdsColumn)
        : memberTable && memberUserIdColumn && memberColumns.has("role")
          ? sql.raw("COALESCE(admin_members.admin_ids, ARRAY[]::integer[])")
          : sql.raw("ARRAY[]::integer[]")} as compatible_admin_ids,
      ${createdByColumn ? sql.raw(createdByColumn) : sql.raw("NULL")} as compatible_created_by,
      ${isPrivateColumn ? sql.raw(isPrivateColumn) : sql.raw("false")} as compatible_is_private
    FROM chat_groups cg
    ${memberJoin}
    ${adminJoin}
    WHERE cg.id = ${groupId}
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as any;
  const memberIds = toNumberArray(row.compatible_member_ids);
  const adminIds = toNumberArray(row.compatible_admin_ids);
  const createdBy = toNullableNumber(row.compatible_created_by);
  const isPrivate = toBooleanFlag(row.compatible_is_private);
  const normalizedUserId = typeof userId === "number" ? Number(userId) : null;
  const isOwner = normalizedUserId !== null && createdBy === normalizedUserId;
  const isMember = normalizedUserId !== null && (memberIds.includes(normalizedUserId) || isOwner);

  return {
    row,
    createdBy,
    adminIds,
    memberIds,
    isPrivate,
    isMember,
    isOwner,
  };
}

async function insertGroupMembershipCompat(
  groupId: number,
  userId: number,
  role: 'creator' | 'member',
  executor: SqlExecutor = db,
) {
  const { tableName, columns } = await getChatGroupMemberTable();
  if (!tableName) {
    console.warn('[CreateGroup] No group member table found; relying on member_ids array only');
    return;
  }

  const memberUserIdColumn = columns.has("user_id")
    ? "user_id"
    : columns.has("athlete_id")
      ? "athlete_id"
      : null;
  const storedRole = tableName === "group_members" && role === "creator" ? "admin" : role;

  if (!memberUserIdColumn || !columns.has("group_id")) {
    console.warn('[CreateGroup] Member table missing expected columns:', tableName);
    return;
  }

  if (tableName === "chat_group_members") {
    const values: Record<string, unknown> = {
      groupId,
      userId,
    };

    if (columns.has("role")) {
      values.role = storedRole;
    }

    await executor.insert(chatGroupMembers).values(values as any);
    return;
  }

  const insertColumns = [sql.raw("group_id"), sql.raw(memberUserIdColumn)];
  const insertValues = [sql`${groupId}`, sql`${userId}`];

  if (columns.has("role")) {
    insertColumns.push(sql.raw("role"));
    insertValues.push(sql`${storedRole}`);
  }

  if (columns.has("status")) {
    insertColumns.push(sql.raw("status"));
    insertValues.push(sql`${"accepted"}`);
  }

  await executor.execute(sql`
    INSERT INTO ${sql.raw(tableName)} (${sql.join(insertColumns, sql`, `)})
    VALUES (${sql.join(insertValues, sql`, `)})
  `);
}

async function removeGroupMembershipCompat(
  groupId: number,
  userId: number,
  executor: SqlExecutor = db,
) {
  const { tableName, columns } = await getChatGroupMemberTable();
  if (!tableName) {
    return;
  }

  const memberUserIdColumn = columns.has("user_id")
    ? "user_id"
    : columns.has("athlete_id")
      ? "athlete_id"
      : null;

  if (!memberUserIdColumn || !columns.has("group_id")) {
    return;
  }

  await executor.execute(sql`
    DELETE FROM ${sql.raw(tableName)}
    WHERE group_id = ${groupId} AND ${sql.raw(memberUserIdColumn)} = ${userId}
  `);
}

type InsertGroupMessageInput = {
  groupId: number;
  senderId: number;
  text: string;
  senderName?: string | null;
  senderProfileImage?: string | null;
  messageType?: string | null;
  mediaUrl?: string | null;
  replyToId?: number | null;
  setCreatedAtNow?: boolean;
};

async function insertGroupMessageCompat(
  input: InsertGroupMessageInput,
  executor: SqlExecutor = db,
) {
  const { tableName, columns } = await getChatGroupMessageTable();
  if (!tableName || !columns.has("group_id") || !columns.has("sender_id")) {
    return null;
  }

  const textColumn = columns.has("text")
    ? "text"
    : columns.has("content")
      ? "content"
      : null;

  if (!textColumn) {
    return null;
  }

  const insertColumns = [
    sql.raw("group_id"),
    sql.raw("sender_id"),
    sql.raw(textColumn),
  ];
  const insertValues = [
    sql`${input.groupId}`,
    sql`${input.senderId}`,
    sql`${input.text}`,
  ];

  if (columns.has("sender_name") && input.senderName !== undefined) {
    insertColumns.push(sql.raw("sender_name"));
    insertValues.push(sql`${input.senderName}`);
  }

  if (columns.has("sender_profile_image") && input.senderProfileImage !== undefined) {
    insertColumns.push(sql.raw("sender_profile_image"));
    insertValues.push(sql`${input.senderProfileImage}`);
  }

  if (columns.has("message_type") && input.messageType !== undefined) {
    insertColumns.push(sql.raw("message_type"));
    insertValues.push(sql`${input.messageType}`);
  }

  if (columns.has("media_url") && input.mediaUrl !== undefined) {
    insertColumns.push(sql.raw("media_url"));
    insertValues.push(sql`${input.mediaUrl}`);
  }

  if (columns.has("reply_to_id") && input.replyToId !== undefined) {
    insertColumns.push(sql.raw("reply_to_id"));
    insertValues.push(sql`${input.replyToId}`);
  }

  if (columns.has("created_at") && input.setCreatedAtNow) {
    insertColumns.push(sql.raw("created_at"));
    insertValues.push(sql`NOW()`);
  }

  const result = await executor.execute(sql`
    INSERT INTO ${sql.raw(tableName)} (${sql.join(insertColumns, sql`, `)})
    VALUES (${sql.join(insertValues, sql`, `)})
    RETURNING *
  `);

  return result.rows[0] ?? null;
}

async function insertGroupSystemMessageCompat(
  groupId: number,
  senderId: number,
  text: string,
  executor: SqlExecutor = db,
) {
  await insertGroupMessageCompat(
    {
      groupId,
      senderId,
      text,
      senderName: "System",
      messageType: "system",
      setCreatedAtNow: true,
    },
    executor,
  );
}

// Configure multer for image uploads - use memory storage for Azure Blob upload
const upload = multer({ 
  storage: multer.memoryStorage(), // Use memory storage for Azure Blob upload
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (increased for videos)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Helper function to compress and optimize uploaded images (buffer version for Azure)
async function compressAndOptimizeImageBuffer(buffer: Buffer, maxSize: number = 96): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(maxSize, maxSize, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

// Helper function to upload image to Azure Blob Storage
async function uploadChatImage(buffer: Buffer, userId: number, prefix: string, maxSize: number = 96): Promise<string> {
  // Compress image
  const compressedBuffer = await compressAndOptimizeImageBuffer(buffer, maxSize);
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`;
  
  if (isBlobStorageAvailable()) {
    // Upload to Azure Blob Storage
    const url = await uploadToBlob(
      compressedBuffer,
      userId,
      BlobContainer.MESSAGES,
      fileName,
      'image/webp'
    );
    console.log(`✅ Chat image uploaded to Azure: ${url}`);
    return url;
  } else {
    // Fallback to local storage (non-persistent)
    console.warn('⚠️  Azure Blob Storage not available, using local storage');
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, compressedBuffer);
    return `/uploads/${fileName}`;
  }
}

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
  console.log('=== UNREAD COUNTS API CALLED ===');
  console.log('Authenticated:', req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log('Not authenticated, returning 401');
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    console.log('Getting unread counts for user:', userId);
    
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
    
    console.log('Unread counts query result:', unreadCounts.rows);
    
    // Transform to object for easy lookup
    const unreadCountsMap = unreadCounts.rows.reduce((acc: any, row: any) => {
      acc[row.group_id] = Number(row.unread_count);
      return acc;
    }, {});
    
    console.log('Returning unread counts map:', unreadCountsMap);
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
    
    const columns = await getChatGroupColumns();
    const imageColumn = columns.has("image")
      ? "cg.image"
      : columns.has("avatar_url")
        ? "cg.avatar_url"
        : null;
    const imageSelect = imageColumn ? sql.raw(imageColumn) : sql.raw("NULL");

    const createdByColumn = columns.has("creator_id")
      ? "cg.creator_id"
      : columns.has("created_by")
        ? "cg.created_by"
        : null;
    const createdBySelect = createdByColumn ? sql.raw(createdByColumn) : sql.raw("NULL");

    const adminIdsColumn = columns.has("admin_ids") ? "cg.admin_ids" : null;
    const adminIdsSelect = adminIdsColumn ? sql.raw(adminIdsColumn) : sql.raw("ARRAY[]::integer[]");

    const memberIdsColumn = columns.has("member_ids") ? "cg.member_ids" : null;

    const isPrivateColumn = columns.has("is_private")
      ? "cg.is_private"
      : columns.has("is_direct")
        ? "cg.is_direct"
        : null;
    const isPrivateSelect = isPrivateColumn ? sql.raw(isPrivateColumn) : sql.raw("false");
    const hasPrivacyFlag = Boolean(isPrivateColumn);

    const chatGroupMemberColumns = await getTableColumns("chat_group_members");
    const legacyGroupMemberColumns = await getTableColumns("group_members");
    const memberTable =
      chatGroupMemberColumns.size > 0
        ? "chat_group_members"
        : legacyGroupMemberColumns.size > 0
          ? "group_members"
          : null;

    const chatGroupMessageColumns = await getTableColumns("chat_group_messages");
    const legacyMessageColumns = await getTableColumns("messages");
    const messageTable =
      chatGroupMessageColumns.size > 0
        ? "chat_group_messages"
        : legacyMessageColumns.size > 0
          ? "messages"
          : null;
    const messageColumns = messageTable ? await getTableColumns(messageTable) : new Set<string>();
    const messageTextColumn = messageColumns.has("text")
      ? "text"
      : messageColumns.has("content")
        ? "content"
        : null;
    const messageCreatedAtColumn = messageColumns.has("created_at") ? "created_at" : null;

    const memberIdsSource = memberIdsColumn
      ? "cg.member_ids"
      : memberTable
        ? "members.member_ids"
        : "ARRAY[]::integer[]";
    const memberIdsSelect = memberIdsColumn
      ? sql.raw("cg.member_ids")
      : memberTable
        ? sql.raw("COALESCE(members.member_ids, ARRAY[]::integer[])")
        : sql.raw("ARRAY[]::integer[]");

    const memberJoin = memberTable && !memberIdsColumn
      ? sql`
        LEFT JOIN (
          SELECT group_id, array_agg(user_id) as member_ids
          FROM ${sql.raw(memberTable)}
          GROUP BY group_id
        ) members ON members.group_id = cg.id
      `
      : sql``;

    const lastMessageSelect = columns.has("last_message")
      ? sql.raw("cg.last_message")
      : messageTable && messageTextColumn && messageCreatedAtColumn
        ? sql.raw(`(
            SELECT m.${messageTextColumn}
            FROM ${messageTable} m
            WHERE m.group_id = cg.id
            ORDER BY m.${messageCreatedAtColumn} DESC
            LIMIT 1
          )`)
        : sql.raw("NULL");

    const lastMessageAtSelect = columns.has("last_message_at")
      ? sql.raw("cg.last_message_at::text")
      : messageTable && messageCreatedAtColumn
        ? sql.raw(`(
            SELECT m.${messageCreatedAtColumn}::text
            FROM ${messageTable} m
            WHERE m.group_id = cg.id
            ORDER BY m.${messageCreatedAtColumn} DESC
            LIMIT 1
          )`)
        : sql.raw("NULL");

    const messageCountSelect = columns.has("message_count")
      ? sql.raw("COALESCE(cg.message_count, 0)")
      : messageTable
        ? sql.raw(`COALESCE((
            SELECT COUNT(*)::integer
            FROM ${messageTable} m
            WHERE m.group_id = cg.id
          ), 0)`)
        : sql.raw("0");

    const whereClause = hasPrivacyFlag
      ? sql`${userId} = ANY(${sql.raw(memberIdsSource)}) OR ${sql.raw(`${isPrivateColumn} = false`)}`
      : sql`${userId} = ANY(${sql.raw(memberIdsSource)})`;

    // Get chat groups with dynamic compatibility for legacy schema
    const groups = await db.execute(sql`
      SELECT 
        'group' as channel_type,
        cg.id,
        cg.name,
        cg.description,
        ${imageSelect} as image,
        ${createdBySelect} as created_by,
        ${adminIdsSelect} as admin_ids,
        ${memberIdsSelect} as member_ids,
        ${isPrivateSelect} as is_private,
        cg.created_at::text,
        ${lastMessageSelect} as last_message,
        ${lastMessageAtSelect} as last_message_at,
        ${messageCountSelect} as message_count,
        null as other_user_id
      FROM chat_groups cg
      ${memberJoin}
      WHERE ${whereClause}
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
    const creatorId = Number(req.user!.id);
    const creatorUsername: string = (req.user as any).username || '';

    // ── 1. Validate name ───────────────────────────────────────────────────
    const name: string = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const description: string = (req.body.description || '').trim();
    const rawPrivate = req.body.isPrivate;
    const isPrivate: boolean = rawPrivate === true || rawPrivate === 'true';

    console.log('[CreateGroup] creatorId=%d name=%s isPrivate=%s', creatorId, name, isPrivate);

    // ── 2. Parse invited members ────────────────────────────────────────────
    let rawMembers: any[] = [];
    if (req.body.members) {
      try {
        rawMembers = JSON.parse(req.body.members);
        if (!Array.isArray(rawMembers)) rawMembers = [];
      } catch {
        rawMembers = [];
      }
    }

    // ── 3. Handle optional image upload ────────────────────────────────────
    let imageUrl: string | null = null;
    if (req.file) {
      try {
        imageUrl = await uploadChatImage(req.file.buffer, creatorId, 'group', 96);
      } catch (imgErr: any) {
        console.error('[CreateGroup] Image upload failed (non-fatal):', imgErr?.message);
      }
    }

    // ── 4. Resolve invited usernames to DB rows ─────────────────────────────
    interface ResolvedMember { id: number; name: string; username: string }
    const resolvedMembers: ResolvedMember[] = [];
    const seenMemberIds = new Set<number>();

    for (const m of rawMembers) {
      const uname: string = (m.username || '').trim();
      if (!uname || uname === creatorUsername) continue;
      const r = await db.execute(sql`
        SELECT id, name, username FROM users WHERE username = ${uname} LIMIT 1
      `);
      if (r.rows.length > 0) {
        const u = r.rows[0] as any;
        const resolvedId = Number(u.id);
        if (seenMemberIds.has(resolvedId)) continue;
        seenMemberIds.add(resolvedId);
        resolvedMembers.push({
          id: resolvedId,
          name: String(u.name || u.username),
          username: String(u.username),
        });
      }
    }

    // ── 5. Build PostgreSQL integer[] literals ──────────────────────────────
    const allIds: number[] = [creatorId, ...resolvedMembers.map(m => m.id)];
    const adminLit  = `{${creatorId}}`;
    const memberLit = `{${allIds.join(',')}}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log('[CreateGroup] adminLit=%s memberLit=%s', adminLit, memberLit);

    // ── 6. Insert the group using whichever chat_groups columns exist ──────
    const groupColumns = await getChatGroupColumns();
    const groupInsertColumns = [sql.raw("name")];
    const groupInsertValues = [sql`${name}`];

    if (groupColumns.has("description")) {
      groupInsertColumns.push(sql.raw("description"));
      groupInsertValues.push(sql`${description}`);
    }

    if (groupColumns.has("image")) {
      groupInsertColumns.push(sql.raw("image"));
      groupInsertValues.push(sql`${imageUrl}`);
    } else if (groupColumns.has("avatar_url")) {
      groupInsertColumns.push(sql.raw("avatar_url"));
      groupInsertValues.push(sql`${imageUrl}`);
    }

    if (groupColumns.has("creator_id")) {
      groupInsertColumns.push(sql.raw("creator_id"));
      groupInsertValues.push(sql`${creatorId}`);
    } else if (groupColumns.has("created_by")) {
      groupInsertColumns.push(sql.raw("created_by"));
      groupInsertValues.push(sql`${creatorId}`);
    }

    if (groupColumns.has("admin_ids")) {
      groupInsertColumns.push(sql.raw("admin_ids"));
      groupInsertValues.push(sql`${adminLit}::integer[]`);
    }

    if (groupColumns.has("member_ids")) {
      groupInsertColumns.push(sql.raw("member_ids"));
      groupInsertValues.push(sql`${memberLit}::integer[]`);
    }

    if (groupColumns.has("is_private")) {
      groupInsertColumns.push(sql.raw("is_private"));
      groupInsertValues.push(sql`${isPrivate}`);
    } else if (groupColumns.has("is_direct")) {
      // Older schemas used is_direct instead of group privacy. Group chats are never direct.
      groupInsertColumns.push(sql.raw("is_direct"));
      groupInsertValues.push(sql`${false}`);
    }

    if (groupColumns.has("invite_code")) {
      groupInsertColumns.push(sql.raw("invite_code"));
      groupInsertValues.push(sql`${inviteCode}`);
    }

    const group = await db.transaction(async (tx) => {
      const groupRes = await tx.execute(sql`
        INSERT INTO chat_groups (${sql.join(groupInsertColumns, sql`, `)})
        VALUES (${sql.join(groupInsertValues, sql`, `)})
        RETURNING *
      `);

      const createdGroup = groupRes.rows[0] as any;
      if (!createdGroup || !createdGroup.id) {
        throw new Error('INSERT returned no row — check table constraints');
      }

      console.log('[CreateGroup] group.id=%d', createdGroup.id);

      // ── 7. Insert creator into the compatible member table if one exists ───
      await insertGroupMembershipCompat(Number(createdGroup.id), creatorId, 'creator', tx as SqlExecutor);

      // ── 8. Insert invited members and initial system messages atomically ───
      for (const m of resolvedMembers) {
        await insertGroupMembershipCompat(Number(createdGroup.id), m.id, 'member', tx as SqlExecutor);
        await insertGroupSystemMessageCompat(
          Number(createdGroup.id),
          creatorId,
          `${m.name} was added to the group`,
          tx as SqlExecutor,
        );
      }

      return createdGroup;
    });

    res.json(group);
  } catch (err: any) {
    const detail = String(err?.message || err || 'unknown');
    console.error('[CreateGroup] FAILED:', detail);
    console.error('[CreateGroup] Error object:', err);
    console.error('[CreateGroup] Stack:', err?.stack);
    res.status(500).json({ error: 'Failed to create group', details: detail });
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

    const group = await getCompatibleGroup(groupId, Number(userId));
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    if (!group.isMember && group.isPrivate) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    res.json({
      ...group.row,
      member_ids: group.memberIds,
      admin_ids: group.adminIds,
      is_private: group.isPrivate,
      created_by: group.createdBy,
      creator_id: group.createdBy,
    });
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
    console.log('=== PATCH GROUP REQUEST ===');
    console.log('Group ID:', groupId);
    console.log('User ID:', userId);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('All req.body keys:', Object.keys(req.body));
    
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

    // Handle both column name variants (creator_id newer schema, created_by legacy)
    const creatorId = (group as any).creator_id ?? (group as any).created_by;
    const rawAdminIds = (group as any).admin_ids;
    const adminIds: number[] = Array.isArray(rawAdminIds)
      ? rawAdminIds.map(Number)
      : typeof rawAdminIds === 'string'
        ? rawAdminIds.replace(/[{}]/g, '').split(',').filter(Boolean).map(Number)
        : [];
    const isAdmin = Number(creatorId) === Number(userId) || adminIds.includes(Number(userId));

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can update group details" });
    }

    // Detect which optional columns actually exist in this DB
    const groupColumns = await getChatGroupColumns();
    const hasImage = groupColumns.has('image') || groupColumns.has('avatar_url');
    const hasIsPrivate = groupColumns.has('is_private');
    const hasDescription = groupColumns.has('description');
    const imageColumn = groupColumns.has('image') ? 'image' : groupColumns.has('avatar_url') ? 'avatar_url' : null;

    // Handle image upload
    const existingImage = (group as any).image ?? (group as any).avatar_url ?? null;
    let imageUrl: string | null = existingImage;

    if (req.file) {
      try {
        imageUrl = await uploadChatImage(req.file.buffer, Number(userId), 'group', 256);
        console.log('[PATCH group] New image URL:', imageUrl);
      } catch (err) {
        console.error('[PATCH group] Image upload failed, keeping existing:', err);
      }
    }

    // Update each column individually using parameterised queries (only columns that exist)
    const newName = (name !== undefined && name !== null && name !== '') ? name : ((group as any).name ?? '');
    await db.execute(sql`UPDATE chat_groups SET name = ${newName} WHERE id = ${groupId}`);

    if (hasDescription) {
      const newDesc = description !== undefined ? description : ((group as any).description ?? null);
      await db.execute(sql`UPDATE chat_groups SET description = ${newDesc} WHERE id = ${groupId}`);
    }

    if (hasIsPrivate) {
      const finalPrivateValue = privateValue === 'true' || privateValue === true ? true :
                                privateValue === 'false' || privateValue === false ? false :
                                ((group as any).is_private ?? false);
      await db.execute(sql`UPDATE chat_groups SET is_private = ${finalPrivateValue} WHERE id = ${groupId}`);
    }

    if (imageColumn && req.file && imageUrl) {
      if (groupColumns.has('image')) {
        await db.execute(sql`UPDATE chat_groups SET image = ${imageUrl} WHERE id = ${groupId}`);
      } else if (groupColumns.has('avatar_url')) {
        await db.execute(sql`UPDATE chat_groups SET avatar_url = ${imageUrl} WHERE id = ${groupId}`);
      }
      console.log('[PATCH group] Image column updated:', imageColumn, imageUrl);
    }

    const updatedResult = await db.execute(sql`SELECT * FROM chat_groups WHERE id = ${groupId}`);
    console.log('[PATCH group] Updated row:', updatedResult.rows[0]);
    res.json(updatedResult.rows[0]);
  } catch (error: any) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Failed to update group", detail: error?.message ?? String(error) });
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

    const group = await getCompatibleGroup(groupId, Number(userId));
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.isMember) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const { tableName, columns } = await getChatGroupMemberTable();
    if (!tableName) {
      return res.json([]);
    }

    const memberUserIdColumn = columns.has("user_id")
      ? "user_id"
      : columns.has("athlete_id")
        ? "athlete_id"
        : null;

    if (!memberUserIdColumn || !columns.has("group_id")) {
      return res.json([]);
    }

    const roleSelect = columns.has("role") ? sql.raw("cgm.role") : sql.raw("'member'");
    const joinedAtSelect = columns.has("joined_at")
      ? sql.raw("cgm.joined_at")
      : columns.has("created_at")
        ? sql.raw("cgm.created_at")
        : sql.raw("NULL");
    const orderClauses = columns.has("role")
      ? [
          sql.raw("CASE cgm.role WHEN 'creator' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END"),
          columns.has("joined_at")
            ? sql.raw("cgm.joined_at ASC")
            : columns.has("created_at")
              ? sql.raw("cgm.created_at ASC")
              : sql.raw("u.name ASC"),
        ]
      : [
          columns.has("joined_at")
            ? sql.raw("cgm.joined_at ASC")
            : columns.has("created_at")
              ? sql.raw("cgm.created_at ASC")
              : sql.raw("u.name ASC"),
        ];

    const membersResult = await db.execute(sql`
      SELECT 
        ${sql.raw(`cgm.${memberUserIdColumn}`)} as user_id,
        ${roleSelect} as role,
        ${joinedAtSelect} as joined_at,
        u.name,
        u.username,
        u.profile_image_url
      FROM ${sql.raw(tableName)} cgm
      INNER JOIN users u ON ${sql.raw(`cgm.${memberUserIdColumn}`)} = u.id
      WHERE cgm.group_id = ${groupId}
      ORDER BY ${sql.join(orderClauses, sql`, `)}
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
    const targetUserId = Number(req.body.userId);

    if (isNaN(groupId) || !Number.isFinite(targetUserId)) {
      return res.status(400).json({ error: "Invalid group ID or user ID" });
    }

    const group = await getCompatibleGroup(groupId, Number(currentUserId));
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isAdmin = group.isOwner || group.adminIds.includes(Number(currentUserId));

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    if (group.memberIds.includes(targetUserId)) {
      return res.status(400).json({ error: "User is already a member" });
    }

    const addedUserResult = await db.execute(sql`
      SELECT name, username FROM users WHERE id = ${targetUserId}
    `);

    if (addedUserResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const addedUser = addedUserResult.rows[0] as any;
    const groupColumns = await getChatGroupColumns();

    await db.transaction(async (tx) => {
      if (groupColumns.has("member_ids")) {
        await tx.execute(sql`
          UPDATE chat_groups
          SET member_ids = array_append(member_ids, ${targetUserId})
          WHERE id = ${groupId}
        `);
      }

      await insertGroupMembershipCompat(groupId, targetUserId, 'member', tx as SqlExecutor);
      await insertGroupSystemMessageCompat(
        groupId,
        Number(currentUserId),
        `${addedUser.name || addedUser.username} was added to the group`,
        tx as SqlExecutor,
      );
    });

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

    const group = await getCompatibleGroup(groupId, Number(currentUserId));
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isAdmin = group.isOwner || group.adminIds.includes(Number(currentUserId));

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    if (group.createdBy === targetUserId) {
      return res.status(400).json({ error: "Cannot remove group creator" });
    }

    const removedUserResult = await db.execute(sql`
      SELECT name, username FROM users WHERE id = ${targetUserId}
    `);
    const removedUser = removedUserResult.rows[0] as any;
    const groupColumns = await getChatGroupColumns();

    await db.transaction(async (tx) => {
      if (groupColumns.has("member_ids") || groupColumns.has("admin_ids")) {
        const assignments = [];
        if (groupColumns.has("member_ids")) {
          assignments.push(sql`member_ids = array_remove(member_ids, ${targetUserId})`);
        }
        if (groupColumns.has("admin_ids")) {
          assignments.push(sql`admin_ids = array_remove(admin_ids, ${targetUserId})`);
        }
        await tx.execute(sql`
          UPDATE chat_groups
          SET ${sql.join(assignments, sql`, `)}
          WHERE id = ${groupId}
        `);
      }

      await removeGroupMembershipCompat(groupId, targetUserId, tx as SqlExecutor);

      if (removedUser) {
        await insertGroupSystemMessageCompat(
          groupId,
          Number(currentUserId),
          `${removedUser.name || removedUser.username} was removed from the group`,
          tx as SqlExecutor,
        );
      }
    });

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

    const group = await getCompatibleGroup(groupId, Number(userId));
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.isMember && group.isPrivate) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { tableName: messageTable, columns: messageColumns } = await getChatGroupMessageTable();
    if (!messageTable || !messageColumns.has("group_id")) {
      return res.json([]);
    }

    const textColumn = messageColumns.has("text")
      ? "text"
      : messageColumns.has("content")
        ? "content"
        : null;
    const senderIdColumn = messageColumns.has("sender_id") ? "sender_id" : null;

    if (!textColumn || !senderIdColumn) {
      return res.json([]);
    }

    const createdAtSelect = messageColumns.has("created_at") ? sql.raw("cgm.created_at") : sql.raw("NULL");
    const createdAtOrder = messageColumns.has("created_at") ? sql.raw("cgm.created_at ASC") : sql.raw("cgm.id ASC");
    const messageTypeSelect = messageColumns.has("message_type") ? sql.raw("cgm.message_type") : sql.raw("'text'");
    const mediaUrlSelect = messageColumns.has("media_url") ? sql.raw("cgm.media_url") : sql.raw("NULL");
    const replyToIdSelect = messageColumns.has("reply_to_id") ? sql.raw("cgm.reply_to_id") : sql.raw("NULL");
    const isEditedSelect = messageColumns.has("edited_at")
      ? sql.raw("(cgm.edited_at IS NOT NULL)")
      : messageColumns.has("is_edited")
        ? sql.raw("cgm.is_edited")
        : sql.raw("false");
    const editedAtSelect = messageColumns.has("edited_at") ? sql.raw("cgm.edited_at") : sql.raw("NULL");
    const senderNameSelect = messageColumns.has("sender_name")
      ? sql.raw("COALESCE(cgm.sender_name, u.name)")
      : sql.raw("u.name");
    const senderProfileImageSelect = messageColumns.has("sender_profile_image")
      ? sql.raw("COALESCE(cgm.sender_profile_image, u.profile_image_url)")
      : sql.raw("u.profile_image_url");
    const hasReplyTo = messageColumns.has("reply_to_id");

    const messages = await db.execute(sql`
      SELECT 
        cgm.id,
        cgm.group_id,
        ${sql.raw(`cgm.${senderIdColumn}`)} as user_id,
        ${sql.raw(`cgm.${textColumn}`)} as text,
        ${createdAtSelect} as created_at,
        ${messageTypeSelect} as message_type,
        ${mediaUrlSelect} as media_url,
        ${replyToIdSelect} as reply_to_id,
        ${isEditedSelect} as is_edited,
        ${editedAtSelect} as edited_at,
        ${senderNameSelect} as name,
        u.username,
        ${senderProfileImageSelect} as profile_image_url,
        ${hasReplyTo ? sql.raw(`reply_msg.${textColumn}`) : sql.raw("NULL")} as reply_to_text,
        ${hasReplyTo && messageColumns.has("message_type") ? sql.raw("reply_msg.message_type") : sql.raw("NULL")} as reply_to_message_type,
        ${hasReplyTo && messageColumns.has("sender_name")
          ? sql.raw("COALESCE(reply_msg.sender_name, reply_user.name)")
          : hasReplyTo
            ? sql.raw("reply_user.name")
            : sql.raw("NULL")} as reply_to_user_name,
        ${hasReplyTo ? sql.raw(`reply_msg.${senderIdColumn}`) : sql.raw("NULL")} as reply_to_user_id
      FROM ${sql.raw(messageTable)} cgm
      LEFT JOIN users u ON ${sql.raw(`cgm.${senderIdColumn}`)} = u.id
      ${hasReplyTo ? sql`LEFT JOIN ${sql.raw(messageTable)} reply_msg ON cgm.reply_to_id = reply_msg.id` : sql``}
      ${hasReplyTo ? sql`LEFT JOIN users reply_user ON ${sql.raw(`reply_msg.${senderIdColumn}`)} = reply_user.id` : sql``}
      WHERE cgm.group_id = ${groupId}
      ORDER BY ${createdAtOrder}
      LIMIT ${limit} OFFSET ${offset}
    `);

    // Get reactions for all messages
    const messageIds = messages.rows.map((msg: any) => msg.id);
    let reactionsData: any[] = [];
    
    if (messageIds.length > 0) {
      try {
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
      } catch (reactionError) {
        console.error("Error fetching group message reactions:", reactionError);
      }
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
router.post("/api/chat/groups/:groupId/messages", upload.single('media'), async (req: Request, res: Response) => {
  console.log('=== GROUP MESSAGE ROUTE HIT ===');
  console.log('Request authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  
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
      return res.status(400).json({ error: "Message text or media is required" });
    }

    const group = await getCompatibleGroup(groupId, Number(userId));
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.isMember && group.isPrivate) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get user info for the message
    const userResult = await db.execute(sql`
      SELECT name, profile_image_url FROM users WHERE id = ${userId}
    `);
    const user = userResult.rows[0];

    // Determine message type and media URL with compression and Azure Blob Storage
    let finalMessageType = "text";
    let mediaUrl = null;
    const messageText = text?.trim() || "";
    
    if (file) {
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');
      
      if (isVideo) {
        finalMessageType = "video";
        // Upload video to Azure Blob Storage
        try {
          const fileName = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
          if (isBlobStorageAvailable()) {
            mediaUrl = await uploadToBlob(
              file.buffer,
              userId,
              BlobContainer.MESSAGES,
              fileName,
              file.mimetype
            );
            console.log(`✅ Video uploaded to Azure: ${mediaUrl}`);
          } else {
            // Fallback to local storage
            const uploadDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);
            mediaUrl = `/uploads/${fileName}`;
          }
        } catch (error) {
          console.error('Error uploading video:', error);
          return res.status(500).json({ error: "Failed to upload video" });
        }
      } else if (isImage) {
        finalMessageType = "image";
        try {
          mediaUrl = await uploadChatImage(file.buffer, userId, 'message', 800); // Larger for message images
        } catch (error) {
          console.error('Error uploading message image:', error);
          return res.status(500).json({ error: "Failed to upload image" });
        }
      }
    }

    console.log('About to insert message:', { groupId, userId, messageText, finalMessageType, mediaUrl });

    const message = await insertGroupMessageCompat({
      groupId,
      senderId: Number(userId),
      text: messageText,
      senderName: user?.name || 'Unknown',
      senderProfileImage: user?.profile_image_url || null,
      messageType: finalMessageType,
      mediaUrl: mediaUrl ?? null,
      replyToId: replyToId ? Number(replyToId) : null,
      setCreatedAtNow: true,
    });

    if (!message) {
      throw new Error("Compatible message insert failed");
    }

    const lastMessageText = text?.trim() || (file ? "📷 Photo" : "");
    const groupColumns = await getChatGroupColumns();
    const groupAssignments = [];

    if (groupColumns.has("last_message")) {
      groupAssignments.push(sql`last_message = ${lastMessageText}`);
    }
    if (groupColumns.has("last_message_at")) {
      groupAssignments.push(sql`last_message_at = NOW()`);
    }
    if (groupColumns.has("message_count")) {
      groupAssignments.push(sql`message_count = COALESCE(message_count, 0) + 1`);
    }

    if (groupAssignments.length > 0) {
      await db.execute(sql`
        UPDATE chat_groups
        SET ${sql.join(groupAssignments, sql`, `)}
        WHERE id = ${groupId}
      `);
    }

    res.json(message);
  } catch (error) {
    console.error("Error sending group message:", error);
    console.error("Error details:", error.message, error.stack);
    res.status(500).json({ error: "Failed to send message", details: error.message });
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
