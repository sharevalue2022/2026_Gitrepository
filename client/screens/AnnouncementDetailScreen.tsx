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

type AnnouncementDetailRouteProp = RouteProp<
  RootStackParamList,
  "AnnouncementDetail"
>;

export default function AnnouncementDetailScreen() {
  const { theme, isDark } = useTheme();
  const route = useRoute<AnnouncementDetailRouteProp>();
  const { announcement } = route.params;
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case "event":
        return { label: "이벤트", color: AppColors.purple };
      case "payment":
        return { label: "결제", color: AppColors.gold };
      case "refund":
        return { label: "환불", color: "#ef4444" };
      default:
        return { label: "일반", color: "#6b7280" };
    }
  };

  const categoryInfo = getCategoryInfo(announcement.category);

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
              styles.categoryBadge,
              { backgroundColor: `${categoryInfo.color}20` },
            ]}
          >
            <ThemedText
              style={[styles.categoryText, { color: categoryInfo.color }]}
            >
              {categoryInfo.label}
            </ThemedText>
          </View>
          <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
            {new Date(announcement.createdAt).toLocaleDateString("ko-KR")}
          </ThemedText>
        </View>

        <ThemedText style={[styles.title, { color: theme.text }]}>
          {announcement.title}
        </ThemedText>

        <View
          style={[styles.divider, { backgroundColor: theme.textSecondary }]}
        />

        <ThemedText style={[styles.content, { color: theme.text }]}>
          {announcement.content}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: Spacing.lg,
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
