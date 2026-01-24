import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
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
import type { UserPhoto } from "@/types";

const HOBBIES = [
  "여행",
  "독서",
  "운동",
  "음악",
  "요리",
  "사진",
  "게임",
  "등산",
  "예술",
  "영화",
];
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

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [location, setLocation] = useState(user?.location || "");
  const [occupation, setOccupation] = useState(user?.occupation || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(
    user?.hobbies || [],
  );
  const [selectedFoods, setSelectedFoods] = useState<string[]>(
    user?.foodPreferences || [],
  );
  const [photos, setPhotos] = useState<UserPhoto[]>(user?.photos || []);
  const [isSaving, setIsSaving] = useState(false);

  const toggleHobby = (hobby: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedHobbies((prev) =>
      prev.includes(hobby)
        ? prev.filter((h) => h !== hobby)
        : [...prev, hobby].slice(0, 5),
    );
  };

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
      setPhotos((prev) =>
        [...prev, { url: result.assets[0].uri, approved: false }].slice(0, 5),
      );
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || !age || !location.trim() || !occupation.trim()) {
      Alert.alert("오류", "모든 필수 항목을 입력해주세요");
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        name: name.trim(),
        age: parseInt(age),
        location: location.trim(),
        occupation: occupation.trim(),
        bio: bio.trim(),
        hobbies: selectedHobbies,
        foodPreferences: selectedFoods,
        photos,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Alert.alert("오류", "프로필 저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
    >
      <View style={styles.photoSection}>
        <ThemedText type="body" style={styles.sectionLabel}>
          사진 (최대 5장)
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri: photo.url }} style={styles.photo} />
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
        label="이름"
        placeholder="이름을 입력해주세요"
        value={name}
        onChangeText={setName}
        leftIcon="user"
      />

      <Input
        label="나이"
        placeholder="나이를 입력해주세요"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        leftIcon="calendar"
      />

      <Input
        label="위치"
        placeholder="도시, 지역"
        value={location}
        onChangeText={setLocation}
        leftIcon="map-pin"
      />

      <Input
        label="직업"
        placeholder="하시는 일을 알려주세요"
        value={occupation}
        onChangeText={setOccupation}
        leftIcon="briefcase"
      />

      <Input
        label="자기소개 (선택)"
        placeholder="자신에 대해 소개해주세요..."
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={3}
        leftIcon="edit-3"
      />

      <View style={styles.tagsSection}>
        <ThemedText type="body" style={styles.sectionLabel}>
          취미 (최대 5개 선택)
        </ThemedText>
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
                  borderColor: selectedHobbies.includes(hobby)
                    ? AppColors.accent
                    : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: selectedHobbies.includes(hobby)
                    ? AppColors.accent
                    : theme.text,
                }}
              >
                {hobby}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.tagsSection}>
        <ThemedText type="body" style={styles.sectionLabel}>
          음식 취향 (최대 3개 선택)
        </ThemedText>
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

      <Button onPress={handleSave} disabled={isSaving} style={styles.button}>
        {isSaving ? "저장 중..." : "저장"}
      </Button>
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
  photoSection: {
    marginBottom: Spacing["2xl"],
  },
  sectionLabel: {
    fontWeight: "600",
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
});
