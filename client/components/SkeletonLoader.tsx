import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.xs,
  style,
}: SkeletonLoaderProps) {
  const { theme } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.backgroundSecondary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function UserCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[skeletonStyles.card, { backgroundColor: theme.backgroundDefault }]}>
      <SkeletonLoader height={150} borderRadius={0} />
      <View style={skeletonStyles.cardContent}>
        <SkeletonLoader width="70%" height={18} />
        <SkeletonLoader width="50%" height={14} style={{ marginTop: Spacing.sm }} />
      </View>
    </View>
  );
}

export function ConversationRowSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={skeletonStyles.row}>
      <SkeletonLoader width={56} height={56} borderRadius={28} />
      <View style={skeletonStyles.rowContent}>
        <SkeletonLoader width="60%" height={16} />
        <SkeletonLoader width="80%" height={14} style={{ marginTop: Spacing.sm }} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flex: 1,
    margin: Spacing.xs,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  cardContent: {
    padding: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  rowContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
