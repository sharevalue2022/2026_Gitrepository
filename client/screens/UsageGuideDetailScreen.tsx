import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type UsageGuideDetailRouteProp = RouteProp<
  RootStackParamList,
  "UsageGuideDetail"
>;

export default function UsageGuideDetailScreen() {
  const { theme, isDark } = useTheme();
  const route = useRoute<UsageGuideDetailRouteProp>();
  const { guide } = route.params;
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(400)}>
        <View style={styles.header}>
          <View
            style={[
              styles.orderBadge,
              { backgroundColor: AppColors.purple },
            ]}
          >
            <ThemedText style={styles.orderText}>
              {guide.order + 1}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.title, { color: theme.text }]}>
          {guide.title}
        </ThemedText>

        <View
          style={[styles.divider, { backgroundColor: theme.textSecondary }]}
        />

        <ThemedText style={[styles.content, { color: theme.text }]}>
          {guide.content}
        </ThemedText>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  orderBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  divider: {
    height: 1,
    opacity: 0.2,
    marginBottom: Spacing.lg,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
});
