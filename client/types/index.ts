export type Gender = "male" | "female";

export interface UserPhoto {
  url: string;
  approved: boolean;
}

export interface UserProfile {
  id: string;
  gender: Gender;
  name: string;
  age: number;
  location: string;
  occupation: string;
  hobbies: string[];
  foodPreferences: string[];
  bio: string;
  photos: UserPhoto[];
  religion?: string;
  drinking?: string;
  smoking?: string;
  education?: string;
  maritalStatus?: string;
  bodyType?: string;
  phoneNumber?: string;
  isVerified: boolean;
  isKingMember: boolean;
  kingMembershipStartDate?: string;
  kingMembershipExpiry?: string;
  phoneVerified: boolean;
  profileComplete: boolean;
  onboardingComplete: boolean;
  lastActive: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  serverConversationId?: string;
  participantId: string;
  participantName: string;
  participantPhoto: string;
  participantGender: Gender;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  isLoading: boolean;
}

export type OnboardingStep =
  | "welcome"
  | "gender"
  | "profile"
  | "verification"
  | "subscription";
