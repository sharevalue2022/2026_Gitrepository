import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CommonActions } from "@react-navigation/native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
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
import { apiRequest } from "@/lib/query-client";

type SubscriptionScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Subscription">;
};

const BENEFITS = [
  { icon: "message-circle" as const, text: "모든 회원에게 무제한 메시지 전송" },
  { icon: "eye" as const, text: "프로필 조회 기록 확인" },
  { icon: "star" as const, text: "검색 결과 상위 노출" },
  { icon: "shield" as const, text: "프로필에 킹 인증 배지 표시" },
  { icon: "heart" as const, text: "고급 매칭 기능 이용" },
];

export default function SubscriptionScreen({
  navigation,
}: SubscriptionScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { user, completeOnboarding } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositorName, setDepositorName] = useState("");

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = async () => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      const response = await apiRequest("POST", "/api/payment-requests", {
        userId: user.id,
        depositorName: depositorName.trim() || null,
      });

      const data = await response.json();

      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowPaymentModal(false);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Payment request error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuccessClose = async () => {
    setShowSuccessModal(false);
    await completeOnboarding();
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={["#0A0A0A", "#141414", "#0A0A0A"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["3xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={styles.header}
          entering={FadeIn.delay(100).duration(600)}
        >
          <Image
            source={require("../../assets/images/king-crown.png")}
            style={styles.crownImage}
            resizeMode="contain"
          />
          <ThemedText
            type="h1"
            style={[styles.title, { color: AppColors.accent }]}
          >
            킹 멤버십
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            프리미엄 기능을 이용하고 의미 있는 대화를 시작하세요
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <BlurView intensity={60} tint="dark" style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <ThemedText type="h4">킹 멤버십</ThemedText>
              <View
                style={[styles.badge, { backgroundColor: AppColors.accent }]}
              >
                <ThemedText
                  type="small"
                  style={{ color: "#000", fontWeight: "600" }}
                >
                  프리미엄
                </ThemedText>
              </View>
            </View>
            <View style={styles.priceRow}>
              <ThemedText type="h1" style={{ color: AppColors.accent }}>
                250,000
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                원 / 월
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              매월 결제, 언제든지 해지 가능
            </ThemedText>
          </BlurView>
        </Animated.View>

        <Animated.View
          style={styles.benefitsList}
          entering={FadeInUp.delay(300).duration(500)}
        >
          {BENEFITS.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <View
                style={[
                  styles.benefitIcon,
                  { backgroundColor: AppColors.accent + "20" },
                ]}
              >
                <Feather
                  name={benefit.icon}
                  size={18}
                  color={AppColors.accent}
                />
              </View>
              <ThemedText type="body" style={styles.benefitText}>
                {benefit.text}
              </ThemedText>
            </View>
          ))}
        </Animated.View>

        <Animated.View
          style={styles.actions}
          entering={FadeInUp.delay(400).duration(500)}
        >
          <Button
            onPress={handleSubscribe}
            style={[
              styles.subscribeButton,
              { backgroundColor: AppColors.accent },
            ]}
          >
            구독하기
          </Button>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              나중에 하기
            </ThemedText>
          </Pressable>
        </Animated.View>

        <ThemedText
          type="small"
          style={[styles.disclaimer, { color: theme.textSecondary }]}
        >
          킹 멤버십 없이는 다른 회원에게 먼저 대화를 시작할 수 없습니다.
        </ThemedText>
      </ScrollView>

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

            <View style={styles.amountInfo}>
              <ThemedText type="body">구독료</ThemedText>
              <ThemedText type="h4" style={{ color: AppColors.accent }}>
                250,000원
              </ThemedText>
            </View>

            <Input
              label="입금자명"
              placeholder="입금하신 분의 성함을 입력해주세요"
              value={depositorName}
              onChangeText={setDepositorName}
              leftIcon="user"
            />

            <ThemedText
              type="small"
              style={[styles.notice, { color: theme.textSecondary }]}
            >
              입금 확인 후 관리자 승인을 거쳐 멤버십이 활성화됩니다. (영업일
              기준 1-2일 소요)
            </ThemedText>

            <Button
              onPress={handlePaymentConfirm}
              disabled={isProcessing || !depositorName.trim()}
              style={styles.confirmButton}
            >
              {isProcessing ? "처리 중..." : "입금 완료 신청"}
            </Button>
          </BlurView>
        </View>
      </Modal>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.modalOverlay}>
          <BlurView
            intensity={80}
            tint="dark"
            style={styles.successModalContent}
          >
            <View
              style={[
                styles.successIcon,
                { backgroundColor: AppColors.success + "20" },
              ]}
            >
              <Feather
                name="check-circle"
                size={48}
                color={AppColors.success}
              />
            </View>
            <ThemedText type="h3" style={styles.successTitle}>
              신청이 완료되었습니다
            </ThemedText>
            <ThemedText
              type="body"
              style={[
                styles.successDescription,
                { color: theme.textSecondary },
              ]}
            >
              입금 확인 후 관리자 승인을 거쳐 킹 멤버십이 활성화됩니다. 승인까지
              영업일 기준 1-2일이 소요될 수 있습니다.
            </ThemedText>
            <Button onPress={handleSuccessClose} style={styles.successButton}>
              확인
            </Button>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  crownImage: {
    width: 100,
    height: 100,
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    maxWidth: 280,
  },
  priceCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing["2xl"],
    overflow: "hidden",
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  benefitsList: {
    gap: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  benefitText: {
    flex: 1,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  subscribeButton: {
    width: "100%",
  },
  skipButton: {
    alignItems: "center",
    padding: Spacing.md,
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
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
  successModalContent: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    overflow: "hidden",
    alignItems: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  successTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  successDescription: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  successButton: {
    width: "100%",
  },
});
