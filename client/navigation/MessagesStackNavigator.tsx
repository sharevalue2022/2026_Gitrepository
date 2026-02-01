import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MessagesScreen from "@/screens/MessagesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MessagesStackParamList = {
  Messages: undefined;
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export default function MessagesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          headerTitle: "메시지",
        }}
      />
    </Stack.Navigator>
  );
}
