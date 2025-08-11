import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { locationService } from "../services/locationService";
import { Coordinate } from "../types";

interface MapViewProps {
  style?: any;
  route?: any;
  checkpoints?: any[];
  userLocation?: Coordinate;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
  onMapPress?: (coordinate: Coordinate) => void;
  onDestinationSelected?: (coordinate: Coordinate, address: string) => void;
}

const MapView: React.FC<MapViewProps> = ({
  style,
  userLocation,
  showUserLocation = true,
  followUserLocation = false,
  onMapPress,
  onDestinationSelected,
}) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(
    userLocation || null
  );

  useEffect(() => {
    if (!currentLocation && showUserLocation) {
      getCurrentLocation();
    }
  }, [currentLocation, showUserLocation]);

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const getMapHTML = () => {
    const lat = currentLocation?.latitude || 21.0285;
    const lng = currentLocation?.longitude || 105.8542;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
        .leaflet-control-attribution { display: none; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map', {
            center: [${lat}, ${lng}],
            zoom: 15,
            zoomControl: true,
            attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            opacity: 0.8
        }).addTo(map);

        ${
          showUserLocation && currentLocation
            ? `
        // Add user location marker
        const userIcon = L.divIcon({
            className: 'user-marker',
            html: '<div style="background: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); animation: pulse 2s infinite;"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map);
        `
            : ""
        }

        // Handle map clicks
        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Send message to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                coordinate: { latitude: lat, longitude: lng }
            }));
        });

        // Send ready message
        window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapReady'
        }));
    </script>
</body>
</html>`;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case "mapReady":
          console.log("Map is ready!");
          break;

        case "mapClick":
          if (onMapPress) {
            onMapPress(message.coordinate);
          }
          if (onDestinationSelected) {
            onDestinationSelected(message.coordinate, "Selected location");
          }
          break;

        default:
          console.log("Unknown message from WebView:", message);
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: getMapHTML() }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="compatibility"
        onError={(error) => {
          console.error("WebView error:", error);
          Alert.alert(
            "Map Error",
            "Failed to load map. Please check your internet connection."
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  webview: {
    flex: 1,
  },
});

export { MapView };
export default MapView;
