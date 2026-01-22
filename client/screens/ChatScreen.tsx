import React, { useState, useCallback, useRef, useEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, FlatList, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useRoute } from "@react-navigation/native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Spacing, BorderRadius, AppColors } from "@/constants/theme";
import { Message, Conversation } from "@/types";
import { getMessages, addMessage, updateConversationLastMessage, getConversations } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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

  useEffect(() => {
    loadMessages();
    loadConversation();
  }, [loadMessages, loadConversation]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
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

  const renderEmpty = () => (
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
        {canSendMessages ? (
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
    gap: Spacing.sm,
  },
  timestamp: {
    fontSize: 11,
  },
  readStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadText: {
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
    opacity: 0.7,
  },
  inputContainer: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
});
