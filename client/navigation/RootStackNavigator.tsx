import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import UserProfileScreen from "@/screens/UserProfileScreen";
import ChatScreen from "@/screens/ChatScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import PhoneVerificationScreen from "@/screens/PhoneVerificationScreen";
import AnnouncementsScreen from "@/screens/AnnouncementsScreen";
import AnnouncementDetailScreen from "@/screens/AnnouncementDetailScreen";
import UsageGuidesScreen from "@/screens/UsageGuidesScreen";
import UsageGuideDetailScreen from "@/screens/UsageGuideDetailScreen";
import PrivacySecurityScreen from "@/screens/PrivacySecurityScreen";
import TermsOfServiceScreen from "@/screens/TermsOfServiceScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/types";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  UserProfile: { user: UserProfile };
  Chat: { conversationId: string; participantName: string };
  EditProfile: undefined;
  PhoneVerification: { fromProfile?: boolean };
  Announcements: undefined;
  AnnouncementDetail: {
    announcement: {
      id: string;
      title: string;
      content: string;
      category: string;
      createdAt: string;
    };
  };
  UsageGuides: undefined;
  UsageGuideDetail: {
    guide: {
      id: string;
      title: string;
      content: string;
      order: number;
      createdAt: string;
    };
  };
  PrivacySecurity: undefined;
  TermsOfService: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthStackNavigator}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={({ route }) => ({
              headerTitle: route.params.user.name,
            })}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              headerTitle: route.params.participantName,
            })}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerTitle: "프로필 수정",
            }}
          />
          <Stack.Screen
            name="PhoneVerification"
            component={PhoneVerificationScreen}
            options={{
              headerTitle: "휴대폰 인증",
            }}
          />
          <Stack.Screen
            name="Announcements"
            component={AnnouncementsScreen}
            options={{
              headerTitle: "공지사항",
            }}
          />
          <Stack.Screen
            name="AnnouncementDetail"
            component={AnnouncementDetailScreen}
            options={{
              headerTitle: "공지사항",
            }}
          />
          <Stack.Screen
            name="UsageGuides"
            component={UsageGuidesScreen}
            options={{
              headerTitle: "이용 가이드",
            }}
          />
          <Stack.Screen
            name="UsageGuideDetail"
            component={UsageGuideDetailScreen}
            options={{
              headerTitle: "이용 가이드",
            }}
          />
          <Stack.Screen
            name="PrivacySecurity"
            component={PrivacySecurityScreen}
            options={{
              headerTitle: "개인정보 및 보안",
            }}
          />
          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{
              headerTitle: "이용약관",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
