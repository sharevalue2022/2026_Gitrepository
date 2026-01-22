import React, { useState, useRef } from "react";
import { StyleSheet, View, ScrollView, Image, Pressable, Alert, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { TagList } from "@/components/Tag";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { createConversation } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { UserPhoto } from "@/types";

const { width } = Dimensions.get("window");
const PHOTO_WIDTH = width - Spacing.lg * 2;

export default function UserProfileScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "UserProfile">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: selectedUser } = route.params;
  const { theme, isDark } = useTheme();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const approvedPhotos = selectedUser.photos?.filter(p => p.approved) || [];
  const hasPhotos = approvedPhotos.length > 0;

  const defaultAvatar = selectedUser.gender === "female"
    ? require("../../assets/images/default-avatar-female.png")
    : require("../../assets/images/default-avatar-male.png");

  const canStartChat = () => {
    if (!currentUser) return false;
    // All users need phone verification
    if (!currentUser.phoneVerified) return false;
    // Male users also need King membership with valid expiry
    if (currentUser.gender === "male") {
      if (!currentUser.isKingMember) return false;
      if (!currentUser.kingMembershipExpiry) return false;
      const expiryDate = new Date(currentUser.kingMembershipExpiry);
      const now = new Date();
      return now < expiryDate;
    }
    // Female users only need phone verification
    return true;
  };

  const handleStartChat = async () => {
    if (!currentUser) return;

    if (!canStartChat()) {
      if (currentUser.gender === "male") {
        Alert.alert(
          "킹 멤버십 필요",
          "대화를 시작하려면 킹 멤버십에 가입해주세요.",
          [
            { text: "취소", style: "cancel" },
            {
              text: "가입하기",
              onPress: () => navigation.navigate("Main", { screen: "MembershipTab" } as any),
            },
          ]
        );
      } else {
        Alert.alert(
          "인증 필요",
          "대화를 시작하려면 휴대폰 인증을 완료해주세요."
        );
      }
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const conversation = await createConversation(selectedUser, currentUser.id);
    navigation.navigate("Chat", { conversationId: conversation.id, participantName: selectedUser.name });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / PHOTO_WIDTH);
    if (index !== currentPhotoIndex && index >= 0 && index < approvedPhotos.length) {
      setCurrentPhotoIndex(index);
      Haptics.selectionAsync();
    }
  };

  const renderPhotoItem = ({ item }: { item: UserPhoto }) => (
    <View style={styles.photoSlide}>
      <Image source={{ uri: item.url }} style={styles.mainPhoto} />
    </View>
  );

  const renderPhotoCarousel = () => {
    if (!hasPhotos) {
      return (
        <Animated.View style={styles.photoContainer} entering={FadeIn.duration(400)}>
          <Image source={defaultAvatar} style={styles.mainPhoto} />
          {selectedUser.isKingMember && selectedUser.gender === "male" ? (
            <View style={styles.crownBadge}>
              <Image
                source={require("../../assets/images/king-crown.png")}
                style={styles.crownIcon}
              />
            </View>
          ) : null}
        </Animated.View>
      );
    }

    return (
      <Animated.View style={styles.photoContainer} entering={FadeIn.duration(400)}>
        <FlatList
          ref={flatListRef}
          data={approvedPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(_, index) => `photo_${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={PHOTO_WIDTH}
          snapToAlignment="center"
        />
        
        {selectedUser.isKingMember && selectedUser.gender === "male" ? (
          <View style={styles.crownBadge}>
            <Image
              source={require("../../assets/images/king-crown.png")}
              style={styles.crownIcon}
            />
          </View>
        ) : null}

        {approvedPhotos.length > 1 ? (
          <View style={styles.photoIndicators}>
            {approvedPhotos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  {
                    backgroundColor: index === currentPhotoIndex 
                      ? "#fff" 
                      : "rgba(255,255,255,0.4)",
                  },
                ]}
              />
            ))}
          </View>
        ) : null}

        {approvedPhotos.length > 1 ? (
          <View style={styles.photoCounter}>
            <ThemedText type="small" style={styles.photoCounterText}>
              {currentPhotoIndex + 1} / {approvedPhotos.length}
            </ThemedText>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["5xl"] + 60,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderPhotoCarousel()}

        <Animated.View style={styles.header} entering={FadeInUp.delay(100).duration(400)}>
          <View style={styles.nameRow}>
            <ThemedText type="h2">{selectedUser.name}, {selectedUser.age}</ThemedText>
            {selectedUser.isVerified ? (
              <View style={[styles.verifiedBadge, { backgroundColor: AppColors.success }]}>
                <Feather name="check" size={14} color="#fff" />
              </View>
            ) : null}
          </View>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={theme.textSecondary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              {selectedUser.location}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInUp.delay(200).duration(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>소개</ThemedText>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Feather name="briefcase" size={18} color={theme.link} />
              <ThemedText type="body" style={styles.infoText}>
                {selectedUser.occupation}
              </ThemedText>
            </View>
            {selectedUser.bio ? (
              <ThemedText type="body" style={[styles.bio, { color: theme.textSecondary }]}>
                {selectedUser.bio}
              </ThemedText>
            ) : null}
          </BlurView>
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInUp.delay(300).duration(400)}>
          <ThemedText type="h4" style={styles.sectionTitle}>취미</ThemedText>
          <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
            <TagList tags={selectedUser.hobbies} variant="primary" />
          </BlurView>
        </Animated.View>

        {selectedUser.foodPreferences.length > 0 ? (
          <Animated.View style={styles.section} entering={FadeInUp.delay(400).duration(400)}>
            <ThemedText type="h4" style={styles.sectionTitle}>음식 취향</ThemedText>
            <BlurView intensity={40} tint="dark" style={styles.sectionContent}>
              <TagList tags={selectedUser.foodPreferences} variant="accent" />
            </BlurView>
          </Animated.View>
        ) : null}
      </ScrollView>

      <Animated.View
        style={[
          styles.chatButton,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        entering={FadeInUp.delay(500).duration(400)}
      >
        <BlurView intensity={80} tint="dark" style={styles.chatButtonBlur}>
          <Pressable
            onPress={handleStartChat}
            style={({ pressed }) => [
              styles.chatButtonInner,
              {
                backgroundColor: canStartChat() ? AppColors.accent : theme.backgroundSecondary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Feather name="message-circle" size={22} color={canStartChat() ? "#fff" : theme.textSecondary} />
            <ThemedText
              type="body"
              style={{
                color: canStartChat() ? "#fff" : theme.textSecondary,
                fontWeight: "600",
                marginLeft: Spacing.sm,
              }}
            >
              {canStartChat() ? "채팅 시작" : currentUser?.gender === "male" ? "킹 멤버십 필요" : "인증 필요"}
            </ThemedText>
          </Pressable>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  photoContainer: {
    width: PHOTO_WIDTH,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  photoSlide: {
    width: PHOTO_WIDTH,
    aspectRatio: 1,
  },
  mainPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  crownBadge: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  crownIcon: {
    width: 28,
    height: 28,
  },
  photoIndicators: {
    position: "absolute",
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  photoCounter: {
    position: "absolute",
    top: Spacing.lg,
    left: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  photoCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  header: {
    marginBottom: Spacing.xl,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionContent: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  infoText: {
    marginLeft: Spacing.md,
  },
  bio: {
    marginTop: Spacing.sm,
  },
  chatButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  chatButtonBlur: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  chatButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: BorderRadius.full,
  },
});
