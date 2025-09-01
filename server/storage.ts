import { 
  users, 
  referrals, 
  withdrawals, 
  uniqueCodes, 
  botSettings, 
  activityLog,
  type User, 
  type InsertUser,
  type Referral,
  type Withdrawal,
  type InsertWithdrawal,
  type UniqueCode,
  type BotSettings,
  type InsertBotSettings,
  type ActivityLog,
  type InsertActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: string, amount: string): Promise<void>;
  updateUserReferrals(userId: string, count: number): Promise<void>;
  markUserAsPlayed(userId: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Referrals
  createReferral(referral: { referrerId: string; referredId: string }): Promise<Referral>;
  completeReferral(referrerId: string, referredId: string): Promise<void>;
  getUserReferrals(userId: string): Promise<(Referral & { referred?: User })[]>;
  
  // Withdrawals
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getUserWithdrawals(userId: string): Promise<Withdrawal[]>;
  getAllWithdrawals(): Promise<(Withdrawal & { user?: User })[]>;
  updateWithdrawalStatus(id: string, status: string, notes?: string): Promise<void>;
  
  // Unique Codes
  createUniqueCode(code: { userId: string; code: string; imageUrl?: string }): Promise<UniqueCode>;
  getUserCodes(userId: string): Promise<UniqueCode[]>;
  getAllCodes(): Promise<(UniqueCode & { user?: User })[]>;
  
  // Bot Settings
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  
  // Activity Log
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivity(): Promise<(ActivityLog & { user?: User })[]>;
  
  // Analytics
  getStats(): Promise<{
    totalUsers: number;
    totalReferrals: number;
    totalEarnings: string;
    pendingWithdrawals: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user as User | undefined;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return result[0] as User;
  }

  async updateUserBalance(userId: string, amount: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        balance: sql`${users.balance} + ${amount}` 
      })
      .where(eq(users.id, userId));
  }

  async updateUserReferrals(userId: string, count: number): Promise<void> {
    await db
      .update(users)
      .set({ totalReferrals: count })
      .where(eq(users.id, userId));
  }

  async markUserAsPlayed(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ hasPlayedOnce: true })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.joinedAt)) as User[];
  }

  async createReferral(referral: { referrerId: string; referredId: string }): Promise<Referral> {
    const [newReferral] = await db
      .insert(referrals)
      .values(referral)
      .returning();
    return newReferral;
  }

  async completeReferral(referrerId: string, referredId: string): Promise<void> {
    await db
      .update(referrals)
      .set({ 
        isCompleted: true, 
        completedAt: new Date(),
        rewardPaid: true 
      })
      .where(and(
        eq(referrals.referrerId, referrerId),
        eq(referrals.referredId, referredId)
      ));
  }

  async getUserReferrals(userId: string): Promise<(Referral & { referred?: User })[]> {
    return await db
      .select({
        id: referrals.id,
        referrerId: referrals.referrerId,
        referredId: referrals.referredId,
        isCompleted: referrals.isCompleted,
        rewardPaid: referrals.rewardPaid,
        createdAt: referrals.createdAt,
        completedAt: referrals.completedAt,
        referred: users
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [newWithdrawal] = await db
      .insert(withdrawals)
      .values(withdrawal)
      .returning();
    return newWithdrawal;
  }

  async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.requestedAt));
  }

  async getAllWithdrawals(): Promise<(Withdrawal & { user?: User })[]> {
    return await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        amount: withdrawals.amount,
        status: withdrawals.status,
        paymentMethod: withdrawals.paymentMethod,
        paymentDetails: withdrawals.paymentDetails,
        requestedAt: withdrawals.requestedAt,
        processedAt: withdrawals.processedAt,
        notes: withdrawals.notes,
        user: users
      })
      .from(withdrawals)
      .leftJoin(users, eq(withdrawals.userId, users.id))
      .orderBy(desc(withdrawals.requestedAt));
  }

  async updateWithdrawalStatus(id: string, status: string, notes?: string): Promise<void> {
    await db
      .update(withdrawals)
      .set({ 
        status, 
        notes,
        processedAt: new Date() 
      })
      .where(eq(withdrawals.id, id));
  }

  async createUniqueCode(code: { userId: string; code: string; imageUrl?: string }): Promise<UniqueCode> {
    const [newCode] = await db
      .insert(uniqueCodes)
      .values(code)
      .returning();
    return newCode;
  }

  async getUserCodes(userId: string): Promise<UniqueCode[]> {
    return await db
      .select()
      .from(uniqueCodes)
      .where(eq(uniqueCodes.userId, userId))
      .orderBy(desc(uniqueCodes.generatedAt));
  }

  async getAllCodes(): Promise<(UniqueCode & { user?: User })[]> {
    return await db
      .select({
        id: uniqueCodes.id,
        userId: uniqueCodes.userId,
        code: uniqueCodes.code,
        imageUrl: uniqueCodes.imageUrl,
        generatedAt: uniqueCodes.generatedAt,
        user: users
      })
      .from(uniqueCodes)
      .leftJoin(users, eq(uniqueCodes.userId, users.id))
      .orderBy(desc(uniqueCodes.generatedAt));
  }

  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).where(eq(botSettings.isActive, true));
    return settings || undefined;
  }

  async updateBotSettings(settings: InsertBotSettings): Promise<BotSettings> {
    // Deactivate all existing settings
    await db.update(botSettings).set({ isActive: false });
    
    // Insert new settings
    const [newSettings] = await db
      .insert(botSettings)
      .values({ ...settings, isActive: true })
      .returning();
    return newSettings;
  }

  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const [newActivity] = await db
      .insert(activityLog)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getRecentActivity(): Promise<(ActivityLog & { user?: User })[]> {
    return await db
      .select({
        id: activityLog.id,
        type: activityLog.type,
        userId: activityLog.userId,
        data: activityLog.data,
        createdAt: activityLog.createdAt,
        user: users
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(50);
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalReferrals: number;
    totalEarnings: string;
    pendingWithdrawals: number;
  }> {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [referralCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(eq(referrals.isCompleted, true));

    const [earningsSum] = await db
      .select({ sum: sql<string>`COALESCE(SUM(${users.balance}), 0)` })
      .from(users);

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(withdrawals)
      .where(eq(withdrawals.status, 'pending'));

    return {
      totalUsers: userCount.count || 0,
      totalReferrals: referralCount.count || 0,
      totalEarnings: earningsSum.sum || '0',
      pendingWithdrawals: pendingCount.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
