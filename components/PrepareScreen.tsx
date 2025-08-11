import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { AppColors } from "../constants/Colors";
import { Story } from "../services/geminiService";
import { RouteResponse, routeService } from "../services/routeService";
import { Coordinate } from "../types";

interface PrepareScreenProps {
  userLocation: Coordinate;
  onStartWalking: (config: WalkingConfig) => void;
  onBack: () => void;
}

export interface WalkingConfig {
  checkpoints: CheckpointData[];
  storyGenre: Story["genre"];
  voiceSettings: {
    rate: number;
  };
  estimatedTime: number;
  isLoop: boolean;
}

export interface CheckpointData {
  id: string;
  coordinate: Coordinate;
  title: string;
  description: string;
  estimatedTimeFromStart: number;
}

export const PrepareScreen: React.FC<PrepareScreenProps> = ({
  userLocation,
  onStartWalking,
  onBack,
}) => {
  const [checkpoints, setCheckpoints] = useState<CheckpointData[]>([]);
  const [selectedGenre, setSelectedGenre] =
    useState<Story["genre"]>("adventure");
  const [voiceRate, setVoiceRate] = useState(0.8);
  const [isLoop, setIsLoop] = useState(true);
  const [selectedCheckpointForEdit, setSelectedCheckpointForEdit] =
    useState<CheckpointData | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showActionArea, setShowActionArea] = useState(false);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Update route when checkpoints change
  const updateRoute = useCallback(async () => {
    if (checkpoints.length === 0) return;

    setIsLoadingRoute(true);
    try {
      const waypointCoordinates = checkpoints.map((cp) => cp.coordinate);
      const endLocation = isLoop
        ? userLocation
        : checkpoints[checkpoints.length - 1].coordinate;

      const routeResponse = await routeService.getWalkingRoute(
        userLocation,
        endLocation,
        isLoop ? waypointCoordinates : waypointCoordinates.slice(0, -1)
      );

      setRoute(routeResponse);
    } catch (error) {
      console.error("Failed to get route:", error);
      Alert.alert(
        "Lỗi tạo đường đi",
        "Không thể tạo đường đi thực tế. Sử dụng đường thẳng."
      );
    } finally {
      setIsLoadingRoute(false);
    }
  }, [checkpoints, isLoop, userLocation]);

  useEffect(() => {
    if (checkpoints.length > 0) {
      updateRoute();
    } else {
      setRoute(null);
    }
  }, [checkpoints, isLoop, updateRoute]);

  const addCheckpoint = (coordinate: Coordinate) => {
    const newCheckpoint: CheckpointData = {
      id: `checkpoint_${Date.now()}`,
      coordinate,
      title: `Điểm ${checkpoints.length + 1}`,
      description: "Nhấn để chỉnh sửa mô tả",
      estimatedTimeFromStart: (checkpoints.length + 1) * 8, // 8 minutes per checkpoint
    };

    setCheckpoints((prev) => [...prev, newCheckpoint]);
    setShowActionArea(true);
  };

  const editCheckpoint = (checkpoint: CheckpointData) => {
    setSelectedCheckpointForEdit(checkpoint);
    setEditTitle(checkpoint.title);
    setEditDescription(checkpoint.description);
    setShowActionArea(true);
  };

  const saveCheckpointEdit = () => {
    if (!selectedCheckpointForEdit) return;

    setCheckpoints((prev) =>
      prev.map((cp) =>
        cp.id === selectedCheckpointForEdit.id
          ? { ...cp, title: editTitle, description: editDescription }
          : cp
      )
    );

    setSelectedCheckpointForEdit(null);
    setEditTitle("");
    setEditDescription("");
  };

  const removeCheckpoint = (checkpointId: string) => {
    setCheckpoints((prev) => prev.filter((cp) => cp.id !== checkpointId));
    if (selectedCheckpointForEdit?.id === checkpointId) {
      setSelectedCheckpointForEdit(null);
      setEditTitle("");
      setEditDescription("");
    }
  };

  const calculateEstimatedTime = () => {
    if (checkpoints.length === 0) return 0;

    // If we have a real route, use its duration
    if (route) {
      return Math.round(route.duration / 60); // Convert seconds to minutes
    }

    // Fallback calculation
    const baseTime = checkpoints.length * 8; // 8 minutes per checkpoint
    const returnTime = isLoop ? 10 : 0;
    return baseTime + returnTime;
  };

  const handleStartWalking = () => {
    if (checkpoints.length === 0) {
      Alert.alert(
        "Cần ít nhất 1 checkpoint",
        "Vui lòng chọn ít nhất một điểm trên bản đồ để bắt đầu hành trình."
      );
      return;
    }

    const config: WalkingConfig = {
      checkpoints,
      storyGenre: selectedGenre,
      voiceSettings: { rate: voiceRate },
      estimatedTime: calculateEstimatedTime(),
      isLoop,
    };

    onStartWalking(config);
  };

  const genres: { id: Story["genre"]; name: string; icon: string }[] = [
    { id: "adventure", name: "Phiêu lưu", icon: "🗺️" },
    { id: "mystery", name: "Bí ẩn", icon: "🕵️" },
    { id: "fantasy", name: "Giả tưởng", icon: "🧙" },
    { id: "historical", name: "Lịch sử", icon: "🏛️" },
    { id: "comedy", name: "Hài hước", icon: "�" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lên kế hoạch hành trình</Text>
          <Text style={styles.headerSubtitle}>
            Chạm vào bản đồ để thêm điểm đến • Đường đi thực tế
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(event) => {
            const coordinate = event.nativeEvent.coordinate;
            addCheckpoint(coordinate);
          }}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* User location marker */}
          <Marker
            coordinate={userLocation}
            title="Vị trí của bạn"
            pinColor="#3B82F6"
          />

          {/* Checkpoint markers */}
          {checkpoints.map((checkpoint, index) => (
            <Marker
              key={checkpoint.id}
              coordinate={checkpoint.coordinate}
              title={checkpoint.title}
              description={checkpoint.description}
              pinColor="#10B981"
              onPress={() => editCheckpoint(checkpoint)}
            />
          ))}

          {/* Route polyline */}
          {route && (
            <Polyline
              coordinates={route.coordinates}
              strokeColor="#10B981"
              strokeWidth={4}
            />
          )}

          {/* Simple route line if no real route available */}
          {!route && checkpoints.length > 0 && (
            <Polyline
              coordinates={[
                userLocation,
                ...checkpoints.map((cp) => cp.coordinate),
                ...(isLoop ? [userLocation] : []),
              ]}
              strokeColor="#94A3B8"
              strokeWidth={3}
            />
          )}
        </MapView>

        {/* Map Info Overlay */}
        <View style={styles.mapInfoOverlay}>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              📍 {checkpoints.length} điểm đã chọn
            </Text>
            {checkpoints.length > 0 && (
              <>
                <Text style={styles.infoSubtext}>
                  ⏱️ Ước tính: {calculateEstimatedTime()} phút
                </Text>
                {route && (
                  <>
                    <Text style={styles.infoSubtext}>
                      🗺️ Khoảng cách: {Math.round(route.distance)}m
                    </Text>
                    <Text style={styles.infoSubtext}>📍 Đường đi ước tính</Text>
                  </>
                )}
                {isLoadingRoute && (
                  <Text style={styles.infoSubtext}>
                    🔄 Đang tạo đường đi...
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Action Area */}
      {showActionArea && (
        <View style={styles.actionArea}>
          <ScrollView
            style={styles.actionContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Checkpoint Edit Section */}
            {selectedCheckpointForEdit ? (
              <View style={styles.editSection}>
                <Text style={styles.sectionTitle}>Chỉnh sửa điểm đến</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tên điểm đến</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Nhập tên điểm đến"
                    placeholderTextColor={AppColors.textSecondary}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mô tả</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Nhập mô tả điểm đến"
                    placeholderTextColor={AppColors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => {
                      removeCheckpoint(selectedCheckpointForEdit.id);
                    }}
                  >
                    <Text
                      style={[styles.buttonText, styles.secondaryButtonText]}
                    >
                      🗑️ Xóa điểm
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={saveCheckpointEdit}
                  >
                    <Text style={styles.buttonText}>💾 Lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                {/* Checkpoint List */}
                {checkpoints.length > 0 && (
                  <View style={styles.checkpointSection}>
                    <Text style={styles.sectionTitle}>
                      Điểm đã chọn ({checkpoints.length})
                    </Text>
                    {checkpoints.map((checkpoint, index) => (
                      <TouchableOpacity
                        key={checkpoint.id}
                        style={styles.checkpointItem}
                        onPress={() => editCheckpoint(checkpoint)}
                      >
                        <View style={styles.checkpointNumber}>
                          <Text style={styles.checkpointNumberText}>
                            {index + 1}
                          </Text>
                        </View>
                        <View style={styles.checkpointInfo}>
                          <Text style={styles.checkpointTitle}>
                            {checkpoint.title}
                          </Text>
                          <Text style={styles.checkpointDescription}>
                            {checkpoint.description}
                          </Text>
                        </View>
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Settings */}
                <View style={styles.settingsSection}>
                  <Text style={styles.sectionTitle}>Cài đặt hành trình</Text>

                  {/* Genre Selection */}
                  <View style={styles.settingGroup}>
                    <Text style={styles.settingLabel}>Thể loại câu chuyện</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.genreScroll}
                    >
                      {genres.map((genre) => (
                        <TouchableOpacity
                          key={genre.id}
                          style={[
                            styles.genreOption,
                            selectedGenre === genre.id &&
                              styles.genreOptionSelected,
                          ]}
                          onPress={() => setSelectedGenre(genre.id)}
                        >
                          <Text style={styles.genreIcon}>{genre.icon}</Text>
                          <Text
                            style={[
                              styles.genreText,
                              selectedGenre === genre.id &&
                                styles.genreTextSelected,
                            ]}
                          >
                            {genre.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Loop Option */}
                  <View style={styles.settingGroup}>
                    <Text style={styles.settingLabel}>Loại hành trình</Text>
                    <View style={styles.routeTypeContainer}>
                      <TouchableOpacity
                        style={[
                          styles.routeTypeOption,
                          isLoop && styles.routeTypeSelected,
                        ]}
                        onPress={() => setIsLoop(true)}
                      >
                        <Text style={styles.routeTypeIcon}>🔄</Text>
                        <Text
                          style={[
                            styles.routeTypeText,
                            isLoop && styles.routeTypeTextSelected,
                          ]}
                        >
                          Vòng tròn
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.routeTypeOption,
                          !isLoop && styles.routeTypeSelected,
                        ]}
                        onPress={() => setIsLoop(false)}
                      >
                        <Text style={styles.routeTypeIcon}>➡️</Text>
                        <Text
                          style={[
                            styles.routeTypeText,
                            !isLoop && styles.routeTypeTextSelected,
                          ]}
                        >
                          Một chiều
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Voice Speed */}
                  <View style={styles.settingGroup}>
                    <Text style={styles.settingLabel}>
                      Tốc độ giọng đọc: {Math.round(voiceRate * 100)}%
                    </Text>
                    <View style={styles.speedContainer}>
                      {[0.6, 0.8, 1.0].map((speed) => (
                        <TouchableOpacity
                          key={speed}
                          style={[
                            styles.speedOption,
                            voiceRate === speed && styles.speedOptionSelected,
                          ]}
                          onPress={() => setVoiceRate(speed)}
                        >
                          <Text
                            style={[
                              styles.speedText,
                              voiceRate === speed && styles.speedTextSelected,
                            ]}
                          >
                            {speed === 0.6
                              ? "Chậm"
                              : speed === 0.8
                              ? "Vừa"
                              : "Nhanh"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {selectedCheckpointForEdit ? (
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={() => {
                  setSelectedCheckpointForEdit(null);
                  setEditTitle("");
                  setEditDescription("");
                }}
              >
                <Text style={[styles.buttonText, styles.closeButtonText]}>
                  Đóng
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowActionArea(false)}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    🗺️ Xem bản đồ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.startButton]}
                  onPress={handleStartWalking}
                  disabled={checkpoints.length === 0}
                >
                  <Text style={styles.buttonText}>🚀 Bắt đầu hành trình</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Floating Start Button (when action area is hidden) */}
      {!showActionArea && checkpoints.length > 0 && (
        <View style={styles.floatingActions}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowActionArea(true)}
          >
            <Text style={styles.floatingButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingButton, styles.startFloatingButton]}
            onPress={handleStartWalking}
          >
            <Text style={styles.floatingButtonText}>🚀</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surface,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },

  // Map
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapInfoOverlay: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  infoCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  infoSubtext: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },

  // Action Area
  actionArea: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    maxHeight: "70%",
  },
  actionContent: {
    padding: 20,
  },

  // Sections
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 16,
  },

  // Edit Section
  editSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
  },

  // Checkpoint Section
  checkpointSection: {
    marginBottom: 24,
  },
  checkpointItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  checkpointNumber: {
    width: 32,
    height: 32,
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkpointNumberText: {
    color: AppColors.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  checkpointInfo: {
    flex: 1,
  },
  checkpointTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  checkpointDescription: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  editIcon: {
    fontSize: 16,
    marginLeft: 8,
  },

  // Settings Section
  settingsSection: {
    marginBottom: 20,
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },

  // Genre Selection
  genreScroll: {
    flexDirection: "row",
  },
  genreOption: {
    alignItems: "center",
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: "transparent",
  },
  genreOptionSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primaryDark,
  },
  genreIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textPrimary,
    textAlign: "center",
  },
  genreTextSelected: {
    color: AppColors.textWhite,
  },

  // Route Type
  routeTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  routeTypeOption: {
    flex: 1,
    alignItems: "center",
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  routeTypeSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primaryDark,
  },
  routeTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  routeTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  routeTypeTextSelected: {
    color: AppColors.textWhite,
  },

  // Speed Selection
  speedContainer: {
    flexDirection: "row",
    gap: 8,
  },
  speedOption: {
    flex: 1,
    alignItems: "center",
    backgroundColor: AppColors.surfaceGray,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  speedOptionSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primaryDark,
  },
  speedText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  speedTextSelected: {
    color: AppColors.textWhite,
  },

  // Buttons
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  closeButton: {
    backgroundColor: AppColors.surfaceGray,
  },
  startButton: {
    backgroundColor: AppColors.primary,
  },
  buttonText: {
    color: AppColors.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: AppColors.primary,
  },
  closeButtonText: {
    color: AppColors.textSecondary,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },

  // Floating Actions
  floatingActions: {
    position: "absolute",
    bottom: 30,
    right: 20,
    gap: 12,
    zIndex: 1000,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AppColors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  startFloatingButton: {
    backgroundColor: AppColors.primary,
  },
  floatingButtonText: {
    fontSize: 20,
    color: AppColors.textWhite,
  },
});

export default PrepareScreen;
