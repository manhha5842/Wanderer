import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Checkpoint, Coordinate, Route } from "../types";

interface SimpleMapViewProps {
  style?: any;
  route?: Route;
  checkpoints?: Checkpoint[];
  userLocation?: Coordinate;
  showUserLocation?: boolean;
  onMapPress?: (coordinate: Coordinate) => void;
  onDestinationSelected?: (coordinate: Coordinate, address?: string) => void;
  followUserLocation?: boolean;
}

export const SimpleMapView: React.FC<SimpleMapViewProps> = ({
  style,
  route,
  checkpoints = [],
  userLocation,
  showUserLocation = true,
  onMapPress,
  onDestinationSelected,
  followUserLocation = false,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [destination, setDestination] = useState<Coordinate | null>(null);

  // Generate simple HTML with Leaflet map
  const generateMapHTML = () => {
    const center = userLocation || { latitude: 10.7784, longitude: 106.7017 };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wanderer Map</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif; 
        }
        #map { 
            height: 100vh; 
            width: 100vw; 
        }
        .controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            display: flex;
            gap: 10px;
        }
        .btn {
            background: #007AFF;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .btn.stop { 
            background: #FF3B30; 
        }
        .search-box {
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            z-index: 1000;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            padding: 10px;
        }
        .search-input {
            width: calc(100% - 20px);
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="search-box">
        <input type="text" class="search-input" placeholder="Tìm kiếm địa điểm..." id="searchInput">
    </div>
    
    <div id="map"></div>
    
    <div class="controls">
        <button class="btn" id="startBtn" onclick="startNav()" style="display: none;">
            🚀 Bắt đầu
        </button>
        <button class="btn stop" id="stopBtn" onclick="stopNav()" style="display: none;">
            ⏹️ Dừng
        </button>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        console.log('Initializing map...');
        
        let map, userMarker, destMarker;
        
        try {
            map = L.map('map').setView([${center.latitude}, ${
      center.longitude
    }], 15);
            
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);
            
            console.log('Map loaded successfully');
            
            // Add user location marker
            ${
              userLocation
                ? `
            userMarker = L.marker([${userLocation.latitude}, ${userLocation.longitude}])
                .addTo(map)
                .bindPopup('📍 Vị trí của bạn');
            `
                : ""
            }
            
            // Handle map clicks
            map.on('click', function(e) {
                console.log('Map clicked:', e.latlng);
                
                if (destMarker) {
                    map.removeLayer(destMarker);
                }
                
                destMarker = L.marker([e.latlng.lat, e.latlng.lng])
                    .addTo(map)
                    .bindPopup('🎯 Điểm đến');
                
                document.getElementById('startBtn').style.display = 'block';
                
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapClick',
                        coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng }
                    }));
                }
            });
            
            // Search functionality
            document.getElementById('searchInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchLocation(e.target.value);
                }
            });
            
            async function searchLocation(query) {
                if (!query) return;
                
                try {
                    const response = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(query)}&limit=1\`);
                    const data = await response.json();
                    
                    if (data.length > 0) {
                        const result = data[0];
                        const lat = parseFloat(result.lat);
                        const lng = parseFloat(result.lon);
                        
                        map.setView([lat, lng], 16);
                        
                        if (destMarker) map.removeLayer(destMarker);
                        destMarker = L.marker([lat, lng])
                            .addTo(map)
                            .bindPopup('🎯 ' + result.display_name);
                        
                        document.getElementById('startBtn').style.display = 'block';
                        
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'destinationSelected',
                                coordinate: { latitude: lat, longitude: lng },
                                address: result.display_name
                            }));
                        }
                    } else {
                        alert('Không tìm thấy: ' + query);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    alert('Lỗi tìm kiếm');
                }
            }
            
            function startNav() {
                console.log('Starting navigation');
                document.getElementById('startBtn').style.display = 'none';
                document.getElementById('stopBtn').style.display = 'block';
                
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'startNavigation'
                    }));
                }
            }
            
            function stopNav() {
                console.log('Stopping navigation');
                document.getElementById('startBtn').style.display = 'block';
                document.getElementById('stopBtn').style.display = 'none';
                
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'stopNavigation'
                    }));
                }
            }
            
            // Notify React Native that map is ready
            setTimeout(() => {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapReady'
                    }));
                }
                console.log('Map ready message sent');
            }, 1000);
            
        } catch (error) {
            console.error('Map error:', error);
            document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: red;">Lỗi tải bản đồ: ' + error.message + '</div>';
        }
    </script>
</body>
</html>`;
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data);

      switch (data.type) {
        case "mapReady":
          setIsMapReady(true);
          console.log("Map is ready!");
          break;

        case "mapClick":
          if (onMapPress) {
            onMapPress(data.coordinate);
          }
          setDestination(data.coordinate);
          break;

        case "destinationSelected":
          setDestination(data.coordinate);
          if (onDestinationSelected) {
            onDestinationSelected(data.coordinate, data.address);
          }
          break;

        case "startNavigation":
          setIsNavigating(true);
          Alert.alert(
            "Bắt đầu hành trình",
            "Wanderer sẽ tạo câu chuyện thú vị cho chuyến đi của bạn!",
            [{ text: "OK" }]
          );

          if (userLocation && destination) {
            const story = `Bạn bắt đầu hành trình từ vị trí hiện tại, băng qua những con phố nhộn nhịp của thành phố. Trên đường đi, bạn sẽ gặp gỡ những con người thú vị và khám phá các địa danh nổi tiếng. Khi đến điểm đến, bạn đã có một trải nghiệm tuyệt vời và một câu chuyện đáng nhớ!`;

            // Phát audio tiếng Việt
            Speech.speak(story, {
              language: "vi-VN",
              rate: 0.8,
              pitch: 1.0,
            });
          }
          break;

        case "stopNavigation":
          setIsNavigating(false);
          Speech.stop();
          Alert.alert("Dừng hành trình", "Hành trình đã được dừng lại.", [
            { text: "OK" },
          ]);
          break;
      }
    } catch (error) {
      console.error("Error parsing WebView message:", error);
    }
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);
  };

  const handleWebViewLoad = () => {
    console.log("WebView loaded");
  };

  useEffect(() => {
    if (isMapReady && userLocation && webViewRef.current) {
      console.log("Updating user location in map:", userLocation);
      webViewRef.current.postMessage(
        JSON.stringify({
          type: "updateUserLocation",
          coordinate: userLocation,
        })
      );
    }
  }, [userLocation, isMapReady]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        onError={handleWebViewError}
        onLoad={handleWebViewLoad}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        scrollEnabled={false}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />

      {/* Status overlay */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {isNavigating ? "🚶‍♂️ Đang di chuyển" : "📍 Chọn điểm đến trên bản đồ"}
        </Text>
        {destination && (
          <Text style={styles.destText}>
            🎯 {destination.latitude.toFixed(4)},{" "}
            {destination.longitude.toFixed(4)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  statusBar: {
    position: "absolute",
    top: 80,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  destText: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    opacity: 0.8,
  },
});

export default SimpleMapView;
