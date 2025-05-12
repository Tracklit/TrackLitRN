import { 
  User, 
  InsertUser, 
  Meet, 
  InsertMeet,
  Result,
  InsertResult,
  Reminder,
  InsertReminder,
  Coach,
  InsertCoach,
  AthleteGroup,
  InsertAthleteGroup,
  GroupMember,
  InsertGroupMember,
  CoachNote,
  InsertCoachNote,
  users,
  meets,
  results,
  reminders,
  coaches,
  athleteGroups,
  groupMembers,
  coachNotes,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, lt, gte, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  // Meet operations
  getMeet(id: number): Promise<Meet | undefined>;
  getMeetsByUserId(userId: number): Promise<Meet[]>;
  getUpcomingMeetsByUserId(userId: number): Promise<Meet[]>;
  getPastMeetsByUserId(userId: number): Promise<Meet[]>;
  createMeet(meet: InsertMeet): Promise<Meet>;
  updateMeet(id: number, meetData: Partial<Meet>): Promise<Meet | undefined>;
  deleteMeet(id: number): Promise<boolean>;

  // Result operations
  getResult(id: number): Promise<Result | undefined>;
  getResultsByUserId(userId: number): Promise<Result[]>;
  getResultsByMeetId(meetId: number): Promise<Result[]>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined>;
  deleteResult(id: number): Promise<boolean>;

  // Reminder operations
  getReminder(id: number): Promise<Reminder | undefined>;
  getRemindersByUserId(userId: number): Promise<Reminder[]>;
  getRemindersByMeetId(meetId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminderData: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;

  // Coach operations
  getCoach(id: number): Promise<Coach | undefined>;
  getCoachesByUserId(userId: number): Promise<Coach[]>;
  getAthletesByCoachId(coachId: number): Promise<User[]>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: number, coachData: Partial<Coach>): Promise<Coach | undefined>;
  deleteCoach(id: number): Promise<boolean>;
  
  // Athlete Group operations
  getAthleteGroup(id: number): Promise<AthleteGroup | undefined>;
  getAthleteGroupsByCoachId(coachId: number): Promise<AthleteGroup[]>;
  createAthleteGroup(group: InsertAthleteGroup): Promise<AthleteGroup>;
  updateAthleteGroup(id: number, groupData: Partial<AthleteGroup>): Promise<AthleteGroup | undefined>;
  deleteAthleteGroup(id: number): Promise<boolean>;
  
  // Group Member operations
  getGroupMember(id: number): Promise<GroupMember | undefined>;
  getGroupMembersByGroupId(groupId: number): Promise<GroupMember[]>;
  getGroupMembersByAthleteId(athleteId: number): Promise<GroupMember[]>;
  createGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  deleteGroupMember(id: number): Promise<boolean>;
  
  // Coach Note operations
  getCoachNote(id: number): Promise<CoachNote | undefined>;
  getCoachNotesByCoachId(coachId: number): Promise<CoachNote[]>;
  getCoachNotesByAthleteId(athleteId: number, includePrivate?: boolean): Promise<CoachNote[]>;
  getCoachNotesByMeetId(meetId: number): Promise<CoachNote[]>;
  getCoachNotesByResultId(resultId: number): Promise<CoachNote[]>;
  createCoachNote(note: InsertCoachNote): Promise<CoachNote>;
  updateCoachNote(id: number, noteData: Partial<CoachNote>): Promise<CoachNote | undefined>;
  deleteCoachNote(id: number): Promise<boolean>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Meet operations
  async getMeet(id: number): Promise<Meet | undefined> {
    const [meet] = await db.select().from(meets).where(eq(meets.id, id));
    return meet;
  }

  async getMeetsByUserId(userId: number): Promise<Meet[]> {
    return db.select().from(meets).where(eq(meets.userId, userId));
  }

  async getUpcomingMeetsByUserId(userId: number): Promise<Meet[]> {
    const now = new Date();
    return db
      .select()
      .from(meets)
      .where(and(eq(meets.userId, userId), gte(meets.date, now)))
      .orderBy(meets.date);
  }

  async getPastMeetsByUserId(userId: number): Promise<Meet[]> {
    const now = new Date();
    return db
      .select()
      .from(meets)
      .where(and(eq(meets.userId, userId), lt(meets.date, now)))
      .orderBy(desc(meets.date));
  }

  async createMeet(insertMeet: InsertMeet): Promise<Meet> {
    const [meet] = await db.insert(meets).values(insertMeet).returning();
    return meet;
  }

  async updateMeet(id: number, meetData: Partial<Meet>): Promise<Meet | undefined> {
    const [meet] = await db
      .update(meets)
      .set(meetData)
      .where(eq(meets.id, id))
      .returning();
    return meet;
  }

  async deleteMeet(id: number): Promise<boolean> {
    const result = await db.delete(meets).where(eq(meets.id, id));
    return !!result;
  }

  // Result operations
  async getResult(id: number): Promise<Result | undefined> {
    const [result] = await db.select().from(results).where(eq(results.id, id));
    return result;
  }

  async getResultsByUserId(userId: number): Promise<Result[]> {
    return db.select().from(results).where(eq(results.userId, userId));
  }

  async getResultsByMeetId(meetId: number): Promise<Result[]> {
    return db.select().from(results).where(eq(results.meetId, meetId));
  }

  async createResult(insertResult: InsertResult): Promise<Result> {
    const [result] = await db.insert(results).values(insertResult).returning();
    return result;
  }

  async updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined> {
    const [result] = await db
      .update(results)
      .set(resultData)
      .where(eq(results.id, id))
      .returning();
    return result;
  }

  async deleteResult(id: number): Promise<boolean> {
    const result = await db.delete(results).where(eq(results.id, id));
    return !!result;
  }

  // Reminder operations
  async getReminder(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder;
  }

  async getRemindersByUserId(userId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.userId, userId));
  }

  async getRemindersByMeetId(meetId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.meetId, meetId));
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(insertReminder).returning();
    return reminder;
  }

  async updateReminder(id: number, reminderData: Partial<Reminder>): Promise<Reminder | undefined> {
    const [reminder] = await db
      .update(reminders)
      .set(reminderData)
      .where(eq(reminders.id, id))
      .returning();
    return reminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const result = await db.delete(reminders).where(eq(reminders.id, id));
    return !!result;
  }

  // Coach operations
  async getCoach(id: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach;
  }

  async getCoachesByUserId(userId: number): Promise<Coach[]> {
    return db.select().from(coaches).where(eq(coaches.userId, userId));
  }

  async getAthletesByCoachId(coachId: number): Promise<User[]> {
    const coachRelations = await db
      .select()
      .from(coaches)
      .where(and(eq(coaches.userId, coachId), eq(coaches.status, 'accepted')));
    
    const athleteIds = coachRelations.map(relation => relation.athleteId);
    
    if (!athleteIds.length) return [];
    
    return db
      .select()
      .from(users)
      .where(
        eq(users.id, athleteIds[0])
      );
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const [coach] = await db.insert(coaches).values(insertCoach).returning();
    return coach;
  }

  async updateCoach(id: number, coachData: Partial<Coach>): Promise<Coach | undefined> {
    const [coach] = await db
      .update(coaches)
      .set(coachData)
      .where(eq(coaches.id, id))
      .returning();
    return coach;
  }

  async deleteCoach(id: number): Promise<boolean> {
    const result = await db.delete(coaches).where(eq(coaches.id, id));
    return !!result;
  }

  // Athlete Group operations
  async getAthleteGroup(id: number): Promise<AthleteGroup | undefined> {
    const [group] = await db.select().from(athleteGroups).where(eq(athleteGroups.id, id));
    return group;
  }

  async getAthleteGroupsByCoachId(coachId: number): Promise<AthleteGroup[]> {
    return db.select().from(athleteGroups).where(eq(athleteGroups.coachId, coachId));
  }

  async createAthleteGroup(insertGroup: InsertAthleteGroup): Promise<AthleteGroup> {
    const [group] = await db.insert(athleteGroups).values(insertGroup).returning();
    return group;
  }

  async updateAthleteGroup(id: number, groupData: Partial<AthleteGroup>): Promise<AthleteGroup | undefined> {
    const [group] = await db
      .update(athleteGroups)
      .set(groupData)
      .where(eq(athleteGroups.id, id))
      .returning();
    return group;
  }

  async deleteAthleteGroup(id: number): Promise<boolean> {
    const result = await db.delete(athleteGroups).where(eq(athleteGroups.id, id));
    return !!result;
  }

  // Group Member operations
  async getGroupMember(id: number): Promise<GroupMember | undefined> {
    const [member] = await db.select().from(groupMembers).where(eq(groupMembers.id, id));
    return member;
  }

  async getGroupMembersByGroupId(groupId: number): Promise<GroupMember[]> {
    return db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async getGroupMembersByAthleteId(athleteId: number): Promise<GroupMember[]> {
    return db.select().from(groupMembers).where(eq(groupMembers.athleteId, athleteId));
  }

  async createGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db.insert(groupMembers).values(insertMember).returning();
    return member;
  }

  async deleteGroupMember(id: number): Promise<boolean> {
    const result = await db.delete(groupMembers).where(eq(groupMembers.id, id));
    return !!result;
  }

  // Coach Note operations
  async getCoachNote(id: number): Promise<CoachNote | undefined> {
    const [note] = await db.select().from(coachNotes).where(eq(coachNotes.id, id));
    return note;
  }

  async getCoachNotesByCoachId(coachId: number): Promise<CoachNote[]> {
    return db.select().from(coachNotes).where(eq(coachNotes.coachId, coachId));
  }

  async getCoachNotesByAthleteId(athleteId: number, includePrivate: boolean = false): Promise<CoachNote[]> {
    if (includePrivate) {
      return db
        .select()
        .from(coachNotes)
        .where(eq(coachNotes.athleteId, athleteId));
    } else {
      return db
        .select()
        .from(coachNotes)
        .where(
          and(
            eq(coachNotes.athleteId, athleteId),
            eq(coachNotes.isPrivate, false)
          )
        );
    }
  }

  async getCoachNotesByMeetId(meetId: number): Promise<CoachNote[]> {
    return db
      .select()
      .from(coachNotes)
      .where(eq(coachNotes.meetId, meetId));
  }

  async getCoachNotesByResultId(resultId: number): Promise<CoachNote[]> {
    return db
      .select()
      .from(coachNotes)
      .where(eq(coachNotes.resultId, resultId));
  }

  async createCoachNote(insertNote: InsertCoachNote): Promise<CoachNote> {
    const [note] = await db.insert(coachNotes).values(insertNote).returning();
    return note;
  }

  async updateCoachNote(id: number, noteData: Partial<CoachNote>): Promise<CoachNote | undefined> {
    const [note] = await db
      .update(coachNotes)
      .set(noteData)
      .where(eq(coachNotes.id, id))
      .returning();
    return note;
  }

  async deleteCoachNote(id: number): Promise<boolean> {
    const result = await db.delete(coachNotes).where(eq(coachNotes.id, id));
    return !!result;
  }
}

export const storage = new DatabaseStorage();