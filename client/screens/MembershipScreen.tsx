import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ProfileSection, ProfileRow } from "@/components/ProfileSection";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";

const BENEFITS = [
  "모든 회원에게 무제한 메시지 전송",
  "프로필 조회 기록 확인",
  "검색 결과 상위 노출",
  "프로필에 킹 인증 배지 표시",
  "고급 매칭 기능 이용",
];

type PaymentStatus = "none" | "pending" | "approved" | "rejected";

export default function MembershipScreen() {
  const { theme, isDark } = useTheme();
  const { user, setKingMembership, updateUser } = useAuth();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositorName, setDepositorName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("none");
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    checkPaymentStatus();
  }, [user?.id]);

  const checkPaymentStatus = async () => {
    if (!user?.id) return;
    setIsCheckingStatus(true);
    try {
      const response = await fetch(
        new URL(`/api/users/${user.id}/payment-status`, getApiUrl()).toString(),
      );
      const data = await response.json();
      if (data.success) {
        setPaymentStatus(data.status);
        if (data.status === "approved" && data.isKingMember) {
          await updateUser({
            isKingMember: true,
            kingMembershipStartDate: data.kingMembershipStartDate,
            kingMembershipExpiry: data.kingMembershipExpiry,
          });
        }
      }
    } catch (error) {
      console.error("Failed to check payment status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDepositorName(user?.name || "");
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!depositorName.trim()) {
      Alert.alert("입력 오류", "입금자명을 입력해주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/payment-requests", {
        userId: user?.id,
        depositorName: depositorName.trim(),
        amount: 250000,
      });

      const data = await response.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPaymentStatus("pending");
        setShowPaymentModal(false);
        Alert.alert(
          "입금 요청 완료",
          "입금 확인 후 24시간 이내에 멤버십이 활성화됩니다.\n\n관리자 확인 전까지 '결제 대기' 상태로 표시됩니다.",
        );
      } else {
        Alert.alert("오류", data.message || "결제 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("Payment request error:", error);
      Alert.alert("오류", "결제 요청 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    setIsProcessing(true);
    await setKingMembership(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsProcessing(false);
    setShowCancelModal(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (paymentStatus === "pending") {
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
          <View
            style={[styles.pendingBadge, { backgroundColor: AppColors.accent }]}
          >
            <Feather name="clock" size={32} color="#fff" />
          </View>
          <ThemedText
            type="h2"
            style={[styles.title, { color: AppColors.accent }]}
          >
            결제 대기 중
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: AppColors.accent + "20" },
            ]}
          >
            <Feather name="clock" size={14} color={AppColors.accent} />
            <ThemedText
              type="small"
              style={{ color: AppColors.accent, marginLeft: Spacing.xs }}
            >
              관리자 확인 중
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <View
            style={[
              styles.pendingInfo,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Feather
              name="info"
              size={20}
              color={AppColors.accent}
              style={{ marginBottom: Spacing.md }}
            />
            <ThemedText
              type="body"
              style={{ textAlign: "center", marginBottom: Spacing.md }}
            >
              입금 확인 후 멤버십이 활성화됩니다
            </ThemedText>
            <ThemedText
              type="small"
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              입금 확인은 영업일 기준 24시간 이내에 처리됩니다.{"\n"}
              문의사항이 있으시면 고객센터로 연락해주세요.
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <View style={[styles.accountInfo, { borderColor: AppColors.accent }]}>
            <ThemedText
              type="small"
              style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}
            >
              입금 계좌
            </ThemedText>
            <ThemedText type="h4" style={{ color: AppColors.accent }}>
              KB국민은행 30380204388027
            </ThemedText>
            <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
              예금주: 조혜빈
            </ThemedText>
          </View>
        </Animated.View>

        <Button
          onPress={checkPaymentStatus}
          variant="outline"
          style={styles.refreshButton}
        >
          상태 새로고침
        </Button>
      </ScrollView>
    );
  }

  if (!user?.isKingMember) {
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
          <Image
            source={require("../../assets/images/king-crown.png")}
            style={styles.crownImage}
            resizeMode="contain"
          />
          <ThemedText
            type="h2"
            style={[styles.title, { color: AppColors.accent }]}
          >
            킹 멤버십
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            프리미엄 기능을 이용하세요
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100).duration(500)}>
          <BlurView intensity={50} tint="dark" style={styles.priceCard}>
            <View style={styles.priceRow}>
              <ThemedText type="h1" style={{ color: AppColors.accent }}>
                250,000
              </ThemedText>
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, marginLeft: Spacing.sm }}
              >
                원 / 월
              </ThemedText>
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View
          style={styles.benefitsCard}
          entering={FadeInUp.delay(200).duration(500)}
        >
          <BlurView intensity={40} tint="dark" style={styles.benefitsBlur}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <View
                  style={[
                    styles.checkIcon,
                    { backgroundColor: AppColors.success + "20" },
                  ]}
                >
                  <Feather name="check" size={14} color={AppColors.success} />
                </View>
                <ThemedText type="body">{benefit}</ThemedText>
              </View>
            ))}
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Button
            onPress={handleSubscribe}
            style={[
              styles.subscribeButton,
              { backgroundColor: AppColors.accent },
            ]}
          >
            구독하기
          </Button>
        </Animated.View>

        <Modal
          visible={showPaymentModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <BlurView intensity={90} tint="dark" style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <ThemedText type="h3" style={styles.modalTitle}>
                  결제 안내
                </ThemedText>
                <Pressable
                  onPress={() => setShowPaymentModal(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View
                style={[
                  styles.paymentInfo,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText type="body" style={styles.paymentLabel}>
                  현재 결제 방식 안내
                </ThemedText>
                <ThemedText
                  type="small"
                  style={[
                    styles.paymentDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  현재는 계좌이체를 통한 결제만 가능합니다. 아래 계좌로 구독료를
                  입금해주시면 24시간 이내에 멤버십이 활성화됩니다.
                </ThemedText>
              </View>

              <View
                style={[styles.accountInfo, { borderColor: AppColors.accent }]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: theme.textSecondary,
                    marginBottom: Spacing.xs,
                  }}
                >
                  입금 계좌
                </ThemedText>
                <ThemedText type="h4" style={{ color: AppColors.accent }}>
                  KB국민은행 30380204388027
                </ThemedText>
                <ThemedText type="body" style={{ marginTop: Spacing.xs }}>
                  예금주: 조혜빈
                </ThemedText>
              </View>

              <View style={styles.amountInfo}>
                <ThemedText type="body">구독료</ThemedText>
                <ThemedText type="h4" style={{ color: AppColors.accent }}>
                  250,000원
                </ThemedText>
              </View>

              <View
                style={[
                  styles.depositorInput,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: theme.textSecondary,
                    marginBottom: Spacing.sm,
                  }}
                >
                  입금자명 (필수)
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.backgroundRoot,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={depositorName}
                  onChangeText={setDepositorName}
                  placeholder="실제 입금하실 성함을 입력해주세요"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <ThemedText
                type="small"
                style={[styles.notice, { color: theme.textSecondary }]}
              >
                입금자명과 실제 입금하는 계좌의 성함이 일치해야 합니다.
              </ThemedText>

              <Button
                onPress={handlePaymentConfirm}
                disabled={isProcessing || !depositorName.trim()}
                style={styles.confirmButton}
              >
                {isProcessing ? "처리 중..." : "입금 요청하기"}
              </Button>
            </BlurView>
          </View>
        </Modal>
      </ScrollView>
    );
  }

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
        <View
          style={[styles.activeBadge, { backgroundColor: AppColors.accent }]}
        >
          <Image
            source={require("../../assets/images/king-crown.png")}
            style={styles.crownImageSmall}
            resizeMode="contain"
          />
        </View>
        <ThemedText
          type="h2"
          style={[styles.title, { color: AppColors.accent }]}
        >
          킹 멤버십
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: AppColors.success + "20" },
          ]}
        >
          <Feather name="check-circle" size={14} color={AppColors.success} />
          <ThemedText
            type="small"
            style={{ color: AppColors.success, marginLeft: Spacing.xs }}
          >
            활성화됨
          </ThemedText>
        </View>
      </Animated.View>

      <ProfileSection title="구독 정보">
        <ProfileRow
          icon="calendar"
          label="갱신일"
          value={formatDate(user.kingMembershipExpiry)}
          showArrow={false}
        />
        <ProfileRow
          icon="credit-card"
          label="결제 방식"
          value="계좌이체"
          showArrow={false}
        />
        <ProfileRow
          icon="tag"
          label="요금제"
          value="월간 (250,000원)"
          showArrow={false}
        />
      </ProfileSection>

      <ProfileSection title="혜택">
        <View style={styles.benefitsContainer}>
          {BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View
                style={[
                  styles.checkIcon,
                  { backgroundColor: AppColors.success + "20" },
                ]}
              >
                <Feather name="check" size={14} color={AppColors.success} />
              </View>
              <ThemedText type="body">{benefit}</ThemedText>
            </View>
          ))}
        </View>
      </ProfileSection>

      <Button
        onPress={handleCancel}
        style={[
          styles.cancelButton,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <ThemedText type="body" style={{ color: AppColors.error }}>
          멤버십 해지
        </ThemedText>
      </Button>

      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3" style={styles.modalTitle}>
                멤버십 해지
              </ThemedText>
              <Pressable
                onPress={() => setShowCancelModal(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View
              style={[
                styles.cancelWarning,
                { backgroundColor: AppColors.accent + "15" },
              ]}
            >
              <Feather
                name="info"
                size={20}
                color={AppColors.accent}
                style={{ marginBottom: Spacing.sm }}
              />
              <ThemedText
                type="body"
                style={[styles.cancelWarningText, { color: theme.text }]}
              >
                멤버십 해지시, 결제일 기준 +30일까지는 킹 멤버십이 유지됩니다.
              </ThemedText>
            </View>

            <View style={[styles.expiryInfo, { borderColor: theme.border }]}>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}
              >
                멤버십 유효 기간
              </ThemedText>
              <ThemedText type="h4" style={{ color: AppColors.accent }}>
                {formatDate(user.kingMembershipExpiry)}까지
              </ThemedText>
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
              >
                이 날짜 이후에는 메시지 전송이 불가능합니다.
              </ThemedText>
            </View>

            <ThemedText
              type="small"
              style={[styles.cancelNotice, { color: theme.textSecondary }]}
            >
              해지 후에도 위 날짜까지는 모든 킹 멤버십 혜택을 이용하실 수
              있습니다.
            </ThemedText>

            <View style={styles.cancelActions}>
              <Button
                onPress={() => setShowCancelModal(false)}
                variant="outline"
                style={styles.cancelKeepButton}
              >
                멤버십 유지
              </Button>
              <Button
                onPress={handleCancelConfirm}
                disabled={isProcessing}
                style={[
                  styles.cancelConfirmButton,
                  { backgroundColor: AppColors.error },
                ]}
              >
                {isProcessing ? "처리 중..." : "해지하기"}
              </Button>
            </View>
          </BlurView>
        </View>
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
  crownImage: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
  },
  crownImageSmall: {
    width: 40,
    height: 40,
  },
  activeBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  priceCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  benefitsCard: {
    marginBottom: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  benefitsBlur: {
    padding: Spacing.xl,
  },
  benefitsContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  subscribeButton: {
    width: "100%",
  },
  cancelButton: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  modalContent: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  paymentInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  paymentLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  paymentDescription: {
    lineHeight: 20,
  },
  accountInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  amountInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  notice: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  confirmButton: {
    width: "100%",
  },
  cancelWarning: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  cancelWarningText: {
    textAlign: "center",
    lineHeight: 22,
  },
  expiryInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  cancelNotice: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  cancelActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelKeepButton: {
    flex: 1,
  },
  cancelConfirmButton: {
    flex: 1,
  },
  pendingBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  pendingInfo: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  refreshButton: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  depositorInput: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  textInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 16,
  },
});
