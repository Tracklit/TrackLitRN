import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { storage } from "../storage";

// Keep validation aligned with mobile (SettingsScreen/ProfileScreen).
const USERNAME_RE = /^[A-Za-z0-9_]{3,30}$/;

function calculateAge(dateOfBirth: string | Date | null | undefined): number | null {
  if (!dateOfBirth) return null;

  try {
    const birthDate = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    const today = new Date();

    if (Number.isNaN(birthDate.getTime())) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch {
    return null;
  }
}

function isBearerAuth(req: Request): boolean {
  const authHeader = req.headers.authorization;
  return typeof authHeader === "string" && authHeader.startsWith("Bearer ");
}

export async function patchUserHandler(req: Request, res: Response) {
  if (!req.user) return res.sendStatus(401);

  const userId = Number((req.user as any).id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const allowedUpdates = [
      "name",
      "username",
      "email",
      "country",
      "dateOfBirth",
      "defaultClubId",
      "isPrivate",
      "gender",
      "trainingGoal",
      "injuryStatus",
      "sleepHours",
      "sleepQuality",
      "trainingDaysPerWeek",
      "mood",
      "coachMode",
      "specialties",
    ] as const;

    const updates: Record<string, any> = {};

    for (const field of allowedUpdates) {
      if ((req.body as any)?.[field] !== undefined) {
        updates[field] = (req.body as any)[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid updates provided" });
    }

    // Normalize/validate username.
    if (updates.username !== undefined) {
      const normalized = String(updates.username ?? "").trim();
      if (!USERNAME_RE.test(normalized)) {
        return res.status(400).json({
          error: "Username must be 3-30 characters (letters, numbers, underscores).",
        });
      }

      // If changing username, ensure it's not taken by another user.
      const currentUsername = (req.user as any)?.username;
      if (normalized !== currentUsername) {
        const existing = await storage.getUserByUsername(normalized);
        if (existing && existing.id !== userId) {
          return res.status(409).json({ error: "Username already taken" });
        }
      }

      updates.username = normalized;
    }

    // Normalize dateOfBirth (string -> Date | null) and update derived age.
    if (updates.dateOfBirth !== undefined) {
      if (updates.dateOfBirth === "" || updates.dateOfBirth === null) {
        updates.dateOfBirth = null;
        updates.age = null;
      } else if (typeof updates.dateOfBirth === "string") {
        const parsedDate = new Date(updates.dateOfBirth);
        updates.dateOfBirth = Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
        updates.age = calculateAge(updates.dateOfBirth);
      }
    }

    // Normalize isPrivate if it came through as a string.
    if (updates.isPrivate !== undefined && typeof updates.isPrivate === "string") {
      updates.isPrivate = updates.isPrivate === "true";
    }

    // If a default club ID is provided, verify the user is a member of that club.
    if (updates.defaultClubId !== undefined && updates.defaultClubId !== null) {
      const clubId = Number(updates.defaultClubId);
      if (!Number.isFinite(clubId) || clubId <= 0) {
        return res.status(400).json({ error: "Invalid defaultClubId" });
      }

      const clubMember = await storage.getClubMemberByUserAndClub(userId, clubId);
      if (!clubMember) {
        return res.status(400).json({ error: "User is not a member of the specified club" });
      }

      updates.defaultClubId = clubId;
    }

    const updatedUser = await storage.updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password: _pw, ...safeUser } = updatedUser as any;

    // Avoid intermediary caching of identity.
    res.setHeader("Cache-Control", "no-store");

    const bearer = isBearerAuth(req);
    const changedIdentity =
      (updates.username !== undefined && updates.username !== (req.user as any)?.username) ||
      (updates.email !== undefined && updates.email !== (req.user as any)?.email);

    // If the mobile client is using JWT and identity changed, re-issue a token.
    if (bearer && changedIdentity) {
      const secret =
        process.env.JWT_SECRET ||
        process.env.SESSION_SECRET ||
        "track-meet-jwt-secret-key";

      const token = jwt.sign(
        {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
        },
        secret,
        { expiresIn: "30d" },
      );

      return res.json({ ...safeUser, token });
    }

    // Session-based requests should refresh the session user object.
    if (!bearer && typeof (req as any).login === "function") {
      return (req as any).login(updatedUser, (err: any) => {
        if (err) return res.status(500).json({ error: "Error updating session" });
        return res.json(safeUser);
      });
    }

    return res.json(safeUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return res
      .status(500)
      .json({ error: "Error updating user: " + (error?.message || "Unknown error") });
  }
}
