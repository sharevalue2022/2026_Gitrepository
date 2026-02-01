import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, Gender } from "@/types";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { setCurrentUserId } from "@/lib/storage";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  canSendMessages: boolean;
  login: (
    phoneNumber: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (user: UserProfile, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  setKingMembership: (isActive: boolean) => Promise<void>;
  setPhoneVerified: (verified: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@kingdate_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);

        // Set current user ID for conversation storage
        if (userData.id) {
          await setCurrentUserId(userData.id);
        }

        const isRealId =
          userData.id &&
          !userData.id.startsWith("local_") &&
          !userData.id.startsWith("user_");
        if (isRealId) {
          try {
            const res = await fetch(
              new URL(`/api/users/${userData.id}`, getApiUrl()).href,
            );
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.user) {
                const mergedUser = {
                  ...userData,
                  ...data.user,
                  onboardingComplete: userData.onboardingComplete,
                };
                setUser(mergedUser);
                await AsyncStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify(mergedUser),
                );
              }
            }
          } catch (e) {
            console.log("Could not sync with server, using local data");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    phoneNumber: string,
    password: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(new URL("/api/auth/login", getApiUrl()).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const userData = { ...data.user, onboardingComplete: true };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        // Set current user ID for user-specific conversation storage
        await setCurrentUserId(userData.id);
        setUser(userData);
        return { success: true };
      }
      return {
        success: false,
        message: data.message || "로그인에 실패했습니다.",
      };
    } catch (error) {
      console.error("Failed to login:", error);
      return { success: false, message: "로그인 중 오류가 발생했습니다." };
    }
  };

  const register = async (userData: UserProfile, password: string) => {
    try {
      let savedUser = userData;

      const isTemporaryId =
        !userData.id ||
        userData.id.startsWith("local_") ||
        userData.id.startsWith("user_");
      if (isTemporaryId) {
        try {
          const res = await apiRequest("POST", "/api/auth/register", {
            name: userData.name,
            age: userData.age,
            gender: userData.gender,
            location: userData.location,
            occupation: userData.occupation,
            bio: userData.bio,
            hobbies: userData.hobbies || [],
            foodPreferences: userData.foodPreferences || [],
            phoneNumber: userData.phoneNumber,
            phoneVerified: userData.phoneVerified || false,
            isKingMember: userData.isKingMember || false,
            password: password,
            religion: userData.religion,
            drinking: userData.drinking,
            smoking: userData.smoking,
            education: userData.education,
            maritalStatus: userData.maritalStatus,
            bodyType: userData.bodyType,
          });
          const data = await res.json();
          if (data.success && data.user) {
            savedUser = { ...userData, id: data.user.id };
          }
        } catch (e) {
          console.log("Could not save to server, using local storage only");
          savedUser = { ...userData, id: userData.id || `local_${Date.now()}` };
        }
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedUser));
      // Set current user ID for user-specific conversation storage
      if (savedUser.id) {
        await setCurrentUserId(savedUser.id);
      }
      setUser(savedUser);
    } catch (error) {
      console.error("Failed to save user:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      // Clear current user ID on logout
      await AsyncStorage.removeItem("@kingdate_current_user_id");
      setUser(null);
    } catch (error) {
      console.error("Failed to logout:", error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };

    const isRealId =
      user.id && !user.id.startsWith("local_") && !user.id.startsWith("user_");
    if (isRealId) {
      try {
        await apiRequest("PATCH", `/api/users/${user.id}`, updates);
      } catch (e) {
        console.log("Could not sync update to server");
      }
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const setKingMembership = async (isActive: boolean) => {
    if (!user) return;
    const expiry = isActive
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    await updateUser({
      isKingMember: isActive,
      kingMembershipExpiry: expiry,
    });
  };

  const setPhoneVerified = async (verified: boolean) => {
    await updateUser({ phoneVerified: verified });
  };

  const completeOnboarding = async () => {
    await updateUser({ onboardingComplete: true });
  };

  const refreshUser = async () => {
    if (!user) return;

    const isRealId =
      user.id && !user.id.startsWith("local_") && !user.id.startsWith("user_");
    if (!isRealId) return;

    try {
      const res = await fetch(
        new URL(`/api/users/${user.id}`, getApiUrl()).href,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const refreshedUser = {
            ...user,
            ...data.user,
            onboardingComplete: user.onboardingComplete,
          };
          setUser(refreshedUser);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedUser));
          console.log("User data refreshed from server");
        }
      }
    } catch (e) {
      console.log("Could not refresh user data from server");
    }
  };

  const checkCanSendMessages = (): boolean => {
    if (!user) return false;
    if (!user.phoneVerified) return false;
    if (user.gender === "female") return true;
    if (!user.isKingMember) return false;
    if (!user.kingMembershipExpiry) return false;
    const expiryDate = new Date(user.kingMembershipExpiry);
    const now = new Date();
    return now < expiryDate;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!user.onboardingComplete,
        canSendMessages: checkCanSendMessages(),
        login,
        register,
        logout,
        updateUser,
        setKingMembership,
        setPhoneVerified,
        completeOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
