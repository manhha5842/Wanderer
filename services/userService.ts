import AsyncStorage from "@react-native-async-storage/async-storage";
import { Route, Story, UserPreferences, WalkSession } from "../types";

export interface UserStats {
  totalWalks: number;
  totalDistance: number; // in meters
  totalDuration: number; // in minutes
  totalSteps?: number;
  totalCalories?: number;
  favoriteGenre: string;
  averageWalkDuration: number;
  longestWalk: number;
  completedStories: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  type: "distance" | "duration" | "stories" | "exploration" | "special";
  requirement: number;
  isUnlocked: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  stats: UserStats;
  preferences: UserPreferences;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface WalkHistory {
  session: WalkSession;
  route: Route;
  story?: Story;
  rating?: number;
  notes?: string;
  photos?: string[];
  completedAt: Date;
}

const STORAGE_KEYS = {
  USER_PROFILE: "@wanderer_user_profile",
  WALK_HISTORY: "@wanderer_walk_history",
  ACHIEVEMENTS: "@wanderer_achievements",
  PREFERENCES: "@wanderer_preferences",
} as const;

export class UserService {
  private userProfile: UserProfile | null = null;
  private walkHistory: WalkHistory[] = [];

  /**
   * Initialize user service và load dữ liệu đã lưu
   */
  async initialize(): Promise<UserProfile> {
    try {
      await this.loadUserProfile();
      await this.loadWalkHistory();

      if (!this.userProfile) {
        this.userProfile = await this.createNewUser();
      }

      return this.userProfile;
    } catch (error) {
      console.error("Error initializing user service:", error);
      this.userProfile = await this.createNewUser();
      return this.userProfile;
    }
  }

  /**
   * Tạo user mới
   */
  private async createNewUser(): Promise<UserProfile> {
    const defaultProfile: UserProfile = {
      id: `user_${Date.now()}`,
      name: "Wanderer",
      level: 1,
      xp: 0,
      stats: {
        totalWalks: 0,
        totalDistance: 0,
        totalDuration: 0,
        favoriteGenre: "adventure",
        averageWalkDuration: 0,
        longestWalk: 0,
        completedStories: 0,
        achievements: [],
      },
      preferences: {
        preferredGenres: ["adventure", "mystery"],
        walkingSpeed: "normal",
        audioSpeed: 1.0,
        enableStepCounting: true,
        enableCalorieTracking: true,
        notificationSettings: {
          checkpointReminders: true,
          storyPrompts: true,
          completionCelebrations: true,
        },
      },
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };

    await this.saveUserProfile(defaultProfile);
    return defaultProfile;
  }

  /**
   * Load user profile từ storage
   */
  private async loadUserProfile(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        this.userProfile = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (this.userProfile) {
          this.userProfile.createdAt = new Date(this.userProfile.createdAt);
          this.userProfile.lastActiveAt = new Date(
            this.userProfile.lastActiveAt
          );
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }

  /**
   * Load walk history từ storage
   */
  private async loadWalkHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.WALK_HISTORY);
      if (stored) {
        const history = JSON.parse(stored);
        this.walkHistory = history.map((item: any) => ({
          ...item,
          session: {
            ...item.session,
            startTime: new Date(item.session.startTime),
            endTime: item.session.endTime
              ? new Date(item.session.endTime)
              : undefined,
          },
          completedAt: new Date(item.completedAt),
        }));
      }
    } catch (error) {
      console.error("Error loading walk history:", error);
    }
  }

  /**
   * Save user profile to storage
   */
  private async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      this.userProfile = profile;
    } catch (error) {
      console.error("Error saving user profile:", error);
    }
  }

  /**
   * Save walk history to storage
   */
  private async saveWalkHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.WALK_HISTORY,
        JSON.stringify(this.walkHistory)
      );
    } catch (error) {
      console.error("Error saving walk history:", error);
    }
  }

  /**
   * Record completed walk session
   */
  async recordWalkSession(
    session: WalkSession,
    route: Route,
    story?: Story,
    rating?: number,
    notes?: string
  ): Promise<void> {
    if (!this.userProfile) {
      throw new Error("User profile not initialized");
    }

    // Add to history
    const walkRecord: WalkHistory = {
      session,
      route,
      story,
      rating,
      notes,
      completedAt: new Date(),
    };

    this.walkHistory.unshift(walkRecord); // Add to beginning

    // Keep only last 100 walks
    if (this.walkHistory.length > 100) {
      this.walkHistory = this.walkHistory.slice(0, 100);
    }

    // Update user stats
    await this.updateUserStats(session, route, story);

    // Check for new achievements
    await this.checkAchievements();

    // Save changes
    await this.saveWalkHistory();
    await this.saveUserProfile(this.userProfile);
  }

  /**
   * Update user statistics
   */
  private async updateUserStats(
    session: WalkSession,
    route: Route,
    story?: Story
  ): Promise<void> {
    if (!this.userProfile) return;

    const stats = this.userProfile.stats;
    const duration =
      session.endTime && session.startTime
        ? Math.floor(
            (session.endTime.getTime() - session.startTime.getTime()) / 60000
          )
        : 0;

    // Update basic stats
    stats.totalWalks += 1;
    stats.totalDistance += session.totalDistance || route.estimatedDistance;
    stats.totalDuration += duration;

    if (session.totalSteps) {
      stats.totalSteps = (stats.totalSteps || 0) + session.totalSteps;
    }

    if (session.totalCalories) {
      stats.totalCalories = (stats.totalCalories || 0) + session.totalCalories;
    }

    // Update longest walk
    if (duration > stats.longestWalk) {
      stats.longestWalk = duration;
    }

    // Update average duration
    stats.averageWalkDuration = Math.floor(
      stats.totalDuration / stats.totalWalks
    );

    // Update completed stories
    if (story) {
      stats.completedStories += 1;

      // Update favorite genre (simple frequency-based)
      const genreCounts: Record<string, number> = {};
      this.walkHistory.forEach((walk) => {
        if (walk.story) {
          genreCounts[walk.story.genre] =
            (genreCounts[walk.story.genre] || 0) + 1;
        }
      });

      let maxCount = 0;
      let favoriteGenre = "adventure";
      Object.entries(genreCounts).forEach(([genre, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteGenre = genre;
        }
      });

      stats.favoriteGenre = favoriteGenre;
    }

    // Add XP
    const xpGained = this.calculateXP(session, route, story);
    this.userProfile.xp += xpGained;

    // Level up check
    this.checkLevelUp();

    // Update last active
    this.userProfile.lastActiveAt = new Date();
  }

  /**
   * Calculate XP từ walk session
   */
  private calculateXP(
    session: WalkSession,
    route: Route,
    story?: Story
  ): number {
    let xp = 0;

    // Base XP cho completing walk
    xp += 50;

    // Distance bonus (1 XP per 100m)
    xp += Math.floor((session.totalDistance || route.estimatedDistance) / 100);

    // Duration bonus (1 XP per minute)
    const duration =
      session.endTime && session.startTime
        ? Math.floor(
            (session.endTime.getTime() - session.startTime.getTime()) / 60000
          )
        : 0;
    xp += duration;

    // Story completion bonus
    if (story) {
      xp += 100;
    }

    // Checkpoint bonus
    xp += session.visitedCheckpoints.length * 25;

    // Choice bonus (interactive story)
    xp += session.choicesMade.length * 15;

    return xp;
  }

  /**
   * Check và handle level up
   */
  private checkLevelUp(): void {
    if (!this.userProfile) return;

    const xpForNextLevel = this.getXPForLevel(this.userProfile.level + 1);

    if (this.userProfile.xp >= xpForNextLevel) {
      this.userProfile.level += 1;

      // Notify user (you can trigger a callback here)
      console.log(`Level up! Now level ${this.userProfile.level}`);
    }
  }

  /**
   * Calculate XP required cho level
   */
  private getXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  /**
   * Check achievements
   */
  private async checkAchievements(): Promise<Achievement[]> {
    if (!this.userProfile) return [];

    const newAchievements: Achievement[] = [];
    const stats = this.userProfile.stats;

    const achievementChecks = [
      {
        id: "first_walk",
        title: "Bước chân đầu tiên",
        description: "Hoàn thành walk đầu tiên",
        icon: "👣",
        type: "special" as const,
        requirement: 1,
        current: stats.totalWalks,
      },
      {
        id: "distance_1km",
        title: "Cây số đầu tiên",
        description: "Đi bộ tổng cộng 1km",
        icon: "🏃",
        type: "distance" as const,
        requirement: 1000,
        current: stats.totalDistance,
      },
      {
        id: "distance_5km",
        title: "Người đi bộ",
        description: "Đi bộ tổng cộng 5km",
        icon: "🚶‍♂️",
        type: "distance" as const,
        requirement: 5000,
        current: stats.totalDistance,
      },
      {
        id: "stories_5",
        title: "Kể chuyện",
        description: "Hoàn thành 5 câu chuyện",
        icon: "📖",
        type: "stories" as const,
        requirement: 5,
        current: stats.completedStories,
      },
      {
        id: "duration_60min",
        title: "Maraton mini",
        description: "Đi bộ tổng cộng 60 phút",
        icon: "⏱️",
        type: "duration" as const,
        requirement: 60,
        current: stats.totalDuration,
      },
    ];

    for (const check of achievementChecks) {
      const existingAchievement = stats.achievements.find(
        (a) => a.id === check.id
      );

      if (!existingAchievement && check.current >= check.requirement) {
        const newAchievement: Achievement = {
          id: check.id,
          title: check.title,
          description: check.description,
          icon: check.icon,
          type: check.type,
          requirement: check.requirement,
          isUnlocked: true,
          unlockedAt: new Date(),
        };

        stats.achievements.push(newAchievement);
        newAchievements.push(newAchievement);
      }
    }

    return newAchievements;
  }

  /**
   * Get user profile
   */
  getUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * Get walk history
   */
  getWalkHistory(limit?: number): WalkHistory[] {
    return limit ? this.walkHistory.slice(0, limit) : this.walkHistory;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    if (!this.userProfile) return;

    this.userProfile.preferences = {
      ...this.userProfile.preferences,
      ...preferences,
    };

    await this.saveUserProfile(this.userProfile);
  }

  /**
   * Update user name
   */
  async updateUserName(name: string): Promise<void> {
    if (!this.userProfile) return;

    this.userProfile.name = name;
    await this.saveUserProfile(this.userProfile);
  }

  /**
   * Get user level progress
   */
  getLevelProgress(): {
    currentLevel: number;
    currentXP: number;
    xpForNext: number;
    progress: number;
  } {
    if (!this.userProfile) {
      return { currentLevel: 1, currentXP: 0, xpForNext: 100, progress: 0 };
    }

    const currentLevel = this.userProfile.level;
    const currentXP = this.userProfile.xp;
    const xpForCurrentLevel = this.getXPForLevel(currentLevel);
    const xpForNextLevel = this.getXPForLevel(currentLevel + 1);
    const xpIntoLevel = currentXP - xpForCurrentLevel;
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
    const progress = Math.min(100, (xpIntoLevel / xpNeededForNext) * 100);

    return {
      currentLevel,
      currentXP,
      xpForNext: xpForNextLevel,
      progress,
    };
  }
}

// Singleton instance
export const userService = new UserService();
