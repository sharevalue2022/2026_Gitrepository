import { users, conversations, messages, paymentRequests, reports, blocks, csMemos, type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage, type PaymentRequest, type InsertPaymentRequest, type Report, type InsertReport, type Block, type InsertBlock, type CsMemo, type InsertCsMemo } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, ne, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getUsers(excludeId?: string, gender?: string): Promise<User[]>;
  
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationByUsers(user1Id: string, user2Id: string): Promise<Conversation | undefined>;
  getConversationsForUser(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message })[]>;
  createConversation(conv: InsertConversation): Promise<Conversation>;
  
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getAllConversationsForAdmin(): Promise<(Conversation & { user1: User; user2: User; lastMessage?: Message; messageCount: number; user1MessageCount: number; user2MessageCount: number; isOneWay: boolean })[]>;

  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequest(id: string): Promise<PaymentRequest | undefined>;
  getPaymentRequestByUser(userId: string): Promise<PaymentRequest | undefined>;
  getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]>;
  getAllPaymentRequests(): Promise<(PaymentRequest & { user: User })[]>;
  getPendingPaymentRequests(): Promise<(PaymentRequest & { user: User })[]>;
  approvePaymentRequest(id: string, adminId: string): Promise<PaymentRequest | undefined>;
  rejectPaymentRequest(id: string, adminId: string, notes?: string): Promise<PaymentRequest | undefined>;

  createReport(report: InsertReport): Promise<Report>;
  getReportsByUserId(userId: string): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  createBlock(block: InsertBlock): Promise<Block>;
  getBlocksByUserId(userId: string): Promise<Block[]>;
  isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean>;
  getRiskyUsers(): Promise<(User & { reportCount: number; blockCount: number })[]>;

  getDashboardKPI(): Promise<{
    activeMaleUsers: number;
    activeFemaleUsers: number;
    pendingPayments: number;
    newPaidConversionsThisMonth: number;
    expiringUsersIn7Days: number;
    genderRatioHistory: { date: string; maleCount: number; femaleCount: number }[];
  }>;

  createCsMemo(memo: InsertCsMemo): Promise<CsMemo>;
  getCsMemosByUserId(userId: string): Promise<CsMemo[]>;
  updateCsMemo(id: string, memo: string, adminId: string): Promise<CsMemo | undefined>;
  deleteCsMemo(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, lastActive: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    // First delete related records to avoid foreign key violations
    // Delete messages where user is sender or receiver
    await db.delete(messages).where(or(
      eq(messages.senderId, id),
      eq(messages.receiverId, id)
    ));
    
    // Delete conversations where user is participant
    await db.delete(conversations).where(or(
      eq(conversations.user1Id, id),
      eq(conversations.user2Id, id)
    ));
    
    // Delete payment requests
    await db.delete(paymentRequests).where(eq(paymentRequests.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(excludeId?: string, gender?: string): Promise<User[]> {
    let query = db.select().from(users);
    
    if (excludeId && gender) {
      return await db.select().from(users)
        .where(and(
          eq(users.gender, gender),
          eq(users.id, excludeId) ? undefined : undefined
        ))
        .orderBy(desc(users.lastActive));
    }
    
    if (gender) {
      return await db.select().from(users)
        .where(eq(users.gender, gender))
        .orderBy(desc(users.lastActive));
    }
    
    return await db.select().from(users).orderBy(desc(users.lastActive));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv || undefined;
  }

  async getConversationByUsers(user1Id: string, user2Id: string): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations)
      .where(or(
        and(eq(conversations.user1Id, user1Id), eq(conversations.user2Id, user2Id)),
        and(eq(conversations.user1Id, user2Id), eq(conversations.user2Id, user1Id))
      ));
    return conv || undefined;
  }

  async getConversationsForUser(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message })[]> {
    const convs = await db.select().from(conversations)
      .where(or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      ))
      .orderBy(desc(conversations.lastMessageAt));

    const result = await Promise.all(convs.map(async (conv: Conversation) => {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      
      const [lastMessage] = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      return {
        ...conv,
        otherUser: otherUser!,
        lastMessage,
      };
    }));

    return result;
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(conv)
      .returning();
    return conversation;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(msg)
      .returning();
    
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, msg.conversationId));

    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.read, false)
      ));
  }

  async getAllConversationsForAdmin(): Promise<(Conversation & { user1: User; user2: User; lastMessage?: Message; messageCount: number; user1MessageCount: number; user2MessageCount: number; isOneWay: boolean })[]> {
    const convs = await db.select().from(conversations)
      .orderBy(desc(conversations.lastMessageAt));

    const result = await Promise.all(convs.map(async (conv: Conversation) => {
      const [user1] = await db.select().from(users).where(eq(users.id, conv.user1Id));
      const [user2] = await db.select().from(users).where(eq(users.id, conv.user2Id));
      
      const [lastMessage] = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const allMessages = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id));

      const user1MessageCount = allMessages.filter((m: Message) => m.senderId === conv.user1Id).length;
      const user2MessageCount = allMessages.filter((m: Message) => m.senderId === conv.user2Id).length;
      const isOneWay = user1MessageCount === 0 || user2MessageCount === 0;

      return {
        ...conv,
        user1: user1!,
        user2: user2!,
        lastMessage,
        messageCount: allMessages.length,
        user1MessageCount,
        user2MessageCount,
        isOneWay,
      };
    }));

    return result;
  }

  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [paymentRequest] = await db
      .insert(paymentRequests)
      .values(request)
      .returning();
    return paymentRequest;
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id));
    return request || undefined;
  }

  async getPaymentRequestByUser(userId: string): Promise<PaymentRequest | undefined> {
    const [request] = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.userId, userId))
      .orderBy(desc(paymentRequests.requestedAt))
      .limit(1);
    return request || undefined;
  }

  async getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]> {
    const requests = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.userId, userId))
      .orderBy(desc(paymentRequests.requestedAt));
    return requests;
  }

  async getAllPaymentRequests(): Promise<(PaymentRequest & { user: User })[]> {
    const requests = await db.select().from(paymentRequests)
      .orderBy(desc(paymentRequests.requestedAt));
    
    const result = await Promise.all(requests.map(async (req: PaymentRequest) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.userId));
      return { ...req, user: user! };
    }));
    
    return result;
  }

  async getPendingPaymentRequests(): Promise<(PaymentRequest & { user: User })[]> {
    const requests = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.status, "pending"))
      .orderBy(desc(paymentRequests.requestedAt));
    
    const result = await Promise.all(requests.map(async (req: PaymentRequest) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.userId));
      return { ...req, user: user! };
    }));
    
    return result;
  }

  async approvePaymentRequest(id: string, adminId: string): Promise<PaymentRequest | undefined> {
    const [request] = await db.update(paymentRequests)
      .set({ 
        status: "approved", 
        processedAt: new Date(),
        processedBy: adminId
      })
      .where(eq(paymentRequests.id, id))
      .returning();
    
    if (request) {
      await db.update(users)
        .set({ 
          isKingMember: true, 
          kingMembershipStartDate: new Date() 
        })
        .where(eq(users.id, request.userId));
    }
    
    return request || undefined;
  }

  async rejectPaymentRequest(id: string, adminId: string, notes?: string): Promise<PaymentRequest | undefined> {
    const [request] = await db.update(paymentRequests)
      .set({ 
        status: "rejected", 
        processedAt: new Date(),
        processedBy: adminId,
        notes: notes || null
      })
      .where(eq(paymentRequests.id, id))
      .returning();

    return request || undefined;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();

    // Increment report count for reported user
    await db.update(users)
      .set({ reportCount: sql`COALESCE(${users.reportCount}, 0) + 1` })
      .where(eq(users.id, insertReport.reportedUserId));

    return report;
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.reportedUserId, userId));
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const [block] = await db.insert(blocks).values(insertBlock).returning();

    // Increment block count for blocked user
    await db.update(users)
      .set({ blockCount: sql`COALESCE(${users.blockCount}, 0) + 1` })
      .where(eq(users.id, insertBlock.blockedUserId));

    return block;
  }

  async getBlocksByUserId(userId: string): Promise<Block[]> {
    return await db.select().from(blocks).where(eq(blocks.blockedUserId, userId));
  }

  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    const [block] = await db.select().from(blocks)
      .where(and(
        eq(blocks.blockerId, blockerId),
        eq(blocks.blockedUserId, blockedUserId)
      ));
    return !!block;
  }

  async getRiskyUsers(): Promise<(User & { reportCount: number; blockCount: number })[]> {
    const riskyUsers = await db.select().from(users)
      .where(or(
        sql`COALESCE(${users.reportCount}, 0) >= 5`,
        sql`COALESCE(${users.blockCount}, 0) >= 3`
      ))
      .orderBy(desc(sql`COALESCE(${users.reportCount}, 0) + COALESCE(${users.blockCount}, 0)`));

    return riskyUsers.map((u: User) => ({
      ...u,
      reportCount: u.reportCount || 0,
      blockCount: u.blockCount || 0,
    }));
  }

  async getDashboardKPI(): Promise<{
    activeMaleUsers: number;
    activeFemaleUsers: number;
    pendingPayments: number;
    newPaidConversionsThisMonth: number;
    expiringUsersIn7Days: number;
    genderRatioHistory: { date: string; maleCount: number; femaleCount: number }[];
  }> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Active male users
    const maleUsers = await db.select().from(users)
      .where(and(
        eq(users.gender, 'male'),
        eq(users.isBanned, false),
        eq(users.isSuspended, false)
      ));
    const activeMaleUsers = maleUsers.length;

    // Active female users
    const femaleUsers = await db.select().from(users)
      .where(and(
        eq(users.gender, 'female'),
        eq(users.isBanned, false),
        eq(users.isSuspended, false)
      ));
    const activeFemaleUsers = femaleUsers.length;

    // Pending payments
    const pendingRequests = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.status, 'pending'));
    const pendingPayments = pendingRequests.length;

    // New paid conversions this month
    const newConversions = await db.select().from(users)
      .where(and(
        eq(users.isKingMember, true),
        sql`${users.kingMembershipStartDate} >= ${startOfMonth}`
      ));
    const newPaidConversionsThisMonth = newConversions.length;

    // Expiring users in 7 days
    const allUsers = await db.select().from(users);
    const expiringUsers = allUsers.filter((user: User) => {
      if (!user.isKingMember || !user.kingMembershipStartDate) return false;
      const expiryDate = new Date(user.kingMembershipStartDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate >= now && expiryDate <= sevenDaysFromNow;
    });
    const expiringUsersIn7Days = expiringUsers.length;

    // Gender ratio history (last 30 days)
    const genderRatioHistory = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayUsers = await db.select().from(users)
        .where(sql`${users.createdAt} < ${nextDate}`);

      const maleCount = dayUsers.filter((u: User) => u.gender === 'male').length;
      const femaleCount = dayUsers.filter((u: User) => u.gender === 'female').length;

      genderRatioHistory.push({
        date: date.toISOString().split('T')[0],
        maleCount,
        femaleCount,
      });
    }

    return {
      activeMaleUsers,
      activeFemaleUsers,
      pendingPayments,
      newPaidConversionsThisMonth,
      expiringUsersIn7Days,
      genderRatioHistory,
    };
  }

  async createCsMemo(insertMemo: InsertCsMemo): Promise<CsMemo> {
    const [memo] = await db
      .insert(csMemos)
      .values(insertMemo)
      .returning();
    return memo;
  }

  async getCsMemosByUserId(userId: string): Promise<CsMemo[]> {
    const memos = await db
      .select()
      .from(csMemos)
      .where(eq(csMemos.userId, userId))
      .orderBy(desc(csMemos.createdAt));
    return memos;
  }

  async updateCsMemo(id: string, memoText: string, adminId: string): Promise<CsMemo | undefined> {
    const [updated] = await db
      .update(csMemos)
      .set({ memo: memoText, adminId, updatedAt: new Date() })
      .where(eq(csMemos.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCsMemo(id: string): Promise<void> {
    await db.delete(csMemos).where(eq(csMemos.id, id));
  }
}

// In-memory storage implementation (for when DATABASE_URL is not set)
class InMemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();
  private paymentRequests: Map<string, PaymentRequest> = new Map();
  private reports: Map<string, Report> = new Map();
  private blocks: Map<string, Block> = new Map();
  private csMemos: Map<string, CsMemo> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.phoneNumber === phoneNumber);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const user: User = {
      ...insertUser,
      id,
      reportCount: 0,
      blockCount: 0,
      createdAt: new Date(),
    } as User;
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getUsers(excludeId?: string, gender?: string): Promise<User[]> {
    let result = Array.from(this.users.values());
    if (excludeId) result = result.filter(u => u.id !== excludeId);
    if (gender) result = result.filter(u => u.gender === gender);
    return result;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationByUsers(user1Id: string, user2Id: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      c => (c.user1Id === user1Id && c.user2Id === user2Id) ||
           (c.user1Id === user2Id && c.user2Id === user1Id)
    );
  }

  async getConversationsForUser(userId: string): Promise<(Conversation & { otherUser: User; lastMessage?: Message })[]> {
    const userConvs = Array.from(this.conversations.values())
      .filter(c => c.user1Id === userId || c.user2Id === userId);

    const result = [];
    for (const conv of userConvs) {
      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const otherUser = await this.getUser(otherUserId);
      if (!otherUser) continue;

      const convMessages = Array.from(this.messages.values())
        .filter(m => m.conversationId === conv.id)
        .sort((a, b) => (b.createdAt || new Date()).getTime() - (a.createdAt || new Date()).getTime());

      result.push({
        ...conv,
        otherUser,
        lastMessage: convMessages[0],
      });
    }
    return result;
  }

  async createConversation(conv: InsertConversation): Promise<Conversation> {
    const id = crypto.randomUUID();
    const conversation: Conversation = {
      ...conv,
      id,
      createdAt: new Date(),
    } as Conversation;
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => (a.createdAt || new Date()).getTime() - (b.createdAt || new Date()).getTime());
  }

  async createMessage(msg: InsertMessage): Promise<Message> {
    const id = crypto.randomUUID();
    const message: Message = {
      ...msg,
      id,
      createdAt: new Date(),
      read: false,
    } as Message;
    this.messages.set(message.id, message);
    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    for (const [id, msg] of this.messages) {
      if (msg.conversationId === conversationId && msg.senderId !== userId) {
        this.messages.set(id, { ...msg, read: true });
      }
    }
  }

  async getAllConversationsForAdmin(): Promise<(Conversation & { user1: User; user2: User; lastMessage?: Message; messageCount: number; user1MessageCount: number; user2MessageCount: number; isOneWay: boolean })[]> {
    const result = [];
    for (const conv of this.conversations.values()) {
      const user1 = await this.getUser(conv.user1Id);
      const user2 = await this.getUser(conv.user2Id);
      if (!user1 || !user2) continue;

      const convMessages = Array.from(this.messages.values())
        .filter(m => m.conversationId === conv.id)
        .sort((a, b) => (b.createdAt || new Date()).getTime() - (a.createdAt || new Date()).getTime());

      const user1MessageCount = convMessages.filter(m => m.senderId === conv.user1Id).length;
      const user2MessageCount = convMessages.filter(m => m.senderId === conv.user2Id).length;

      result.push({
        ...conv,
        user1,
        user2,
        lastMessage: convMessages[0],
        messageCount: convMessages.length,
        user1MessageCount,
        user2MessageCount,
        isOneWay: user1MessageCount === 0 || user2MessageCount === 0,
      });
    }
    return result;
  }

  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const id = crypto.randomUUID();
    const paymentRequest: PaymentRequest = {
      ...request,
      id,
      requestedAt: new Date(),
      status: 'pending',
      processedAt: null,
      processedBy: null,
      amount: request.amount || 250000,
      depositorName: request.depositorName || null,
      notes: request.notes || null,
    } as PaymentRequest;
    this.paymentRequests.set(paymentRequest.id, paymentRequest);
    return paymentRequest;
  }

  async getPaymentRequest(id: string): Promise<PaymentRequest | undefined> {
    return this.paymentRequests.get(id);
  }

  async getPaymentRequestByUser(userId: string): Promise<PaymentRequest | undefined> {
    return Array.from(this.paymentRequests.values())
      .filter(r => r.userId === userId && r.status === 'pending')
      .sort((a, b) => (b.requestedAt || new Date()).getTime() - (a.requestedAt || new Date()).getTime())[0];
  }

  async getPaymentRequestsByUserId(userId: string): Promise<PaymentRequest[]> {
    return Array.from(this.paymentRequests.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => (b.requestedAt || new Date()).getTime() - (a.requestedAt || new Date()).getTime());
  }

  async getAllPaymentRequests(): Promise<(PaymentRequest & { user: User })[]> {
    const result = [];
    for (const req of this.paymentRequests.values()) {
      const user = await this.getUser(req.userId);
      if (!user) continue;
      result.push({ ...req, user });
    }
    return result.sort((a, b) => (b.requestedAt || new Date()).getTime() - (a.requestedAt || new Date()).getTime());
  }

  async getPendingPaymentRequests(): Promise<(PaymentRequest & { user: User })[]> {
    const all = await this.getAllPaymentRequests();
    return all.filter(r => r.status === 'pending');
  }

  async approvePaymentRequest(id: string, adminId: string): Promise<PaymentRequest | undefined> {
    const request = this.paymentRequests.get(id);
    if (!request) return undefined;

    const updated = {
      ...request,
      status: 'approved' as const,
      processedAt: new Date(),
      processedBy: adminId,
    };
    this.paymentRequests.set(id, updated);

    // Update user to be king member
    const user = await this.getUser(request.userId);
    if (user) {
      await this.updateUser(user.id, {
        isKingMember: true,
        kingMembershipStartDate: new Date(),
      });
    }

    return updated;
  }

  async rejectPaymentRequest(id: string, adminId: string, notes?: string): Promise<PaymentRequest | undefined> {
    const request = this.paymentRequests.get(id);
    if (!request) return undefined;

    const updated = {
      ...request,
      status: 'rejected' as const,
      processedAt: new Date(),
      processedBy: adminId,
      notes: notes || null,
    };
    this.paymentRequests.set(id, updated);
    return updated;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const report: Report = {
      ...insertReport,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      description: insertReport.description || null,
      messageSnapshot: insertReport.messageSnapshot || null,
    };
    this.reports.set(report.id, report);

    // Increment report count for reported user
    const user = this.users.get(insertReport.reportedUserId);
    if (user) {
      const updated = { ...user, reportCount: (user.reportCount || 0) + 1 };
      this.users.set(user.id, updated);
    }

    return report;
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(r => r.reportedUserId === userId);
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const block: Block = {
      ...insertBlock,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.blocks.set(block.id, block);

    // Increment block count for blocked user
    const user = this.users.get(insertBlock.blockedUserId);
    if (user) {
      const updated = { ...user, blockCount: (user.blockCount || 0) + 1 };
      this.users.set(user.id, updated);
    }

    return block;
  }

  async getBlocksByUserId(userId: string): Promise<Block[]> {
    return Array.from(this.blocks.values()).filter(b => b.blockedUserId === userId);
  }

  async getRiskyUsers(): Promise<(User & { reportCount: number; blockCount: number })[]> {
    return Array.from(this.users.values())
      .filter(u => (u.reportCount || 0) >= 5 || (u.blockCount || 0) >= 3)
      .map(u => ({
        ...u,
        reportCount: u.reportCount || 0,
        blockCount: u.blockCount || 0,
      }))
      .sort((a, b) => (b.reportCount + b.blockCount) - (a.reportCount + a.blockCount));
  }

  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    const blocks = Array.from(this.blocks.values());
    return blocks.some(b => b.blockerId === blockerId && b.blockedUserId === blockedUserId);
  }

  async getDashboardKPI(): Promise<{
    activeMaleUsers: number;
    activeFemaleUsers: number;
    pendingPayments: number;
    newPaidConversionsThisMonth: number;
    expiringUsersIn7Days: number;
    genderRatioHistory: { date: string; maleCount: number; femaleCount: number }[];
  }> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const allUsers = Array.from(this.users.values());
    const allPaymentRequests = Array.from(this.paymentRequests.values());

    // Active male users
    const activeMaleUsers = allUsers.filter(u =>
      u.gender === 'male' && !u.isBanned && !u.isSuspended
    ).length;

    // Active female users
    const activeFemaleUsers = allUsers.filter(u =>
      u.gender === 'female' && !u.isBanned && !u.isSuspended
    ).length;

    // Pending payments
    const pendingPayments = allPaymentRequests.filter(r => r.status === 'pending').length;

    // New paid conversions this month
    const newPaidConversionsThisMonth = allUsers.filter(u => {
      if (!u.isKingMember || !u.kingMembershipStartDate) return false;
      const startDate = new Date(u.kingMembershipStartDate);
      return startDate >= startOfMonth;
    }).length;

    // Expiring users in 7 days
    const expiringUsersIn7Days = allUsers.filter(u => {
      if (!u.isKingMember || !u.kingMembershipStartDate) return false;
      const expiryDate = new Date(u.kingMembershipStartDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate >= now && expiryDate <= sevenDaysFromNow;
    }).length;

    // Gender ratio history (last 30 days)
    const genderRatioHistory = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayUsers = allUsers.filter(u => {
        const createdAt = new Date(u.createdAt!);
        return createdAt < nextDate;
      });

      const maleCount = dayUsers.filter((u: User) => u.gender === 'male').length;
      const femaleCount = dayUsers.filter((u: User) => u.gender === 'female').length;

      genderRatioHistory.push({
        date: date.toISOString().split('T')[0],
        maleCount,
        femaleCount,
      });
    }

    return {
      activeMaleUsers,
      activeFemaleUsers,
      pendingPayments,
      newPaidConversionsThisMonth,
      expiringUsersIn7Days,
      genderRatioHistory,
    };
  }

  async createCsMemo(insertMemo: InsertCsMemo): Promise<CsMemo> {
    const id = `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const memo: CsMemo = {
      id,
      userId: insertMemo.userId,
      memo: insertMemo.memo,
      adminId: insertMemo.adminId,
      createdAt: now,
      updatedAt: now,
    };
    this.csMemos.set(id, memo);
    return memo;
  }

  async getCsMemosByUserId(userId: string): Promise<CsMemo[]> {
    const memos = Array.from(this.csMemos.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    return memos;
  }

  async updateCsMemo(id: string, memoText: string, adminId: string): Promise<CsMemo | undefined> {
    const existing = this.csMemos.get(id);
    if (!existing) return undefined;

    const updated: CsMemo = {
      ...existing,
      memo: memoText,
      adminId,
      updatedAt: new Date(),
    };
    this.csMemos.set(id, updated);
    return updated;
  }

  async deleteCsMemo(id: string): Promise<void> {
    this.csMemos.delete(id);
  }

  // Reset all data (for testing/development)
}

// Use InMemoryStorage if DATABASE_URL is not set, otherwise use DatabaseStorage
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new InMemoryStorage();
