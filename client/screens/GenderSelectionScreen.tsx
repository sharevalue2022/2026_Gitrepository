import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Gender } from "@/types";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type GenderSelectionScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "GenderSelection">;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GenderCard({ 
  gender, 
  label, 
  isSelected, 
  onSelect 
}: { 
  gender: Gender; 
  label: string; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const { theme } = useTheme();
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

  const avatarSource = gender === "female"
    ? require("../../assets/images/default-avatar-female.png")
    : require("../../assets/images/default-avatar-male.png");

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.optionWrapper, animatedStyle]}
    >
      <BlurView
        intensity={isSelected ? 80 : 40}
        tint="dark"
        style={[
          styles.option,
          {
            borderColor: isSelected ? AppColors.accent : "rgba(255,255,255,0.15)",
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <Image source={avatarSource} style={styles.avatar} />
        <ThemedText type="h4" style={styles.optionLabel}>
          {label}
        </ThemedText>
        {isSelected ? (
          <View style={[styles.checkmark, { backgroundColor: AppColors.accent }]}>
            <Feather name="check" size={16} color="#000" />
          </View>
        ) : null}
      </BlurView>
    </AnimatedPressable>
  );
}

export default function GenderSelectionScreen({ navigation }: GenderSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

  const handleSelect = (gender: Gender) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGender(gender);
  };

  const handleContinue = () => {
    if (selectedGender) {
      navigation.navigate("ProfileSetup", { gender: selectedGender });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={["#0A0A0A", "#141414", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"] }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <ThemedText type="h2" style={styles.title}>
            성별을 선택해주세요
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            회원가입을 위해 성별을 선택해주세요
          </ThemedText>
        </Animated.View>

        <View style={styles.options}>
          <Animated.View entering={FadeIn.delay(200).duration(500)} style={{ flex: 1 }}>
            <GenderCard
              gender="male"
              label="남성"
              isSelected={selectedGender === "male"}
              onSelect={() => handleSelect("male")}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(300).duration(500)} style={{ flex: 1 }}>
            <GenderCard
              gender="female"
              label="여성"
              isSelected={selectedGender === "female"}
              onSelect={() => handleSelect("female")}
            />
          </Animated.View>
        </View>
      </View>

      <Animated.View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}
        entering={FadeInUp.delay(400).duration(500)}
      >
        <Button
          onPress={handleContinue}
          disabled={!selectedGender}
          style={styles.button}
        >
          계속하기
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["4xl"],
  },
  options: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  optionWrapper: {
    flex: 1,
  },
  option: {
    aspectRatio: 0.8,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: Spacing.xl,
    overflow: "hidden",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.lg,
  },
  optionLabel: {
    textAlign: "center",
  },
  checkmark: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: Spacing["2xl"],
  },
  button: {
    width: "100%",
  },
});
