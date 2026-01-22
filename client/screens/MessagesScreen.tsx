import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ConversationRow } from "@/components/ConversationRow";
import { EmptyState } from "@/components/EmptyState";
import { ConversationRowSkeleton } from "@/components/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { Conversation } from "@/types";
import { getConversations } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function MessagesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    const data = await getConversations();
    setConversations(data);
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations();
  };

  const handleConversationPress = (conversation: Conversation) => {
    navigation.navigate("Chat", {
      conversationId: conversation.id,
      participantName: conversation.participantName,
    });
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <ConversationRow
      conversation={item}
      onPress={() => handleConversationPress(item)}
    />
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View>
          {[0, 1, 2, 3, 4].map((i) => (
            <ConversationRowSkeleton key={i} />
          ))}
        </View>
      );
    }

    return (
      <EmptyState
        title="아직 대화가 없습니다"
        message="관심 있는 회원에게 먼저 대화를 시작해보세요"
        buttonText="회원 둘러보기"
        onButtonPress={() => navigation.navigate("Main", { screen: "DiscoverTab" } as any)}
      />
    );
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.md,
        },
        conversations.length === 0 && !isLoading ? styles.emptyContent : null,
      ]}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={conversations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.text}
          progressViewOffset={headerHeight}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
  },
});
