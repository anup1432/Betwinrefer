import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';
import { generateUniqueCode } from './image-generator';
import { User, Referral, UniqueCode, ActivityLog } from '@shared/schema';

const BOT_TOKEN = process.env.BOT_TOKEN || '8455088649:AAEk6aXpLFQ1e8YDaJFfSMIKAf7GqXuslyw';
const CHANNEL_ID = process.env.CHANNEL_ID || '-1001962385481';
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://marketbet2-0e.onrender.com/';
const SUPPORT_USERNAME = process.env.SUPPORT_USERNAME || '@Yokai_watc';

class TelegramBotService {
  private bot: TelegramBot;

  constructor() {
    const botToken = process.env.BOT_TOKEN || '8455088649:AAEk6aXpLFQ1e8YDaJFfSMIKAf7GqXuslyw';

    if (!botToken) {
      throw new Error('BOT_TOKEN environment variable is required');
    }

    this.bot = new TelegramBot(botToken, { polling: true });
    this.setupCommands();
  }

  private setupCommands() {
    // Start command
    this.bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const referralCode = match?.[1];

      try {
        await this.handleStart(chatId, msg.from!, referralCode);
      } catch (error) {
        console.error('Error in /start command:', error);
        await this.bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
      }
    });

    // Refer command
    this.bot.onText(/\/refer/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        await this.handleRefer(chatId, msg.from!);
      } catch (error) {
        console.error('Error in /refer command:', error);
        await this.bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
      }
    });

    // History command
    this.bot.onText(/\/history/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        await this.handleHistory(chatId, msg.from!);
      } catch (error) {
        console.error('Error in /history command:', error);
        await this.bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
      }
    });

    // Balance command
    this.bot.onText(/\/balance/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        await this.handleBalance(chatId, msg.from!);
      } catch (error) {
        console.error('Error in /balance command:', error);
        await this.bot.sendMessage(chatId, 'Sorry, something went wrong. Please try again later.');
      }
    });

    // Support command
    this.bot.onText(/\/support/, async (msg) => {
      const chatId = msg.chat.id;

      const supportMessage = `🆘 Support Contact

For any issues or questions, please contact our support team:

👤 Support: ${SUPPORT_USERNAME}

We'll get back to you as soon as possible!`;

      await this.bot.sendMessage(chatId, supportMessage);
    });

    // Handle callback queries (button clicks)
    this.bot.on('message', (msg) => {
      this.handleMessage(msg);
    });

    this.bot.on('callback_query', (query) => {
      this.handleCallbackQuery(query);
    });
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const chatId = query.message?.chat.id;
    const user = query.from;
    const data = query.data;

    if (!chatId || !user || !data) return;

    try {
      await this.bot.answerCallbackQuery(query.id);

      if (data === 'play_game') {
        await this.handlePlayButton(chatId, user);
      } else if (data === 'refer') {
        await this.handleRefer(chatId, user);
      } else if (data === 'withdraw') {
        await this.handleWithdraw(chatId, user);
      } else if (data.startsWith('withdraw_')) {
        const method = data.replace('withdraw_', '');
        await this.handleWithdrawPayment(chatId, user, method);
      }
    } catch (error) {
      console.error('Error handling callback query:', error);
      await this.bot.answerCallbackQuery(query.id, { text: 'Something went wrong. Please try again.' });
    }
  }

  private async handleStart(chatId: number, user: TelegramBot.User, referralCode?: string) {
    const telegramId = user.id.toString();

    // Check if user exists
    let existingUser = await storage.getUserByTelegramId(telegramId);

    if (!existingUser) {
      // Create new user
      const referrerId = referralCode ? await this.getReferrerIdFromCode(referralCode) : null;
      const newUser = await storage.createUser({
        telegramId,
        username: user.username || null,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        referredBy: referrerId,
      });

      // Award new user bonus
      await storage.updateUserBalance(newUser.id, '1.00');

      // Log new user activity
      await storage.logActivity({
        type: 'new_user',
        userId: newUser.id,
        data: { telegramId, username: user.username }
      });

      // Send notification to channel
      await this.notifyChannel(`🎉 New user joined: @${user.username || user.first_name} and earned $1.00!`);

      // If referred by someone, create referral record
      if (referrerId) {
        await storage.createReferral({
          referrerId: referrerId,
          referredId: newUser.id,
        });
      }

      existingUser = newUser;
    }

    // Get bot settings
    const settings = await storage.getBotSettings();

    // Send welcome message with photo and play button
    const welcomeMessage = `🎉 Welcome to our referral bot!

Start earning by referring friends and get rewards for every successful referral!

💰 New users get $1 bonus
🎯 Earn $0.10 per referral
🎁 Get unique codes after 10 referrals

Use the buttons below to get started!`;

    const keyboard = {
      inline_keyboard: [[
        { text: '🎮 Play Now', callback_data: 'play_game' },
        { text: '👥 Refer Friends', callback_data: 'refer' }
      ]]
    };

    if (settings?.welcomePhotoUrl) {
      await this.bot.sendPhoto(chatId, settings.welcomePhotoUrl, {
        caption: welcomeMessage,
        reply_markup: keyboard
      });
    } else {
      await this.bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard
      });
    }
  }

  private async handlePlayButton(chatId: number, user: TelegramBot.User) {
    const telegramId = user.id.toString();
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (!existingUser) {
      await this.bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    // Mark user as having played
    if (!existingUser.hasPlayedOnce) {
      await storage.markUserAsPlayed(existingUser.id);

      // Complete referral if user was referred
      if (existingUser.referredBy) {
        await this.completeReferral(existingUser.referredBy, existingUser.id);
      }
    }

    // Get play URL from settings
    const settings = await storage.getBotSettings();
    const playUrl = settings?.playButtonUrl || WEBSITE_URL;

    const keyboard = {
      inline_keyboard: [[
        { text: '🌐 Open Website', url: playUrl }
      ]]
    };

    await this.bot.sendMessage(chatId, '🎮 Click the button below to play!', {
      reply_markup: keyboard
    });
  }

  private async handleRefer(chatId: number, user: TelegramBot.User) {
    const telegramId = user.id.toString();
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (!existingUser) {
      await this.bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const referralLink = `https://t.me/${await this.getBotUsername()}?start=${existingUser.id}`;

    const message = `👥 Your Referral Link

🔗 ${referralLink}

💰 How it works:
• Share this link with friends
• They get $1 when they join and play
• You get $0.10 for each successful referral
• Get a unique code after 10 referrals!

📊 Your Stats:
• Referrals: ${existingUser.totalReferrals}/10
• Balance: $${existingUser.balance}`;

    await this.bot.sendMessage(chatId, message);
  }

  private async handleHistory(chatId: number, user: TelegramBot.User) {
    const telegramId = user.id.toString();
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (!existingUser) {
      await this.bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const referrals = await storage.getUserReferrals(existingUser.id);
    const withdrawals = await storage.getUserWithdrawals(existingUser.id);
    const codes = await storage.getUserCodes(existingUser.id);

    let historyMessage = `📊 Your History

💰 Balance: $${existingUser.balance}
🎯 Total Referrals: ${existingUser.totalReferrals}

`;

    if (referrals.length > 0) {
      historyMessage += `👥 Recent Referrals:
`;
      referrals.slice(0, 5).forEach((ref, index) => {
        const status = ref.isCompleted ? '✅' : '⏳';
        historyMessage += `${index + 1}. ${status} ${ref.referred?.username || 'User'} - ${new Date(ref.createdAt).toDateString()}
`;
      });
      historyMessage += '\n';
    }

    if (withdrawals.length > 0) {
      historyMessage += `💸 Recent Withdrawals:
`;
      withdrawals.slice(0, 3).forEach((withdrawal, index) => {
        const statusEmoji = withdrawal.status === 'approved' ? '✅' : withdrawal.status === 'rejected' ? '❌' : '⏳';
        historyMessage += `${index + 1}. ${statusEmoji} $${withdrawal.amount} - ${new Date(withdrawal.requestedAt).toDateString()}
`;
      });
      historyMessage += '\n';
    }

    if (codes.length > 0) {
      historyMessage += `🎁 Your Unique Codes:
`;
      codes.forEach((code, index) => {
        historyMessage += `${index + 1}. ${code.code} - ${new Date(code.generatedAt).toDateString()}
`;
      });
    }

    await this.bot.sendMessage(chatId, historyMessage);
  }

  private async handleBalance(chatId: number, user: TelegramBot.User) {
    const telegramId = user.id.toString();
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (!existingUser) {
      await this.bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const balance = parseFloat(existingUser.balance);
    const canWithdraw = balance >= 1.00;

    let message = `💰 Your Balance

Current Balance: $${existingUser.balance}
Total Referrals: ${existingUser.totalReferrals}/10

`;

    if (canWithdraw) {
      message += `✅ You can withdraw your earnings!`;

      const keyboard = {
        inline_keyboard: [[
          { text: '💸 Withdraw', callback_data: 'withdraw' }
        ]]
      };

      await this.bot.sendMessage(chatId, message, { reply_markup: keyboard });
    } else {
      message += `❌ Minimum withdrawal amount: $1.00
Need: $${(1.00 - balance).toFixed(2)} more

Keep referring friends to reach the minimum!`;

      await this.bot.sendMessage(chatId, message);
    }
  }

  private async handleWithdraw(chatId: number, user: TelegramBot.User) {
    const telegramId = user.id.toString();
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (!existingUser) {
      await this.bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const balance = parseFloat(existingUser.balance);

    if (balance < 1.00) {
      await this.bot.sendMessage(chatId, `❌ Insufficient balance for withdrawal.

Current Balance: $${existingUser.balance}
Minimum Required: $1.00
Need: $${(1.00 - balance).toFixed(2)} more

Keep referring friends to earn more!`);
      return;
    }

    // Offer withdrawal methods
    const message = `💸 Please choose a withdrawal method:

Current Balance: $${existingUser.balance}`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '💳 Bank Transfer', callback_data: 'withdraw_bank' }],
        [{ text: '💰 Crypto', callback_data: 'withdraw_crypto' }],
        [{ text: '📞 Other', callback_data: 'withdraw_other' }],
      ]
    };

    await this.bot.sendMessage(chatId, message, { reply_markup: keyboard });
  }

  private async handleWithdrawPayment(chatId: number, user: TelegramBot.User, method: string) {
    const telegramId = user.id.toString();
    const existingUser = await storage.getUserByTelegramId(telegramId);

    if (!existingUser) {
      await this.bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const balance = parseFloat(existingUser.balance);

    // Generate unique 14-digit code
    const uniqueCode = this.generateUniqueCode();

    // Save code to database
    await storage.createUniqueCode({
      userId: existingUser.id,
      code: uniqueCode
    });

    // Deduct balance
    await storage.updateUserBalance(existingUser.id, `-${balance.toFixed(2)}`);

    // Send success message with code and method
    const successMessage = `🎉 Withdrawal Request Processed!

💎 Your Unique 14-Digit Code:
${uniqueCode}

💰 Amount Withdrawn: $${balance.toFixed(2)}
💳 Withdrawal Method: ${method.charAt(0).toUpperCase() + method.slice(1)}
💳 Your new balance: $0.00

Keep this code safe! You can check all your codes with /history command.`;

    await this.bot.sendMessage(chatId, successMessage);

    // Send notification to channel
    await this.notifyChannel(`💸 Withdrawal processed: @${existingUser.username || existingUser.firstName} withdrew $${balance.toFixed(2)} via ${method} and received code: ${uniqueCode}`);

    // Log activity
    await storage.logActivity({
      type: 'code_generated',
      userId: existingUser.id,
      data: { code: uniqueCode, amount: balance.toFixed(2), method: method }
    });
  }

  private generateUniqueCode(): string {
    // Generate 14-character mixed code with 5-6 numbers and rest alphabets
    const numbers = '0123456789';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let code = '';
    let numberCount = 0;
    const targetNumbers = Math.floor(Math.random() * 2) + 5; // 5 or 6 numbers

    for (let i = 0; i < 14; i++) {
      if (numberCount < targetNumbers && (Math.random() < 0.4 || (14 - i) <= (targetNumbers - numberCount))) {
        // Add number
        code += numbers[Math.floor(Math.random() * numbers.length)];
        numberCount++;
      } else {
        // Add letter
        code += letters[Math.floor(Math.random() * letters.length)];
      }
    }

    return code;
  }

  private async completeReferral(referrerId: string, referredId: string) {
    // Update referral as completed
    await storage.completeReferral(referrerId, referredId);

    // Update referrer's total referrals
    const referrer = await storage.getUser(referrerId);
    if (!referrer) return;

    const newReferralCount = referrer.totalReferrals + 1;
    await storage.updateUserReferrals(referrerId, newReferralCount);

    // Award referral reward
    const settings = await storage.getBotSettings();
    const reward = settings?.referralReward || '0.10';
    await storage.updateUserBalance(referrerId, reward);

    // Notify referrer
    try {
      let message = `🎉 Congratulations! One of your referrals completed the task!

💰 You earned $${reward}
📊 Total referrals: ${newReferralCount}/10`;

      if (newReferralCount >= (settings?.referralsForCode || 10)) {
        message += `

🎁 Amazing! You've completed 10 referrals!
Use /balance to withdraw your earnings and get your unique code!`;
      }

      await this.bot.sendMessage(parseInt(referrer.telegramId), message);
    } catch (error) {
      console.error('Failed to notify referrer:', error);
    }

    // Log activity
    await storage.logActivity({
      type: 'referral_complete',
      userId: referrerId,
      data: { referredId, reward: reward.toString(), totalReferrals: newReferralCount }
    });

    // Notify channel
    await this.notifyChannel(`💰 Referral completed! @${referrer.username || referrer.firstName} earned $${reward} (${newReferralCount}/10 referrals)`);
  }


  private async getReferrerIdFromCode(referralCode: string): Promise<string | undefined> {
    // The referral code is actually the user ID
    const referrer = await storage.getUser(referralCode);
    return referrer?.id;
  }

  private async getBotUsername(): Promise<string> {
    const botInfo = await this.bot.getMe();
    return botInfo.username || 'unknown_bot';
  }

  async sendBroadcast(message: string): Promise<void> {
    try {
      const users = await storage.getAllUsers();
      const activeUsers = users.filter(user => user.isActive);

      for (const user of activeUsers) {
        try {
          await this.bot.sendMessage(parseInt(user.telegramId), message);
          await new Promise(resolve => setTimeout(resolve, 50)); // Rate limiting
        } catch (error) {
          console.error(`Failed to send message to user ${user.telegramId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      throw error;
    }
  }

  private async notifyChannel(message: string) {
    try {
      await this.bot.sendMessage(CHANNEL_ID, message);
    } catch (error) {
      console.error('Failed to send channel notification:', error);
    }
  }

  public getBot(): TelegramBot {
    return this.bot;
  }
}

export const telegramBot = new TelegramBotService();
