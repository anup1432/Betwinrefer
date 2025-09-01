import { User, Referral, Withdrawal, UniqueCode, BotSettings, ActivityLog } from '@shared/schema';
import type { IUser, IReferral, IWithdrawal, IUniqueCode, IBotSettings, IActivityLog } from '@shared/schema';

export const storage = {
  // User operations
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  },

  async getUserByTelegramId(telegramId: string): Promise<IUser | null> {
    return await User.findOne({ telegramId });
  },

  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  },

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  },

  async getAllUsers(): Promise<IUser[]> {
    return await User.find().sort({ joinedAt: -1 });
  },

  async updateUserBalance(userId: string, amount: number): Promise<void> {
    await User.findByIdAndUpdate(userId, { 
      $inc: { balance: amount, totalEarnings: amount > 0 ? amount : 0 }
    });
  },

  // Referral operations
  async createReferral(referralData: Partial<IReferral>): Promise<IReferral> {
    const referral = new Referral(referralData);
    return await referral.save();
  },

  async getReferralsByUserId(userId: string): Promise<IReferral[]> {
    return await Referral.find({ referrerId: userId });
  },

  async updateReferralStatus(id: string, status: 'pending' | 'completed'): Promise<void> {
    await Referral.findByIdAndUpdate(id, { 
      status, 
      completedAt: status === 'completed' ? new Date() : undefined 
    });
  },

  // Withdrawal operations
  async createWithdrawal(withdrawalData: Partial<IWithdrawal>): Promise<IWithdrawal> {
    const withdrawal = new Withdrawal(withdrawalData);
    return await withdrawal.save();
  },

  async getAllWithdrawals(): Promise<IWithdrawal[]> {
    return await Withdrawal.find().sort({ requestedAt: -1 });
  },

  async updateWithdrawalStatus(id: string, status: 'pending' | 'approved' | 'rejected', adminNotes?: string): Promise<void> {
    await Withdrawal.findByIdAndUpdate(id, { 
      status, 
      processedAt: new Date(),
      adminNotes 
    });
  },

  // Unique Code operations
  async createUniqueCode(codeData: Partial<IUniqueCode>): Promise<IUniqueCode> {
    const uniqueCode = new UniqueCode(codeData);
    return await uniqueCode.save();
  },

  async getUniqueCodeByCode(code: string): Promise<IUniqueCode | null> {
    return await UniqueCode.findOne({ code });
  },

  async markCodeAsUsed(id: string, usedBy: string): Promise<void> {
    await UniqueCode.findByIdAndUpdate(id, { 
      isUsed: true, 
      usedBy, 
      usedAt: new Date() 
    });
  },

  // Bot Settings operations
  async getBotSettings(): Promise<IBotSettings | null> {
    return await BotSettings.findOne();
  },

  async updateBotSettings(settings: Partial<IBotSettings>): Promise<IBotSettings | null> {
    const existingSettings = await BotSettings.findOne();
    if (existingSettings) {
      return await BotSettings.findByIdAndUpdate(existingSettings._id, settings, { new: true });
    } else {
      const newSettings = new BotSettings(settings);
      return await newSettings.save();
    }
  },

  // Activity Log operations
  async logActivity(activityData: Partial<IActivityLog>): Promise<IActivityLog> {
    const activity = new ActivityLog(activityData);
    return await activity.save();
  },

  async getRecentActivity(limit: number = 50): Promise<IActivityLog[]> {
    return await ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
  },

  // Dashboard statistics
  async getDashboardStats() {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalWithdrawals = await Withdrawal.countDocuments();
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const totalReferrals = await Referral.countDocuments();
    const completedReferrals = await Referral.countDocuments({ status: 'completed' });

    return {
      totalUsers,
      activeUsers,
      totalWithdrawals,
      pendingWithdrawals,
      totalReferrals,
      completedReferrals
    };
  },

  async getStats() {
    return this.getDashboardStats();
  },

  async getAllCodes(): Promise<IUniqueCode[]> {
    return await UniqueCode.find().sort({ createdAt: -1 });
  },

  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id);
  },

  async getUserReferrals(userId: string): Promise<IReferral[]> {
    return await Referral.find({ referrerId: userId });
  },

  async getUserWithdrawals(userId: string): Promise<IWithdrawal[]> {
    return await Withdrawal.find({ userId }).sort({ requestedAt: -1 });
  },

  async getUserCodes(userId: string): Promise<IUniqueCode[]> {
    return await UniqueCode.find({ userId }).sort({ createdAt: -1 });
  },

  async createWithdrawal(withdrawalData: any): Promise<IWithdrawal> {
    const withdrawal = new Withdrawal({
      userId: withdrawalData.userId,
      amount: withdrawalData.amount,
      method: withdrawalData.method,
      details: withdrawalData.details,
      paymentMethod: withdrawalData.paymentMethod || withdrawalData.method,
      status: 'pending'
    });
    return await withdrawal.save();
  },

  async getAllWithdrawals(): Promise<IWithdrawal[]> {
    return await Withdrawal.find()
      .sort({ requestedAt: -1 })
      .populate('userId', 'firstName lastName username telegramId');
  },

  async updateWithdrawalStatus(withdrawalId: string, status: string, notes?: string): Promise<void> {
    await Withdrawal.findByIdAndUpdate(withdrawalId, {
      status,
      adminNotes: notes,
      processedAt: new Date()
    });
  },

  async getBotSettings(): Promise<IBotSettings | null> {
    let settings = await BotSettings.findOne();
    if (!settings) {
      settings = new BotSettings({
        welcomeMessage: "Welcome to our referral bot! 🎉",
        playButtonUrl: "https://example.com/play",
        newUserBonus: 1.00,
        referralReward: 0.10,
        minWithdrawal: 1.00,
        referralsForCode: 10,
        isActive: true
      });
      await settings.save();
    }
    return settings;
  },

  async updateBotSettings(updates: any): Promise<IBotSettings> {
    let settings = await BotSettings.findOne();
    if (!settings) {
      settings = new BotSettings(updates);
    } else {
      Object.assign(settings, updates);
      settings.updatedAt = new Date();
    }
    return await settings.save();
  },

  async logActivity(activityData: Partial<IActivityLog>): Promise<IActivityLog> {
    const activity = new ActivityLog(activityData);
    return await activity.save();
  },

  async getRecentActivity(): Promise<IActivityLog[]> {
    return await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'firstName lastName username telegramId');
  }
};
