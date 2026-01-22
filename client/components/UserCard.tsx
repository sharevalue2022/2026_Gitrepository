import React from "react";
import { StyleSheet, Pressable, View, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { UserProfile } from "@/types";

interface UserCardProps {
  user: UserProfile;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UserCard({ user, onPress, index = 0 }: UserCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getAvatarSource = () => {
    const approvedPhotos = user.photos?.filter(p => p.approved) || [];
    if (approvedPhotos.length > 0) {
      return { uri: approvedPhotos[0].url };
    }
    return user.gender === "female"
      ? require("../../assets/images/default-avatar-female.png")
      : require("../../assets/images/default-avatar-male.png");
  };
  
  const avatarSource = getAvatarSource();

  const timeSinceActive = () => {
    const diff = Date.now() - new Date(user.lastActive).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        { backgroundColor: theme.backgroundDefault },
        animatedStyle,
      ]}
      entering={FadeIn.delay(index * 50).duration(300)}
    >
      <View style={styles.imageContainer}>
        <Image source={avatarSource} style={styles.avatar} />
        {user.isKingMember && user.gender === "male" ? (
          <View style={styles.crownBadge}>
            <Image
              source={require("../../assets/images/king-crown.png")}
              style={styles.crownIcon}
            />
          </View>
        ) : null}
        {user.phoneVerified ? (
          <View style={[styles.verifiedBadge, { backgroundColor: AppColors.success }]}>
            <Feather name="check" size={10} color="#fff" />
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <ThemedText type="h4" numberOfLines={1} style={styles.name}>
            {user.name}, {user.age}
          </ThemedText>
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={12} color={theme.textSecondary} />
          <ThemedText
            type="small"
            style={[styles.location, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {user.location}
          </ThemedText>
        </View>
        <ThemedText
          type="small"
          style={[styles.activeTime, { color: theme.textSecondary }]}
        >
          {timeSinceActive()}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    margin: Spacing.xs,
  },
  imageContainer: {
    aspectRatio: 1,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  crownBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  crownIcon: {
    width: 16,
    height: 16,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: Spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: 16,
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    flex: 1,
  },
  activeTime: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
});
