import { 
  users, 
  meets, 
  results, 
  reminders, 
  coaches, 
  type User, 
  type InsertUser, 
  type Meet, 
  type InsertMeet,
  type Result,
  type InsertResult,
  type Reminder,
  type InsertReminder,
  type Coach,
  type InsertCoach
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private meets: Map<number, Meet>;
  private results: Map<number, Result>;
  private reminders: Map<number, Reminder>;
  private coaches: Map<number, Coach>;
  sessionStore: session.Store;
  
  private userIdCounter: number;
  private meetIdCounter: number;
  private resultIdCounter: number;
  private reminderIdCounter: number;
  private coachIdCounter: number;

  constructor() {
    this.users = new Map();
    this.meets = new Map();
    this.results = new Map();
    this.reminders = new Map();
    this.coaches = new Map();
    
    this.userIdCounter = 1;
    this.meetIdCounter = 1;
    this.resultIdCounter = 1;
    this.reminderIdCounter = 1;
    this.coachIdCounter = 1;
    
    // Create test user with properly hashed password
    this.users.set(1, {
      id: 1,
      username: 'testuser',
      password: '52cad11596bb5b93baf755035ed6166fd07961616878615288d5119e5b766d0d02b697956a1ecc36e00dba9c86c65c8e7c31b219ec17a0a1d1db066d787151f2.ef9c12cce344b3925024420f5b8f37f2', // hashed 'password123'
      name: 'Test User',
      email: 'test@example.com',
      events: ['100m', '200m', 'Long Jump'],
      isPremium: false,
      createdAt: new Date()
    });
    
    this.userIdCounter = 2; // Increment counter since we added a user
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isPremium: false, 
      createdAt 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Meet operations
  async getMeet(id: number): Promise<Meet | undefined> {
    return this.meets.get(id);
  }

  async getMeetsByUserId(userId: number): Promise<Meet[]> {
    return Array.from(this.meets.values()).filter(
      (meet) => meet.userId === userId
    );
  }

  async getUpcomingMeetsByUserId(userId: number): Promise<Meet[]> {
    const now = new Date();
    return Array.from(this.meets.values()).filter(
      (meet) => meet.userId === userId && new Date(meet.date) >= now
    );
  }

  async getPastMeetsByUserId(userId: number): Promise<Meet[]> {
    const now = new Date();
    return Array.from(this.meets.values()).filter(
      (meet) => meet.userId === userId && new Date(meet.date) < now
    );
  }

  async createMeet(insertMeet: InsertMeet): Promise<Meet> {
    const id = this.meetIdCounter++;
    const createdAt = new Date();
    const meet: Meet = {
      ...insertMeet,
      id,
      createdAt
    };
    this.meets.set(id, meet);
    return meet;
  }

  async updateMeet(id: number, meetData: Partial<Meet>): Promise<Meet | undefined> {
    const meet = await this.getMeet(id);
    if (!meet) return undefined;
    
    const updatedMeet = { ...meet, ...meetData };
    this.meets.set(id, updatedMeet);
    return updatedMeet;
  }

  async deleteMeet(id: number): Promise<boolean> {
    return this.meets.delete(id);
  }

  // Result operations
  async getResult(id: number): Promise<Result | undefined> {
    return this.results.get(id);
  }

  async getResultsByUserId(userId: number): Promise<Result[]> {
    return Array.from(this.results.values()).filter(
      (result) => result.userId === userId
    );
  }

  async getResultsByMeetId(meetId: number): Promise<Result[]> {
    return Array.from(this.results.values()).filter(
      (result) => result.meetId === meetId
    );
  }

  async createResult(insertResult: InsertResult): Promise<Result> {
    const id = this.resultIdCounter++;
    const createdAt = new Date();
    const result: Result = { 
      ...insertResult, 
      id, 
      createdAt 
    };
    this.results.set(id, result);
    return result;
  }

  async updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined> {
    const result = await this.getResult(id);
    if (!result) return undefined;
    
    const updatedResult = { ...result, ...resultData };
    this.results.set(id, updatedResult);
    return updatedResult;
  }

  async deleteResult(id: number): Promise<boolean> {
    return this.results.delete(id);
  }

  // Reminder operations
  async getReminder(id: number): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async getRemindersByUserId(userId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(
      (reminder) => reminder.userId === userId
    );
  }

  async getRemindersByMeetId(meetId: number): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(
      (reminder) => reminder.meetId === meetId
    );
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = this.reminderIdCounter++;
    const createdAt = new Date();
    const reminder: Reminder = { 
      ...insertReminder, 
      id, 
      completed: false, 
      createdAt 
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: number, reminderData: Partial<Reminder>): Promise<Reminder | undefined> {
    const reminder = await this.getReminder(id);
    if (!reminder) return undefined;
    
    const updatedReminder = { ...reminder, ...reminderData };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    return this.reminders.delete(id);
  }

  // Coach operations
  async getCoach(id: number): Promise<Coach | undefined> {
    return this.coaches.get(id);
  }

  async getCoachesByUserId(userId: number): Promise<Coach[]> {
    return Array.from(this.coaches.values()).filter(
      (coach) => coach.userId === userId
    );
  }

  async getAthletesByCoachId(coachId: number): Promise<User[]> {
    const athletes = Array.from(this.coaches.values())
      .filter((coach) => coach.userId === coachId && coach.status === 'accepted')
      .map((coach) => coach.athleteId);
    
    return Array.from(this.users.values()).filter(
      (user) => athletes.includes(user.id)
    );
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const id = this.coachIdCounter++;
    const createdAt = new Date();
    const coach: Coach = { 
      ...insertCoach, 
      id, 
      status: 'pending', 
      createdAt 
    };
    this.coaches.set(id, coach);
    return coach;
  }

  async updateCoach(id: number, coachData: Partial<Coach>): Promise<Coach | undefined> {
    const coach = await this.getCoach(id);
    if (!coach) return undefined;
    
    const updatedCoach = { ...coach, ...coachData };
    this.coaches.set(id, updatedCoach);
    return updatedCoach;
  }

  async deleteCoach(id: number): Promise<boolean> {
    return this.coaches.delete(id);
  }
}

export const storage = new MemStorage();