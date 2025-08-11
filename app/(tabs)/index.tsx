import { PrepareScreen, WalkingConfig } from "@/components/PrepareScreen";
import { StartScreen } from "@/components/StartScreen";
import { SummaryScreen, WalkingSummary } from "@/components/SummaryScreen";
import { WalkingScreen } from "@/components/WalkingScreen";
import { AppColors } from "@/constants/Colors";
import { Coordinate } from "@/types";
import React, { useState } from "react";
import { Alert, SafeAreaView, StatusBar, StyleSheet } from "react-native";

type AppScreen = "start" | "prepare" | "walking" | "summary";

export default function HomeScreen() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("start");
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [walkingConfig, setWalkingConfig] = useState<WalkingConfig | null>(
    null
  );
  const [walkingSummary, setWalkingSummary] = useState<WalkingSummary | null>(
    null
  );

  const handleStartWalk = (config: WalkingConfig) => {
    setWalkingConfig(config);
    setCurrentScreen("walking");
  };

  const handleWalkComplete = (summary: WalkingSummary) => {
    setWalkingSummary(summary);
    setCurrentScreen("summary");
  };

  const handleRestartApp = () => {
    setCurrentScreen("start");
    setUserLocation(null);
    setWalkingConfig(null);
    setWalkingSummary(null);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "start":
        return (
          <StartScreen
            onStartJourney={(location) => {
              setUserLocation(location);
              setCurrentScreen("prepare");
            }}
          />
        );

      case "prepare":
        if (!userLocation) {
          Alert.alert("Lỗi", "Không có thông tin vị trí");
          setCurrentScreen("start");
          return null;
        }
        return (
          <PrepareScreen
            userLocation={userLocation}
            onStartWalking={handleStartWalk}
            onBack={() => setCurrentScreen("start")}
          />
        );

      case "walking":
        if (!walkingConfig || !userLocation) {
          Alert.alert("Lỗi", "Không có cấu hình đi bộ");
          setCurrentScreen("start");
          return null;
        }
        return (
          <WalkingScreen
            config={walkingConfig}
            userLocation={userLocation}
            onComplete={handleWalkComplete}
            onBack={() => setCurrentScreen("prepare")}
          />
        );

      case "summary":
        if (!walkingSummary) {
          Alert.alert("Lỗi", "Không có dữ liệu tổng kết");
          setCurrentScreen("start");
          return null;
        }
        return (
          <SummaryScreen
            summary={walkingSummary}
            onStartNew={handleRestartApp}
            onBackToHome={handleRestartApp}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.background}
      />
      {renderCurrentScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
});
