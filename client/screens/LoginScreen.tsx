import React, { useState } from "react";
import { StyleSheet, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const numbers = text.replace(/[^\d]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleLogin = async () => {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
    if (cleanNumber.length < 10) {
      Alert.alert("오류", "올바른 전화번호를 입력해주세요.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("오류", "비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(cleanNumber, password);
      if (!result.success) {
        if (result.message?.includes("계정이 없습니다")) {
          Alert.alert(
            "계정 없음", 
            "등록된 계정이 없습니다. 회원가입을 먼저 진행해주세요.",
            [
              { text: "취소", style: "cancel" },
              { text: "회원가입", onPress: () => navigation.navigate("GenderSelection") }
            ]
          );
        } else {
          Alert.alert("로그인 실패", result.message || "로그인에 실패했습니다.");
        }
      }
    } catch (error) {
      Alert.alert("오류", "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#0A0A0A" }]}>
      <LinearGradient
        colors={["#0A0A0A", "#141414", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Spacing["4xl"], paddingBottom: insets.bottom + Spacing["2xl"] }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <ThemedText type="h2" style={styles.title}>
              로그인
            </ThemedText>
            <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
              가입 시 사용한 전화번호를 입력해주세요
            </ThemedText>
          </Animated.View>

          <Animated.View 
            style={styles.form}
            entering={FadeInDown.delay(400).duration(500)}
          >
            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                전화번호
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "#FFFFFF",
                    borderColor: "rgba(255,255,255,0.15)",
                  }
                ]}
                placeholder="010-0000-0000"
                placeholderTextColor="#6B7280"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={13}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="small" style={styles.label}>
                비밀번호
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "#FFFFFF",
                    borderColor: "rgba(255,255,255,0.15)",
                  }
                ]}
                placeholder="비밀번호를 입력해주세요"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Button
              onPress={handleLogin}
              disabled={isLoading || phoneNumber.length < 12 || !password.trim()}
              style={styles.loginButton}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <ThemedText type="small" style={{ color: theme.textSecondary, marginHorizontal: Spacing.md }}>
                또는
              </ThemedText>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <Button
              variant="outline"
              onPress={() => navigation.navigate("GenderSelection")}
              style={styles.signupButton}
            >
              새 계정 만들기
            </Button>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
    color: AppColors.accent,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["3xl"],
  },
  form: {
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    marginLeft: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 18,
    letterSpacing: 1,
  },
  loginButton: {
    width: "100%",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  signupButton: {
    width: "100%",
  },
});
