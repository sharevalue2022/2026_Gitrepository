import React, { useState, useCallback, useRef, useEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, FlatList, Image, Modal, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useRoute } from "@react-navigation/native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Message, Conversation } from "@/types";
import { getMessages, addMessage, updateConversationLastMessage, getConversations } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getApiUrl } from "@/lib/query-client";

const REPORT_REASONS = [
  { id: "abuse", label: "욕설/비방" },
  { id: "spam", label: "스팸/광고" },
  { id: "photo_request", label: "사진 요구" },
  { id: "scam", label: "사기 의심" },
  { id: "harassment", label: "성적 괴롭힘" },
  { id: "other", label: "기타" },
];

export default function ChatScreen() {
  const route = useRoute<RouteProp<RootStackParamList, "Chat">>();
  const { conversationId } = route.params;
  const { theme, isDark } = useTheme();
  const { user, canSendMessages } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherDescription, setOtherDescription] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    const data = await getMessages(conversationId);
    setMessages(data);
  }, [conversationId]);

  const loadConversation = useCallback(async () => {
    const conversations = await getConversations();
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) setConversation(conv);
  }, [conversationId]);

  const checkBlockStatus = useCallback(async () => {
    if (!user || !conversation) return;

    try {
      const response = await fetch(
        new URL(\`/api/blocks/check?userId=\${user.id}&otherUserId=\${conversation.participantId}\`, getApiUrl()).href
      );
      const data = await response.json();
      if (data.success) {
        setIsBlocked(data.isBlockedByMe);
        setHasBlockedMe(data.hasBlockedMe);
      }
    } catch (error) {
      console.error("Failed to check block status:", error);
    }
  }, [user, conversation]);

  useEffect(() => {
    loadMessages();
    loadConversation();
  }, [loadMessages, loadConversation]);

  useEffect(() => {
    checkBlockStatus();
  }, [checkBlockStatus]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowMenu(true);
          }}
          style={{ marginRight: Spacing.md }}
        >
          <Feather name="more-vertical" size={24} color={theme.text} />
        </Pressable>
      ),
    });
  }, [navigation, theme]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;
    if (hasBlockedMe) {
      Alert.alert("메시지 전송 불가", "상대방이 대화를 차단했습니다.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMessage: Message = {
      id: \`msg_\${Date.now()}\`,
      conversationId,
      senderId: user.id,
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [newMessage, ...prev]);
    setInputText("");

    await addMessage(
      conversationId,
      newMessage,
      conversation?.participantId,
      conversation?.serverConversationId
    );
    await updateConversationLastMessage(conversationId, newMessage.text);
  };

  const handleReport = async () => {
    if (!selectedReason || !user || !conversation) return;

    if (selectedReason === "other" && !otherDescription.trim()) {
      Alert.alert("알림", "기타 사유를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(new URL("/api/reports", getApiUrl()).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: user.id,
          reportedUserId: conversation.participantId,
          reason: REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason,
          description: selectedReason === "other" ? otherDescription : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("신고 완료", "신고가 접수되었습니다. 관리자가 확인 후 조치하겠습니다.");
        setShowReportModal(false);
        setShowMenu(false);
        setSelectedReason("");
        setOtherDescription("");
      } else {
        Alert.alert("오류", data.message || "신고 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Report error:", error);
      Alert.alert("오류", "신고 처리 중 오류가 발생했습니다.");
    }
  };

  const handleBlock = async () => {
    if (!user || !conversation) return;

    Alert.alert(
      "차단하기",
      "이 사용자를 차단하시겠습니까? 차단하면 더 이상 메시지를 주고받을 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "차단",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(new URL("/api/blocks", getApiUrl()).href, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  blockerId: user.id,
                  blockedUserId: conversation.participantId,
                }),
              });

              const data = await response.json();

              if (data.success) {
                setIsBlocked(true);
                setShowMenu(false);
                Alert.alert("차단 완료", "사용자를 차단했습니다.");
                navigation.goBack();
              } else {
                Alert.alert("오류", data.message || "차단 처리 중 오류가 발생했습니다.");
              }
            } catch (error) {
              console.error("Block error:", error);
              Alert.alert("오류", "차단 처리 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const showTimestamp = index === messages.length - 1 ||
      new Date(messages[index + 1]?.timestamp).getTime() - new Date(item.timestamp).getTime() > 300000;

    return (
      <Animated.View
        style={[styles.messageWrapper, isOwn ? styles.ownMessage : styles.otherMessage]}
        entering={FadeInUp.duration(200)}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwn ? AppColors.accent : theme.backgroundDefault,
            },
          ]}
        >
          <ThemedText
            type="body"
            style={{ color: isOwn ? "#fff" : theme.text }}
          >
            {item.text}
          </ThemedText>
        </View>
        <View style={styles.messageFooter}>
          {showTimestamp ? (
            <ThemedText
              type="small"
              style={[styles.timestamp, { color: theme.textSecondary }]}
            >
              {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </ThemedText>
          ) : null}
          {isOwn ? (
            <View style={styles.readStatus}>
              {item.isRead ? (
                <Feather name="check-circle" size={12} color={AppColors.success} />
              ) : (
                <ThemedText type="small" style={[styles.unreadText, { color: theme.textSecondary }]}>
                  읽지않음
                </ThemedText>
              )}
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

  const renderEmpty = () => {
    if (hasBlockedMe) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="slash" size={48} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
            대화가 끊겼습니다
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
            상대방이 대화를 차단했습니다
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("../../assets/images/empty-messages.png")}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
          메시지를 보내 대화를 시작해보세요
        </ThemedText>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        inverted={messages.length > 0}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageList,
          {
            paddingTop: Spacing.lg,
            paddingBottom: headerHeight + Spacing.lg,
          },
          messages.length === 0 ? styles.emptyList : null,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
      <BlurView
        intensity={80}
        tint="dark"
        style={[
          styles.inputContainer,
          { paddingBottom: insets.bottom + Spacing.sm },
        ]}
      >
        {canSendMessages && !hasBlockedMe && !isBlocked ? (
          <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundDefault }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="메시지를 입력하세요..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() ? AppColors.accent : theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather
                name="send"
                size={18}
                color={inputText.trim() ? "#fff" : theme.textSecondary}
              />
            </Pressable>
          </View>
        ) : hasBlockedMe ? (
          <View style={[styles.membershipRequired, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="slash" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
              상대방이 대화를 차단했습니다
            </ThemedText>
          </View>
        ) : isBlocked ? (
          <View style={[styles.membershipRequired, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="slash" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.sm, flex: 1 }}>
              차단한 사용자입니다
            </ThemedText>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              if (user?.gender === "female" && !user?.phoneVerified) {
                navigation.navigate("PhoneVerification" as never);
              } else {
                navigation.navigate("Membership" as never);
              }
            }}
            style={[styles.membershipRequired, { backgroundColor: AppColors.accent + "20" }]}
          >
            <Feather name="lock" size={16} color={AppColors.accent} />
            <ThemedText type="small" style={{ color: AppColors.accent, marginLeft: Spacing.sm, flex: 1 }}>
              {user?.gender === "female" && !user?.phoneVerified
                ? "휴대폰 인증이 필요합니다. 탭하여 인증하세요."
                : !user?.phoneVerified
                ? "휴대폰 인증이 필요합니다. 탭하여 인증하세요."
                : "킹 멤버십이 필요합니다. 탭하여 가입하세요."}
            </ThemedText>
            <Feather name="chevron-right" size={16} color={AppColors.accent} />
          </Pressable>
        )}
      </BlurView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <Pressable
            style={[styles.menuContainer, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => {
                setShowMenu(false);
                setShowReportModal(true);
              }}
            >
              <Feather name="flag" size={20} color={AppColors.warning} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, color: AppColors.warning }}>
                신고하기
              </ThemedText>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={handleBlock}
            >
              <Feather name="slash" size={20} color={AppColors.error} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md, color: AppColors.error }}>
                차단하기
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.reportContainer, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">신고하기</ThemedText>
              <Pressable onPress={() => setShowReportModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
              <ThemedText type="body" style={{ marginBottom: Spacing.md, color: theme.textSecondary }}>
                신고 사유를 선택해주세요
              </ThemedText>
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason.id}
                  style={[
                    styles.reasonItem,
                    {
                      backgroundColor: selectedReason === reason.id ? AppColors.accent + "20" : theme.backgroundSecondary,
                      borderColor: selectedReason === reason.id ? AppColors.accent : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <View style={[
                    styles.radioButton,
                    { borderColor: selectedReason === reason.id ? AppColors.accent : theme.textSecondary }
                  ]}>
                    {selectedReason === reason.id && (
                      <View style={[styles.radioButtonInner, { backgroundColor: AppColors.accent }]} />
                    )}
                  </View>
                  <ThemedText type="body">{reason.label}</ThemedText>
                </Pressable>
              ))}

              {selectedReason === "other" && (
                <Input
                  label="기타 사유"
                  placeholder="자세한 사유를 입력해주세요"
                  value={otherDescription}
                  onChangeText={setOtherDescription}
                  multiline
                  numberOfLines={3}
                  style={{ marginTop: Spacing.md }}
                />
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                onPress={() => setShowReportModal(false)}
                variant="outline"
                style={{ flex: 1, marginRight: Spacing.sm }}
              >
                취소
              </Button>
              <Button
                onPress={handleReport}
                disabled={!selectedReason}
                style={{ flex: 1 }}
              >
                신고하기
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  emptyList: {
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: Spacing.lg,
  },
  messageWrapper: {
    marginBottom: Spacing.sm,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  timestamp: {
    fontSize: 10,
  },
  readStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadText: {
    fontSize: 10,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipRequired: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
  },
  reportContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  reasonList: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
});
