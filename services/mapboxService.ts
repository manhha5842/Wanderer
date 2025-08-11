import { Coordinate } from "../types";
import { RouteResponse } from "./routeService";

class MapboxService {
  private readonly MAPBOX_ACCESS_TOKEN = "YOUR_MAPBOX_ACCESS_TOKEN_HERE";
  private readonly DIRECTIONS_API_URL =
    "https://api.mapbox.com/directions/v5/mapbox/walking";

  async getWalkingRoute(
    origin: Coordinate,
    destination: Coordinate,
    waypoints: Coordinate[] = []
  ): Promise<RouteResponse> {
    try {
      // Tạo coordinates string: origin;waypoint1;waypoint2;destination
      const allCoordinates = [origin, ...waypoints, destination]
        .map((coord) => `${coord.longitude},${coord.latitude}`)
        .join(";");

      const params = new URLSearchParams({
        geometries: "geojson",
        steps: "true",
        voice_instructions: "true",
        banner_instructions: "true",
        language: "vi",
        access_token: this.MAPBOX_ACCESS_TOKEN,
      });

      const response = await fetch(
        `${this.DIRECTIONS_API_URL}/${allCoordinates}?${params}`
      );
      const data = await response.json();

      if (data.code !== "Ok") {
        throw new Error(`Mapbox API error: ${data.code} - ${data.message}`);
      }

      const route = data.routes[0];

      // Convert coordinates từ [lng, lat] sang {latitude, longitude}
      const coordinates: Coordinate[] = route.geometry.coordinates.map(
        (coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        })
      );

      // Extract steps
      const steps = route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration,
        way_points: [
          step.geometry.coordinates.length - 1,
          step.geometry.coordinates.length,
        ],
      }));

      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        steps,
        bbox: route.geometry.bbox || this.calculateBbox(coordinates),
      };
    } catch (error) {
      console.error("Mapbox API error:", error);
      throw error;
    }
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

export const mapboxService = new MapboxService();
