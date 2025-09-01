
import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  balance: number;
  totalEarnings: number;
  referralCount: number;
  referredBy?: string;
  isActive: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
}

const userSchema = new Schema<IUser>({
  telegramId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: String,
  username: String,
  balance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 },
  referredBy: String,
  isActive: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now }
});

// Referral Schema
export interface IReferral extends Document {
  id: string;
  referrerId: string;
  referredId: string;
  reward: number;
  status: 'pending' | 'completed';
  completedAt?: Date;
  createdAt: Date;
}

const referralSchema = new Schema<IReferral>({
  referrerId: { type: String, required: true },
  referredId: { type: String, required: true },
  reward: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// Withdrawal Schema
export interface IWithdrawal extends Document {
  id: string;
  userId: string;
  amount: number;
  method: string;
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  adminNotes?: string;
}

const withdrawalSchema = new Schema<IWithdrawal>({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  details: Schema.Types.Mixed,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date,
  adminNotes: String
});

// Unique Code Schema
export interface IUniqueCode extends Document {
  id: string;
  userId: string;
  code: string;
  imageUrl: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: Date;
  createdAt: Date;
}

const uniqueCodeSchema = new Schema<IUniqueCode>({
  userId: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  isUsed: { type: Boolean, default: false },
  usedBy: String,
  usedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

// Bot Settings Schema
export interface IBotSettings extends Document {
  id: string;
  welcomeMessage: string;
  welcomePhotoUrl?: string;
  playButtonUrl: string;
  newUserBonus: number;
  referralReward: number;
  minWithdrawal: number;
  referralsForCode: number;
  isActive: boolean;
  updatedAt: Date;
}

const botSettingsSchema = new Schema<IBotSettings>({
  welcomeMessage: { type: String, required: true },
  welcomePhotoUrl: String,
  playButtonUrl: { type: String, required: true },
  newUserBonus: { type: Number, default: 1.00 },
  referralReward: { type: Number, default: 0.10 },
  minWithdrawal: { type: Number, default: 1.00 },
  referralsForCode: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

// Activity Log Schema
export interface IActivityLog extends Document {
  id: string;
  type: string;
  userId?: string;
  data?: any;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  type: { type: String, required: true },
  userId: String,
  data: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

// Export models
export const User = mongoose.model<IUser>('User', userSchema);
export const Referral = mongoose.model<IReferral>('Referral', referralSchema);
export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
export const UniqueCode = mongoose.model<IUniqueCode>('UniqueCode', uniqueCodeSchema);
export const BotSettings = mongoose.model<IBotSettings>('BotSettings', botSettingsSchema);
export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

// Zod validation schemas
export const insertWithdrawalSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  method: z.string(),
  details: z.any(),
  paymentMethod: z.string().optional()
});

export const insertBotSettingsSchema = z.object({
  welcomeMessage: z.string(),
  welcomePhotoUrl: z.string().optional(),
  playButtonUrl: z.string(),
  newUserBonus: z.number().default(1.00),
  referralReward: z.number().default(0.10),
  minWithdrawal: z.number().default(1.00),
  referralsForCode: z.number().default(10),
  isActive: z.boolean().default(true)
});

// Export types for compatibility
export type {
  IUser as User,
  IReferral as Referral,
  IWithdrawal as Withdrawal,
  IUniqueCode as UniqueCode,
  IBotSettings as BotSettings,
  IActivityLog as ActivityLog
};
