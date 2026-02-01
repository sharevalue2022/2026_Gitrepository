import AsyncStorage from "@react-native-async-storage/async-storage";
import { Conversation, Message, UserProfile } from "@/types";
import { getApiUrl } from "@/lib/query-client";

const CONVERSATIONS_KEY_PREFIX = "@kingdate_conversations_";
const MESSAGES_KEY = "@kingdate_messages";
const CURRENT_USER_KEY = "@kingdate_current_user_id";

export async function setCurrentUserId(userId: string): Promise<void> {
  await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
}

export async function getCurrentUserId(): Promise<string | null> {
  return await AsyncStorage.getItem(CURRENT_USER_KEY);
}

function getConversationsKey(userId: string): string {
  return `${CONVERSATIONS_KEY_PREFIX}${userId}`;
}

export async function getConversations(
  userId?: string,
): Promise<Conversation[]> {
  try {
    const currentUserId = userId || (await getCurrentUserId());
    if (!currentUserId) return [];

    // 로컬 저장소에서 기존 대화 정보 가져오기
    const localStored = await AsyncStorage.getItem(
      getConversationsKey(currentUserId),
    );
    const localConvs: Conversation[] = localStored ? JSON.parse(localStored) : [];

    // First try to fetch from server
    try {
      const url = new URL("/api/conversations", getApiUrl());
      url.searchParams.set("userId", currentUserId);
      const res = await fetch(url.href);
      if (res.ok) {
        const data = await res.json();
        if (
          data.success &&
          data.conversations &&
          data.conversations.length > 0
        ) {
          // Map server conversations to local format
          const serverConversations: Conversation[] = data.conversations.map(
            (conv: any) => {
              const otherUser = conv.otherUser;
              // participantId로 매칭되는 로컬 대화 찾기 (로컬 ID 유지)
              const localConv = localConvs.find(
                (lc) => lc.participantId === otherUser.id || lc.serverConversationId === conv.id
              );
              return {
                id: localConv?.id || conv.id, // 로컬 ID 유지, 없으면 서버 ID 사용
                serverConversationId: conv.id,
                participantId: otherUser.id,
                participantName: otherUser.name,
                participantPhoto: otherUser.photos?.find((p: any) => p.approved)?.url || "",
                participantGender: otherUser.gender,
                lastMessage: conv.lastMessage?.content || "",
                lastMessageTime: conv.lastMessageAt || conv.createdAt,
                unreadCount: 0,
              };
            },
          );
          // Save to local storage for offline access
          await saveConversations(serverConversations, currentUserId);
          return serverConversations;
        }
      }
    } catch (e) {
      console.log(
        "Could not fetch conversations from server, using local data",
      );
    }

    // Fall back to local storage
    return localConvs;
  } catch {
    return [];
  }
}

export async function saveConversations(
  conversations: Conversation[],
  userId?: string,
): Promise<void> {
  const currentUserId = userId || (await getCurrentUserId());
  if (!currentUserId) return;
  await AsyncStorage.setItem(
    getConversationsKey(currentUserId),
    JSON.stringify(conversations),
  );
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    // Try to fetch from server first
    try {
      const url = new URL(
        `/api/conversations/${conversationId}/messages`,
        getApiUrl(),
      );
      const res = await fetch(url.href);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.messages) {
          // Map server messages to local format
          const serverMessages: Message[] = data.messages.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            text: msg.content,
            timestamp: msg.createdAt,
            read: msg.read,
          }));
          // Save to local storage
          await saveMessages(conversationId, serverMessages);
          return serverMessages;
        }
      }
    } catch (e) {
      console.log("Could not fetch messages from server, using local data");
    }

    // Fall back to local storage
    const stored = await AsyncStorage.getItem(
      `${MESSAGES_KEY}_${conversationId}`,
    );
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveMessages(
  conversationId: string,
  messages: Message[],
): Promise<void> {
  await AsyncStorage.setItem(
    `${MESSAGES_KEY}_${conversationId}`,
    JSON.stringify(messages),
  );
}

export async function addMessage(
  conversationId: string,
  message: Message,
  recipientId?: string,
  serverConversationId?: string,
): Promise<void> {
  const messages = await getMessages(conversationId);
  messages.push(message);
  await saveMessages(conversationId, messages);

  // Sync to server if we have server conversation ID
  if (serverConversationId && recipientId) {
    try {
      const url = new URL(
        `/api/conversations/${serverConversationId}/messages`,
        getApiUrl(),
      );
      await fetch(url.href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: message.senderId,
          receiverId: recipientId,
          content: message.text,
        }),
      });
    } catch (e) {
      console.error("[Message Sync Error]", e);
      // 재시도 로직이나 큐 시스템 고려 가능
    }
  }
}

export async function getUsers(
  excludeId?: string,
  gender?: string,
): Promise<UserProfile[]> {
  try {
    const url = new URL("/api/users", getApiUrl());
    if (excludeId) url.searchParams.set("excludeId", excludeId);
    if (gender) url.searchParams.set("gender", gender);

    const res = await fetch(url.href);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.users && data.users.length > 0) {
        return data.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          age: u.age,
          gender: u.gender,
          location: u.location,
          occupation: u.occupation,
          bio: u.bio,
          hobbies: u.hobbies || [],
          foodPreferences: u.foodPreferences || [],
          photos: u.photos || [],
          isVerified: true,
          isKingMember: u.isKingMember,
          phoneVerified: u.phoneVerified,
          profileComplete: true,
          onboardingComplete: true,
          lastActive: u.lastActive,
          createdAt: u.createdAt,
        }));
      }
    }
  } catch (e) {
    console.log("Could not fetch users from API");
  }

  return [];
}

export async function createConversation(
  participant: UserProfile,
  currentUserId: string,
): Promise<Conversation> {
  const conversations = await getConversations(currentUserId);
  const existing = conversations.find(
    (c) => c.participantId === participant.id,
  );
  if (existing) return existing;

  let serverConversationId: string | undefined;

  // Create conversation on server
  try {
    const url = new URL("/api/conversations", getApiUrl());
    const res = await fetch(url.href, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user1Id: currentUserId,
        user2Id: participant.id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.conversation) {
        serverConversationId = data.conversation.id;
      }
    }
  } catch (e) {
    console.log("Could not create conversation on server");
  }

  const newConversation: Conversation = {
    id: `conv_${Date.now()}`,
    serverConversationId,
    participantId: participant.id,
    participantName: participant.name,
    participantPhoto: participant.photos?.find((p: any) => p.approved)?.url || "",
    participantGender: participant.gender,
    lastMessage: "",
    lastMessageTime: new Date().toISOString(),
    unreadCount: 0,
  };

  conversations.unshift(newConversation);
  await saveConversations(conversations, currentUserId);
  return newConversation;
}

export async function updateConversationLastMessage(
  conversationId: string,
  message: string,
  userId?: string,
): Promise<void> {
  const currentUserId = userId || (await getCurrentUserId());
  if (!currentUserId) return;

  const conversations = await getConversations(currentUserId);
  // 로컬 ID 또는 서버 ID로 검색
  const index = conversations.findIndex(
    (c) => c.id === conversationId || c.serverConversationId === conversationId
  );
  if (index !== -1) {
    conversations[index].lastMessage = message;
    conversations[index].lastMessageTime = new Date().toISOString();
    const [updated] = conversations.splice(index, 1);
    conversations.unshift(updated);
    await saveConversations(conversations, currentUserId);
  }
}
