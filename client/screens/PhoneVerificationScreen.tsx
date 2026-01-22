import React, { useState, useRef } from "react";
import { StyleSheet, View, TextInput, Image, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRoute, RouteProp } from "@react-navigation/native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

type PhoneVerificationScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList | RootStackParamList, "PhoneVerification">;
};

export default function PhoneVerificationScreen({ navigation }: PhoneVerificationScreenProps) {
  const route = useRoute<RouteProp<RootStackParamList, "PhoneVerification">>();
  const fromProfile = route.params?.fromProfile ?? false;
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { setPhoneVerified, updateUser, completeOnboarding } = useAuth();

  const [phone, setPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [demoCode, setDemoCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleSendCode = async () => {
    if (phone.length < 10) return;
    setIsLoading(true);
    setError("");
    setDemoCode("");
    
    try {
      const response = await fetch(new URL("/api/verification/send", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCodeSent(true);
        if (data.demoCode) {
          setDemoCode(data.demoCode);
          console.log(`[데모] 인증번호: ${data.demoCode}`);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(data.message || "인증번호 발송에 실패했습니다.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      console.error("Send code error:", err);
      setError("서버 연결에 실패했습니다. 다시 시도해주세요.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setIsLoading(false);
  };

  const handleCodeChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c !== "") && newCode.join("").length === 6) {
      verifyCode(newCode.join(""));
    }
  };

  const verifyCode = async (enteredCode: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(new URL("/api/verification/verify", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, code: enteredCode }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsVerified(true);
        await updateUser({ phoneVerified: true, isVerified: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError(data.message || "인증번호가 일치하지 않습니다.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      console.error("Verify code error:", err);
      setError("서버 연결에 실패했습니다. 다시 시도해주세요.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setIsLoading(false);
  };

  const handleContinue = async () => {
    if (fromProfile) {
      navigation.goBack();
    } else {
      await completeOnboarding();
    }
  };

  if (isVerified) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LinearGradient
          colors={["#0A0A0A", "#141414", "#0A0A0A"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.content, { paddingTop: insets.top + Spacing["5xl"] }]}>
          <Animated.View style={styles.successContainer} entering={FadeIn.duration(600)}>
            <BlurView intensity={60} tint="dark" style={styles.successBlur}>
              <Image
                source={require("../../assets/images/verification-success.png")}
                style={styles.successImage}
                resizeMode="contain"
              />
              <ThemedText type="h2" style={styles.successTitle}>
                인증 완료!
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.successMessage, { color: theme.textSecondary }]}
              >
                휴대폰 번호가 인증되었습니다. 이제 다른 회원들과 대화를 시작할 수 있습니다.
              </ThemedText>
            </BlurView>
          </Animated.View>
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing["2xl"] }]}>
          <Button onPress={handleContinue} style={styles.button}>
            시작하기
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={["#0A0A0A", "#141414", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, { paddingTop: insets.top + Spacing["4xl"] }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <ThemedText type="h2" style={styles.title}>
            {codeSent ? "인증번호 입력" : "휴대폰 인증"}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            {codeSent
              ? `${phone}로 발송된 6자리 인증번호를 입력해주세요`
              : "본인 확인을 위해 휴대폰 번호를 입력해주세요"}
          </ThemedText>
        </Animated.View>

        {!codeSent ? (
          <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.form}>
            <Input
              label="휴대폰 번호"
              placeholder="010-1234-5678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon="phone"
            />
            <Button
              onPress={handleSendCode}
              disabled={phone.length < 10 || isLoading}
              style={styles.button}
            >
              {isLoading ? "발송 중..." : "인증번호 받기"}
            </Button>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.codeContainer}>
            <View style={styles.codeInputs}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: "rgba(255,255,255,0.08)",
                      borderColor: digit ? AppColors.accent : "rgba(255,255,255,0.15)",
                      color: "#FFFFFF",
                    },
                  ]}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value.slice(-1), index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
            {error ? (
              <ThemedText type="caption" style={styles.errorText}>
                {error}
              </ThemedText>
            ) : null}
            <Pressable
              onPress={() => {
                setCode(["", "", "", "", "", ""]);
                setError("");
                handleSendCode();
              }}
              style={styles.resendButton}
            >
              <ThemedText type="link">인증번호 다시 받기</ThemedText>
            </Pressable>
            {demoCode ? (
              <ThemedText
                type="caption"
                style={[styles.demoHint, { color: AppColors.accent }]}
              >
                (테스트용 인증번호: {demoCode})
              </ThemedText>
            ) : null}
          </Animated.View>
        )}
      </View>
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
    marginBottom: Spacing["3xl"],
  },
  form: {
    gap: Spacing.lg,
  },
  codeContainer: {
    alignItems: "center",
  },
  codeInputs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  resendButton: {
    padding: Spacing.md,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  demoHint: {
    textAlign: "center",
    marginTop: Spacing.lg,
    fontStyle: "italic",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successBlur: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  successImage: {
    width: 140,
    height: 140,
    marginBottom: Spacing["2xl"],
  },
  successTitle: {
    marginBottom: Spacing.md,
  },
  successMessage: {
    textAlign: "center",
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: Spacing["2xl"],
  },
  button: {
    width: "100%",
  },
});
