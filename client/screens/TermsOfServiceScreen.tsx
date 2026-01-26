import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function TermsOfServiceScreen() {
  const { theme, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeIn.duration(400)}>
        <ThemedText style={[styles.mainTitle, { color: theme.text }]}>
          서비스 이용약관
        </ThemedText>

        <View
          style={[styles.divider, { backgroundColor: theme.textSecondary }]}
        />

        {/* 제1조 (목적) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제1조 (목적)
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            본 약관은 밋더니즈가 제공하는 킹데이트 서비스(이하 "서비스")의 이용과
            관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로
            합니다.
          </ThemedText>
        </View>

        {/* 제2조 (정의) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제2조 (정의)
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. "회원"이란 본 약관에 동의하고 서비스 이용 자격을 부여받은 자를
              말합니다.
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. "서비스"란 회사가 모바일 애플리케이션을 통해 제공하는 기능
              일체를 의미합니다.
            </ThemedText>
          </View>
        </View>

        {/* 제3조 (약관의 효력 및 변경) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제3조 (약관의 효력 및 변경)
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. 본 약관은 회원이 동의함으로써 효력이 발생합니다.
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. 회사는 관련 법령을 위반하지 않는 범위 내에서 약관을 변경할 수
              있으며, 변경 시 서비스 내 공지합니다.
            </ThemedText>
          </View>
        </View>

        {/* 제4조 (회원가입 및 이용 제한) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제4조 (회원가입 및 이용 제한)
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. 회원은 만 14세 이상이어야 합니다.
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. 회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한하거나 회원
              자격을 해지할 수 있습니다.
            </ThemedText>
          </View>
          <View style={styles.subBulletList}>
            <ThemedText style={[styles.subBulletItem, { color: theme.text }]}>
              • 타인의 정보를 도용한 경우
            </ThemedText>
            <ThemedText style={[styles.subBulletItem, { color: theme.text }]}>
              • 법령 또는 본 약관을 위반한 경우
            </ThemedText>
            <ThemedText style={[styles.subBulletItem, { color: theme.text }]}>
              • 서비스의 정상적인 운영을 방해한 경우
            </ThemedText>
          </View>
        </View>

        {/* 제5조 (서비스의 제공 및 변경) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제5조 (서비스의 제공 및 변경)
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. 회사는 안정적인 서비스 제공을 위해 노력합니다.
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. 회사는 운영상 또는 기술상의 필요에 따라 서비스의 전부 또는
              일부를 변경할 수 있습니다.
            </ThemedText>
          </View>
        </View>

        {/* 제6조 (유료 서비스) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제6조 (유료 서비스)
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. 서비스 내 일부 기능은 유료로 제공될 수 있습니다.
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. 유료 서비스의 이용 조건, 결제 방식, 이용 기간 등은 서비스
              화면을 통해 안내합니다.
            </ThemedText>
          </View>
        </View>

        {/* 제7조 (환불 및 해지) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제7조 (환불 및 해지)
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. 유료 서비스의 환불 및 해지는 관련 법령 및 회사의 정책에
              따릅니다.
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. 세부 기준은 서비스 내 별도 안내에 따릅니다.
            </ThemedText>
          </View>
        </View>

        {/* 제8조 (회원의 의무) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제8조 (회원의 의무)
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            회원은 다음 행위를 하여서는 안 됩니다.
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. 법령 또는 공서양속에 반하는 행위
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. 타인의 권리를 침해하는 행위
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              3. 서비스 내 정보를 무단으로 복제·배포하는 행위
            </ThemedText>
          </View>
        </View>

        {/* 제9조 (책임의 제한) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제9조 (책임의 제한)
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              1. 회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 제공
              중단에 대해 책임을 지지 않습니다.
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              2. 회사는 회원 간 또는 회원과 제3자 간 발생한 분쟁에 개입하지
              않으며 이에 대한 책임을 지지 않습니다.
            </ThemedText>
          </View>
        </View>

        {/* 제10조 (준거법 및 관할) */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            제10조 (준거법 및 관할)
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련하여
            발생한 분쟁은 관할 법원에 따릅니다.
          </ThemedText>
        </View>

        {/* 시행일 */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.03)",
            },
          ]}
        >
          <ThemedText style={[styles.infoValue, { color: theme.text }]}>
            공고일자: 2026년 1월 26일
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: theme.text }]}>
            시행일자: 2026년 1월 26일
          </ThemedText>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  divider: {
    height: 1,
    opacity: 0.2,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  bulletList: {
    marginLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bulletItem: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  subBulletList: {
    marginLeft: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  subBulletItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  infoBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 22,
  },
});
