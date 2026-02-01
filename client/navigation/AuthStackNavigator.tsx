import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import WelcomeScreen from "@/screens/WelcomeScreen";
import LoginScreen from "@/screens/LoginScreen";
import GenderSelectionScreen from "@/screens/GenderSelectionScreen";
import ProfileSetupScreen from "@/screens/ProfileSetupScreen";
import OptionalProfileScreen from "@/screens/OptionalProfileScreen";
import PhoneVerificationScreen from "@/screens/PhoneVerificationScreen";
import SubscriptionScreen from "@/screens/SubscriptionScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Gender } from "@/types";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  GenderSelection: undefined;
  ProfileSetup: { gender: Gender };
  OptionalProfile: {
    gender: Gender;
    name: string;
    phoneNumber: string;
    password: string;
    age: number;
    location: string;
    occupation: string;
    hobbies: string[];
  };
  PhoneVerification: undefined;
  Subscription: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        headerShown: true,
        headerTitle: "",
        headerBackTitle: "뒤로",
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerTitle: "로그인" }}
      />
      <Stack.Screen
        name="GenderSelection"
        component={GenderSelectionScreen}
        options={{ headerTitle: "성별 선택" }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ headerTitle: "기본 정보" }}
      />
      <Stack.Screen
        name="OptionalProfile"
        component={OptionalProfileScreen}
        options={{ headerTitle: "추가 정보" }}
      />
      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
        options={{ headerTitle: "전화번호 인증" }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ headerTitle: "킹 멤버십" }}
      />
    </Stack.Navigator>
  );
}
