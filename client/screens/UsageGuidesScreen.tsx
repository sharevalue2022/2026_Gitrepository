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

interface UsageGuide {
  id: string;
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function UsageGuidesScreen() {
  const { theme, isDark } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [guides, setGuides] = useState<UsageGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/usage-guides`,
      );
      const data = await response.json();
      if (data.success) {
        setGuides(data.guides);
      }
    } catch (error) {
      console.error("Failed to load usage guides:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuidePress = (guide: UsageGuide) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("UsageGuideDetail", { guide });
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
      {guides.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="book-open" size={64} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            이용 가이드가 없습니다
          </ThemedText>
        </View>
      ) : (
        guides.map((guide, index) => (
          <Animated.View
            key={guide.id}
            entering={FadeInUp.delay(index * 50).duration(400)}
          >
            <Pressable
              style={[styles.guideCard, { backgroundColor: theme.card }]}
              onPress={() => handleGuidePress(guide)}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
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
                <View style={styles.textContainer}>
                  <ThemedText
                    style={[styles.title, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {guide.title}
                  </ThemedText>
                  <ThemedText
                    style={[styles.preview, { color: theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {guide.content}
                  </ThemedText>
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </Pressable>
          </Animated.View>
        ))
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
  guideCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  orderBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
});
