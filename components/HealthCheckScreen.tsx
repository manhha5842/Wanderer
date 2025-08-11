import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiConfigManager } from "../config/apiConfig";
import { AppColors } from "../constants/Colors";
import { locationService } from "../services/locationService";

interface HealthCheckResult {
  service: string;
  status: "checking" | "success" | "error" | "warning";
  message: string;
  details?: string;
}

const HealthCheckScreen: React.FC = () => {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runHealthCheck = async () => {
    setIsRunning(true);
    setResults([]);

    const checks = [
      checkLocationService,
      checkGeminiAPI,
      checkInternetConnection,
      checkDeviceCapabilities,
    ];

    for (const check of checks) {
      try {
        const result = await check();
        setResults((prev) => [...prev, result]);
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            service: "Unknown",
            status: "error",
            message: "Check failed",
            details: error instanceof Error ? error.message : "Unknown error",
          },
        ]);
      }
    }

    setIsRunning(false);
  };

  const checkLocationService = async (): Promise<HealthCheckResult> => {
    try {
      const permission = await locationService.checkLocationPermission();

      if (!permission.granted) {
        return {
          service: "Location Service",
          status: "warning",
          message: "Location permission not granted",
          details:
            "App needs location access to create routes and track progress",
        };
      }

      const location = await locationService.getCurrentLocation();

      if (!location) {
        return {
          service: "Location Service",
          status: "error",
          message: "Cannot get current location",
          details:
            "Make sure GPS is enabled and you have a clear view of the sky",
        };
      }

      return {
        service: "Location Service",
        status: "success",
        message: `Location acquired: ${location.latitude.toFixed(
          4
        )}, ${location.longitude.toFixed(4)}`,
        details: "GPS is working correctly",
      };
    } catch (error) {
      return {
        service: "Location Service",
        status: "error",
        message: "Location service error",
        details:
          error instanceof Error ? error.message : "Unknown location error",
      };
    }
  };

  const checkGeminiAPI = async (): Promise<HealthCheckResult> => {
    try {
      // Simple API availability check
      const keys = apiConfigManager.getAllKeys();
      const validKeys = keys.filter((key) => key && !key.startsWith("YOUR_"));

      if (validKeys.length === 0) {
        return {
          service: "Gemini AI",
          status: "warning",
          message: "No API keys configured",
          details: "App will use fallback stories if AI keys are not set up",
        };
      }

      return {
        service: "Gemini AI",
        status: "success",
        message: `${validKeys.length} API keys configured`,
        details: "AI story generation should work correctly",
      };
    } catch (error) {
      return {
        service: "Gemini AI",
        status: "error",
        message: "Failed to check AI service",
        details:
          error instanceof Error ? error.message : "Unknown AI service error",
      };
    }
  };

  const checkInternetConnection = async (): Promise<HealthCheckResult> => {
    try {
      const response = await fetch("https://www.google.com", {
        method: "HEAD",
      });

      if (response.ok) {
        return {
          service: "Internet Connection",
          status: "success",
          message: "Internet connection is working",
          details: "All online features should work correctly",
        };
      } else {
        return {
          service: "Internet Connection",
          status: "warning",
          message: "Limited internet connectivity",
          details: "Some features may not work properly",
        };
      }
    } catch {
      return {
        service: "Internet Connection",
        status: "error",
        message: "No internet connection",
        details: "App will work in offline mode with limited features",
      };
    }
  };

  const checkDeviceCapabilities = async (): Promise<HealthCheckResult> => {
    try {
      // Check if we're running on a real device or simulator
      const isSimulator = __DEV__;

      let warnings = [];

      if (isSimulator) {
        warnings.push("Running on simulator - GPS may not work accurately");
      }

      return {
        service: "Device Capabilities",
        status: warnings.length > 0 ? "warning" : "success",
        message:
          warnings.length > 0
            ? "Some limitations detected"
            : "Device fully compatible",
        details: warnings.join("; ") || "All device features are available",
      };
    } catch (error) {
      return {
        service: "Device Capabilities",
        status: "error",
        message: "Cannot check device capabilities",
        details:
          error instanceof Error ? error.message : "Unknown device error",
      };
    }
  };

  const getStatusIcon = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "checking":
        return "⏳";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "❓";
    }
  };

  const getStatusColor = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "checking":
        return "#6B7280";
      case "success":
        return "#10B981";
      case "warning":
        return "#F59E0B";
      case "error":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  useEffect(() => {
    runHealthCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 System Health Check</Text>
        <Text style={styles.subtitle}>
          Verifying all services are working correctly
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.statusIcon}>
                {getStatusIcon(result.status)}
              </Text>
              <View style={styles.resultInfo}>
                <Text style={styles.serviceName}>{result.service}</Text>
                <Text
                  style={[
                    styles.statusMessage,
                    { color: getStatusColor(result.status) },
                  ]}
                >
                  {result.message}
                </Text>
              </View>
            </View>
            {result.details && (
              <Text style={styles.details}>{result.details}</Text>
            )}
          </View>
        ))}

        {isRunning && results.length < 4 && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.statusIcon}>⏳</Text>
              <View style={styles.resultInfo}>
                <Text style={styles.serviceName}>Running checks...</Text>
                <Text style={styles.statusMessage}>Please wait</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, isRunning && styles.buttonDisabled]}
          onPress={runHealthCheck}
          disabled={isRunning}
        >
          <Text style={styles.buttonText}>
            {isRunning ? "🔄 Running Checks..." : "🔄 Run Health Check Again"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            const summary = results.reduce((acc, result) => {
              acc[result.status] = (acc[result.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            Alert.alert(
              "Health Check Summary",
              `✅ Success: ${summary.success || 0}\n⚠️ Warnings: ${
                summary.warning || 0
              }\n❌ Errors: ${summary.error || 0}`,
              [{ text: "OK" }]
            );
          }}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            📊 View Summary
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.surface,
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: AppColors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  resultInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    fontWeight: "600",
  },
  details: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 12,
    marginLeft: 40,
    lineHeight: 18,
    fontWeight: "500",
  },
  actions: {
    padding: 20,
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  button: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: AppColors.surfaceGray,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  buttonText: {
    color: AppColors.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: AppColors.primary,
  },
});

export default HealthCheckScreen;
