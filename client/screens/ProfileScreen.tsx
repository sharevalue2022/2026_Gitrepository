import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Image, Modal, Pressable } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ProfileSection, ProfileRow } from "@/components/ProfileSection";
import { TagList } from "@/components/Tag";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { calculateProfileCompleteness, getCompletenessMessage, getMissingFields } from "@/lib/profileCompleteness";

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const avatarSource = user?.gender === "female"
    ? require("../../assets/images/default-avatar-female.png")
    : require("../../assets/images/default-avatar-male.png");

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      })
    );
  };

  if (!user) return null;

  const completenessScore = calculateProfileCompleteness(user);
  const completenessMessage = getCompletenessMessage(completenessScore);
  const missingFields = getMissingFields(user);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={styles.header} entering={FadeIn.duration(500)}>
        <View style={styles.avatarContainer}>
          <Image source={avatarSource} style={styles.avatar} />
          {user.isKingMember && user.gender === "male" ? (
            <View style={styles.crownBadge}>
              <Image
                source={require("../../assets/images/king-crown.png")}
                style={styles.crownIcon}
              />
            </View>
          ) : null}
          {user.isVerified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: AppColors.success }]}>
              <Feather name="check" size={14} color="#fff" />
            </View>
          ) : null}
        </View>
        <View style={styles.nameRow}>
          <ThemedText type="h2" style={styles.name}>
            {user.name}, {user.age}
          </ThemedText>
          {user.phoneVerified ? (
            <View style={styles.verifiedTextBadge}>
              <Feather name="check-circle" size={16} color={AppColors.success} />
              <ThemedText type="small" style={styles.verifiedText}>
                본인인증
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
            {user.location}
          </ThemedText>
        </View>
        <Button onPress={handleEditProfile} style={styles.editButton}>
          프로필 수정
        </Button>
      </Animated.View>

      {/* Profile Completeness Card */}
      {completenessScore < 100 && (
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={[
            styles.completenessCard,
            {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
            },
          ]}
        >
          <View style={styles.completenessHeader}>
            <View style={styles.completenessIconContainer}>
              <Feather name="trending-up" size={20} color={AppColors.primary} />
            </View>
            <View style={styles.completenessInfo}>
              <ThemedText type="h4" style={styles.completenessTitle}>
                프로필 완성도
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {completenessMessage}
              </ThemedText>
            </View>
            <View style={styles.completenessScoreContainer}>
              <ThemedText type="h3" style={{ color: AppColors.primary }}>
                {completenessScore}%
              </ThemedText>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${completenessScore}%`,
                  backgroundColor: completenessScore >= 80 ? AppColors.success : completenessScore >= 60 ? AppColors.primary : AppColors.warning,
                },
              ]}
            />
          </View>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <View style={styles.missingFieldsContainer}>
              <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                추가하면 좋은 정보:
              </ThemedText>
              <View style={styles.missingFieldsTags}>
                {missingFields.slice(0, 3).map((field, index) => (
                  <View
                    key={index}
                    style={[
                      styles.missingFieldTag,
                      { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
                    ]}
                  >
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {field}
                    </ThemedText>
                  </View>
                ))}
                {missingFields.length > 3 && (
                  <View
                    style={[
                      styles.missingFieldTag,
                      { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)" },
                    ]}
                  >
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      +{missingFields.length - 3}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(100).duration(500)}>
        <ProfileSection title="소개">
          <ProfileRow icon="briefcase" label="직업" value={user.occupation} showArrow={false} />
          {user.bio ? (
            <View style={styles.bioRow}>
              <Feather name="edit-3" size={20} color={theme.link} style={styles.bioIcon} />
              <ThemedText type="body" style={{ color: theme.textSecondary, flex: 1 }}>
                {user.bio}
              </ThemedText>
            </View>
          ) : null}
        </ProfileSection>
      </Animated.View>

      {user.hobbies.length > 0 ? (
        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <ProfileSection title="취미">
            <View style={styles.tagsContainer}>
              <TagList tags={user.hobbies} variant="primary" />
            </View>
          </ProfileSection>
        </Animated.View>
      ) : null}

      {user.foodPreferences.length > 0 ? (
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <ProfileSection title="음식 취향">
            <View style={styles.tagsContainer}>
              <TagList tags={user.foodPreferences} variant="accent" />
            </View>
          </ProfileSection>
        </Animated.View>
      ) : null}

      {user.gender === "male" ? (
        <Animated.View entering={FadeInUp.delay(350).duration(500)}>
          <ProfileSection title="킹 멤버십">
            <View style={styles.membershipCard}>
              <View style={styles.membershipHeader}>
                <View style={styles.membershipIconContainer}>
                  <Image
                    source={require("../../assets/images/king-crown.png")}
                    style={styles.membershipCrownIcon}
                  />
                </View>
                <View style={styles.membershipInfo}>
                  <ThemedText type="h4" style={{ color: AppColors.accent }}>
                    {user.isKingMember ? "킹 멤버십 활성" : "미가입"}
                  </ThemedText>
                  {user.isKingMember && user.kingMembershipStartDate ? (
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      시작일: {new Date(user.kingMembershipStartDate).toLocaleDateString("ko-KR")}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
              
              {user.isKingMember && user.kingMembershipStartDate ? (
                <View style={[styles.expiryBanner, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={styles.expiryRow}>
                    <Feather name="calendar" size={20} color={AppColors.accent} />
                    <View style={styles.expiryTextContainer}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        만료일
                      </ThemedText>
                      <ThemedText type="h3" style={styles.expiryDate}>
                        {(() => {
                          const startDate = new Date(user.kingMembershipStartDate!);
                          const expiryDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                          return expiryDate.toLocaleDateString("ko-KR", { 
                            year: "numeric", 
                            month: "long", 
                            day: "numeric" 
                          });
                        })()}
                      </ThemedText>
                    </View>
                    <View style={styles.daysLeftContainer}>
                      <ThemedText type="h2" style={styles.daysLeftNumber}>
                        {(() => {
                          const startDate = new Date(user.kingMembershipStartDate!);
                          const expiryDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                          const now = new Date();
                          const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          return Math.max(0, daysLeft);
                        })()}
                      </ThemedText>
                      <ThemedText type="small" style={styles.daysLeftLabel}>
                        일 남음
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.noMembershipBanner, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="info" size={18} color={theme.textSecondary} />
                  <ThemedText type="body" style={{ color: theme.textSecondary, flex: 1, marginLeft: Spacing.sm }}>
                    킹 멤버십에 가입하면 여성 회원에게 먼저 메시지를 보낼 수 있습니다.
                  </ThemedText>
                </View>
              )}
              
              <Button 
                onPress={() => navigation.navigate("Main", { screen: "MembershipTab" } as any)}
                style={styles.membershipButton}
                variant={user.isKingMember ? "outline" : "primary"}
              >
                {user.isKingMember ? "멤버십 관리" : "멤버십 가입하기"}
              </Button>
            </View>
          </ProfileSection>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInUp.delay(400).duration(500)}>
        <ProfileSection title="계정">
          <View style={styles.verificationRow}>
            <View style={styles.verificationInfo}>
              <View style={[styles.verificationIcon, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="phone" size={20} color={theme.link} />
              </View>
              <View style={styles.verificationLabels}>
                <ThemedText type="body">휴대폰 인증</ThemedText>
                <ThemedText 
                  type="small" 
                  style={{ color: user.phoneVerified ? AppColors.success : theme.textSecondary }}
                >
                  {user.phoneVerified ? "인증 완료" : "미인증"}
                </ThemedText>
              </View>
            </View>
            {user.phoneVerified ? (
              <View style={styles.verifiedCheckmark}>
                <Feather name="check-circle" size={24} color={AppColors.success} />
              </View>
            ) : (
              <Button
                onPress={() => navigation.navigate("PhoneVerification", { fromProfile: true })}
                style={styles.verifyButton}
                variant="outline"
              >
                인증하기
              </Button>
            )}
          </View>
          {!user.phoneVerified ? (
            <View style={styles.chatLimitationHint}>
              <Feather name="info" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={[styles.chatLimitationText, { color: theme.textSecondary }]}>
                미인증 시 채팅을 받을 수만 있으며, 먼저 대화를 시작할 수 없습니다
              </ThemedText>
            </View>
          ) : null}
          <ProfileRow icon="shield" label="개인정보 및 보안" onPress={() => {}} />
          <ProfileRow icon="bell" label="알림 설정" onPress={() => {}} />
          <ProfileRow icon="help-circle" label="도움말" onPress={() => {}} />
        </ProfileSection>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(500)}>
        <ProfileSection title="">
          <ProfileRow
            icon="log-out"
            label="로그아웃"
            onPress={handleLogout}
            showArrow={false}
            danger
          />
        </ProfileSection>
      </Animated.View>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLogoutModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="h4" style={styles.modalTitle}>
              로그아웃
            </ThemedText>
            <ThemedText type="body" style={[styles.modalMessage, { color: theme.textSecondary }]}>
              로그아웃 하시겠습니까?
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <ThemedText type="body">취소</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.logoutButton]}
                onPress={confirmLogout}
              >
                <ThemedText type="body" style={{ color: "#fff" }}>로그아웃</ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: AppColors.accent,
  },
  crownBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  crownIcon: {
    width: 24,
    height: 24,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  name: {
  },
  verifiedTextBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    color: AppColors.success,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  editButton: {
    minWidth: 140,
  },
  bioRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  bioIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  tagsContainer: {
    padding: Spacing.lg,
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  verificationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  verificationLabels: {
    gap: 2,
  },
  verifiedCheckmark: {
    padding: Spacing.xs,
  },
  verifyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chatLimitationHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  chatLimitationText: {
    flex: 1,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  modalMessage: {
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {},
  logoutButton: {
    backgroundColor: AppColors.error,
  },
  membershipCard: {
    padding: Spacing.lg,
  },
  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  membershipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(196, 168, 117, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  membershipCrownIcon: {
    width: 28,
    height: 28,
  },
  membershipInfo: {
    flex: 1,
    gap: 2,
  },
  expiryBanner: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  expiryTextContainer: {
    flex: 1,
    gap: 2,
  },
  expiryDate: {
    color: AppColors.accent,
  },
  daysLeftContainer: {
    alignItems: "center",
    backgroundColor: "rgba(196, 168, 117, 0.15)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  daysLeftNumber: {
    color: AppColors.accent,
    fontWeight: "700",
  },
  daysLeftLabel: {
    color: AppColors.accent,
  },
  noMembershipBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  membershipButton: {
    width: "100%",
  },
  completenessCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  completenessHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  completenessIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(196, 168, 117, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  completenessInfo: {
    flex: 1,
  },
  completenessTitle: {
    marginBottom: 2,
  },
  completenessScoreContainer: {
    alignItems: "flex-end",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  missingFieldsContainer: {
    marginTop: Spacing.sm,
  },
  missingFieldsTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  missingFieldTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
});
