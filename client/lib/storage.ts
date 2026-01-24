import AsyncStorage from "@react-native-async-storage/async-storage";
import { Conversation, Message, UserProfile } from "@/types";
import { getApiUrl } from "@/lib/query-client";

const CONVERSATIONS_KEY_PREFIX = "@kingdate_conversations_";
const MESSAGES_KEY = "@kingdate_messages";
const MOCK_USERS_KEY = "@kingdate_mock_users_v4";
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
              return {
                id: conv.id,
                serverConversationId: conv.id,
                participantId: otherUser.id,
                participantName: otherUser.name,
                participantPhoto: otherUser.photos?.[0]?.url || "",
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
    const stored = await AsyncStorage.getItem(
      getConversationsKey(currentUserId),
    );
    return stored ? JSON.parse(stored) : [];
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
      console.log("Could not sync message to server");
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
    console.log("Could not fetch users from API, using mock data");
  }

  return getMockUsers(gender);
}

export async function getMockUsers(
  filterGender?: string,
): Promise<UserProfile[]> {
  try {
    const stored = await AsyncStorage.getItem(MOCK_USERS_KEY);
    let users: UserProfile[];
    if (stored) {
      users = JSON.parse(stored);
    } else {
      users = generateMockUsers();
      await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    }

    if (filterGender) {
      return users.filter((u) => u.gender === filterGender);
    }
    return users;
  } catch {
    return generateMockUsers();
  }
}

function generateMockUsers(): UserProfile[] {
  const femaleNames = [
    "소연",
    "지우",
    "민정",
    "유나",
    "하영",
    "수현",
    "은지",
    "다혜",
  ];
  const maleNames = [
    "준호",
    "민호",
    "서준",
    "태현",
    "우진",
    "현수",
    "지훈",
    "동우",
  ];
  const locations = ["서울", "부산", "인천", "대구", "대전", "광주"];
  const occupations = [
    "디자이너",
    "엔지니어",
    "의사",
    "교사",
    "아티스트",
    "마케터",
    "금융인",
    "사업가",
  ];
  const hobbies = [
    "여행",
    "독서",
    "운동",
    "음악",
    "요리",
    "사진",
    "게임",
    "등산",
  ];
  const foods = [
    "한식",
    "일식",
    "양식",
    "태국음식",
    "커피",
    "와인",
    "디저트",
    "건강식",
  ];

  const samplePhotos = [
    {
      url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop",
      approved: true,
    },
    {
      url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      approved: true,
    },
    {
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
      approved: true,
    },
    {
      url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
      approved: true,
    },
  ];

  const users: UserProfile[] = [];

  femaleNames.forEach((name, i) => {
    const hasPhotos = name === "은지" || name === "유나";
    users.push({
      id: `female_${i}`,
      gender: "female",
      name,
      age: 20 + i * 2 + Math.floor(Math.random() * 3),
      location: locations[Math.floor(Math.random() * locations.length)],
      occupation: occupations[Math.floor(Math.random() * occupations.length)],
      hobbies: hobbies.sort(() => 0.5 - Math.random()).slice(0, 3),
      foodPreferences: foods.sort(() => 0.5 - Math.random()).slice(0, 2),
      bio: "진정한 만남을 찾고 있어요.",
      photos: hasPhotos ? samplePhotos : [],
      isVerified: true,
      isKingMember: false,
      phoneVerified: true,
      profileComplete: true,
      onboardingComplete: true,
      lastActive: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      createdAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 3600000,
      ).toISOString(),
    });
  });

  maleNames.forEach((name, i) => {
    users.push({
      id: `male_${i}`,
      gender: "male",
      name,
      age: 26 + Math.floor(Math.random() * 10),
      location: locations[Math.floor(Math.random() * locations.length)],
      occupation: occupations[Math.floor(Math.random() * occupations.length)],
      hobbies: hobbies.sort(() => 0.5 - Math.random()).slice(0, 3),
      foodPreferences: foods.sort(() => 0.5 - Math.random()).slice(0, 2),
      bio: "새로운 인연을 기다리고 있습니다.",
      photos: [],
      isVerified: true,
      isKingMember: true,
      phoneVerified: true,
      profileComplete: true,
      onboardingComplete: true,
      lastActive: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      createdAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 3600000,
      ).toISOString(),
    });
  });

  return users;
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
    participantPhoto: participant.photos[0]?.url || "",
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
  const index = conversations.findIndex((c) => c.id === conversationId);
  if (index !== -1) {
    conversations[index].lastMessage = message;
    conversations[index].lastMessageTime = new Date().toISOString();
    const [updated] = conversations.splice(index, 1);
    conversations.unshift(updated);
    await saveConversations(conversations, currentUserId);
  }
}
