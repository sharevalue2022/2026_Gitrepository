import React, { useState, useEffect, useCallback, useMemo } from "react";
import { StyleSheet, View, FlatList, RefreshControl, Pressable, Image, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, { FadeIn } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { UserCard } from "@/components/UserCard";
import { EmptyState } from "@/components/EmptyState";
import { UserCardSkeleton } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { UserProfile } from "@/types";
import { getUsers } from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type AgeRange = "20~25" | "25~30" | "30~35" | "35~40" | null;
type LocationFilter = string | null;

const AGE_RANGES: { label: string; value: AgeRange; min: number; max: number }[] = [
  { label: "20~25세", value: "20~25", min: 20, max: 25 },
  { label: "25~30세", value: "25~30", min: 25, max: 30 },
  { label: "30~35세", value: "30~35", min: 30, max: 35 },
  { label: "35~40세", value: "35~40", min: 35, max: 40 },
];

const LOCATIONS = ["서울", "경기", "부산", "인천", "대구", "대전", "광주"];

export default function DiscoverScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const targetGender = user.gender === "male" ? "female" : "male";
    const fetchedUsers = await getUsers(user.id, targetGender);
    fetchedUsers.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
    setAllUsers(fetchedUsers);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [user]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    let result = [...allUsers];
    
    if (selectedAgeRange) {
      const range = AGE_RANGES.find(r => r.value === selectedAgeRange);
      if (range) {
        result = result.filter(u => u.age >= range.min && u.age < range.max);
      }
    }
    
    if (selectedLocations.length > 0) {
      result = result.filter(u => 
        selectedLocations.some(loc => u.location.includes(loc))
      );
    }
    
    return result;
  }, [allUsers, selectedAgeRange, selectedLocations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  const handleUserPress = (selectedUser: UserProfile) => {
    navigation.navigate("UserProfile", { user: selectedUser });
  };

  const handleFilterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFilterModal(true);
  };

  const toggleAgeRange = (range: AgeRange) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAgeRange(prev => prev === range ? null : range);
  };

  const toggleLocation = (location: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAgeRange(null);
    setSelectedLocations([]);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedAgeRange) count++;
    if (selectedLocations.length > 0) count++;
    return count;
  };

  const avatarSource = user?.gender === "female"
    ? require("../../assets/images/default-avatar-female.png")
    : require("../../assets/images/default-avatar-male.png");

  const renderHeader = () => (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Image source={avatarSource} style={styles.headerAvatar} />
        </View>
        <ThemedText type="h2" style={styles.greeting}>
          {user?.name || "회원"}님, 안녕하세요.
        </ThemedText>
        <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
          특별한 경험을 시작해보세요
        </ThemedText>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={handleFilterPress}
          style={[
            styles.filterIconButton,
            { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
          ]}
        >
          <Feather name="sliders" size={18} color={theme.text} />
          {getActiveFilterCount() > 0 ? (
            <View style={styles.filterBadge}>
              <ThemedText type="small" style={styles.filterBadgeText}>
                {getActiveFilterCount()}
              </ThemedText>
            </View>
          ) : null}
        </Pressable>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {selectedAgeRange ? (
            <Pressable
              onPress={() => toggleAgeRange(selectedAgeRange)}
              style={[
                styles.filterChip,
                styles.activeFilterChip,
                { backgroundColor: isDark ? "rgba(107,91,149,0.3)" : "rgba(107,91,149,0.15)" },
              ]}
            >
              <ThemedText type="small" style={styles.filterText}>
                나이 {AGE_RANGES.find(r => r.value === selectedAgeRange)?.label}
              </ThemedText>
              <Feather name="x" size={14} color={theme.text} style={{ marginLeft: 4 }} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFilterPress}
              style={[
                styles.filterChip,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
              ]}
            >
              <ThemedText type="small" style={styles.filterText}>
                나이
              </ThemedText>
              <Feather name="chevron-down" size={14} color={theme.textSecondary} style={{ marginLeft: 2 }} />
            </Pressable>
          )}

          {selectedLocations.length > 0 ? (
            <Pressable
              onPress={() => setSelectedLocations([])}
              style={[
                styles.filterChip,
                styles.activeFilterChip,
                { backgroundColor: isDark ? "rgba(107,91,149,0.3)" : "rgba(107,91,149,0.15)" },
              ]}
            >
              <ThemedText type="small" style={styles.filterText}>
                {selectedLocations.join(", ")}
              </ThemedText>
              <Feather name="x" size={14} color={theme.text} style={{ marginLeft: 4 }} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleFilterPress}
              style={[
                styles.filterChip,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
              ]}
            >
              <ThemedText type="small" style={styles.filterText}>
                지역
              </ThemedText>
              <Feather name="chevron-down" size={14} color={theme.textSecondary} style={{ marginLeft: 2 }} />
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderItem = ({ item, index }: { item: UserProfile; index: number }) => (
    <UserCard
      user={item}
      onPress={() => handleUserPress(item)}
      index={index}
    />
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <UserCardSkeleton />
            </View>
          ))}
        </View>
      );
    }

    return (
      <EmptyState
        image={require("../../assets/images/empty-discover.png")}
        title={getActiveFilterCount() > 0 ? "조건에 맞는 회원이 없습니다" : "활동 중인 회원이 없습니다"}
        message={getActiveFilterCount() > 0 
          ? "필터 조건을 변경해보세요."
          : "나중에 다시 확인해주세요. 새로운 회원들이 곧 활동을 시작할 거예요."
        }
      />
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={() => setShowFilterModal(false)} 
        />
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="h3">필터</ThemedText>
            <Pressable onPress={() => setShowFilterModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <ThemedText type="h4" style={styles.filterSectionTitle}>나이</ThemedText>
              <View style={styles.filterOptions}>
                {AGE_RANGES.map((range) => (
                  <Pressable
                    key={range.value}
                    onPress={() => toggleAgeRange(range.value)}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: selectedAgeRange === range.value
                          ? (isDark ? "rgba(107,91,149,0.4)" : "rgba(107,91,149,0.2)")
                          : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"),
                        borderColor: selectedAgeRange === range.value ? "#6B5B95" : "transparent",
                        borderWidth: selectedAgeRange === range.value ? 1 : 0,
                      },
                    ]}
                  >
                    <ThemedText type="body">{range.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <ThemedText type="h4" style={styles.filterSectionTitle}>지역</ThemedText>
              <View style={styles.filterOptions}>
                {LOCATIONS.map((location) => (
                  <Pressable
                    key={location}
                    onPress={() => toggleLocation(location)}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: selectedLocations.includes(location)
                          ? (isDark ? "rgba(107,91,149,0.4)" : "rgba(107,91,149,0.2)")
                          : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"),
                        borderColor: selectedLocations.includes(location) ? "#6B5B95" : "transparent",
                        borderWidth: selectedLocations.includes(location) ? 1 : 0,
                      },
                    ]}
                  >
                    <ThemedText type="body">{location}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              onPress={clearFilters}
              style={[styles.modalButton, styles.clearButton, { borderColor: theme.border }]}
            >
              <ThemedText type="body">초기화</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setShowFilterModal(false)}
              style={[styles.modalButton, styles.applyButton, { backgroundColor: "#6B5B95" }]}
            >
              <ThemedText type="body" style={{ color: "#fff" }}>
                {filteredUsers.length}명 보기
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <FlatList
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
          filteredUsers.length === 0 && !isLoading ? styles.emptyContent : null,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.text}
            progressViewOffset={insets.top + 50}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      {renderFilterModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  emptyContent: {
    flex: 1,
  },
  headerSection: {
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  headerAvatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#6B5B95",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  filterChipsScroll: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  activeFilterChip: {
    borderWidth: 1,
    borderColor: "#6B5B95",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skeletonItem: {
    width: "50%",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    marginBottom: Spacing.md,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    borderWidth: 1,
  },
  applyButton: {},
});
