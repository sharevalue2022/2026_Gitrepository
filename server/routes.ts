import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { sendVerificationSMS } from "./lib/twilio";
import { storage } from "./storage";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";

const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Phone verification endpoints
  app.post("/api/verification/send", async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber || phoneNumber.length < 10) {
        return res.status(400).json({ success: false, message: "유효한 전화번호를 입력해주세요." });
      }

      const code = generateVerificationCode();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      
      verificationCodes.set(phoneNumber, { code, expiresAt });
      
      const smsSent = await sendVerificationSMS(phoneNumber, code);
      
      if (smsSent) {
        console.log(`[SMS 발송 성공] ${phoneNumber}`);
        return res.json({ success: true, message: "인증번호가 발송되었습니다." });
      } else {
        console.log(`[SMS 발송 실패] ${phoneNumber}, 코드: ${code}`);
        return res.json({ 
          success: true, 
          message: "인증번호가 발송되었습니다.",
          demoCode: code
        });
      }
    } catch (error) {
      console.error("Verification send error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.post("/api/verification/verify", async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      
      if (!phoneNumber || !code) {
        return res.status(400).json({ success: false, message: "전화번호와 인증번호를 입력해주세요." });
      }

      const stored = verificationCodes.get(phoneNumber);
      
      if (!stored) {
        return res.status(400).json({ success: false, message: "인증번호를 먼저 요청해주세요." });
      }
      
      if (Date.now() > stored.expiresAt) {
        verificationCodes.delete(phoneNumber);
        return res.status(400).json({ success: false, message: "인증번호가 만료되었습니다. 다시 요청해주세요." });
      }
      
      if (stored.code !== code) {
        return res.status(400).json({ success: false, message: "인증번호가 일치하지 않습니다." });
      }
      
      verificationCodes.delete(phoneNumber);
      console.log(`[인증 성공] ${phoneNumber}`);
      
      return res.json({ success: true, message: "인증이 완료되었습니다." });
    } catch (error) {
      console.error("Verification verify error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { password, ...userData } = req.body;
      
      if (!userData.name || !userData.age || !userData.gender || !userData.location) {
        return res.status(400).json({ success: false, message: "필수 정보를 입력해주세요." });
      }
      
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: "비밀번호는 최소 6자 이상이어야 합니다." });
      }

      if (userData.phoneNumber) {
        const existingUser = await storage.getUserByPhone(userData.phoneNumber);
        if (existingUser) {
          return res.status(400).json({ success: false, message: "이미 등록된 전화번호입니다." });
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ ...userData, passwordHash });
      
      const { passwordHash: _, ...userWithoutPassword } = user;
      return res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phoneNumber, password } = req.body;
      
      if (!phoneNumber || !password) {
        return res.status(400).json({ success: false, message: "전화번호와 비밀번호를 입력해주세요." });
      }

      const user = await storage.getUserByPhone(phoneNumber);
      
      if (!user) {
        return res.status(401).json({ success: false, message: "등록된 계정이 없습니다." });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ success: false, message: "비밀번호가 설정되지 않은 계정입니다. 고객센터에 문의해주세요." });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
      }

      const { passwordHash: _, ...userWithoutPassword } = user;
      return res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // User endpoints
  app.post("/api/users", async (req, res) => {
    try {
      const userData = req.body;
      
      if (!userData.name || !userData.age || !userData.gender || !userData.location) {
        return res.status(400).json({ success: false, message: "필수 정보를 입력해주세요." });
      }

      const user = await storage.createUser(userData);
      return res.json({ success: true, user });
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      return res.json({ success: true, user });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.get("/api/users/:id/payment-status", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      
      const paymentRequests = await storage.getPaymentRequestsByUserId(req.params.id);
      const pendingRequest = paymentRequests.find(r => r.status === "pending");
      const approvedRequest = paymentRequests.find(r => r.status === "approved");
      
      let status: "none" | "pending" | "approved" | "rejected" = "none";
      
      if (pendingRequest) {
        status = "pending";
      } else if (user.isKingMember && user.kingMembershipStartDate) {
        status = "approved";
      } else if (approvedRequest) {
        status = "approved";
      }
      
      const startDate = user.kingMembershipStartDate ? new Date(user.kingMembershipStartDate) : null;
      const expiryDate = startDate ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
      
      return res.json({ 
        success: true, 
        status,
        isKingMember: user.isKingMember,
        kingMembershipStartDate: user.kingMembershipStartDate,
        kingMembershipExpiry: expiryDate?.toISOString(),
      });
    } catch (error) {
      console.error("Get payment status error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      return res.json({ success: true, user });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const { excludeId, gender } = req.query;
      const users = await storage.getUsers(
        excludeId as string | undefined,
        gender as string | undefined
      );
      return res.json({ success: true, users });
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.get("/api/users/phone/:phoneNumber", async (req, res) => {
    try {
      const user = await storage.getUserByPhone(req.params.phoneNumber);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      return res.json({ success: true, user });
    } catch (error) {
      console.error("Get user by phone error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Conversation endpoints
  app.get("/api/conversations", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ success: false, message: "사용자 ID가 필요합니다." });
      }
      const conversations = await storage.getConversationsForUser(userId as string);
      return res.json({ success: true, conversations });
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const { user1Id, user2Id } = req.body;
      
      if (!user1Id || !user2Id) {
        return res.status(400).json({ success: false, message: "두 사용자 ID가 필요합니다." });
      }

      let conversation = await storage.getConversationByUsers(user1Id, user2Id);
      
      if (!conversation) {
        conversation = await storage.createConversation({ user1Id, user2Id });
      }

      return res.json({ success: true, conversation });
    } catch (error) {
      console.error("Create conversation error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ success: false, message: "대화를 찾을 수 없습니다." });
      }
      return res.json({ success: true, conversation });
    } catch (error) {
      console.error("Get conversation error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Message endpoints
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.id);
      return res.json({ success: true, messages });
    } catch (error) {
      console.error("Get messages error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { senderId, receiverId, content } = req.body;
      
      if (!senderId || !receiverId || !content) {
        return res.status(400).json({ success: false, message: "메시지 정보가 필요합니다." });
      }

      const message = await storage.createMessage({
        conversationId: req.params.id,
        senderId,
        receiverId,
        content,
      });

      return res.json({ success: true, message });
    } catch (error) {
      console.error("Create message error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.patch("/api/conversations/:id/read", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: "사용자 ID가 필요합니다." });
      }
      await storage.markMessagesAsRead(req.params.id, userId);
      return res.json({ success: true });
    } catch (error) {
      console.error("Mark messages read error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Payment request endpoints
  app.post("/api/payment-requests", async (req, res) => {
    try {
      const { userId, depositorName } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: "사용자 ID가 필요합니다." });
      }

      const existingRequest = await storage.getPaymentRequestByUser(userId);
      if (existingRequest && existingRequest.status === "pending") {
        return res.status(400).json({ 
          success: false, 
          message: "이미 처리 대기 중인 결제 요청이 있습니다." 
        });
      }

      const paymentRequest = await storage.createPaymentRequest({
        userId,
        depositorName: depositorName || null,
        amount: 250000,
        status: "pending",
      });

      return res.json({ success: true, paymentRequest });
    } catch (error) {
      console.error("Create payment request error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.get("/api/payment-requests/user/:userId", async (req, res) => {
    try {
      const paymentRequest = await storage.getPaymentRequestByUser(req.params.userId);
      return res.json({ success: true, paymentRequest });
    } catch (error) {
      console.error("Get payment request error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Admin endpoints
  app.get("/api/admin/payment-requests", async (req, res) => {
    try {
      const { status } = req.query;
      const requests = status === "pending" 
        ? await storage.getPendingPaymentRequests()
        : await storage.getAllPaymentRequests();
      return res.json({ success: true, requests });
    } catch (error) {
      console.error("Get all payment requests error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.post("/api/admin/payment-requests/:id/approve", async (req, res) => {
    try {
      const { adminId } = req.body;
      const request = await storage.approvePaymentRequest(req.params.id, adminId || "admin");
      if (!request) {
        return res.status(404).json({ success: false, message: "결제 요청을 찾을 수 없습니다." });
      }
      return res.json({ success: true, request });
    } catch (error) {
      console.error("Approve payment request error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.post("/api/admin/payment-requests/:id/reject", async (req, res) => {
    try {
      const { adminId, notes } = req.body;
      const request = await storage.rejectPaymentRequest(req.params.id, adminId || "admin", notes);
      if (!request) {
        return res.status(404).json({ success: false, message: "결제 요청을 찾을 수 없습니다." });
      }
      return res.json({ success: true, request });
    } catch (error) {
      console.error("Reject payment request error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Helper function to calculate membership status
  function getMembershipStatus(user: any): { status: string; statusLabel: string; daysLeft?: number } {
    const now = new Date();
    
    // Check banned first (highest priority)
    if (user.isBanned) {
      return { status: 'banned', statusLabel: '영구 차단' };
    }
    
    // Check suspended
    if (user.isSuspended) {
      return { status: 'suspended', statusLabel: '정지' };
    }
    
    // For female users, check phone verification
    if (user.gender === 'female') {
      if (user.phoneVerified) {
        return { status: 'active', statusLabel: '휴대폰 인증 완료' };
      } else {
        return { status: 'not_verified', statusLabel: '휴대폰 미인증' };
      }
    }
    
    // For male users, check King membership
    // Check if not a King member or no start date
    if (!user.isKingMember || !user.kingMembershipStartDate) {
      if (!user.phoneVerified) {
        return { status: 'not_verified', statusLabel: '휴대폰 미인증' };
      }
      return { status: 'no_membership', statusLabel: '킹 미가입' };
    }
    
    const startDate = new Date(user.kingMembershipStartDate);
    const expiryDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check expired
    if (daysLeft <= 0) {
      return { status: 'expired', statusLabel: '만료', daysLeft: 0 };
    }
    
    // Check expiring soon (within 7 days)
    if (daysLeft <= 7) {
      return { status: 'expiring_soon', statusLabel: `만료 ${daysLeft}일 전`, daysLeft };
    }
    
    // Active
    return { status: 'active', statusLabel: '킹 멤버십 활성', daysLeft };
  }

  // Get all members with detailed status
  app.get("/api/admin/members", async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const allPaymentRequests = await storage.getAllPaymentRequests();
      const now = new Date();
      
      // Get payment request info by user (latest approved and pending)
      const paymentInfoByUser = new Map<string, { 
        pendingRequest?: { requestedAt: Date; depositorName: string };
        approvedRequest?: { requestedAt: Date; processedAt: Date; depositorName: string };
        paymentCount: number;
      }>();
      
      allPaymentRequests.forEach((paymentReq) => {
        const existing = paymentInfoByUser.get(paymentReq.userId) || { paymentCount: 0 };
        
        if (paymentReq.status === 'pending') {
          existing.pendingRequest = {
            requestedAt: paymentReq.requestedAt!,
            depositorName: paymentReq.depositorName || '',
          };
        } else if (paymentReq.status === 'approved') {
          existing.paymentCount++;
          // Keep the latest approved request
          if (!existing.approvedRequest || 
              (paymentReq.processedAt && existing.approvedRequest.processedAt < paymentReq.processedAt)) {
            existing.approvedRequest = {
              requestedAt: paymentReq.requestedAt!,
              processedAt: paymentReq.processedAt!,
              depositorName: paymentReq.depositorName || '',
            };
          }
        }
        paymentInfoByUser.set(paymentReq.userId, existing);
      });
      
      const members = allUsers.map(user => {
        let membershipInfo = getMembershipStatus(user);
        const paymentInfo = paymentInfoByUser.get(user.id);
        
        // Override status if has pending payment (only if not banned/suspended)
        if (paymentInfo?.pendingRequest && 
            membershipInfo.status !== 'banned' && 
            membershipInfo.status !== 'suspended') {
          membershipInfo = { status: 'payment_pending', statusLabel: '결제 대기' };
        }
        
        const startDate = user.kingMembershipStartDate ? new Date(user.kingMembershipStartDate) : null;
        const expiryDate = startDate ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
        
        // Timeline data
        const depositDate = paymentInfo?.pendingRequest?.requestedAt || paymentInfo?.approvedRequest?.requestedAt;
        const approvalDate = paymentInfo?.approvedRequest?.processedAt;
        const isRenewal = (paymentInfo?.paymentCount || 0) > 1;
        
        return {
          id: user.id,
          name: user.name,
          age: user.age,
          gender: user.gender,
          phoneNumber: user.phoneNumber,
          location: user.location,
          occupation: user.occupation,
          isKingMember: user.isKingMember,
          kingMembershipStartDate: user.kingMembershipStartDate,
          kingMembershipExpiry: expiryDate?.toISOString(),
          isSuspended: user.isSuspended,
          suspendedAt: user.suspendedAt,
          suspendedReason: user.suspendedReason,
          isBanned: user.isBanned,
          bannedAt: user.bannedAt,
          bannedReason: user.bannedReason,
          createdAt: user.createdAt,
          membershipStatus: membershipInfo.status,
          membershipStatusLabel: membershipInfo.statusLabel,
          daysLeft: membershipInfo.daysLeft,
          // Timeline fields
          depositDate: depositDate?.toISOString?.() || depositDate,
          approvalDate: approvalDate?.toISOString?.() || approvalDate,
          depositorName: paymentInfo?.pendingRequest?.depositorName || paymentInfo?.approvedRequest?.depositorName,
          isRenewal,
          renewalCount: paymentInfo?.paymentCount || 0,
        };
      });
      
      return res.json({ success: true, members });
    } catch (error) {
      console.error("Get members error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Get all conversations for admin
  app.get("/api/admin/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversationsForAdmin();
      return res.json({ success: true, conversations });
    } catch (error) {
      console.error("Get admin conversations error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Get messages for a specific conversation (admin)
  app.get("/api/admin/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ success: false, message: "대화를 찾을 수 없습니다." });
      }
      
      const messages = await storage.getMessages(id);
      const user1 = await storage.getUser(conversation.user1Id);
      const user2 = await storage.getUser(conversation.user2Id);
      
      return res.json({ 
        success: true, 
        conversation: {
          ...conversation,
          user1,
          user2,
        },
        messages 
      });
    } catch (error) {
      console.error("Get admin conversation messages error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Suspend a user
  app.post("/api/admin/users/:userId/suspend", async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      
      await storage.updateUser(userId, {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason || '관리자에 의해 정지됨',
      });
      
      return res.json({ success: true, message: "사용자가 정지되었습니다." });
    } catch (error) {
      console.error("Suspend user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Unsuspend a user
  app.post("/api/admin/users/:userId/unsuspend", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      
      await storage.updateUser(userId, {
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null,
      });
      
      return res.json({ success: true, message: "사용자 정지가 해제되었습니다." });
    } catch (error) {
      console.error("Unsuspend user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Ban a user
  app.post("/api/admin/users/:userId/ban", async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      
      await storage.updateUser(userId, {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason || '관리자에 의해 영구 차단됨',
        isKingMember: false,
      });
      
      return res.json({ success: true, message: "사용자가 영구 차단되었습니다." });
    } catch (error) {
      console.error("Ban user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Unban a user
  app.post("/api/admin/users/:userId/unban", async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      
      await storage.updateUser(userId, {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      });
      
      return res.json({ success: true, message: "사용자 차단이 해제되었습니다." });
    } catch (error) {
      console.error("Unban user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  app.post("/api/admin/users/:userId/reset-password", async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "비밀번호는 최소 6자 이상이어야 합니다." });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { passwordHash });
      
      return res.json({ success: true, message: "비밀번호가 변경되었습니다." });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Legacy endpoint for backward compatibility
  app.get("/api/admin/active-members", async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const now = new Date();
      const activeMembers = allUsers
        .filter(user => {
          if (user.isBanned || user.isSuspended) return false;
          if (!user.isKingMember) return false;
          if (!user.kingMembershipStartDate) return false;
          const expiryDate = new Date(user.kingMembershipStartDate);
          expiryDate.setDate(expiryDate.getDate() + 30);
          return expiryDate > now;
        })
        .map(user => {
          const startDate = user.kingMembershipStartDate ? new Date(user.kingMembershipStartDate) : null;
          const expiryDate = startDate ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
          return {
            id: user.id,
            name: user.name,
            age: user.age,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            location: user.location,
            occupation: user.occupation,
            kingMembershipStartDate: user.kingMembershipStartDate,
            kingMembershipExpiry: expiryDate?.toISOString(),
            createdAt: user.createdAt,
          };
        });
      return res.json({ success: true, members: activeMembers });
    } catch (error) {
      console.error("Get active members error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Seed mock users to database
  app.post("/api/admin/seed-mock-users", async (req, res) => {
    try {
      const femaleNames = ["소연", "지우", "민정", "유나", "하영", "수현", "은지", "다혜"];
      const maleNames = ["준호", "민호", "서준", "태현", "우진", "현수", "지훈", "동우"];
      const locations = ["서울", "부산", "인천", "대구", "대전", "광주"];
      const occupations = ["디자이너", "엔지니어", "의사", "교사", "아티스트", "마케터", "금융인", "사업가"];
      const hobbies = ["여행", "독서", "운동", "음악", "요리", "사진", "게임", "등산"];
      const foods = ["한식", "일식", "양식", "태국음식", "커피", "와인", "디저트", "건강식"];

      const createdUsers = [];
      const hashedPassword = await bcrypt.hash("test1234", 10);

      for (let i = 0; i < femaleNames.length; i++) {
        const name = femaleNames[i];
        const phoneNumber = `010${String(1000 + i).padStart(4, '0')}0001`;
        
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) continue;

        const user = await storage.createUser({
          phoneNumber,
          passwordHash: hashedPassword,
          name,
          age: 22 + i,
          gender: "female",
          location: locations[i % locations.length],
          occupation: occupations[i % occupations.length],
          hobbies: hobbies.slice(0, 3),
          foodPreferences: foods.slice(0, 2),
          bio: "진정한 만남을 찾고 있어요.",
          photos: [],
          phoneVerified: true,
        });
        createdUsers.push(user);
      }

      for (let i = 0; i < maleNames.length; i++) {
        const name = maleNames[i];
        const phoneNumber = `010${String(2000 + i).padStart(4, '0')}0002`;
        
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) continue;

        const user = await storage.createUser({
          phoneNumber,
          passwordHash: hashedPassword,
          name,
          age: 26 + i,
          gender: "male",
          location: locations[i % locations.length],
          occupation: occupations[i % occupations.length],
          hobbies: hobbies.slice(0, 3),
          foodPreferences: foods.slice(0, 2),
          bio: "새로운 인연을 기다리고 있습니다.",
          photos: [],
          phoneVerified: true,
          isKingMember: true,
          kingMembershipStartDate: new Date(),
          kingMembershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });
        createdUsers.push(user);
      }

      return res.json({ 
        success: true, 
        message: `${createdUsers.length}명의 테스트 사용자가 추가되었습니다.`,
        count: createdUsers.length 
      });
    } catch (error) {
      console.error("Seed mock users error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Delete user (admin)
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }

      await storage.deleteUser(userId);
      return res.json({ success: true, message: "사용자가 삭제되었습니다." });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Reset all data (admin only - for development/testing)
  app.post("/api/admin/reset-all", async (req, res) => {
    try {
      // Only works with InMemoryStorage
      if (typeof (storage as any).reset === 'function') {
        (storage as any).reset();
        console.log('[Admin] All data has been reset');
        return res.json({ success: true, message: "모든 데이터가 초기화되었습니다." });
      } else {
        return res.status(400).json({
          success: false,
          message: "데이터베이스 모드에서는 초기화할 수 없습니다. InMemoryStorage만 지원합니다."
        });
      }
    } catch (error) {
      console.error("Reset all data error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Admin login page
  app.get("/admin", (req, res) => {
    const loginTemplatePath = path.resolve(process.cwd(), "server", "templates", "admin-login.html");
    const html = fs.readFileSync(loginTemplatePath, "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });

  // Admin dashboard (after login)
  app.get("/admin/dashboard", (req, res) => {
    const adminTemplatePath = path.resolve(process.cwd(), "server", "templates", "admin.html");
    const html = fs.readFileSync(adminTemplatePath, "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });

  // Admin login verification
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME || "kingdate_admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "kingdate2026!";
    
    if (username === adminUsername && password === adminPassword) {
      return res.json({ success: true, token: "admin_session_" + Date.now() });
    }
    return res.status(401).json({ success: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
  });

  const httpServer = createServer(app);

  return httpServer;
}
