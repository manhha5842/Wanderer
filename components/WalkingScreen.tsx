import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { AppColors } from "../constants/Colors";
import {
  geminiStoryService,
  Story,
  StoryChoice,
} from "../services/geminiService";
import { locationService } from "../services/locationService";
import { Coordinate } from "../types";
import { CheckpointData, WalkingConfig } from "./PrepareScreen";
import { WalkingSummary } from "./SummaryScreen";

interface WalkingScreenProps {
  config: WalkingConfig;
  userLocation: Coordinate;
  onComplete: (summary: WalkingSummary) => void;
  onBack: () => void;
}

export const WalkingScreen: React.FC<WalkingScreenProps> = ({
  config,
  userLocation: initialLocation,
  onComplete,
  onBack,
}) => {
  const [currentLocation, setCurrentLocation] =
    useState<Coordinate>(initialLocation);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>(
    []
  );
  const [isNarrating, setIsNarrating] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [currentChoices, setCurrentChoices] = useState<StoryChoice[]>([]);
  const [choicesMade, setChoicesMade] = useState<StoryChoice[]>([]);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    "Đang tạo câu chuyện..."
  );

  useEffect(() => {
    const init = async () => {
      await initializeJourney();
      await startLocationTracking();
    };

    init();

    return () => {
      Speech.stop();
      locationService.stopLocationTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeJourney = async () => {
    try {
      setLoadingMessage("Đang tạo câu chuyện cho hành trình...");

      const routeInfo = {
        checkpoints: config.checkpoints.map((cp) => cp.coordinate),
        estimatedWalkingTime: config.estimatedTime,
        totalDistance: calculateTotalDistance(),
        genre: config.storyGenre,
      };

      const story = await geminiStoryService.generateStory(routeInfo);
      setCurrentStory(story);

      setLoadingMessage("Bắt đầu hành trình...");
      setTimeout(() => {
        setIsLoading(false);
        startNarration(story);
      }, 1000);
    } catch (error) {
      console.error("Error initializing journey:", error);
      Alert.alert("Lỗi", "Không thể tạo câu chuyện. Hãy thử lại.");
      setIsLoading(false);
    }
  };

  const calculateTotalDistance = () => {
    let totalDistance = 0;
    const points = [
      initialLocation,
      ...config.checkpoints.map((cp) => cp.coordinate),
    ];

    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += getDistanceBetweenPoints(points[i], points[i + 1]);
    }

    if (config.isLoop) {
      totalDistance += getDistanceBetweenPoints(
        points[points.length - 1],
        points[0]
      );
    }

    return totalDistance;
  };

  const getDistanceBetweenPoints = (point1: Coordinate, point2: Coordinate) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startLocationTracking = async () => {
    const success = await locationService.startLocationTracking(
      {
        accuracy: 6, // High accuracy
        distanceInterval: 5, // Update every 5 meters
        timeInterval: 3000, // Update every 3 seconds
      },
      (location: Coordinate) => {
        setCurrentLocation(location);
        checkNearbyCheckpoints(location);
      }
    );

    if (!success) {
      console.error("Location tracking failed to start");
    }
  };

  const checkNearbyCheckpoints = (location: Coordinate) => {
    config.checkpoints.forEach((checkpoint) => {
      if (!completedCheckpoints.includes(checkpoint.id)) {
        const distance = getDistanceBetweenPoints(
          location,
          checkpoint.coordinate
        );

        // If within 50 meters of checkpoint
        if (distance < 50) {
          handleCheckpointReached(checkpoint);
        }
      }
    });
  };

  const handleCheckpointReached = (checkpoint: CheckpointData) => {
    setCompletedCheckpoints((prev) => [...prev, checkpoint.id]);

    // Stop current narration
    Speech.stop();
    setIsNarrating(false);

    // Show checkpoint reached notification
    Alert.alert(
      "Đã đến checkpoint! 🎯",
      `${checkpoint.title}\n\nBạn đang đứng tại ngã rẽ. Hãy chọn hướng đi để tiếp tục câu chuyện.`,
      [{ text: "Tiếp tục", onPress: () => showStoryChoices() }]
    );
  };

  const showStoryChoices = () => {
    if (currentStory && currentSegmentIndex < currentStory.segments.length) {
      const currentSegment = currentStory.segments[currentSegmentIndex];

      if (currentSegment.choices && currentSegment.choices.length > 0) {
        setCurrentChoices(currentSegment.choices);
        setShowChoices(true);
      } else {
        // No choices, continue to next segment
        continueToNextSegment();
      }
    }
  };

  const handleChoiceSelected = (choice: StoryChoice) => {
    setChoicesMade((prev) => [...prev, choice]);
    setShowChoices(false);

    // Continue to next segment
    continueToNextSegment();
  };

  const continueToNextSegment = () => {
    if (
      currentStory &&
      currentSegmentIndex < currentStory.segments.length - 1
    ) {
      const nextIndex = currentSegmentIndex + 1;
      setCurrentSegmentIndex(nextIndex);

      startNarration(currentStory, nextIndex);
    } else {
      // Journey completed
      completeJourney();
    }
  };

  const startNarration = (story: Story, segmentIndex = 0) => {
    if (segmentIndex < story.segments.length) {
      const segment = story.segments[segmentIndex];

      setIsNarrating(true);

      Speech.speak(segment.content, {
        language: "vi-VN",
        rate: config.voiceSettings.rate,
        onDone: () => {
          setIsNarrating(false);
        },
        onError: (error) => {
          console.error("Speech error:", error);
          setIsNarrating(false);
        },
      });
    }
  };

  const toggleNarration = () => {
    if (isNarrating) {
      Speech.stop();
      setIsNarrating(false);
    } else if (currentStory) {
      startNarration(currentStory, currentSegmentIndex);
    }
  };

  const completeJourney = () => {
    const summary: WalkingSummary = {
      totalTime: Math.floor((Date.now() - startTime) / 1000),
      distance: calculateTotalDistance(),
      checkpointsCompleted: completedCheckpoints.length,
      storyChoicesMade: choicesMade,
      genre: config.storyGenre,
    };

    Speech.stop();
    onComplete(summary);
  };

  const getProgressPercentage = () => {
    const totalCheckpoints = config.checkpoints.length;
    return totalCheckpoints > 0
      ? (completedCheckpoints.length / totalCheckpoints) * 100
      : 0;
  };

  const getMapHTML = () => {
    const lat = currentLocation.latitude;
    const lng = currentLocation.longitude;

    const checkpointMarkers = config.checkpoints
      .map((checkpoint, index) => {
        const isCompleted = completedCheckpoints.includes(checkpoint.id);
        const color = isCompleted ? "#10B981" : "#6B7280";

        return `
        L.marker([${checkpoint.coordinate.latitude}, ${
          checkpoint.coordinate.longitude
        }], {
          icon: L.divIcon({
            className: 'checkpoint-marker',
            html: '<div style="background: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; box-shadow: 0 4px 12px rgba(${
          isCompleted ? "16, 185, 129" : "107, 114, 128"
        }, 0.4);">${index + 1}</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        }).addTo(map);
      `;
      })
      .join("");

    const routeCoordinates = [
      [initialLocation.latitude, initialLocation.longitude],
      ...config.checkpoints.map((cp) => [
        cp.coordinate.latitude,
        cp.coordinate.longitude,
      ]),
      ...(config.isLoop
        ? [[initialLocation.latitude, initialLocation.longitude]]
        : []),
    ];

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
        .leaflet-control { display: none; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map', {
            center: [${lat}, ${lng}],
            zoom: 16,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            dragging: false,
            touchZoom: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '',
            opacity: 0.8
        }).addTo(map);

        // Add route line
        L.polyline(${JSON.stringify(routeCoordinates)}, {
            color: '#10B981',
            weight: 4,
            opacity: 0.8
        }).addTo(map);

        // Add user location marker (moving)
        const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); animation: pulse 2s infinite;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map);

        // Add checkpoint markers
        ${checkpointMarkers}
    </script>
</body>
</html>`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColors.background}
        />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <Text style={styles.loadingIcon}>🎭</Text>
            <Text style={styles.loadingTitle}>Chuẩn bị câu chuyện</Text>
            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
            <View style={styles.loadingBar}>
              <View style={styles.loadingProgress} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.background}
      />

      {/* Progress Overlay */}
      <View style={styles.progressOverlay}>
        <View style={styles.progressHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressInfo}>
            <Text style={styles.progressTitle}>Đang khám phá...</Text>
            <Text style={styles.progressSubtitle}>
              {completedCheckpoints.length}/{config.checkpoints.length} điểm
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgressPercentage()}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercent}>
            {Math.round(getProgressPercentage())}%
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: getMapHTML() }}
          style={styles.map}
          scrollEnabled={false}
          bounces={false}
        />
      </View>

      {/* Story Controls */}
      <View style={styles.storyControls}>
        <View style={styles.storyCard}>
          <Text style={styles.storyTitle}>
            {currentStory?.title || "Câu chuyện của bạn"}
          </Text>
          <Text style={styles.storySegment}>
            Đoạn {currentSegmentIndex + 1}/{currentStory?.segments.length || 1}
          </Text>

          <TouchableOpacity
            style={[
              styles.narrateButton,
              isNarrating && styles.narrateButtonActive,
            ]}
            onPress={toggleNarration}
          >
            <Text style={styles.narrateIcon}>{isNarrating ? "⏸️" : "▶️"}</Text>
            <Text style={styles.narrateText}>
              {isNarrating ? "Tạm dừng" : "Phát câu chuyện"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Choice Modal */}
      <Modal
        visible={showChoices}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChoices(false)}
      >
        <View style={styles.choiceOverlay}>
          <View style={styles.choiceCard}>
            <Text style={styles.choiceTitle}>Chọn hướng đi 🚶‍♂️</Text>
            <Text style={styles.choiceSubtitle}>
              Lựa chọn của bạn sẽ ảnh hưởng đến câu chuyện tiếp theo
            </Text>

            <View style={styles.choiceList}>
              {currentChoices.map((choice, index) => (
                <TouchableOpacity
                  key={choice.id}
                  style={styles.choiceButton}
                  onPress={() => handleChoiceSelected(choice)}
                >
                  <View style={styles.choiceNumber}>
                    <Text style={styles.choiceNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.choiceContent}>
                    <Text style={styles.choiceText}>{choice.text}</Text>
                    <Text style={styles.choiceConsequence}>
                      {choice.consequence}
                    </Text>
                  </View>
                  <Text style={styles.choiceArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  loadingBar: {
    width: "100%",
    height: 6,
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 3,
    overflow: "hidden",
  },
  loadingProgress: {
    width: "60%",
    height: "100%",
    backgroundColor: AppColors.primary,
    borderRadius: 3,
  },

  // Progress Overlay
  progressOverlay: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceGray,
    marginRight: 16,
  },
  backText: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  progressSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: AppColors.primary,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.primary,
    minWidth: 35,
  },

  // Map
  mapContainer: {
    flex: 1,
    backgroundColor: AppColors.mapBackground,
  },
  map: {
    flex: 1,
  },

  // Story Controls
  storyControls: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  storyCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  storySegment: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  narrateButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  narrateButtonActive: {
    backgroundColor: "#EF4444",
  },
  narrateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  narrateText: {
    color: AppColors.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },

  // Choice Modal
  choiceOverlay: {
    flex: 1,
    backgroundColor: AppColors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  choiceCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  choiceTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  choiceSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
    lineHeight: 20,
  },
  choiceList: {
    gap: 16,
  },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: AppColors.border,
  },
  choiceNumber: {
    width: 32,
    height: 32,
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  choiceNumberText: {
    color: AppColors.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  choiceContent: {
    flex: 1,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  choiceConsequence: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: "500",
    lineHeight: 18,
  },
  choiceArrow: {
    fontSize: 18,
    color: AppColors.primary,
    fontWeight: "700",
  },
});

export default WalkingScreen;
