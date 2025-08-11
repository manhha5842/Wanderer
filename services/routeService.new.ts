import { apiKeyManager } from "../config/apiKeyManager";
import { Coordinate } from "../types";
import { googleMapsService } from "./googleMapsService";

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  way_points: number[];
}

export interface RouteResponse {
  coordinates: Coordinate[];
  distance: number; // meters
  duration: number; // seconds
  steps: RouteStep[];
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

export interface CheckpointOnRoute {
  id: string;
  coordinate: Coordinate;
  title: string;
  description: string;
  distanceFromStart: number; // meters
  estimatedTimeFromStart: number; // minutes
  routeSegmentIndex: number;
}

class RouteService {
  private readonly ORS_BASE_URL = "https://api.openrouteservice.org/v2";

  private getORSApiKey(): string {
    try {
      return apiKeyManager.getCurrentORSKey();
    } catch (error) {
      console.warn("⚠️ ORS API key not configured, using fallback routing");
      return "";
    }
  }

  async getWalkingRoute(
    start: Coordinate,
    end: Coordinate,
    waypoints: Coordinate[] = []
  ): Promise<RouteResponse> {
    // Try Google Maps first (best quality)
    try {
      console.log("🗺️ Trying Google Maps Directions API...");
      const googleResponse = await googleMapsService.getWalkingRoute(
        start,
        end,
        waypoints
      );
      const routeData = googleMapsService.convertToAppRoute(googleResponse);
      console.log("✅ Google Maps route successful");
      return routeData;
    } catch (error) {
      console.warn("⚠️ Google Maps failed, trying OpenRouteService...", error);
    }

    // Fallback to OpenRouteService
    const orsKey = this.getORSApiKey();
    if (orsKey) {
      try {
        console.log("🗺️ Trying OpenRouteService API...");
        const orsResponse = await this.getORSRoute(
          start,
          end,
          waypoints,
          orsKey
        );
        console.log("✅ OpenRouteService route successful");
        return orsResponse;
      } catch (error) {
        console.warn(
          "⚠️ OpenRouteService failed, using enhanced fallback...",
          error
        );
      }
    }

    // Final fallback to enhanced algorithm
    console.log("🧮 Using enhanced fallback route calculation...");
    return this.createEnhancedFallbackRoute(start, end, waypoints);
  }

  private async getORSRoute(
    start: Coordinate,
    end: Coordinate,
    waypoints: Coordinate[],
    apiKey: string
  ): Promise<RouteResponse> {
    // Prepare coordinates array: start -> waypoints -> end
    const coordinates = [
      [start.longitude, start.latitude],
      ...waypoints.map((wp) => [wp.longitude, wp.latitude]),
      [end.longitude, end.latitude],
    ];

    const requestBody = {
      coordinates,
      profile: "foot-walking",
      format: "geojson",
      options: {
        avoid_features: ["highways", "tollways"],
        profile_params: {
          restrictions: {
            maximum_grade: 15,
          },
        },
      },
      preference: "fastest",
      instructions: true,
      geometry: true,
      elevation: false,
    };

    console.log("Requesting route from ORS:", requestBody);

    const response = await fetch(
      `${this.ORS_BASE_URL}/directions/foot-walking/geojson`,
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json; charset=utf-8",
          Accept:
            "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ORS API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error("No route found");
    }

    const route = data.features[0];
    const geometry = route.geometry;
    const properties = route.properties;

    // Convert coordinates from [lon, lat] to {latitude, longitude}
    const routeCoordinates: Coordinate[] = geometry.coordinates.map(
      (coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      })
    );

    // Extract route steps
    const steps: RouteStep[] = properties.segments[0].steps.map(
      (step: any) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration,
        way_points: step.way_points,
      })
    );

    return {
      coordinates: routeCoordinates,
      distance: properties.segments[0].distance,
      duration: properties.segments[0].duration,
      steps,
      bbox: properties.bbox,
    };
  }

  /**
   * Enhanced fallback route calculation với realistic walking paths
   */
  private createEnhancedFallbackRoute(
    start: Coordinate,
    end: Coordinate,
    waypoints: Coordinate[] = []
  ): RouteResponse {
    const allPoints = [start, ...waypoints, end];
    const coordinates: Coordinate[] = [];
    const steps: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // Tạo route qua các điểm
    for (let i = 0; i < allPoints.length - 1; i++) {
      const from = allPoints[i];
      const to = allPoints[i + 1];

      // Tạo curved path giữa 2 điểm
      const segmentCoords = this.createCurvedPath(from, to);
      coordinates.push(...segmentCoords);

      // Tính distance cho segment
      const segmentDistance = this.calculateDistance(from, to);
      const segmentDuration = segmentDistance / 1.4; // 1.4 m/s = normal walking speed

      totalDistance += segmentDistance;
      totalDuration += segmentDuration;

      // Tạo instruction
      const direction = this.getDirection(from, to);
      const instruction =
        i === 0
          ? `Đi ${direction} ${Math.round(segmentDistance)}m`
          : `Tiếp tục ${direction} ${Math.round(segmentDistance)}m`;

      steps.push({
        instruction,
        distance: segmentDistance,
        duration: segmentDuration,
        way_points: [
          coordinates.length - segmentCoords.length,
          coordinates.length - 1,
        ],
      });
    }

    // Calculate bounding box
    const lats = coordinates.map((c) => c.latitude);
    const lons = coordinates.map((c) => c.longitude);
    const bbox: [number, number, number, number] = [
      Math.min(...lons), // minLon
      Math.min(...lats), // minLat
      Math.max(...lons), // maxLon
      Math.max(...lats), // maxLat
    ];

    return {
      coordinates,
      distance: totalDistance,
      duration: totalDuration,
      steps,
      bbox,
    };
  }

  /**
   * Tạo curved path realistic giữa 2 điểm
   */
  private createCurvedPath(
    from: Coordinate,
    to: Coordinate,
    intervalMeters: number = 30
  ): Coordinate[] {
    const coordinates: Coordinate[] = [from];

    const distance = this.calculateDistance(from, to);
    const numPoints = Math.max(2, Math.floor(distance / intervalMeters));

    for (let i = 1; i < numPoints; i++) {
      const ratio = i / numPoints;

      // Linear interpolation
      const lat = from.latitude + (to.latitude - from.latitude) * ratio;
      const lon = from.longitude + (to.longitude - from.longitude) * ratio;

      // Thêm slight curve để realistic hơn
      const curveOffset = Math.sin(ratio * Math.PI) * 0.0001; // Very small curve

      coordinates.push({
        latitude: lat + curveOffset,
        longitude: lon + curveOffset,
      });
    }

    coordinates.push(to);
    return coordinates;
  }

  private getDirection(from: Coordinate, to: Coordinate): string {
    const bearing = this.calculateBearing(from, to);

    if (bearing >= 337.5 || bearing < 22.5) return "về phía Bắc";
    if (bearing >= 22.5 && bearing < 67.5) return "về phía Đông Bắc";
    if (bearing >= 67.5 && bearing < 112.5) return "về phía Đông";
    if (bearing >= 112.5 && bearing < 157.5) return "về phía Đông Nam";
    if (bearing >= 157.5 && bearing < 202.5) return "về phía Nam";
    if (bearing >= 202.5 && bearing < 247.5) return "về phía Tây Nam";
    if (bearing >= 247.5 && bearing < 292.5) return "về phía Tây";
    return "về phía Tây Bắc";
  }

  private calculateBearing(from: Coordinate, to: Coordinate): number {
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }

  /**
   * Haversine formula để tính khoảng cách
   */
  private calculateDistance(from: Coordinate, to: Coordinate): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Tìm checkpoint gần nhất trên route
   */
  findNearestCheckpointOnRoute(
    currentLocation: Coordinate,
    route: RouteResponse,
    checkpoints: {
      coordinate: Coordinate;
      title: string;
      description: string;
    }[]
  ): CheckpointOnRoute | null {
    if (!checkpoints.length) return null;

    let nearestCheckpoint: CheckpointOnRoute | null = null;
    let minDistance = Infinity;

    checkpoints.forEach((checkpoint, index) => {
      // Tìm điểm gần nhất trên route với checkpoint
      let nearestPointIndex = 0;
      let nearestDistanceToRoute = Infinity;

      route.coordinates.forEach((routePoint, routeIndex) => {
        const distance = this.calculateDistance(
          checkpoint.coordinate,
          routePoint
        );
        if (distance < nearestDistanceToRoute) {
          nearestDistanceToRoute = distance;
          nearestPointIndex = routeIndex;
        }
      });

      // Tính khoảng cách từ current location đến checkpoint
      const distanceFromCurrent = this.calculateDistance(
        currentLocation,
        checkpoint.coordinate
      );

      if (distanceFromCurrent < minDistance) {
        minDistance = distanceFromCurrent;

        // Tính distance từ start đến checkpoint
        let distanceFromStart = 0;
        for (let i = 0; i < nearestPointIndex; i++) {
          distanceFromStart += this.calculateDistance(
            route.coordinates[i],
            route.coordinates[i + 1]
          );
        }

        nearestCheckpoint = {
          id: `checkpoint_${index}`,
          coordinate: checkpoint.coordinate,
          title: checkpoint.title,
          description: checkpoint.description,
          distanceFromStart,
          estimatedTimeFromStart: Math.round(distanceFromStart / 1.4 / 60), // minutes
          routeSegmentIndex: nearestPointIndex,
        };
      }
    });

    return nearestCheckpoint;
  }

  /**
   * Calculate progress along route
   */
  calculateProgress(
    currentLocation: Coordinate,
    route: RouteResponse
  ): {
    completedDistance: number;
    remainingDistance: number;
    progressPercentage: number;
    nearestPointIndex: number;
  } {
    // Tìm điểm gần nhất trên route
    let nearestPointIndex = 0;
    let minDistance = Infinity;

    route.coordinates.forEach((point, index) => {
      const distance = this.calculateDistance(currentLocation, point);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPointIndex = index;
      }
    });

    // Tính completed distance
    let completedDistance = 0;
    for (let i = 0; i < nearestPointIndex; i++) {
      completedDistance += this.calculateDistance(
        route.coordinates[i],
        route.coordinates[i + 1]
      );
    }

    const progressPercentage = (completedDistance / route.distance) * 100;
    const remainingDistance = route.distance - completedDistance;

    return {
      completedDistance,
      remainingDistance,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
      nearestPointIndex,
    };
  }
}

export const routeService = new RouteService();
