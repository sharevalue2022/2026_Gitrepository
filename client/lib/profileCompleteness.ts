import type { UserProfile } from "../types";

/**
 * Calculate profile completeness score (0-100)
 * Higher score = more profile fields filled out
 */
export function calculateProfileCompleteness(user: UserProfile): number {
  let completedFields = 0;
  const totalOptionalFields = 10;

  // Check optional fields
  if (user.bio && user.bio.trim().length > 0) completedFields++;
  if (user.occupation && user.occupation.trim().length > 0) completedFields++;
  if (user.hobbies && user.hobbies.length > 0) completedFields++;
  if (user.foodPreferences && user.foodPreferences.length > 0) completedFields++;
  if (user.photos && user.photos.length > 0) completedFields++;
  if (user.religion) completedFields++;
  if (user.drinking) completedFields++;
  if (user.smoking) completedFields++;
  if (user.education) completedFields++;
  if (user.maritalStatus) completedFields++;

  return Math.round((completedFields / totalOptionalFields) * 100);
}

/**
 * Get profile completeness message based on score
 */
export function getCompletenessMessage(score: number): string {
  if (score >= 80) {
    return "완벽한 프로필이에요! 🎉";
  } else if (score >= 60) {
    return "프로필을 조금만 더 채우면 매칭 확률이 더 올라가요!";
  } else if (score >= 40) {
    return "프로필을 더 채우면 매칭 확률이 2배 올라가요!";
  } else {
    return "프로필을 완성하면 다른 사용자에게 더 많이 노출돼요!";
  }
}

/**
 * Get missing fields that user should fill
 */
export function getMissingFields(user: UserProfile): string[] {
  const missing: string[] = [];

  if (!user.bio || user.bio.trim().length === 0) missing.push("자기소개");
  if (!user.occupation || user.occupation.trim().length === 0) missing.push("직업");
  if (!user.hobbies || user.hobbies.length === 0) missing.push("취미");
  if (!user.foodPreferences || user.foodPreferences.length === 0) missing.push("음식 취향");
  if (!user.photos || user.photos.length === 0) missing.push("사진");
  if (!user.religion) missing.push("종교");
  if (!user.drinking) missing.push("음주");
  if (!user.smoking) missing.push("흡연");
  if (!user.education) missing.push("학력");
  if (!user.maritalStatus) missing.push("결혼 여부");

  return missing;
}

/**
 * Calculate discovery weight for sorting users
 * Users with higher completeness get better visibility
 */
export function calculateDiscoveryWeight(user: UserProfile): number {
  const completeness = calculateProfileCompleteness(user);
  const activityRecency = new Date(user.lastActive).getTime();

  // Weight formula:
  // - 70% profile completeness
  // - 30% recent activity
  const completenessWeight = (completeness / 100) * 0.7;
  const activityWeight = activityRecency * 0.3;

  return completenessWeight * 1000000 + activityWeight;
}
