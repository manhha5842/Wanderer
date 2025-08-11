import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { AppColors } from "../constants/Colors";
import { locationService } from "../services/locationService";
import { Coordinate } from "../types";

interface StartScreenProps {
  onStartJourney: (location: Coordinate) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStartJourney }) => {
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "checking" | "granted" | "denied"
  >("checking");

  useEffect(() => {
    checkLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkLocationPermission = async () => {
    try {
      const permission = await locationService.checkLocationPermission();

      if (permission.granted) {
        setPermissionStatus("granted");
        getCurrentLocation();
      } else {
        setPermissionStatus("denied");
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
      setPermissionStatus("denied");
    }
  };

  const requestLocationPermission = async () => {
    try {
      const permission = await locationService.requestLocationPermission();

      if (permission.granted) {
        setPermissionStatus("granted");
        getCurrentLocation();
      } else {
        Alert.alert(
          "Cần quyền truy cập vị trí",
          "Wanderer cần quyền truy cập vị trí để tạo tuyến đường và theo dõi hành trình của bạn.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert("Lỗi", "Không thể yêu cầu quyền truy cập vị trí");
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
      } else {
        Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại. Vui lòng thử lại.");
    }
  };

  const getMapHTML = () => {
    if (!userLocation) return "";

    const { latitude, longitude } = userLocation;

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
            center: [${latitude}, ${longitude}],
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

        // Add user location marker
        const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); animation: pulse 2s infinite;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        L.marker([${latitude}, ${longitude}], { icon: userIcon }).addTo(map);
    </script>
</body>
</html>`;
  };

  // Permission checking state
  if (permissionStatus === "checking") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColors.background}
        />
        <View style={styles.permissionContainer}>
          <View style={styles.logoSection}>
            <Text style={styles.logoIcon}>🌟</Text>
            <Text style={styles.appTitle}>Wanderer</Text>
          </View>
          <Text style={styles.loadingText}>
            Đang kiểm tra quyền truy cập...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (permissionStatus === "denied") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={AppColors.background}
        />
        <View style={styles.permissionContainer}>
          <View style={styles.logoSection}>
            <Text style={styles.logoIcon}>🌟</Text>
            <Text style={styles.appTitle}>Wanderer</Text>
            <Text style={styles.appSubtitle}>
              Khám phá thế giới qua từng bước chân
            </Text>
          </View>

          <View style={styles.permissionCard}>
            <Text style={styles.permissionIcon}>📍</Text>
            <Text style={styles.permissionTitle}>
              Cần quyền truy cập vị trí
            </Text>
            <Text style={styles.permissionDescription}>
              Wanderer cần quyền truy cập vị trí để:
              {"\n"}• Tạo tuyến đường phù hợp với bạn
              {"\n"}• Theo dõi tiến độ hành trình
              {"\n"}• Kể câu chuyện theo địa điểm
            </Text>

            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.permissionButtonText}>
                Cấp quyền truy cập
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Main screen with location
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AppColors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🌟 Wanderer</Text>
          <Text style={styles.headerSubtitle}>
            Sẵn sàng cho cuộc phiêu lưu mới?
          </Text>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {userLocation && (
          <WebView
            source={{ html: getMapHTML() }}
            style={styles.map}
            scrollEnabled={false}
            bounces={false}
          />
        )}

        {/* Map Overlay */}
        <View style={styles.mapOverlay}>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationTitle}>Vị trí hiện tại</Text>
            <Text style={styles.locationCoords}>
              {userLocation
                ? `${userLocation.latitude.toFixed(
                    6
                  )}, ${userLocation.longitude.toFixed(6)}`
                : "Đang tải..."}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.bottomSection}>
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Bắt đầu hành trình mới</Text>
          <Text style={styles.actionDescription}>
            Tạo tuyến đường và khám phá những câu chuyện thú vị được kể bởi AI
            theo từng bước chân của bạn
          </Text>

          <TouchableOpacity
            style={[
              styles.startButton,
              !userLocation && styles.startButtonDisabled,
            ]}
            onPress={() => {
              if (userLocation) {
                onStartJourney(userLocation);
              }
            }}
            disabled={!userLocation}
          >
            <Text style={styles.startButtonIcon}>🚀</Text>
            <Text style={styles.startButtonText}>
              {userLocation ? "Bắt đầu khám phá" : "Đang tải vị trí..."}
            </Text>
          </TouchableOpacity>

          {!userLocation && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={getCurrentLocation}
            >
              <Text style={styles.refreshButtonText}>🔄 Làm mới vị trí</Text>
            </TouchableOpacity>
          )}
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

  // Permission States
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: AppColors.textWhite,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  permissionCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  permissionDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: "500",
  },
  permissionButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  permissionButtonText: {
    color: AppColors.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },

  // Main Screen
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: AppColors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },

  // Map
  mapContainer: {
    flex: 1,
    backgroundColor: AppColors.mapBackground,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  locationCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
    flex: 1,
  },
  locationCoords: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },

  // Bottom Section
  bottomSection: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  actionCard: {
    alignItems: "center",
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  actionDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    fontWeight: "500",
  },
  startButton: {
    backgroundColor: AppColors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 280,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 16,
  },
  startButtonDisabled: {
    backgroundColor: AppColors.surfaceGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  startButtonText: {
    color: AppColors.textWhite,
    fontSize: 16,
    fontWeight: "700",
  },
  refreshButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: AppColors.surfaceGray,
  },
  refreshButtonText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default StartScreen;
