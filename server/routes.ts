import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramBot } from "./telegram-bot";
import { insertWithdrawalSchema, insertBotSettingsSchema } from "@shared/schema";
import express from "express";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Telegram webhook endpoint
  app.post('/api/webhook', express.json(), (req, res) => {
    try {
      telegramBot.processWebhookUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      console.error('Webhook error:', error);
      res.sendStatus(500);
    }
  });

  // Serve uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user referrals
  app.get("/api/users/:id/referrals", async (req, res) => {
    try {
      const referrals = await storage.getUserReferrals(req.params.id);
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Get all withdrawals
  app.get("/api/withdrawals", async (req, res) => {
    try {
      const withdrawals = await storage.getAllWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Update withdrawal status
  app.patch("/api/withdrawals/:id", async (req, res) => {
    try {
      const { status, notes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateWithdrawalStatus(req.params.id, status, notes);
      res.json({ message: "Withdrawal status updated" });
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      res.status(500).json({ message: "Failed to update withdrawal" });
    }
  });

  // Create withdrawal request
  app.post("/api/withdrawals", async (req, res) => {
    try {
      const validatedData = insertWithdrawalSchema.parse(req.body);
      const withdrawal = await storage.createWithdrawal(validatedData);
      
      // Log activity
      await storage.logActivity({
        type: 'withdrawal_request',
        userId: withdrawal.userId,
        data: { amount: withdrawal.amount, method: withdrawal.paymentMethod }
      });

      res.status(201).json(withdrawal);
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      res.status(500).json({ message: "Failed to create withdrawal" });
    }
  });

  // Get all unique codes
  app.get("/api/codes", async (req, res) => {
    try {
      const codes = await storage.getAllCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching codes:", error);
      res.status(500).json({ message: "Failed to fetch codes" });
    }
  });

  // Get recent activity
  app.get("/api/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // Get bot settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update bot settings
  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertBotSettingsSchema.parse(req.body);
      const settings = await storage.updateBotSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Send broadcast message
  app.post("/api/broadcast", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      await telegramBot.sendBroadcast(message);
      res.json({ message: "Broadcast sent successfully" });
    } catch (error) {
      console.error("Error sending broadcast:", error);
      res.status(500).json({ message: "Failed to send broadcast" });
    }
  });

  // Get top referrers
  app.get("/api/referrers/top", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const topReferrers = users
        .filter(user => user.totalReferrals > 0)
        .sort((a, b) => b.totalReferrals - a.totalReferrals)
        .slice(0, 10)
        .map(user => ({
          id: user.id,
          username: user.username || user.firstName,
          referrals: user.totalReferrals,
          balance: user.balance
        }));
      
      res.json(topReferrers);
    } catch (error) {
      console.error("Error fetching top referrers:", error);
      res.status(500).json({ message: "Failed to fetch top referrers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
