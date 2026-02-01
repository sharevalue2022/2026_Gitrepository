import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MembershipScreen from "@/screens/MembershipScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MembershipStackParamList = {
  Membership: undefined;
};

const Stack = createNativeStackNavigator<MembershipStackParamList>();

export default function MembershipStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Membership"
        component={MembershipScreen}
        options={{
          headerTitle: "킹 멤버십",
        }}
      />
    </Stack.Navigator>
  );
}
