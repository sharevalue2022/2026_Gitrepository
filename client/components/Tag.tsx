import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";

interface TagProps {
  label: string;
  onRemove?: () => void;
  variant?: "default" | "primary" | "accent";
}

export function Tag({ label, onRemove, variant = "default" }: TagProps) {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case "primary":
        return AppColors.primary + "20";
      case "accent":
        return AppColors.accent + "20";
      default:
        return theme.backgroundSecondary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return AppColors.primary;
      case "accent":
        return AppColors.accent;
      default:
        return theme.text;
    }
  };

  return (
    <View style={[styles.tag, { backgroundColor: getBackgroundColor() }]}>
      <ThemedText type="small" style={{ color: getTextColor() }}>
        {label}
      </ThemedText>
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Feather name="x" size={14} color={getTextColor()} />
        </Pressable>
      ) : null}
    </View>
  );
}

interface TagListProps {
  tags: string[];
  variant?: "default" | "primary" | "accent";
  onRemove?: (tag: string) => void;
}

export function TagList({ tags, variant = "default", onRemove }: TagListProps) {
  return (
    <View style={styles.tagList}>
      {tags.map((tag) => (
        <Tag
          key={tag}
          label={tag}
          variant={variant}
          onRemove={onRemove ? () => onRemove(tag) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  removeButton: {
    marginLeft: Spacing.xs,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
