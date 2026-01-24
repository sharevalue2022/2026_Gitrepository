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

      // Log admin action
      const user = await storage.getUser(request.userId);
      await storage.createAdminActionLog({
        adminId: adminId || "admin",
        action: "approve",
        targetUserId: request.userId,
        targetUserName: user?.name || "Unknown",
        details: `결제 승인 - 금액: ₩${request.amount.toLocaleString()}`,
      });

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

      // Log admin action
      const user = await storage.getUser(request.userId);
      await storage.createAdminActionLog({
        adminId: adminId || "admin",
        action: "reject",
        targetUserId: request.userId,
        targetUserName: user?.name || "Unknown",
        details: `결제 거절${notes ? ` - 사유: ${notes}` : ''}`,
      });

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
      const { reason, adminId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }

      await storage.updateUser(userId, {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason || '관리자에 의해 정지됨',
      });

      // Log admin action
      await storage.createAdminActionLog({
        adminId: adminId || "admin",
        action: "suspend",
        targetUserId: userId,
        targetUserName: user.name,
        details: reason || '관리자에 의해 정지됨',
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
      const { adminId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }

      await storage.updateUser(userId, {
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null,
      });

      // Log admin action
      await storage.createAdminActionLog({
        adminId: adminId || "admin",
        action: "unsuspend",
        targetUserId: userId,
        targetUserName: user.name,
        details: '정지 해제',
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
      const { reason, adminId } = req.body;

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

      // Log admin action
      await storage.createAdminActionLog({
        adminId: adminId || "admin",
        action: "block",
        targetUserId: userId,
        targetUserName: user.name,
        details: reason || '관리자에 의해 영구 차단됨',
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
      const { adminId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
      }

      await storage.updateUser(userId, {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      });

      // Log admin action
      await storage.createAdminActionLog({
        adminId: adminId || "admin",
        action: "unblock",
        targetUserId: userId,
        targetUserName: user.name,
        details: '영구 차단 해제',
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

  // Get risky users (admin)
  app.get("/api/admin/risky-users", async (req, res) => {
    try {
      const riskyUsers = await storage.getRiskyUsers();
      const formatted = riskyUsers.map(user => ({
        id: user.id,
        name: user.name,
        age: user.age,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        reportCount: user.reportCount || 0,
        blockCount: user.blockCount || 0,
        isSuspended: user.isSuspended,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
      }));
      return res.json({ success: true, users: formatted });
    } catch (error) {
      console.error("Get risky users error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Get dashboard KPI (admin)
  app.get("/api/admin/dashboard-kpi", async (req, res) => {
    try {
      const kpi = await storage.getDashboardKPI();
      return res.json({ success: true, kpi });
    } catch (error) {
      console.error("Get dashboard KPI error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Report user
  app.post("/api/reports", async (req, res) => {
    try {
      const { reporterId, reportedUserId, reason, description } = req.body;

      if (!reporterId || !reportedUserId || !reason) {
        return res.status(400).json({ success: false, message: "필수 정보가 누락되었습니다." });
      }

      // Capture message snapshot (last 10 messages in conversation)
      let messageSnapshot = null;
      try {
        const conversation = await storage.getConversationByUsers(reporterId, reportedUserId);
        if (conversation) {
          const messages = await storage.getMessages(conversation.id);
          const recentMessages = messages.slice(-10); // Get last 10 messages

          // Format messages for snapshot
          messageSnapshot = await Promise.all(
            recentMessages.map(async (msg) => {
              const sender = await storage.getUser(msg.senderId);
              return {
                id: msg.id,
                senderId: msg.senderId,
                senderName: sender?.name || "Unknown",
                content: msg.content,
                createdAt: msg.createdAt || new Date(),
              };
            })
          );
        }
      } catch (snapshotError) {
        console.error("[Report] Failed to capture message snapshot:", snapshotError);
        // Continue even if snapshot fails
      }

      const report = await storage.createReport({
        reporterId,
        reportedUserId,
        reason,
        description: description || null,
        messageSnapshot,
      });

      // Get updated report count
      const reportedUser = await storage.getUser(reportedUserId);
      const reportCount = reportedUser?.reportCount || 0;

      // Auto-moderation logic
      if (reportCount === 3) {
        console.log(`[Auto-Moderation] User ${reportedUserId} received warning (3 reports)`);

        // Send warning SMS
        if (reportedUser?.phoneNumber) {
          try {
            const { sendSMS } = await import("./lib/twilio.js");
            await sendSMS(
              reportedUser.phoneNumber,
              `[킹데이트 경고]\n신고 누적 3회로 인한 경고입니다.\n2회 추가 신고 시 계정이 7일간 정지됩니다.\n커뮤니티 가이드를 준수해주세요.`
            );
            console.log(`[Auto-Moderation] Warning SMS sent to ${reportedUser.phoneNumber}`);
          } catch (smsError) {
            console.error("[Auto-Moderation] Failed to send warning SMS:", smsError);
          }
        }
      } else if (reportCount >= 5) {
        await storage.updateUser(reportedUserId, {
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedReason: `신고 누적 ${reportCount}회로 인한 자동 정지 (7일)`,
        });
        console.log(`[Auto-Moderation] User ${reportedUserId} suspended for 7 days (${reportCount} reports)`);

        // Send suspension notification SMS
        if (reportedUser?.phoneNumber) {
          try {
            const { sendSMS } = await import("./lib/twilio.js");
            await sendSMS(
              reportedUser.phoneNumber,
              `[킹데이트 알림]\n신고 누적 ${reportCount}회로 인해 계정이 7일간 정지되었습니다.\n정지 기간: ${new Date().toLocaleDateString('ko-KR')} ~ ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}`
            );
            console.log(`[Auto-Moderation] Suspension SMS sent to ${reportedUser.phoneNumber}`);
          } catch (smsError) {
            console.error("[Auto-Moderation] Failed to send suspension SMS:", smsError);
          }
        }
      }

      return res.json({ success: true, report, reportCount });
    } catch (error) {
      console.error("Report user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Block user
  app.post("/api/blocks", async (req, res) => {
    try {
      const { blockerId, blockedUserId } = req.body;

      if (!blockerId || !blockedUserId) {
        return res.status(400).json({ success: false, message: "필수 정보가 누락되었습니다." });
      }

      const block = await storage.createBlock({
        blockerId,
        blockedUserId,
      });

      return res.json({ success: true, block });
    } catch (error) {
      console.error("Block user error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Check if blocked
  app.get("/api/blocks/check", async (req, res) => {
    try {
      const { userId, otherUserId } = req.query;

      if (!userId || !otherUserId) {
        return res.status(400).json({ success: false, message: "필수 정보가 누락되었습니다." });
      }

      const isBlockedByMe = await storage.isUserBlocked(userId as string, otherUserId as string);
      const hasBlockedMe = await storage.isUserBlocked(otherUserId as string, userId as string);

      return res.json({
        success: true,
        isBlockedByMe, // Current user blocked the other user
        hasBlockedMe, // Other user blocked current user
      });
    } catch (error) {
      console.error("Check block error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Get all reports (admin)
  app.get("/api/admin/reports", async (req, res) => {
    try {
      const allReports = await storage.getAllReports();

      // Format reports with user information
      const reportsWithUsers = await Promise.all(
        allReports.map(async (report) => {
          const reporter = await storage.getUser(report.reporterId);
          const reportedUser = await storage.getUser(report.reportedUserId);

          return {
            ...report,
            reporter: reporter ? {
              id: reporter.id,
              name: reporter.name,
              phoneNumber: reporter.phoneNumber,
              gender: reporter.gender,
              age: reporter.age,
            } : null,
            reportedUser: reportedUser ? {
              id: reportedUser.id,
              name: reportedUser.name,
              phoneNumber: reportedUser.phoneNumber,
              gender: reportedUser.gender,
              age: reportedUser.age,
              reportCount: reportedUser.reportCount,
              blockCount: reportedUser.blockCount,
              isSuspended: reportedUser.isSuspended,
              isBanned: reportedUser.isBanned,
            } : null,
          };
        })
      );

      return res.json({ success: true, reports: reportsWithUsers });
    } catch (error) {
      console.error("Get reports error:", error);
      return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  });

  // Seed mock users to database
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

  // CS Memos (Admin only)
  // Get CS memos for a user
  app.get("/api/admin/users/:userId/cs-memos", async (req, res) => {
    try {
      const { userId } = req.params;
      const memos = await storage.getCsMemosByUserId(userId);
      return res.json({ success: true, memos });
    } catch (error) {
      console.error("Get CS memos error:", error);
      return res.status(500).json({ success: false, message: "CS 메모 조회 중 오류가 발생했습니다." });
    }
  });

  // Create CS memo for a user
  app.post("/api/admin/users/:userId/cs-memos", async (req, res) => {
    try {
      const { userId } = req.params;
      const { memo, adminId } = req.body;

      if (!memo || !adminId) {
        return res.status(400).json({ success: false, message: "메모 내용과 관리자 ID는 필수입니다." });
      }

      const newMemo = await storage.createCsMemo({
        userId,
        memo,
        adminId,
      });

      return res.json({ success: true, memo: newMemo });
    } catch (error) {
      console.error("Create CS memo error:", error);
      return res.status(500).json({ success: false, message: "CS 메모 생성 중 오류가 발생했습니다." });
    }
  });

  // Update CS memo
  app.put("/api/admin/cs-memos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { memo, adminId } = req.body;

      if (!memo || !adminId) {
        return res.status(400).json({ success: false, message: "메모 내용과 관리자 ID는 필수입니다." });
      }

      const updated = await storage.updateCsMemo(id, memo, adminId);
      if (!updated) {
        return res.status(404).json({ success: false, message: "CS 메모를 찾을 수 없습니다." });
      }

      return res.json({ success: true, memo: updated });
    } catch (error) {
      console.error("Update CS memo error:", error);
      return res.status(500).json({ success: false, message: "CS 메모 수정 중 오류가 발생했습니다." });
    }
  });

  // Delete CS memo
  app.delete("/api/admin/cs-memos/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCsMemo(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete CS memo error:", error);
      return res.status(500).json({ success: false, message: "CS 메모 삭제 중 오류가 발생했습니다." });
    }
  });

  // Admin Action Logs (Admin only)
  // Get all admin action logs
  app.get("/api/admin/action-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAdminActionLogs(limit);
      return res.json({ success: true, logs });
    } catch (error) {
      console.error("Get admin action logs error:", error);
      return res.status(500).json({ success: false, message: "관리자 행동 로그 조회 중 오류가 발생했습니다." });
    }
  });

  // Get admin action logs for specific user
  app.get("/api/admin/action-logs/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getAdminActionLogsByUser(userId);
      return res.json({ success: true, logs });
    } catch (error) {
      console.error("Get user action logs error:", error);
      return res.status(500).json({ success: false, message: "사용자 행동 로그 조회 중 오류가 발생했습니다." });
    }
  });

  // Create admin action log
  app.post("/api/admin/action-logs", async (req, res) => {
    try {
      const { adminId, action, targetUserId, targetUserName, details } = req.body;

      if (!adminId || !action) {
        return res.status(400).json({ success: false, message: "필수 정보가 누락되었습니다." });
      }

      const log = await storage.createAdminActionLog({
        adminId,
        action,
        targetUserId: targetUserId || null,
        targetUserName: targetUserName || null,
        details: details || null,
      });

      return res.json({ success: true, log });
    } catch (error) {
      console.error("Create admin action log error:", error);
      return res.status(500).json({ success: false, message: "관리자 행동 로그 생성 중 오류가 발생했습니다." });
    }
  });

  // Reset all data (admin only - for development/testing)
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
