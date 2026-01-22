import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Gender } from "@/types";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type ProfileSetupScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "ProfileSetup">;
  route: RouteProp<AuthStackParamList, "ProfileSetup">;
};

const HOBBIES = ["여행", "독서", "운동", "음악", "요리", "사진", "게임", "등산", "예술", "영화"];

export default function ProfileSetupScreen({ navigation, route }: ProfileSetupScreenProps) {
  const { gender } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleHobby = (hobby: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby].slice(0, 5)
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "이름을 입력해주세요";
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "전화번호를 입력해주세요";
    } else if (!phoneRegex.test(phoneNumber.replace(/-/g, "").replace(/^010/, "010"))) {
      newErrors.phoneNumber = "올바른 전화번호 형식을 입력해주세요";
    }
    if (!password.trim()) {
      newErrors.password = "비밀번호를 입력해주세요";
    } else if (password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다";
    }
    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다";
    }
    if (!age || parseInt(age) < 18 || parseInt(age) > 100) newErrors.age = "올바른 나이를 입력해주세요 (18세 이상)";
    if (!location.trim()) newErrors.location = "위치를 입력해주세요";
    if (!occupation.trim()) newErrors.occupation = "직업을 입력해주세요";
    if (selectedHobbies.length === 0) newErrors.hobbies = "취미를 하나 이상 선택해주세요";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    navigation.navigate("OptionalProfile", {
      gender,
      name: name.trim(),
      phoneNumber: phoneNumber.replace(/-/g, ""),
      password,
      age: parseInt(age),
      location: location.trim(),
      occupation: occupation.trim(),
      hobbies: selectedHobbies,
    });
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing["4xl"],
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
    >
      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <ThemedText type="h2" style={styles.title}>
          기본 정보
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          필수 정보를 입력해주세요
        </ThemedText>
      </Animated.View>

      <Input
        label="이름"
        placeholder="이름을 입력해주세요"
        value={name}
        onChangeText={setName}
        error={errors.name}
        leftIcon="user"
      />

      <Input
        label="전화번호"
        placeholder="010-1234-5678"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        error={errors.phoneNumber}
        leftIcon="phone"
      />

      <Input
        label="비밀번호"
        placeholder="6자 이상 입력해주세요"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
        leftIcon="lock"
      />

      <Input
        label="비밀번호 확인"
        placeholder="비밀번호를 다시 입력해주세요"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        secureTextEntry
        error={errors.passwordConfirm}
        leftIcon="lock"
      />

      <Input
        label="나이"
        placeholder="나이를 입력해주세요"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        error={errors.age}
        leftIcon="calendar"
      />

      <Input
        label="위치"
        placeholder="도시, 지역"
        value={location}
        onChangeText={setLocation}
        error={errors.location}
        leftIcon="map-pin"
      />

      <Input
        label="직업"
        placeholder="하시는 일을 알려주세요"
        value={occupation}
        onChangeText={setOccupation}
        error={errors.occupation}
        leftIcon="briefcase"
      />

      <View style={styles.tagsSection}>
        <View style={styles.labelRow}>
          <ThemedText type="body" style={styles.sectionLabel}>
            취미 (최대 5개 선택)
          </ThemedText>
        </View>
        {errors.hobbies ? (
          <ThemedText type="small" style={{ color: AppColors.error, marginBottom: Spacing.sm }}>
            {errors.hobbies}
          </ThemedText>
        ) : null}
        <View style={styles.tagGrid}>
          {HOBBIES.map((hobby) => (
            <Pressable
              key={hobby}
              onPress={() => toggleHobby(hobby)}
              style={[
                styles.tagButton,
                {
                  backgroundColor: selectedHobbies.includes(hobby)
                    ? AppColors.accent + "20"
                    : theme.backgroundDefault,
                  borderColor: selectedHobbies.includes(hobby) ? AppColors.accent : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: selectedHobbies.includes(hobby) ? AppColors.accent : theme.text,
                }}
              >
                {hobby}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <Button onPress={handleContinue} style={styles.button}>
        다음
      </Button>

      <ThemedText type="small" style={styles.termsText}>
        계속 진행하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing["2xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  sectionLabel: {
    fontWeight: "600",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  tagsSection: {
    marginBottom: Spacing["2xl"],
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tagButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  button: {
    marginTop: Spacing.lg,
  },
  termsText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 11,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
