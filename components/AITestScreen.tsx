import { storyService } from "@/services/storyService";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const AITestScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);

  // Test data for different scenarios
  const testScenarios = [
    {
      name: "Test Cơ bản - Phiêu lưu",
      route: {
        id: "test_1",
        name: "Test Route",
        startPoint: { latitude: 10.762622, longitude: 106.660172 },
        endPoint: { latitude: 10.771701, longitude: 106.698059 },
        waypoints: [
          {
            id: "w1",
            latitude: 10.762622,
            longitude: 106.660172,
            isCheckpoint: true,
            checkpointType: "start" as const,
          },
          {
            id: "w2",
            latitude: 10.766921,
            longitude: 106.679041,
            isCheckpoint: true,
            checkpointType: "junction" as const,
          },
          {
            id: "w3",
            latitude: 10.771701,
            longitude: 106.698059,
            isCheckpoint: true,
            checkpointType: "end" as const,
          },
        ],
        estimatedDuration: 30,
        estimatedDistance: 2000,
        difficulty: "easy" as const,
        createdAt: new Date(),
      },
      options: {
        genre: "adventure" as const,
        mood: "exciting" as const,
        routeInfo: {
          startLocation: "Quận 1, TP.HCM",
          endLocation: "Quận 3, TP.HCM",
          distance: 2.0,
          duration: 30,
          waypoints: 3,
        },
        userPreferences: {
          speed: 1.0,
          complexity: "moderate" as const,
        },
      },
    },
    {
      name: "Test Tình cảm - Romance",
      route: {
        id: "test_2",
        name: "Romance Route",
        startPoint: { latitude: 10.762622, longitude: 106.660172 },
        endPoint: { latitude: 10.771701, longitude: 106.698059 },
        waypoints: [
          {
            id: "w1",
            latitude: 10.762622,
            longitude: 106.660172,
            isCheckpoint: true,
            checkpointType: "start" as const,
          },
          {
            id: "w2",
            latitude: 10.766921,
            longitude: 106.679041,
            isCheckpoint: true,
            checkpointType: "junction" as const,
          },
          {
            id: "w3",
            latitude: 10.771701,
            longitude: 106.698059,
            isCheckpoint: true,
            checkpointType: "end" as const,
          },
        ],
        estimatedDuration: 45,
        estimatedDistance: 1500,
        difficulty: "easy" as const,
        createdAt: new Date(),
      },
      options: {
        genre: "romance" as const,
        mood: "relaxing" as const,
        routeInfo: {
          startLocation: "Công viên Tao Đàn",
          endLocation: "Phố đi bộ Nguyễn Huệ",
          distance: 1.5,
          duration: 45,
          waypoints: 3,
        },
        userPreferences: {
          speed: 0.8,
          complexity: "simple" as const,
        },
      },
    },
    {
      name: "Test Bí ẩn - Mystery",
      route: {
        id: "test_3",
        name: "Mystery Route",
        startPoint: { latitude: 10.762622, longitude: 106.660172 },
        endPoint: { latitude: 10.771701, longitude: 106.698059 },
        waypoints: [
          {
            id: "w1",
            latitude: 10.762622,
            longitude: 106.660172,
            isCheckpoint: true,
            checkpointType: "start" as const,
          },
          {
            id: "w2",
            latitude: 10.766921,
            longitude: 106.679041,
            isCheckpoint: true,
            checkpointType: "junction" as const,
          },
          {
            id: "w3",
            latitude: 10.769425,
            longitude: 106.685125,
            isCheckpoint: true,
            checkpointType: "junction" as const,
          },
          {
            id: "w4",
            latitude: 10.771701,
            longitude: 106.698059,
            isCheckpoint: true,
            checkpointType: "end" as const,
          },
        ],
        estimatedDuration: 60,
        estimatedDistance: 3000,
        difficulty: "medium" as const,
        createdAt: new Date(),
      },
      options: {
        genre: "mystery" as const,
        mood: "exciting" as const,
        routeInfo: {
          startLocation: "Bưu điện Thành phố",
          endLocation: "Chợ Bến Thành",
          distance: 3.0,
          duration: 60,
          waypoints: 4,
        },
        userPreferences: {
          speed: 1.2,
          complexity: "complex" as const,
        },
      },
    },
  ];

  const runSingleTest = async (scenario: any, index: number) => {
    setCurrentTest(`Đang test: ${scenario.name}`);
    const startTime = Date.now();

    try {
      console.log(`🧪 Bắt đầu test ${index + 1}: ${scenario.name}`);

      const story = await storyService.generateStory(
        scenario.route,
        scenario.options
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        name: scenario.name,
        success: true,
        duration: duration,
        story: {
          title: story.title,
          description: story.description,
          genre: story.genre,
          segmentCount: story.segments.length,
          estimatedDuration: story.estimatedDuration,
          tags: story.tags,
          fullStory: story, // Lưu toàn bộ câu chuyện
        },
        details: {
          segments: story.segments.map((s) => ({
            id: s.id,
            content: s.content, // Lưu nội dung đầy đủ
            duration: s.duration,
            hasChoices: s.choices && s.choices.length > 0,
            choices: s.choices || [],
          })),
        },
      };

      console.log(`✅ Test ${index + 1} thành công:`, result);
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = {
        name: scenario.name,
        success: false,
        duration: duration,
        error: error instanceof Error ? error.message : String(error),
        details: {
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
        },
      };

      console.log(`❌ Test ${index + 1} thất bại:`, result);
      return result;
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    setCurrentTest("Bắt đầu test AI...");

    try {
      // Test connection first
      setCurrentTest("Kiểm tra kết nối AI...");
      const connectionTest = await storyService.testConnection();
      console.log(
        "🔗 Kết nối AI:",
        connectionTest ? "✅ Thành công" : "❌ Thất bại"
      );

      const results = [];

      for (let i = 0; i < testScenarios.length; i++) {
        const result = await runSingleTest(testScenarios[i], i);
        results.push(result);
        setTestResults([...results]);

        // Delay between tests
        if (i < testScenarios.length - 1) {
          setCurrentTest("Chờ giữa các test...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setCurrentTest("Hoàn thành tất cả test!");

      // Summary
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      const avgDuration =
        results.reduce((sum, r) => sum + r.duration, 0) / results.length;

      Alert.alert(
        "Kết quả Test AI",
        `✅ Thành công: ${successCount}\n❌ Thất bại: ${failCount}\n⏱️ Thời gian TB: ${avgDuration.toFixed(
          0
        )}ms`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("💥 Lỗi khi chạy test:", error);
      Alert.alert("Lỗi", `Không thể chạy test: ${error}`);
    } finally {
      setIsLoading(false);
      setCurrentTest("");
    }
  };

  const showFullStory = (result: any) => {
    setSelectedStory(result);
    setShowStoryModal(true);
  };

  const closeStoryModal = () => {
    setShowStoryModal(false);
    setSelectedStory(null);
  };

  const runConnectionTest = async () => {
    setIsLoading(true);
    setCurrentTest("Kiểm tra kết nối AI...");

    try {
      const isConnected = await storyService.testConnection();

      Alert.alert(
        "Kết quả kết nối",
        isConnected
          ? "✅ Kết nối AI thành công!\nGroq API đang hoạt động bình thường."
          : "❌ Không thể kết nối AI!\nKiểm tra API key hoặc internet.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Lỗi", `Lỗi kiểm tra kết nối: ${error}`);
    } finally {
      setIsLoading(false);
      setCurrentTest("");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 AI Test Suite</Text>
        <Text style={styles.subtitle}>
          Test khả năng phản hồi của AI story generation
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runConnectionTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🔗 Test kết nối AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>🚀 Chạy tất cả test</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color="#48bb78" />
          <Text style={styles.loadingText}>{currentTest}</Text>
        </View>
      )}

      <View style={styles.scenarios}>
        <Text style={styles.sectionTitle}>📋 Test Scenarios</Text>
        {testScenarios.map((scenario, index) => (
          <View key={index} style={styles.scenarioCard}>
            <Text style={styles.scenarioName}>{scenario.name}</Text>
            <Text style={styles.scenarioDetails}>
              📍 {scenario.options.routeInfo.startLocation} →{" "}
              {scenario.options.routeInfo.endLocation}
            </Text>
            <Text style={styles.scenarioDetails}>
              🎭 {scenario.options.genre} | ⏱️{" "}
              {scenario.options.routeInfo.duration}min | 📏{" "}
              {scenario.options.routeInfo.distance}km
            </Text>
          </View>
        ))}
      </View>

      {testResults.length > 0 && (
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>📊 Kết quả Test</Text>
          {testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultCard,
                result.success ? styles.successCard : styles.errorCard,
              ]}
            >
              <Text style={styles.resultName}>
                {result.success ? "✅" : "❌"} {result.name}
              </Text>
              <Text style={styles.resultDuration}>⏱️ {result.duration}ms</Text>

              {result.success ? (
                <View style={styles.successDetails}>
                  <Text style={styles.storyTitle}>📖 {result.story.title}</Text>
                  <Text style={styles.storyDetails}>
                    🎭 {result.story.genre} | 📝 {result.story.segmentCount}{" "}
                    segments
                  </Text>
                  <Text style={styles.storyDescription}>
                    {result.story.description}
                  </Text>
                  <TouchableOpacity
                    style={styles.viewStoryButton}
                    onPress={() => showFullStory(result)}
                  >
                    <Text style={styles.viewStoryButtonText}>
                      📖 Xem câu chuyện đầy đủ
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorText}>❌ {result.error}</Text>
                  <Text style={styles.errorType}>
                    Type: {result.details.errorType}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Modal hiển thị câu chuyện hoàn chỉnh */}
      {showStoryModal && selectedStory && (
        <Modal
          visible={showStoryModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                📖 {selectedStory.story.fullStory.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeStoryModal}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.storyInfo}>
                <Text style={styles.storyMeta}>
                  🎭 {selectedStory.story.fullStory.genre} | ⏱️{" "}
                  {selectedStory.story.estimatedDuration} phút
                </Text>
                <Text style={styles.storyDescription}>
                  {selectedStory.story.fullStory.description}
                </Text>
                <View style={styles.tagsContainer}>
                  {selectedStory.story.fullStory.tags.map(
                    (tag: string, index: number) => (
                      <Text key={index} style={styles.tag}>
                        #{tag}
                      </Text>
                    )
                  )}
                </View>
              </View>

              {selectedStory.details.segments.map(
                (segment: any, index: number) => (
                  <View key={segment.id} style={styles.segmentCard}>
                    <Text style={styles.segmentHeader}>
                      Đoạn {index + 1} • {segment.duration} phút
                    </Text>
                    <Text style={styles.segmentContent}>{segment.content}</Text>

                    {segment.hasChoices && (
                      <View style={styles.choicesSection}>
                        <Text style={styles.choicesTitle}>🤔 Lựa chọn:</Text>
                        {segment.choices.map(
                          (choice: any, choiceIndex: number) => (
                            <View key={choiceIndex} style={styles.choiceItem}>
                              <Text style={styles.choiceText}>
                                {String.fromCharCode(65 + choiceIndex)}.{" "}
                                {choice.text}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    )}
                  </View>
                )
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  controls: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#48bb78",
  },
  secondaryButton: {
    backgroundColor: "#4299e1",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingSection: {
    alignItems: "center",
    marginBottom: 30,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  scenarios: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 16,
  },
  scenarioCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scenarioName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 8,
  },
  scenarioDetails: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  results: {
    marginBottom: 30,
  },
  resultCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#48bb78",
  },
  errorCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#e53e3e",
  },
  resultName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  resultDuration: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 12,
  },
  successDetails: {
    backgroundColor: "#f0fff4",
    padding: 12,
    borderRadius: 8,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 6,
  },
  storyDetails: {
    fontSize: 14,
    color: "#48bb78",
    marginBottom: 8,
  },
  storyDescription: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
  },
  errorDetails: {
    backgroundColor: "#fed7d7",
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#e53e3e",
    marginBottom: 4,
  },
  errorType: {
    fontSize: 12,
    color: "#6c757d",
  },
  // Styles cho view story button
  viewStoryButton: {
    backgroundColor: "#4299e1",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  viewStoryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  // Styles cho modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#6c757d",
    fontWeight: "bold",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  storyInfo: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyMeta: {
    fontSize: 14,
    color: "#48bb78",
    fontWeight: "600",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: "#e6fffa",
    color: "#38a169",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: "500",
  },
  segmentCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  segmentContent: {
    fontSize: 15,
    color: "#4a5568",
    lineHeight: 24,
    marginBottom: 16,
  },
  choicesSection: {
    backgroundColor: "#f7fafc",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  choicesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 8,
  },
  choiceItem: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#4299e1",
  },
  choiceText: {
    fontSize: 14,
    color: "#4a5568",
  },
});

export default AITestScreen;
