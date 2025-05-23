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
  AthleteGroupMember,
  GroupMember,
  InsertGroupMember,
  CoachNote,
  InsertCoachNote,
  PracticeMedia,
  InsertPracticeMedia,
  Club,
  InsertClub,
  ClubMember,
  InsertClubMember,
  Group,
  InsertGroup,
  ChatGroupMember,
  InsertChatGroupMember,
  GroupMessage,
  InsertGroupMessage,
  ProgramAssignment,
  InsertProgramAssignment,
  ClubMessage,
  InsertClubMessage,
  Achievement,
  InsertAchievement,
  UserAchievement,
  InsertUserAchievement,
  LoginStreak,
  InsertLoginStreak,
  SpikeTransaction,
  InsertSpikeTransaction,
  Referral,
  InsertReferral,
  TrainingProgram,
  InsertTrainingProgram,
  ProgramSession,
  InsertProgramSession,
  ProgramPurchase,
  InsertProgramPurchase,
  ProgramProgress,
  InsertProgramProgress,
  WorkoutLibrary,
  InsertWorkoutLibrary,
  WorkoutSessionPreview,
  InsertWorkoutSessionPreview,
  users,
  meets,
  results,
  reminders,
  coaches,
  athleteGroups,
  athleteGroupMembers,
  coachNotes,
  practiceMedia,
  practiceCompletions,
  clubs,
  clubMembers,
  groups,
  chatGroupMembers,
  groupMessages,
  clubMessages,
  achievements,
  userAchievements,
  loginStreaks,
  spikeTransactions,
  referrals,
  workoutLibrary,
  workoutSessionPreview,
  trainingPrograms,
  programSessions,
  programPurchases,
  programProgress,
  programAssignments
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, lt, gte, desc, asc, inArray, or, isNotNull, isNull } from "drizzle-orm";
import { AthleteProfile, InsertAthleteProfile, athleteProfiles } from "@shared/athlete-profile-schema";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Athlete Profile operations
  getAthleteProfile(userId: number): Promise<AthleteProfile | undefined>;
  createAthleteProfile(profile: InsertAthleteProfile): Promise<AthleteProfile>;
  updateAthleteProfile(userId: number, profileData: Partial<AthleteProfile>): Promise<AthleteProfile | undefined>;
  
  // Club operations
  getClub(id: number): Promise<Club | undefined>;
  getClubByInviteCode(inviteCode: string): Promise<Club | undefined>;
  getClubs(): Promise<Club[]>;
  getUserClubs(userId: number): Promise<Club[]>;
  createClub(club: InsertClub): Promise<Club>;
  updateClub(id: number, clubData: Partial<Club>): Promise<Club | undefined>;
  deleteClub(id: number): Promise<boolean>;
  getClubMemberByUserAndClub(userId: number, clubId: number): Promise<ClubMember | undefined>;
  getClubMember(id: number): Promise<ClubMember | undefined>;
  getClubMembersByClubId(clubId: number): Promise<(ClubMember & { username: string })[]>;
  getPendingClubMembers(clubId: number): Promise<(ClubMember & { username: string })[]>;
  createClubMember(member: InsertClubMember): Promise<ClubMember>;
  updateClubMember(id: number, memberData: Partial<ClubMember>): Promise<ClubMember | undefined>;
  deleteClubMember(id: number): Promise<boolean>;
  
  // Group operations
  getGroup(id: number): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: number): Promise<boolean>;
  getGroupMembers(groupId: number): Promise<ChatGroupMember[]>;
  getGroupMemberByUserAndGroup(userId: number, groupId: number): Promise<ChatGroupMember | undefined>;
  createChatGroupMember(member: InsertChatGroupMember): Promise<ChatGroupMember>;
  deleteChatGroupMember(id: number): Promise<boolean>;
  getGroupMessages(groupId: number): Promise<GroupMessage[]>;
  createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  
  // Club Message operations
  getClubMessages(clubId: number): Promise<(ClubMessage & { username: string })[]>;
  createClubMessage(message: InsertClubMessage): Promise<ClubMessage & { username: string }>;

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
  
  // Group Member operations (Athlete Group Members)
  getGroupMember(id: number): Promise<GroupMember | undefined>;
  getGroupMembersByGroupId(groupId: number): Promise<GroupMember[]>;
  getGroupMembersByAthleteId(athleteId: number): Promise<GroupMember[]>;
  createAthleteGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  deleteAthleteGroupMember(id: number): Promise<boolean>;
  
  // Coach Note operations
  getCoachNote(id: number): Promise<CoachNote | undefined>;
  getCoachNotesByCoachId(coachId: number): Promise<CoachNote[]>;
  getCoachNotesByAthleteId(athleteId: number, includePrivate?: boolean): Promise<CoachNote[]>;
  getCoachNotesByMeetId(meetId: number): Promise<CoachNote[]>;
  getCoachNotesByResultId(resultId: number): Promise<CoachNote[]>;
  createCoachNote(note: InsertCoachNote): Promise<CoachNote>;
  updateCoachNote(id: number, noteData: Partial<CoachNote>): Promise<CoachNote | undefined>;
  deleteCoachNote(id: number): Promise<boolean>;
  
  // Practice Media operations
  getPracticeMedia(id: number): Promise<PracticeMedia | undefined>;
  getPracticeMediaByCompletionId(completionId: number): Promise<PracticeMedia[]>;
  createPracticeMedia(media: InsertPracticeMedia): Promise<PracticeMedia>;
  deletePracticeMedia(id: number): Promise<boolean>;
  
  // Workout Library
  getWorkoutPreviews(userId: number): Promise<any[]>;
  getSavedWorkouts(userId: number): Promise<any[]>;
  
  // Programs
  // Training Programs - User's own programs
  getUserPrograms(userId: number): Promise<TrainingProgram[]>;
  getProgram(id: number): Promise<TrainingProgram | undefined>;
  getProgramsFromSheets(): Promise<TrainingProgram[]>;
  createProgram(program: InsertTrainingProgram): Promise<TrainingProgram>;
  updateProgram(id: number, data: Partial<TrainingProgram>): Promise<TrainingProgram | undefined>;
  deleteProgram(id: number): Promise<boolean>;
  
  // Program sessions
  getProgramSessions(programId: number): Promise<ProgramSession[]>;
  createProgramSession(session: InsertProgramSession): Promise<ProgramSession>;
  updateProgramSession(id: number, data: Partial<ProgramSession>): Promise<ProgramSession | undefined>;
  deleteProgramSession(id: number): Promise<boolean>;
  createProgramSessionBatch(sessions: InsertProgramSession[]): Promise<ProgramSession[]>;
  
  // Purchased Programs
  getUserPurchasedPrograms(userId: number): Promise<(ProgramPurchase & { program: TrainingProgram, creator: { username: string } })[]>;
  getPurchasedProgram(userId: number, programId: number): Promise<ProgramPurchase | undefined>;
  purchaseProgram(purchase: InsertProgramPurchase): Promise<ProgramPurchase>;
  
  // Program Assignments
  createProgramAssignment(assignment: InsertProgramAssignment): Promise<ProgramAssignment>;
  getProgramAssignment(programId: number, assigneeId: number): Promise<ProgramAssignment | undefined>;
  getProgramAssignees(programId: number): Promise<ProgramAssignment[]>;
  getAssignedPrograms(userId: number): Promise<ProgramAssignment[]>;
  updateProgramAssignment(id: number, updates: Partial<ProgramAssignment>): Promise<ProgramAssignment>;
  getCoachableUsers(coachId: number): Promise<User[]>;
  
  // Program Progress
  getProgramProgress(userId: number, programId: number): Promise<ProgramProgress[]>;
  getSessionProgress(userId: number, sessionId: number): Promise<ProgramProgress | undefined>;
  recordProgramProgress(progress: InsertProgramProgress): Promise<ProgramProgress>;
  
  // Session store
  sessionStore: session.Store;

  // Achievement operations
  getAchievement(id: number): Promise<Achievement | undefined>;
  getAchievements(): Promise<Achievement[]>;
  getAchievementsByCategory(category: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, achievementData: Partial<Achievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: number): Promise<boolean>;

  // User Achievement operations
  getUserAchievement(id: number): Promise<UserAchievement | undefined>;
  getUserAchievementsByUserId(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  getUserAchievementByUserAndAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: number, userAchievementData: Partial<UserAchievement>): Promise<UserAchievement | undefined>;
  completeUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined>;
  
  // Login Streak operations
  getLoginStreakByUserId(userId: number): Promise<LoginStreak | undefined>;
  createOrUpdateLoginStreak(userId: number): Promise<LoginStreak>;
  
  // Spike Transaction operations
  getSpikeTransactions(userId: number): Promise<SpikeTransaction[]>;
  createSpikeTransaction(transaction: InsertSpikeTransaction): Promise<SpikeTransaction>;
  addSpikesToUser(userId: number, amount: number, source: string, sourceId?: number, description?: string): Promise<{ transaction: SpikeTransaction, user: User }>;
  deductSpikesFromUser(userId: number, amount: number, source: string, sourceId?: number, description?: string): Promise<{ transaction: SpikeTransaction, user: User } | undefined>;
  
  // Referral operations
  getReferral(id: number): Promise<Referral | undefined>;
  getReferralByCode(referralCode: string): Promise<Referral | undefined>;
  getUserReferrals(userId: number): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  completeReferral(id: number): Promise<Referral | undefined>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }
  
  // Athlete Profile operations
  async getAthleteProfile(userId: number): Promise<AthleteProfile | undefined> {
    const [profile] = await db.select().from(athleteProfiles).where(eq(athleteProfiles.userId, userId));
    return profile;
  }

  async createAthleteProfile(profile: InsertAthleteProfile): Promise<AthleteProfile> {
    const [newProfile] = await db.insert(athleteProfiles).values(profile).returning();
    return newProfile;
  }

  async updateAthleteProfile(userId: number, profileData: Partial<AthleteProfile>): Promise<AthleteProfile | undefined> {
    // Check if profile exists
    const existingProfile = await this.getAthleteProfile(userId);
    
    if (existingProfile) {
      // Update existing profile
      const [profile] = await db
        .update(athleteProfiles)
        .set({
          ...profileData,
          updatedAt: new Date()
        })
        .where(eq(athleteProfiles.userId, userId))
        .returning();
      return profile;
    } else {
      // Create new profile if one doesn't exist
      return this.createAthleteProfile({
        userId,
        ...profileData as InsertAthleteProfile
      });
    }
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
    const [member] = await db.select().from(athleteGroupMembers).where(eq(athleteGroupMembers.id, id));
    return member;
  }

  async getGroupMembersByGroupId(groupId: number): Promise<GroupMember[]> {
    return db.select().from(athleteGroupMembers).where(eq(athleteGroupMembers.groupId, groupId));
  }

  async getGroupMembersByAthleteId(athleteId: number): Promise<GroupMember[]> {
    return db.select().from(athleteGroupMembers).where(eq(athleteGroupMembers.athleteId, athleteId));
  }

  // This method is used for athlete group members (coach-focused functionality)
  async createAthleteGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await db.insert(athleteGroupMembers).values(insertMember).returning();
    return member;
  }

  async deleteAthleteGroupMember(id: number): Promise<boolean> {
    const result = await db.delete(athleteGroupMembers).where(eq(athleteGroupMembers.id, id));
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

  // Practice Media operations
  async getPracticeMedia(id: number): Promise<PracticeMedia | undefined> {
    const [media] = await db.select().from(practiceMedia).where(eq(practiceMedia.id, id));
    return media;
  }

  async getPracticeMediaByCompletionId(completionId: number): Promise<PracticeMedia[]> {
    return await db.select()
      .from(practiceMedia)
      .where(eq(practiceMedia.completionId, completionId))
      .orderBy(desc(practiceMedia.createdAt));
  }

  async createPracticeMedia(media: InsertPracticeMedia): Promise<PracticeMedia> {
    const [result] = await db.insert(practiceMedia).values(media).returning();
    return result;
  }

  async deletePracticeMedia(id: number): Promise<boolean> {
    const result = await db.delete(practiceMedia).where(eq(practiceMedia.id, id));
    return !!result;
  }

  // Club operations
  async getClub(id: number): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.id, id));
    return club;
  }
  
  async getClubByInviteCode(inviteCode: string): Promise<Club | undefined> {
    const [club] = await db.select().from(clubs).where(eq(clubs.inviteCode, inviteCode));
    return club;
  }
  
  async getClubs(): Promise<Club[]> {
    return db.select().from(clubs);
  }
  
  async getUserClubs(userId: number): Promise<Club[]> {
    // Get clubs where user is a member
    const memberships = await db
      .select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.userId, userId),
        isNotNull(clubMembers.joinedAt)
      )); // Use joinedAt instead of status
    
    if (memberships.length === 0) {
      return [];
    }
    
    const clubIds = memberships.map((m: { clubId: number }) => m.clubId);
    return db
      .select()
      .from(clubs)
      .where(inArray(clubs.id, clubIds));
  }
  
  async createClub(clubData: InsertClub): Promise<Club> {
    const [club] = await db
      .insert(clubs)
      .values(clubData)
      .returning();
    
    // Auto-add creator as admin member
    await db
      .insert(clubMembers)
      .values({
        clubId: club.id,
        userId: club.ownerId,
        role: 'admin' as const,
        joinedAt: new Date() // Use joined_at instead of status
      });
    
    return club;
  }
  
  async updateClub(id: number, clubData: Partial<Club>): Promise<Club | undefined> {
    const [club] = await db
      .update(clubs)
      .set(clubData)
      .where(eq(clubs.id, id))
      .returning();
    return club;
  }
  
  async deleteClub(id: number): Promise<boolean> {
    // Delete all members first
    await db
      .delete(clubMembers)
      .where(eq(clubMembers.clubId, id));
    
    // Delete all groups in this club
    const clubGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.clubId, id));
    
    for (const group of clubGroups) {
      await this.deleteGroup(group.id);
    }
    
    // Delete the club
    const result = await db
      .delete(clubs)
      .where(eq(clubs.id, id));
    return !!result;
  }
  
  async getClubMemberByUserAndClub(userId: number, clubId: number): Promise<ClubMember | undefined> {
    const [member] = await db
      .select()
      .from(clubMembers)
      .where(and(
        eq(clubMembers.userId, userId),
        eq(clubMembers.clubId, clubId)
      ));
    return member;
  }
  
  async createClubMember(member: InsertClubMember): Promise<ClubMember> {
    const [newMember] = await db
      .insert(clubMembers)
      .values(member)
      .returning();
    return newMember;
  }
  
  async getClubMember(id: number): Promise<ClubMember | undefined> {
    const [member] = await db
      .select()
      .from(clubMembers)
      .where(eq(clubMembers.id, id));
    return member;
  }
  
  async getClubMembersByClubId(clubId: number): Promise<(ClubMember & { username: string })[]> {
    return db
      .select({
        id: clubMembers.id,
        userId: clubMembers.userId,
        clubId: clubMembers.clubId,
        role: clubMembers.role,
        joinedAt: clubMembers.joinedAt,
        createdAt: clubMembers.createdAt,
        username: users.username,
      })
      .from(clubMembers)
      .innerJoin(users, eq(clubMembers.userId, users.id))
      .where(eq(clubMembers.clubId, clubId));
  }
  
  async getPendingClubMembers(clubId: number): Promise<(ClubMember & { username: string })[]> {
    return db
      .select({
        id: clubMembers.id,
        userId: clubMembers.userId,
        clubId: clubMembers.clubId,
        role: clubMembers.role,
        joinedAt: clubMembers.joinedAt,
        createdAt: clubMembers.createdAt,
        username: users.username,
      })
      .from(clubMembers)
      .innerJoin(users, eq(clubMembers.userId, users.id))
      .where(and(
        eq(clubMembers.clubId, clubId),
        isNull(clubMembers.joinedAt)  // Pending members have null joinedAt
      ));
  }
  
  async updateClubMember(id: number, memberData: Partial<ClubMember>): Promise<ClubMember | undefined> {
    const [updatedMember] = await db
      .update(clubMembers)
      .set(memberData)
      .where(eq(clubMembers.id, id))
      .returning();
    return updatedMember;
  }
  
  async deleteClubMember(id: number): Promise<boolean> {
    const result = await db
      .delete(clubMembers)
      .where(eq(clubMembers.id, id));
    return !!result;
  }
  
  // Group operations
  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }
  
  async getUserGroups(userId: number): Promise<Group[]> {
    try {
      // First get groups where user is an accepted member
      let memberGroups: Group[] = [];
      
      try {
        const memberships = await db
          .select({
            groupId: chatGroupMembers.groupId,
          })
          .from(chatGroupMembers)
          .where(eq(chatGroupMembers.userId, userId));
            
        if (memberships.length > 0) {
          const groupIds = memberships.map(m => m.groupId);
          memberGroups = await db
            .select()
            .from(groups)
            .where(inArray(groups.id, groupIds));
        }
      } catch (error) {
        console.error("Error fetching group memberships:", error);
      }
      
      // Also get groups owned by the user
      const ownedGroups = await db
        .select()
        .from(groups)
        .where(eq(groups.ownerId, userId));
      
      // Combine both lists without duplicates
      const allGroups = [...memberGroups];
      ownedGroups.forEach(owned => {
        if (!allGroups.some(g => g.id === owned.id)) {
          allGroups.push(owned);
        }
      });
      
      return allGroups;
    } catch (error) {
      console.error("Error in getUserGroups:", error);
      return [];
    }
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    try {
      const [newGroup] = await db
        .insert(groups)
        .values(group)
        .returning();
        
      // Automatically add the creator as a member with admin role
      await this.createChatGroupMember({
        groupId: newGroup.id,
        userId: newGroup.ownerId,
        role: 'admin' as const,
        status: 'accepted' as const
      });
        
      return newGroup;
    } catch (error) {
      console.error("Error in createGroup:", error);
      throw error;
    }
  }
  
  async updateGroup(id: number, groupData: Partial<Group>): Promise<Group | undefined> {
    const [group] = await db
      .update(groups)
      .set(groupData)
      .where(eq(groups.id, id))
      .returning();
    return group;
  }
  
  async deleteGroup(id: number): Promise<boolean> {
    // Delete all members first
    await db
      .delete(chatGroupMembers)
      .where(eq(chatGroupMembers.groupId, id));
    
    // Delete all messages 
    await db
      .delete(groupMessages)
      .where(eq(groupMessages.groupId, id));
    
    // Delete the group
    const result = await db
      .delete(groups)
      .where(eq(groups.id, id));
    return !!result;
  }
  
  async getGroupMembers(groupId: number): Promise<ChatGroupMember[]> {
    return db
      .select()
      .from(chatGroupMembers)
      .where(eq(chatGroupMembers.groupId, groupId));
  }
  
  async getGroupMemberByUserAndGroup(userId: number, groupId: number): Promise<ChatGroupMember | undefined> {
    const [member] = await db
      .select()
      .from(chatGroupMembers)
      .where(and(
        eq(chatGroupMembers.userId, userId),
        eq(chatGroupMembers.groupId, groupId)
      ));
    return member;
  }
  
  async createChatGroupMember(member: InsertChatGroupMember): Promise<ChatGroupMember> {
    const [newMember] = await db
      .insert(chatGroupMembers)
      .values(member)
      .returning();
    return newMember;
  }
  
  async deleteChatGroupMember(id: number): Promise<boolean> {
    const result = await db
      .delete(chatGroupMembers)
      .where(eq(chatGroupMembers.id, id));
    return !!result;
  }
  
  async getGroupMessages(groupId: number): Promise<GroupMessage[]> {
    return db
      .select()
      .from(groupMessages)
      .where(eq(groupMessages.groupId, groupId))
      .orderBy(asc(groupMessages.createdAt));
  }
  
  async createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage> {
    const [newMessage] = await db
      .insert(groupMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Club Messages operations
  async getClubMessages(clubId: number): Promise<(ClubMessage & { username: string })[]> {
    const messages = await db
      .select({
        id: clubMessages.id,
        clubId: clubMessages.clubId,
        userId: clubMessages.userId,
        content: clubMessages.content,
        createdAt: clubMessages.createdAt,
        username: users.username
      })
      .from(clubMessages)
      .innerJoin(users, eq(clubMessages.userId, users.id))
      .where(eq(clubMessages.clubId, clubId))
      .orderBy(asc(clubMessages.createdAt));
    
    return messages;
  }
  
  async createClubMessage(message: InsertClubMessage): Promise<ClubMessage & { username: string }> {
    try {
      const [newMessage] = await db
        .insert(clubMessages)
        .values(message)
        .returning();
      
      // Get the username for the created message
      const [user] = await db
        .select({ username: users.username })
        .from(users)
        .where(eq(users.id, message.userId));
      
      return { ...newMessage, username: user.username };
    } catch (error) {
      console.error("Error creating club message:", error);
      throw error;
    }
  }

  // Achievement operations
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }

  async getAchievements(): Promise<Achievement[]> {
    return db.select().from(achievements).orderBy(achievements.category, achievements.name);
  }

  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return db.select().from(achievements).where(eq(achievements.category, category)).orderBy(achievements.name);
  }

  async createAchievement(insertAchievement: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db.insert(achievements).values(insertAchievement).returning();
    return achievement;
  }

  async updateAchievement(id: number, achievementData: Partial<Achievement>): Promise<Achievement | undefined> {
    const [achievement] = await db
      .update(achievements)
      .set(achievementData)
      .where(eq(achievements.id, id))
      .returning();
    return achievement;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    const result = await db.delete(achievements).where(eq(achievements.id, id));
    return !!result;
  }

  // User Achievement operations
  async getUserAchievement(id: number): Promise<UserAchievement | undefined> {
    const [userAchievement] = await db.select().from(userAchievements).where(eq(userAchievements.id, id));
    return userAchievement;
  }

  async getUserAchievementsByUserId(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    // Join with achievements to get details
    const result = await db
      .select({
        ua: userAchievements,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId));
    
    return result.map(item => ({
      ...item.ua,
      achievement: item.achievement
    }));
  }

  async getUserAchievementByUserAndAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    const [userAchievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
    return userAchievement;
  }

  async createUserAchievement(insertUserAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const [userAchievement] = await db.insert(userAchievements).values(insertUserAchievement).returning();
    return userAchievement;
  }

  async updateUserAchievement(id: number, userAchievementData: Partial<UserAchievement>): Promise<UserAchievement | undefined> {
    const [userAchievement] = await db
      .update(userAchievements)
      .set(userAchievementData)
      .where(eq(userAchievements.id, id))
      .returning();
    return userAchievement;
  }

  async completeUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Get the achievement
        const [achievement] = await tx
          .select()
          .from(achievements)
          .where(eq(achievements.id, achievementId));
        
        if (!achievement) {
          throw new Error(`Achievement with ID ${achievementId} not found`);
        }

        // Get or create user achievement
        let userAchievement: UserAchievement | undefined;
        const [existingUserAchievement] = await tx
          .select()
          .from(userAchievements)
          .where(
            and(
              eq(userAchievements.userId, userId),
              eq(userAchievements.achievementId, achievementId)
            )
          );
        
        if (existingUserAchievement) {
          // If one-time achievement and already completed, return existing
          if (achievement.isOneTime && existingUserAchievement.isCompleted) {
            return existingUserAchievement;
          }

          // Update existing achievement
          const timesEarned = existingUserAchievement.timesEarned + 1;
          const now = new Date();
          
          [userAchievement] = await tx
            .update(userAchievements)
            .set({
              isCompleted: true,
              completionDate: now,
              timesEarned,
              lastEarnedAt: now
            })
            .where(eq(userAchievements.id, existingUserAchievement.id))
            .returning();
        } else {
          // Create new user achievement
          const now = new Date();
          [userAchievement] = await tx
            .insert(userAchievements)
            .values({
              userId,
              achievementId,
              isCompleted: true,
              progress: achievement.requirementValue,
              completionDate: now,
              timesEarned: 1,
              lastEarnedAt: now
            })
            .returning();
        }

        // Award spikes to the user
        await this._awardSpikesForAchievement(tx, userId, achievement);

        return userAchievement;
      });
    } catch (error) {
      console.error("Error completing user achievement:", error);
      throw error;
    }
  }

  // Helper function to award spikes for achievement
  private async _awardSpikesForAchievement(tx: any, userId: number, achievement: Achievement) {
    const [user] = await tx.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error(`User with ID ${userId} not found`);

    const newBalance = user.spikes + achievement.spikeReward;
    
    // Update user spikes
    await tx
      .update(users)
      .set({ spikes: newBalance })
      .where(eq(users.id, userId));

    // Record transaction
    await tx
      .insert(spikeTransactions)
      .values({
        userId,
        amount: achievement.spikeReward,
        balance: newBalance,
        source: 'achievement',
        sourceId: achievement.id,
        description: `Earned ${achievement.spikeReward} spikes for achievement: ${achievement.name}`
      });
  }

  // Login Streak operations
  async getLoginStreakByUserId(userId: number): Promise<LoginStreak | undefined> {
    const [streak] = await db.select().from(loginStreaks).where(eq(loginStreaks.userId, userId));
    return streak;
  }

  async createOrUpdateLoginStreak(userId: number): Promise<LoginStreak> {
    try {
      return await db.transaction(async (tx) => {
        // Get user
        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        if (!user) throw new Error(`User with ID ${userId} not found`);

        // Get existing streak
        const [existingStreak] = await tx
          .select()
          .from(loginStreaks)
          .where(eq(loginStreaks.userId, userId));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streakData: Partial<LoginStreak>;
        let spikesToAward = 0;
        let description = '';

        if (!existingStreak) {
          // Create new streak
          streakData = {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastLoginDate: today,
            streakUpdatedAt: new Date()
          };
          spikesToAward = 5; // First login
          description = 'First login bonus: 5 spikes';
        } else {
          const lastLogin = existingStreak.lastLoginDate;
          
          if (!lastLogin) {
            // First time tracking
            streakData = {
              currentStreak: 1,
              longestStreak: Math.max(existingStreak.longestStreak, 1),
              lastLoginDate: today,
              streakUpdatedAt: new Date()
            };
            spikesToAward = 5;
            description = 'Login bonus: 5 spikes';
          } else {
            // Already logged in today
            if (lastLogin.toDateString() === today.toDateString()) {
              return existingStreak;
            }

            // Check if yesterday
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastLogin.toDateString() === yesterday.toDateString()) {
              // Continuing streak
              const newStreak = existingStreak.currentStreak + 1;
              const newLongestStreak = Math.max(existingStreak.longestStreak, newStreak);
              
              streakData = {
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastLoginDate: today,
                streakUpdatedAt: new Date()
              };

              // Award spikes based on streak milestones
              if (newStreak % 7 === 0) {
                // Weekly milestone (7, 14, 21, etc.)
                spikesToAward = 25;
                description = `${newStreak}-day login streak bonus: 25 spikes`;
              } else if (newStreak % 30 === 0) {
                // Monthly milestone (30, 60, 90, etc.)
                spikesToAward = 100;
                description = `${newStreak}-day login streak milestone: 100 spikes`;
              } else {
                // Regular day
                spikesToAward = 5;
                description = `Day ${newStreak} login streak: 5 spikes`;
              }
            } else {
              // Streak broken
              streakData = {
                currentStreak: 1,
                lastLoginDate: today,
                streakUpdatedAt: new Date()
              };
              spikesToAward = 5;
              description = 'Login bonus: 5 spikes';
            }
          }
        }

        // Update or insert streak
        let streak: LoginStreak;
        if (existingStreak) {
          [streak] = await tx
            .update(loginStreaks)
            .set(streakData)
            .where(eq(loginStreaks.userId, userId))
            .returning();
        } else {
          [streak] = await tx
            .insert(loginStreaks)
            .values(streakData as InsertLoginStreak)
            .returning();
        }

        // Award spikes
        if (spikesToAward > 0) {
          const newBalance = user.spikes + spikesToAward;
          
          // Update user spikes
          await tx
            .update(users)
            .set({ spikes: newBalance })
            .where(eq(users.id, userId));

          // Record transaction
          await tx
            .insert(spikeTransactions)
            .values({
              userId,
              amount: spikesToAward,
              balance: newBalance,
              source: 'login_streak',
              sourceId: streak.id,
              description
            });
        }

        return streak;
      });
    } catch (error) {
      console.error("Error updating login streak:", error);
      throw error;
    }
  }

  // Spike Transaction operations
  async getSpikeTransactions(userId: number): Promise<SpikeTransaction[]> {
    return db
      .select()
      .from(spikeTransactions)
      .where(eq(spikeTransactions.userId, userId))
      .orderBy(desc(spikeTransactions.createdAt));
  }

  async createSpikeTransaction(insertTransaction: InsertSpikeTransaction): Promise<SpikeTransaction> {
    const [transaction] = await db.insert(spikeTransactions).values(insertTransaction).returning();
    return transaction;
  }

  async addSpikesToUser(userId: number, amount: number, source: string, sourceId?: number, description?: string): Promise<{ transaction: SpikeTransaction, user: User }> {
    try {
      return await db.transaction(async (tx) => {
        // Get user
        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        if (!user) throw new Error(`User with ID ${userId} not found`);

        const newBalance = user.spikes + amount;
        
        // Update user spikes
        const [updatedUser] = await tx
          .update(users)
          .set({ spikes: newBalance })
          .where(eq(users.id, userId))
          .returning();

        // Record transaction
        const [transaction] = await tx
          .insert(spikeTransactions)
          .values({
            userId,
            amount,
            balance: newBalance,
            source,
            sourceId,
            description: description || `Earned ${amount} spikes from ${source}`
          })
          .returning();

        return { transaction, user: updatedUser };
      });
    } catch (error) {
      console.error("Error adding spikes to user:", error);
      throw error;
    }
  }

  async deductSpikesFromUser(userId: number, amount: number, source: string, sourceId?: number, description?: string): Promise<{ transaction: SpikeTransaction, user: User } | undefined> {
    try {
      return await db.transaction(async (tx) => {
        // Get user
        const [user] = await tx.select().from(users).where(eq(users.id, userId));
        if (!user) throw new Error(`User with ID ${userId} not found`);

        // Check if user has enough spikes
        if (user.spikes < amount) {
          return undefined;
        }

        const newBalance = user.spikes - amount;
        
        // Update user spikes
        const [updatedUser] = await tx
          .update(users)
          .set({ spikes: newBalance })
          .where(eq(users.id, userId))
          .returning();

        // Record transaction
        const [transaction] = await tx
          .insert(spikeTransactions)
          .values({
            userId,
            amount: -amount,
            balance: newBalance,
            source,
            sourceId,
            description: description || `Spent ${amount} spikes on ${source}`
          })
          .returning();

        return { transaction, user: updatedUser };
      });
    } catch (error) {
      console.error("Error deducting spikes from user:", error);
      throw error;
    }
  }

  // Referral operations
  async getReferral(id: number): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral;
  }

  async getReferralByCode(referralCode: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referralCode, referralCode));
    return referral;
  }

  async getUserReferrals(userId: number): Promise<Referral[]> {
    return db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(insertReferral).returning();
    return referral;
  }

  async completeReferral(id: number): Promise<Referral | undefined> {
    try {
      return await db.transaction(async (tx) => {
        // Get referral
        const [referral] = await tx.select().from(referrals).where(eq(referrals.id, id));
        if (!referral) throw new Error(`Referral with ID ${id} not found`);

        // If already completed, just return
        if (referral.status === 'completed' && referral.spikesAwarded) {
          return referral;
        }

        // Get referrer
        const [referrer] = await tx.select().from(users).where(eq(users.id, referral.referrerId));
        if (!referrer) throw new Error(`Referrer with ID ${referral.referrerId} not found`);

        // Award spikes to referrer (100 spikes for successful referral)
        const amount = 100;
        const newBalance = referrer.spikes + amount;
        
        // Update referrer spikes
        await tx
          .update(users)
          .set({ spikes: newBalance })
          .where(eq(users.id, referrer.id));

        // Record transaction
        await tx
          .insert(spikeTransactions)
          .values({
            userId: referrer.id,
            amount,
            balance: newBalance,
            source: 'referral',
            sourceId: referral.id,
            description: `Earned ${amount} spikes for referring a new user!`
          });

        // Update referral status
        const [updatedReferral] = await tx
          .update(referrals)
          .set({
            status: 'completed',
            spikesAwarded: true,
            completedAt: new Date()
          })
          .where(eq(referrals.id, id))
          .returning();

        return updatedReferral;
      });
    } catch (error) {
      console.error("Error completing referral:", error);
      throw error;
    }
  }

  // Workout Library Methods
  async getWorkoutPreviews(userId: number): Promise<any[]> {
    const previews = await db
      .select()
      .from(workoutSessionPreview)
      .where(eq(workoutSessionPreview.userId, userId))
      .orderBy(desc(workoutSessionPreview.createdAt));
    
    return previews;
  }
  
  async getSavedWorkouts(userId: number): Promise<any[]> {
    const savedWorkouts = await db
      .select()
      .from(workoutLibrary)
      .where(and(
        eq(workoutLibrary.userId, userId),
        eq(workoutLibrary.category, 'saved')
      ))
      .orderBy(desc(workoutLibrary.createdAt));
    
    return savedWorkouts;
  }
  
  // Programs Methods
  async getUserPrograms(userId: number): Promise<TrainingProgram[]> {
    const programs = await db
      .select()
      .from(trainingPrograms)
      .where(eq(trainingPrograms.userId, userId))
      .orderBy(desc(trainingPrograms.createdAt));
    
    return programs;
  }
  
  async getProgram(id: number): Promise<TrainingProgram | undefined> {
    const [program] = await db
      .select()
      .from(trainingPrograms)
      .where(eq(trainingPrograms.id, id));
    
    return program;
  }
  
  async getProgramsFromSheets(): Promise<TrainingProgram[]> {
    const sheetPrograms = await db
      .select()
      .from(trainingPrograms)
      .where(and(
        eq(trainingPrograms.importedFromSheet, true),
        isNotNull(trainingPrograms.googleSheetId)
      ));
    
    return sheetPrograms;
  }
  
  async createProgram(program: InsertTrainingProgram): Promise<TrainingProgram> {
    const [newProgram] = await db
      .insert(trainingPrograms)
      .values(program)
      .returning();
    
    return newProgram;
  }
  
  async updateProgram(id: number, data: Partial<TrainingProgram>): Promise<TrainingProgram | undefined> {
    const [updatedProgram] = await db
      .update(trainingPrograms)
      .set(data)
      .where(eq(trainingPrograms.id, id))
      .returning();
    
    return updatedProgram;
  }
  
  async deleteProgram(id: number): Promise<boolean> {
    // Double-check if program exists
    const program = await db.select().from(trainingPrograms).where(eq(trainingPrograms.id, id));
    if (!program || program.length === 0) {
      console.log(`Program with ID ${id} not found`);
      return false;
    }
    
    try {
      // Using direct SQL to handle deletions in proper order to avoid constraint violations
      
      // First delete any practice completions tied to program sessions
      await pool.query(
        `DELETE FROM practice_completions WHERE session_id IN (
          SELECT id FROM program_sessions WHERE program_id = $1
        )`,
        [id]
      );
      
      // Delete program sessions
      await pool.query(
        `DELETE FROM program_sessions WHERE program_id = $1`,
        [id]
      );
      
      // Delete program purchases
      await pool.query(
        `DELETE FROM program_purchases WHERE program_id = $1`,
        [id]
      );
      
      // Delete program progress
      await pool.query(
        `DELETE FROM program_progress WHERE program_id = $1`,
        [id]
      );
      
      // Delete program assignments
      await pool.query(
        `DELETE FROM program_assignments WHERE program_id = $1`,
        [id]
      );
      
      // Finally delete the program itself
      await pool.query(
        `DELETE FROM training_programs WHERE id = $1`,
        [id]
      );
      
      return true;
    } catch (error) {
      console.error(`Error in deleteProgram:`, error);
      throw error;
    }
  }
  
  // Program Sessions Methods
  async getProgramSessions(programId: number): Promise<ProgramSession[]> {
    const sessions = await db
      .select()
      .from(programSessions)
      .where(eq(programSessions.programId, programId))
      .orderBy(asc(programSessions.dayNumber), asc(programSessions.orderInDay));
    
    return sessions;
  }
  
  async createProgramSession(session: InsertProgramSession): Promise<ProgramSession> {
    const [newSession] = await db
      .insert(programSessions)
      .values(session)
      .returning();
    
    return newSession;
  }
  
  async createProgramSessionBatch(sessions: InsertProgramSession[]): Promise<ProgramSession[]> {
    if (sessions.length === 0) {
      return [];
    }
    
    // Insert all sessions at once
    const newSessions = await db
      .insert(programSessions)
      .values(sessions)
      .returning();
    
    return newSessions;
  }
  
  async updateProgramSession(id: number, data: Partial<ProgramSession>): Promise<ProgramSession | undefined> {
    const [updatedSession] = await db
      .update(programSessions)
      .set(data)
      .where(eq(programSessions.id, id))
      .returning();
    
    return updatedSession;
  }
  
  async deleteProgramSessions(programId: number): Promise<boolean> {
    // Delete all sessions for a specific program
    await pool.query(
      `DELETE FROM program_sessions WHERE program_id = $1`,
      [programId]
    );
    
    return true;
  }
  
  async deleteProgramSession(id: number): Promise<boolean> {
    await db.delete(programSessions).where(eq(programSessions.id, id));
    return true;
  }
  
  // Purchased Programs Methods
  async getUserPurchasedPrograms(userId: number): Promise<(ProgramPurchase & { program: TrainingProgram, creator: { username: string } })[]> {
    const purchases = await db
      .select({
        id: programPurchases.id,
        programId: programPurchases.programId,
        userId: programPurchases.userId,
        price: programPurchases.price,
        isFree: programPurchases.isFree,
        purchasedAt: programPurchases.purchasedAt,
        program: trainingPrograms,
        creator: {
          username: users.username
        }
      })
      .from(programPurchases)
      .innerJoin(trainingPrograms, eq(programPurchases.programId, trainingPrograms.id))
      .innerJoin(users, eq(trainingPrograms.userId, users.id))
      .where(eq(programPurchases.userId, userId))
      .orderBy(desc(programPurchases.purchasedAt));
    
    return purchases;
  }
  
  async getPurchasedProgram(userId: number, programId: number): Promise<ProgramPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(programPurchases)
      .where(and(
        eq(programPurchases.userId, userId),
        eq(programPurchases.programId, programId)
      ));
    
    return purchase;
  }
  
  async purchaseProgram(purchase: InsertProgramPurchase): Promise<ProgramPurchase> {
    const [newPurchase] = await db
      .insert(programPurchases)
      .values(purchase)
      .returning();
    
    return newPurchase;
  }
  
  // Program Progress Methods
  async getProgramProgress(userId: number, programId: number): Promise<ProgramProgress[]> {
    const progress = await db
      .select()
      .from(programProgress)
      .where(and(
        eq(programProgress.userId, userId),
        eq(programProgress.programId, programId)
      ))
      .orderBy(desc(programProgress.completedAt));
    
    return progress;
  }
  
  async getSessionProgress(userId: number, sessionId: number): Promise<ProgramProgress | undefined> {
    const [progress] = await db
      .select()
      .from(programProgress)
      .where(and(
        eq(programProgress.userId, userId),
        eq(programProgress.sessionId, sessionId)
      ));
    
    return progress;
  }
  
  async recordProgramProgress(progress: InsertProgramProgress): Promise<ProgramProgress> {
    const [newProgress] = await db
      .insert(programProgress)
      .values(progress)
      .returning();
    
    return newProgress;
  }
  
  // Program Assignments methods
  async createProgramAssignment(assignment: InsertProgramAssignment): Promise<ProgramAssignment> {
    const [newAssignment] = await db
      .insert(programAssignments)
      .values(assignment)
      .returning();
    
    return newAssignment;
  }
  
  async getProgramAssignment(programId: number, assigneeId: number): Promise<ProgramAssignment | undefined> {
    const [assignment] = await db
      .select()
      .from(programAssignments)
      .where(and(
        eq(programAssignments.programId, programId),
        eq(programAssignments.assigneeId, assigneeId)
      ));
    
    return assignment;
  }
  
  async getProgramAssignees(programId: number): Promise<ProgramAssignment[]> {
    const assignments = await db
      .select()
      .from(programAssignments)
      .where(eq(programAssignments.programId, programId));
    
    return assignments;
  }
  
  async getAssignedPrograms(userId: number): Promise<ProgramAssignment[]> {
    const assignments = await db
      .select()
      .from(programAssignments)
      .where(eq(programAssignments.assigneeId, userId));
    
    return assignments;
  }
  
  async updateProgramAssignment(id: number, updates: Partial<ProgramAssignment>): Promise<ProgramAssignment> {
    const [updated] = await db
      .update(programAssignments)
      .set(updates)
      .where(eq(programAssignments.id, id))
      .returning();
    
    return updated;
  }
  
  // Get users who can be assigned programs (club members, coached athletes)
  async getCoachableUsers(coachId: number): Promise<User[]> {
    // First get all clubs where the user is an admin/coach
    const clubIds = await db
      .select({ clubId: clubMembers.clubId })
      .from(clubMembers)
      .where(and(
        eq(clubMembers.userId, coachId),
        or(
          eq(clubMembers.role, 'admin'),
          eq(clubMembers.role, 'coach')
        )
      ));
    
    if (clubIds.length === 0) {
      return [];
    }
    
    // Then get all members of those clubs
    const clubMemberUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        isPremium: users.isPremium,
        role: users.role,
        bio: users.bio,
        spikes: users.spikes,
        defaultClubId: users.defaultClubId,
        createdAt: users.createdAt,
        password: users.password
      })
      .from(clubMembers)
      .innerJoin(users, eq(clubMembers.userId, users.id))
      .where(inArray(
        clubMembers.clubId,
        clubIds.map(c => c.clubId)
      ));
    
    return clubMemberUsers;
  }
}

export const storage = new DatabaseStorage();