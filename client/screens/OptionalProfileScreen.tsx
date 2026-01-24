import React, { useState } from "react";
import { StyleSheet, View, Pressable, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Gender, UserProfile } from "@/types";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type OptionalProfileScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "OptionalProfile">;
  route: RouteProp<AuthStackParamList, "OptionalProfile">;
};

const FOODS = [
  "한식",
  "일식",
  "양식",
  "중식",
  "커피",
  "와인",
  "디저트",
  "건강식",
  "분식",
  "파인다이닝",
];
const RELIGIONS = ["무교", "기독교", "천주교", "불교", "원불교", "기타"];
const DRINKING_OPTIONS = ["안 마심", "가끔", "자주", "즐김"];
const SMOKING_OPTIONS = ["비흡연", "가끔", "흡연"];
const EDUCATION_OPTIONS = ["고졸", "전문대졸", "대졸", "석사", "박사"];
const MARITAL_OPTIONS = ["미혼", "돌싱"];
const BODY_TYPES = ["마름", "보통", "통통", "근육질", "건장", "글래머"];

export default function OptionalProfileScreen({
  navigation,
  route,
}: OptionalProfileScreenProps) {
  const {
    gender,
    name,
    phoneNumber,
    password,
    age,
    location,
    occupation,
    hobbies,
  } = route.params;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { register } = useAuth();

  const [bio, setBio] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [religion, setReligion] = useState("");
  const [drinking, setDrinking] = useState("");
  const [smoking, setSmoking] = useState("");
  const [education, setEducation] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Calculate profile completeness progress
  const calculateProgress = () => {
    let completed = 0;
    const totalFields = 7; // bio, foods, photos, religion, drinking, smoking, education, marital, bodyType (but we count 7 key ones)

    if (bio.trim().length > 0) completed++;
    if (selectedFoods.length > 0) completed++;
    if (photos.length > 0) completed++;
    if (religion) completed++;
    if (drinking) completed++;
    if (smoking) completed++;
    if (education) completed++;

    return Math.round((completed / totalFields) * 100);
  };

  const progress = calculateProgress();

  const toggleFood = (food: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFoods((prev) =>
      prev.includes(food)
        ? prev.filter((f) => f !== food)
        : [...prev, food].slice(0, 3),
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const user: UserProfile = {
        id: `user_${Date.now()}`,
        gender,
        name,
        phoneNumber,
        age,
        location,
        occupation,
        hobbies,
        foodPreferences: selectedFoods,
        bio: bio.trim(),
        photos: photos.map((url) => ({ url, approved: false })),
        religion: religion || undefined,
        drinking: drinking || undefined,
        smoking: smoking || undefined,
        education: education || undefined,
        maritalStatus: maritalStatus || undefined,
        bodyType: bodyType || undefined,
        isVerified: false,
        isKingMember: false,
        phoneVerified: false,
        profileComplete: true,
        onboardingComplete: false,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await register(user, password);

      if (gender === "female") {
        navigation.navigate("PhoneVerification");
      } else {
        navigation.navigate("Subscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      const user: UserProfile = {
        id: `user_${Date.now()}`,
        gender,
        name,
        phoneNumber,
        age,
        location,
        occupation,
        hobbies,
        foodPreferences: [],
        bio: "",
        photos: [],
        isVerified: false,
        isKingMember: false,
        phoneVerified: false,
        profileComplete: true,
        onboardingComplete: false,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await register(user, password);

      if (gender === "female") {
        navigation.navigate("PhoneVerification");
      } else {
        navigation.navigate("Subscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTagSection = (
    title: string,
    options: string[],
    value: string,
    setValue: (v: string) => void,
  ) => (
    <View style={styles.tagsSection}>
      <View style={styles.labelRow}>
        <ThemedText type="body" style={styles.sectionLabel}>
          {title}
        </ThemedText>
      </View>
      <View style={styles.tagGrid}>
        {options.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setValue(value === item ? "" : item);
            }}
            style={[
              styles.tagButton,
              {
                backgroundColor:
                  value === item
                    ? AppColors.accent + "20"
                    : theme.backgroundDefault,
                borderColor: value === item ? AppColors.accent : theme.border,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: value === item ? AppColors.accent : theme.text }}
            >
              {item}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );

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
          추가 정보
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          선택 사항이며, 나중에 프로필에서 수정할 수 있습니다
        </ThemedText>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              프로필 완성도
            </ThemedText>
            <ThemedText
              type="body"
              style={{ color: AppColors.primary, fontWeight: "600" }}
            >
              {progress}%
            </ThemedText>
          </View>
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                  backgroundColor:
                    progress >= 80
                      ? AppColors.success
                      : progress >= 50
                        ? AppColors.accent
                        : AppColors.accent,
                },
              ]}
            />
          </View>
          {progress < 100 && (
            <ThemedText
              type="small"
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                marginTop: Spacing.xs,
              }}
            >
              {progress >= 80
                ? "거의 다 되었어요! 🎉"
                : progress >= 50
                  ? "절반 넘게 완성했어요! 💪"
                  : "프로필을 채우면 매칭 확률이 올라가요!"}
            </ThemedText>
          )}
        </View>
      </Animated.View>

      <View style={styles.photoSection}>
        <View style={styles.labelRow}>
          <ThemedText type="body" style={styles.sectionLabel}>
            사진 (최대 5장)
          </ThemedText>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
        >
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} />
              <Pressable
                onPress={() => removePhoto(index)}
                style={[
                  styles.removePhoto,
                  { backgroundColor: AppColors.error },
                ]}
              >
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < 5 ? (
            <Pressable
              onPress={pickImage}
              style={[
                styles.addPhoto,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <Feather name="plus" size={24} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      <Input
        label="자기소개"
        placeholder="자신에 대해 소개해주세요..."
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        leftIcon="edit-3"
      />

      {renderTagSection("종교", RELIGIONS, religion, setReligion)}
      {renderTagSection("음주", DRINKING_OPTIONS, drinking, setDrinking)}
      {renderTagSection("흡연", SMOKING_OPTIONS, smoking, setSmoking)}
      {renderTagSection("학력", EDUCATION_OPTIONS, education, setEducation)}
      {renderTagSection(
        "결혼 여부",
        MARITAL_OPTIONS,
        maritalStatus,
        setMaritalStatus,
      )}
      {renderTagSection("체형", BODY_TYPES, bodyType, setBodyType)}

      <View style={styles.tagsSection}>
        <View style={styles.labelRow}>
          <ThemedText type="body" style={styles.sectionLabel}>
            음식 취향 (최대 3개 선택)
          </ThemedText>
        </View>
        <View style={styles.tagGrid}>
          {FOODS.map((food) => (
            <Pressable
              key={food}
              onPress={() => toggleFood(food)}
              style={[
                styles.tagButton,
                {
                  backgroundColor: selectedFoods.includes(food)
                    ? AppColors.accent + "20"
                    : theme.backgroundDefault,
                  borderColor: selectedFoods.includes(food)
                    ? AppColors.accent
                    : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: selectedFoods.includes(food)
                    ? AppColors.accent
                    : theme.text,
                }}
              >
                {food}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        onPress={handleComplete}
        style={styles.button}
        disabled={isLoading}
      >
        완료
      </Button>

      <Pressable
        onPress={handleSkip}
        style={styles.skipButton}
        disabled={isLoading}
      >
        <ThemedText
          type="body"
          style={[styles.skipText, { color: theme.textSecondary }]}
        >
          건너뛰기
        </ThemedText>
      </Pressable>
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
  photoSection: {
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
  photoScroll: {
    flexDirection: "row",
  },
  photoWrapper: {
    width: 80,
    height: 80,
    marginRight: Spacing.md,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  removePhoto: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
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
  skipButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  skipText: {
    fontWeight: "500",
  },
  progressContainer: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(196, 168, 117, 0.1)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  progressBarBg: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});
