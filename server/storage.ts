import { users, conversations, messages, paymentRequests, type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage, type PaymentRequest, type InsertPaymentRequest } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc, ne } from "drizzle-orm";

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

    const result = await Promise.all(convs.map(async (conv) => {
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

    const result = await Promise.all(convs.map(async (conv) => {
      const [user1] = await db.select().from(users).where(eq(users.id, conv.user1Id));
      const [user2] = await db.select().from(users).where(eq(users.id, conv.user2Id));
      
      const [lastMessage] = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const allMessages = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id));

      const user1MessageCount = allMessages.filter(m => m.senderId === conv.user1Id).length;
      const user2MessageCount = allMessages.filter(m => m.senderId === conv.user2Id).length;
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
    
    const result = await Promise.all(requests.map(async (req) => {
      const [user] = await db.select().from(users).where(eq(users.id, req.userId));
      return { ...req, user: user! };
    }));
    
    return result;
  }

  async getPendingPaymentRequests(): Promise<(PaymentRequest & { user: User })[]> {
    const requests = await db.select().from(paymentRequests)
      .where(eq(paymentRequests.status, "pending"))
      .orderBy(desc(paymentRequests.requestedAt));
    
    const result = await Promise.all(requests.map(async (req) => {
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
}

export const storage = new DatabaseStorage();
