import { Coordinate } from "@/types";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PrepareScreen, WalkingConfig } from "./PrepareScreen";
import { StartScreen } from "./StartScreen";
import { SummaryScreen, WalkingSummary } from "./SummaryScreen";
import { WalkingScreen } from "./WalkingScreen";

type AppScreen = "start" | "prepare" | "walking" | "summary";

interface AppState {
  currentScreen: AppScreen;
  userLocation: Coordinate | null;
  walkingConfig: WalkingConfig | null;
  walkingSummary: WalkingSummary | null;
}

export const WandererApp: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentScreen: "start",
    userLocation: null,
    walkingConfig: null,
    walkingSummary: null,
  });

  const handleStartScreenComplete = (userLocation: Coordinate) => {
    setAppState((prev) => ({
      ...prev,
      currentScreen: "prepare",
      userLocation,
    }));
  };

  const handlePrepareScreenComplete = (config: WalkingConfig) => {
    setAppState((prev) => ({
      ...prev,
      currentScreen: "walking",
      walkingConfig: config,
    }));
  };

  const handleWalkingComplete = (summary: WalkingSummary) => {
    setAppState((prev) => ({
      ...prev,
      currentScreen: "summary",
      walkingSummary: summary,
    }));
  };

  const handleStartNewJourney = () => {
    setAppState({
      currentScreen: "start",
      userLocation: null,
      walkingConfig: null,
      walkingSummary: null,
    });
  };

  const handleBackToHome = () => {
    setAppState({
      currentScreen: "start",
      userLocation: null,
      walkingConfig: null,
      walkingSummary: null,
    });
  };

  const handleBackToStart = () => {
    setAppState((prev) => ({
      ...prev,
      currentScreen: "start",
      userLocation: null,
      destination: null,
      walkingConfig: null,
    }));
  };

  const handleBackToPrepare = () => {
    setAppState((prev) => ({
      ...prev,
      currentScreen: "prepare",
      walkingConfig: null,
    }));
  };

  const renderCurrentScreen = () => {
    switch (appState.currentScreen) {
      case "start":
        return <StartScreen onStartJourney={handleStartScreenComplete} />;

      case "prepare":
        if (!appState.userLocation) {
          return null; // Should not happen
        }
        return (
          <PrepareScreen
            userLocation={appState.userLocation}
            onStartWalking={handlePrepareScreenComplete}
            onBack={handleBackToStart}
          />
        );

      case "walking":
        if (!appState.userLocation || !appState.walkingConfig) {
          return null; // Should not happen
        }
        return (
          <WalkingScreen
            userLocation={appState.userLocation}
            config={appState.walkingConfig}
            onComplete={handleWalkingComplete}
            onBack={handleBackToPrepare}
          />
        );

      case "summary":
        if (!appState.walkingSummary) {
          return null; // Should not happen
        }
        return (
          <SummaryScreen
            summary={appState.walkingSummary}
            onStartNew={handleStartNewJourney}
            onBackToHome={handleBackToHome}
          />
        );

      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderCurrentScreen()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default WandererApp;
