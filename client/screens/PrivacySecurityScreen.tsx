import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function PrivacySecurityScreen() {
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
          킹데이트 개인정보처리방침
        </ThemedText>

        <View
          style={[styles.divider, { backgroundColor: theme.textSecondary }]}
        />

        {/* 1. 개인정보처리방침의 목적 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            1. 개인정보처리방침의 목적
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            킹데이트(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보
            보호법」을 준수하고 있습니다. 회사는 개인정보처리방침을 통하여
            이용자가 제공하는 개인정보가 어떠한 용도와 방식으로 이용되고 있으며,
            개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
          </ThemedText>
        </View>

        {/* 2. 수집하는 개인정보 항목 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            2. 수집하는 개인정보 항목
          </ThemedText>
          <ThemedText style={[styles.subTitle, { color: theme.text }]}>
            필수 수집 항목:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 이름, 성별, 생년월일, 휴대폰 번호
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 이메일 주소
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 프로필 사진
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 위치 정보 (서비스 이용 시)
            </ThemedText>
          </View>
          <ThemedText style={[styles.subTitle, { color: theme.text }]}>
            선택 수집 항목:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 직업, 학력, 자기소개
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 취미, 관심사, 음식 취향
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 이상형 정보
            </ThemedText>
          </View>
        </View>

        {/* 3. 개인정보의 이용 목적 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            3. 개인정보의 이용 목적
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 회원 가입 및 서비스 이용에 관한 본인 확인
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 매칭 서비스 제공 및 추천
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 서비스 개선 및 신규 서비스 개발
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 고객 문의 대응 및 분쟁 해결
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 마케팅 및 광고 활용 (동의한 경우에 한함)
            </ThemedText>
          </View>
        </View>

        {/* 4. 개인정보의 제공 및 위탁 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            4. 개인정보의 제공 및 위탁
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            회사는 이용자의 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만,
            다음의 경우에는 예외로 합니다:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 이용자가 사전에 동의한 경우
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우
            </ThemedText>
          </View>
        </View>

        {/* 5. 개인정보 보유 및 이용기간 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            5. 개인정보 보유 및 이용기간
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이
            파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우
            회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를
            보관합니다:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 계약 또는 청약철회 등에 관한 기록: 5년
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 대금결제 및 재화 등의 공급에 관한 기록: 5년
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 소비자의 불만 또는 분쟁처리에 관한 기록: 3년
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 접속에 관한 기록: 3개월
            </ThemedText>
          </View>
        </View>

        {/* 6. 개인정보의 파기 절차 및 방법 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            6. 개인정보의 파기 절차 및 방법
          </ThemedText>
          <ThemedText style={[styles.subTitle, { color: theme.text }]}>
            파기 절차:
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 별도의 DB로
            옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한
            정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.
          </ThemedText>
          <ThemedText style={[styles.subTitle, { color: theme.text }]}>
            파기 방법:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기
            </ThemedText>
          </View>
        </View>

        {/* 7. 이용자의 권리와 행사 방법 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            7. 이용자의 권리와 행사 방법
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            이용자는 언제든지 다음의 권리를 행사할 수 있습니다:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 개인정보 열람 요구
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 오류 등이 있을 경우 정정 요구
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 삭제 요구
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 처리정지 요구
            </ThemedText>
          </View>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            위 권리 행사는 앱 내 설정 또는 개인정보 보호책임자에게 서면, 전화,
            이메일 등을 통해 하실 수 있으며, 회사는 이에 대해 지체 없이
            조치하겠습니다.
          </ThemedText>
        </View>

        {/* 8. 개인정보 보호를 위한 기술적·관리적 조치 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            8. 개인정보 보호를 위한 기술적·관리적 조치
          </ThemedText>
          <ThemedText style={[styles.subTitle, { color: theme.text }]}>
            기술적 조치:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 개인정보의 암호화
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 해킹 등에 대비한 기술적 대책
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 접근 권한의 제한 및 관리
            </ThemedText>
          </View>
          <ThemedText style={[styles.subTitle, { color: theme.text }]}>
            관리적 조치:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 개인정보 취급 직원의 최소화 및 교육
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 개인정보보호 내부관리계획 수립 및 시행
            </ThemedText>
            <ThemedText style={[styles.bulletItem, { color: theme.text }]}>
              • 정기적인 자체 감사 실시
            </ThemedText>
          </View>
        </View>

        {/* 9. 개인정보 보호책임자 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            9. 개인정보 보호책임자
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
            관련한 이용자의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보
            보호책임자를 지정하고 있습니다.
          </ThemedText>
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
            <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
              개인정보 보호책임자 연락처
            </ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.text }]}>
              kingdateofficial@gmail.com
            </ThemedText>
          </View>
        </View>

        {/* 10. 개인정보처리방침의 변경 */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            10. 개인정보처리방침의 변경
          </ThemedText>
          <ThemedText style={[styles.paragraph, { color: theme.text }]}>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
            변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일
            전부터 공지사항을 통하여 고지할 것입니다.
          </ThemedText>
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
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
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
  infoBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: 15,
    lineHeight: 22,
  },
});
