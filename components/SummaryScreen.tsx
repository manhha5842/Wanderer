import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppColors } from "../constants/Colors";
import { StoryChoice } from "../services/geminiService";

export interface WalkingSummary {
  totalTime: number; // seconds
  distance: number; // meters
  checkpointsCompleted: number;
  storyChoicesMade: StoryChoice[];
  genre: string;
}

interface SummaryScreenProps {
  summary: WalkingSummary;
  onStartNew: () => void;
  onBackToHome: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  summary,
  onStartNew,
  onBackToHome,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const getGenreEmoji = (genre: string) => {
    const genreEmojis = {
      adventure: "🗺️",
      mystery: "🔍",
      fantasy: "🧙‍♂️",
      historical: "🏛️",
      comedy: "😄",
    };
    return genreEmojis[genre as keyof typeof genreEmojis] || "📖";
  };

  const getGenreName = (genre: string) => {
    const genreNames = {
      adventure: "Phiêu lưu",
      mystery: "Bí ẩn",
      fantasy: "Kỳ ảo",
      historical: "Lịch sử",
      comedy: "Hài hước",
    };
    return genreNames[genre as keyof typeof genreNames] || "Khám phá";
  };

  const calculateAchievements = () => {
    const achievements = [];

    // Distance achievements
    if (summary.distance >= 5000) {
      achievements.push({
        icon: "🏃‍♂️",
        title: "Marathon Walker",
        description: "Đi bộ hơn 5km",
        color: "#F59E0B",
      });
    } else if (summary.distance >= 2000) {
      achievements.push({
        icon: "🚶‍♂️",
        title: "Active Explorer",
        description: "Đi bộ hơn 2km",
        color: "#10B981",
      });
    }

    // Time achievements
    if (summary.totalTime >= 3600) {
      achievements.push({
        icon: "⏰",
        title: "Time Master",
        description: "Hành trình dài hơn 1 giờ",
        color: "#8B5CF6",
      });
    }

    // Checkpoint achievements
    if (summary.checkpointsCompleted >= 5) {
      achievements.push({
        icon: "🎯",
        title: "Checkpoint Champion",
        description: "Hoàn thành 5+ điểm dừng",
        color: "#EF4444",
      });
    } else if (summary.checkpointsCompleted >= 3) {
      achievements.push({
        icon: "📍",
        title: "Explorer",
        description: "Hoàn thành 3+ điểm dừng",
        color: "#3B82F6",
      });
    }

    // Story choices achievements
    if (summary.storyChoicesMade.length >= 3) {
      achievements.push({
        icon: "🎭",
        title: "Story Weaver",
        description: "Đưa ra 3+ lựa chọn câu chuyện",
        color: "#F97316",
      });
    }

    return achievements;
  };

  const shareResults = async () => {
    try {
      const message = `
🚶‍♂️ Vừa hoàn thành một cuộc phiêu lưu tuyệt vời với Wanderer!

📊 Thống kê:
⏱️ Thời gian: ${formatTime(summary.totalTime)}
📏 Quãng đường: ${formatDistance(summary.distance)}
🎯 Điểm dừng: ${summary.checkpointsCompleted}
📖 Thể loại: ${getGenreName(summary.genre)}
🎭 Lựa chọn câu chuyện: ${summary.storyChoicesMade.length}

#Wanderer #Walking #Adventure #Storytelling
      `.trim();

      await Share.share({
        message,
        title: "Kết quả hành trình Wanderer",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const achievements = calculateAchievements();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.background}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.celebrationIcon}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
          </View>
          <Text style={styles.headerTitle}>Chúc mừng!</Text>
          <Text style={styles.headerSubtitle}>
            Bạn đã hoàn thành một hành trình tuyệt vời
          </Text>
        </View>

        {/* Main Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statValue}>
              {formatTime(summary.totalTime)}
            </Text>
            <Text style={styles.statLabel}>Thời gian</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📏</Text>
            <Text style={styles.statValue}>
              {formatDistance(summary.distance)}
            </Text>
            <Text style={styles.statLabel}>Quãng đường</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{summary.checkpointsCompleted}</Text>
            <Text style={styles.statLabel}>Điểm dừng</Text>
          </View>
        </View>

        {/* Story Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>
                {getGenreEmoji(summary.genre)}
              </Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Câu chuyện của bạn</Text>
              <Text style={styles.sectionSubtitle}>
                Thể loại: {getGenreName(summary.genre)}
              </Text>
            </View>
          </View>

          <View style={styles.storyStats}>
            <View style={styles.storyStatItem}>
              <Text style={styles.storyStatValue}>
                {summary.storyChoicesMade.length}
              </Text>
              <Text style={styles.storyStatLabel}>Lựa chọn đã thực hiện</Text>
            </View>
          </View>

          {/* Story Choices */}
          {summary.storyChoicesMade.length > 0 && (
            <View style={styles.choicesContainer}>
              <Text style={styles.choicesTitle}>Các lựa chọn của bạn:</Text>
              {summary.storyChoicesMade.map(
                (choice: StoryChoice, index: number) => (
                  <View key={index} style={styles.choiceItem}>
                    <View style={styles.choiceNumber}>
                      <Text style={styles.choiceNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.choiceText}>{choice.text}</Text>
                  </View>
                )
              )}
            </View>
          )}
        </View>

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>🏆</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Thành tích</Text>
                <Text style={styles.sectionSubtitle}>
                  Những cột mốc bạn đã đạt được
                </Text>
              </View>
            </View>

            <View style={styles.achievementsList}>
              {achievements.map((achievement, index) => (
                <View
                  key={index}
                  style={[
                    styles.achievementCard,
                    { borderLeftColor: achievement.color },
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementContent}>
                    <Text style={styles.achievementTitle}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Performance Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>📊</Text>
            </View>
            <View>
              <Text style={styles.sectionTitle}>Phân tích hiệu suất</Text>
              <Text style={styles.sectionSubtitle}>
                Đánh giá chi tiết hành trình
              </Text>
            </View>
          </View>

          <View style={styles.insightsList}>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Tốc độ trung bình</Text>
              <Text style={styles.insightValue}>
                {(summary.distance / 1000 / (summary.totalTime / 3600)).toFixed(
                  1
                )}{" "}
                km/h
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Thời gian mỗi điểm dừng</Text>
              <Text style={styles.insightValue}>
                {summary.checkpointsCompleted > 0
                  ? `${Math.round(
                      summary.totalTime / summary.checkpointsCompleted / 60
                    )} phút`
                  : "N/A"}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Tỷ lệ hoàn thành</Text>
              <Text style={styles.insightValue}>100%</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomPanel}>
        <TouchableOpacity style={styles.shareButton} onPress={shareResults}>
          <Text style={styles.shareIcon}>📤</Text>
          <Text style={styles.shareText}>Chia sẻ kết quả</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.homeButton} onPress={onBackToHome}>
            <Text style={styles.homeButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newJourneyButton}
            onPress={onStartNew}
          >
            <Text style={styles.newJourneyButtonText}>Hành trình mới</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
  },

  // Header
  header: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    backgroundColor: "#FEF3C7",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  celebrationEmoji: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: AppColors.textWhite,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: AppColors.textLight,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 24,
  },

  // Main Stats
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },

  // Sections
  section: {
    backgroundColor: AppColors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sectionIconText: {
    fontSize: 20,
    color: AppColors.textWhite,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },

  // Story Stats
  storyStats: {
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  storyStatItem: {
    alignItems: "center",
  },
  storyStatValue: {
    fontSize: 28,
    fontWeight: "800",
    color: AppColors.primary,
    marginBottom: 4,
  },
  storyStatLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },

  // Story Choices
  choicesContainer: {
    marginTop: 16,
  },
  choicesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  choiceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  choiceNumber: {
    width: 28,
    height: 28,
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  choiceNumberText: {
    color: AppColors.textWhite,
    fontSize: 12,
    fontWeight: "700",
  },
  choiceText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: "600",
  },

  // Achievements
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
  },
  achievementIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },

  // Performance Insights
  insightsList: {
    gap: 16,
  },
  insightItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  insightValue: {
    fontSize: 16,
    color: AppColors.textPrimary,
    fontWeight: "700",
  },

  // Bottom Panel
  bottomPanel: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 45,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  shareButton: {
    backgroundColor: AppColors.surfaceGray,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  shareIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  shareText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  homeButton: {
    flex: 1,
    backgroundColor: AppColors.surfaceGray,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  newJourneyButton: {
    flex: 2,
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  newJourneyButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textWhite,
  },
});

export default SummaryScreen;
