import React from "react";
import { StyleSheet, View, Image, ImageBackground, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { Button } from "@/components/Button";
import { Spacing, AppColors } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Welcome">;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../assets/images/king-hero.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.8)"]}
          style={StyleSheet.absoluteFill}
        />
        
        <Animated.View 
          style={[styles.header, { paddingTop: insets.top + Spacing.xl }]}
          entering={FadeIn.delay(200).duration(600)}
        >
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>킹데이트</Text>
          </View>
          <Text style={styles.subtitle}>의미 있는 만남이 시작되는 곳</Text>
        </Animated.View>

        <Animated.View
          style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}
          entering={FadeInDown.delay(400).duration(600)}
        >
          <BlurView intensity={40} tint="dark" style={styles.footerBlur}>
            <View style={styles.buttonRow}>
              <Button
                onPress={() => navigation.navigate("GenderSelection")}
                style={styles.button}
              >
                회원가입
              </Button>
              <Button
                onPress={() => navigation.navigate("Login")}
                variant="outline"
                style={styles.button}
              >
                로그인
              </Button>
            </View>
          </BlurView>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: AppColors.accent,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footer: {
    overflow: "hidden",
  },
  footerBlur: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
  },
});
