import React from "react";
import { StyleSheet, Pressable, View, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Conversation } from "@/types";

interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ConversationRow({
  conversation,
  onPress,
}: ConversationRowProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue("transparent");

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: backgroundColor.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
    backgroundColor.value = theme.backgroundSecondary;
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    backgroundColor.value = "transparent";
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const avatarSource = conversation.participantPhoto
    ? { uri: conversation.participantPhoto }
    : conversation.participantGender === "female"
      ? require("../../assets/images/default-avatar-female.png")
      : require("../../assets/images/default-avatar-male.png");

  const formatTime = () => {
    const date = new Date(conversation.lastMessageTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.row, animatedStyle]}
    >
      <View style={styles.avatarContainer}>
        <Image source={avatarSource} style={styles.avatar} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="body" style={styles.name} numberOfLines={1}>
            {conversation.participantName}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {formatTime()}
          </ThemedText>
        </View>
        <View style={styles.messageRow}>
          <ThemedText
            type="small"
            style={[styles.message, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {conversation.lastMessage || "Start a conversation"}
          </ThemedText>
          {conversation.unreadCount > 0 ? (
            <View
              style={[styles.badge, { backgroundColor: AppColors.primary }]}
            >
              <ThemedText type="small" style={styles.badgeText}>
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    marginHorizontal: Spacing.xs,
    marginVertical: Spacing.xs / 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: AppColors.accent,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  name: {
    fontWeight: "600",
    flex: 1,
    marginRight: Spacing.sm,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
