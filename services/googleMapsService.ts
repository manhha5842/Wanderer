import { apiKeyManager } from "../config/apiKeyManager";
import { Coordinate } from "../types";
import { RouteResponse } from "./routeService";

export interface GoogleRouteResponse {
  routes: {
    legs: {
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      steps: {
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        html_instructions: string;
        polyline: { points: string };
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
        travel_mode: string;
      }[];
    }[];
    overview_polyline: { points: string };
    summary: string;
  }[];
  status: string;
}

class GoogleMapsService {
  private readonly DIRECTIONS_API_URL =
    "https://maps.googleapis.com/maps/api/directions/json";

  private getApiKey(): string {
    try {
      return apiKeyManager.getCurrentGoogleMapsKey();
    } catch (error) {
      console.error("❌ Google Maps API key not configured:", error);
      throw new Error(
        "Google Maps service unavailable - please configure API key"
      );
    }
  }

  /**
   * Lấy route từ Google Maps Directions API với retry mechanism
   */
  async getWalkingRoute(
    origin: Coordinate,
    destination: Coordinate,
    waypoints: Coordinate[] = []
  ): Promise<GoogleRouteResponse> {
    let lastError: Error;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const apiKey = this.getApiKey();
        const params = new URLSearchParams({
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          mode: "walking",
          key: apiKey,
          language: "vi",
          region: "VN",
        });

        // Thêm waypoints nếu có
        if (waypoints.length > 0) {
          const waypointsStr = waypoints
            .map((wp) => `${wp.latitude},${wp.longitude}`)
            .join("|");
          params.append("waypoints", waypointsStr);
        }

        const response = await fetch(`${this.DIRECTIONS_API_URL}?${params}`);
        const data = await response.json();

        if (data.status === "OVER_QUERY_LIMIT" && attempt < maxRetries - 1) {
          console.warn(
            `🔄 API key limit reached, switching to next key (attempt ${
              attempt + 1
            })`
          );
          if (apiKeyManager.switchToNextGoogleMapsKey()) {
            continue; // Try with next key
          }
        }

        if (data.status !== "OK") {
          throw new Error(
            `Google Directions API error: ${data.status} - ${
              data.error_message || "Unknown error"
            }`
          );
        }

        return data;
      } catch (error) {
        lastError = error as Error;
        console.error(`Google Maps API attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          ); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  /**
   * Decode Google polyline thành coordinates
   */
  decodePolyline(encoded: string): Coordinate[] {
    const coordinates: Coordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  }

  /**
   * Convert Google route response sang format app
   */
  convertToAppRoute(googleResponse: GoogleRouteResponse): RouteResponse {
    const route = googleResponse.routes[0];
    const leg = route.legs[0];

    // Decode polyline thành coordinates
    const coordinates = this.decodePolyline(route.overview_polyline.points);

    // Extract steps
    const steps = leg.steps.map((step) => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Remove HTML tags
      distance: step.distance.value,
      duration: step.duration.value,
      way_points: [0, 0], // Google không cung cấp way_points
    }));

    return {
      coordinates,
      distance: leg.distance.value,
      duration: leg.duration.value,
      steps,
      bbox: this.calculateBbox(coordinates),
    };
  }

  private calculateBbox(
    coordinates: Coordinate[]
  ): [number, number, number, number] {
    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLon = coordinates[0].longitude;
    let maxLon = coordinates[0].longitude;

    coordinates.forEach((coord) => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLon = Math.min(minLon, coord.longitude);
      maxLon = Math.max(maxLon, coord.longitude);
    });

    return [minLon, minLat, maxLon, maxLat];
  }
}

export const googleMapsService = new GoogleMapsService();
