import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "event" | "payment" | "refund" | "general";
  isActive: boolean;
  createdAt: string;
}

export default function AnnouncementsScreen() {
  const { theme, isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/announcements`,
      );
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error("Failed to load announcements:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAnnouncementPress = (announcement: Announcement) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("AnnouncementDetail", { announcement });
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={AppColors.gold} />
      </View>
    );
  }

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
      {announcements.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="bell-off" size={64} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            공지사항이 없습니다
          </ThemedText>
        </View>
      ) : (
        announcements.map((announcement, index) => {
          const categoryInfo = getCategoryInfo(announcement.category);
          return (
            <Animated.View
              key={announcement.id}
              entering={FadeInUp.delay(index * 50).duration(400)}
            >
              <Pressable
                style={[
                  styles.announcementCard,
                  { backgroundColor: theme.card },
                ]}
                onPress={() => handleAnnouncementPress(announcement)}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: `${categoryInfo.color}20` },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.categoryText,
                        { color: categoryInfo.color },
                      ]}
                    >
                      {categoryInfo.label}
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={[styles.dateText, { color: theme.textSecondary }]}
                  >
                    {new Date(announcement.createdAt).toLocaleDateString(
                      "ko-KR",
                    )}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.title, { color: theme.text }]}
                  numberOfLines={2}
                >
                  {announcement.title}
                </ThemedText>
                <ThemedText
                  style={[styles.preview, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {announcement.content}
                </ThemedText>
                <View style={styles.footer}>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              </Pressable>
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.lg,
  },
  announcementCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  footer: {
    alignItems: "flex-end",
  },
});
