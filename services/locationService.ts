import * as Location from "expo-location";
import { Checkpoint, Coordinate } from "../types";

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export interface LocationTrackingOptions {
  accuracy: number; // Use number instead of Location.Accuracy enum
  distanceInterval: number; // meters
  timeInterval: number; // milliseconds
}

export class LocationService {
  private watchId: Location.LocationSubscription | null = null;
  private isTracking = false;
  private lastKnownLocation: Coordinate | null = null;
  private onLocationUpdate?: (location: Coordinate) => void;
  private onCheckpointReached?: (checkpoint: Checkpoint) => void;
  private checkpoints: Checkpoint[] = [];

  /**
   * Yêu cầu quyền truy cập vị trí
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        // Yêu cầu background permission nếu cần
        const backgroundStatus =
          await Location.requestBackgroundPermissionsAsync();
        console.log("Background location permission:", backgroundStatus.status);
      }

      return {
        granted: status === "granted",
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED,
      };
    }
  }

  /**
   * Kiểm tra trạng thái permission hiện tại
   */
  async checkLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } =
        await Location.getForegroundPermissionsAsync();
      return {
        granted: status === "granted",
        canAskAgain,
        status,
      };
    } catch (error) {
      console.error("Error checking location permission:", error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED,
      };
    }
  }

  /**
   * Lấy vị trí hiện tại
   */
  async getCurrentLocation(): Promise<Coordinate | null> {
    try {
      const permission = await this.checkLocationPermission();
      if (!permission.granted) {
        throw new Error("Location permission not granted");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: 6, // 6 = Location.Accuracy.High
      });

      const coordinate: Coordinate = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      this.lastKnownLocation = coordinate;
      return coordinate;
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }

  /**
   * Bắt đầu theo dõi vị trí
   */
  async startLocationTracking(
    options: Partial<LocationTrackingOptions> = {},
    onUpdate?: (location: Coordinate) => void
  ): Promise<boolean> {
    try {
      const permission = await this.checkLocationPermission();
      if (!permission.granted) {
        throw new Error("Location permission not granted");
      }

      if (this.isTracking) {
        console.log("Location tracking already started");
        return true;
      }

      const trackingOptions: LocationTrackingOptions = {
        accuracy: 6, // 6 = Location.Accuracy.High
        distanceInterval: 5, // Update every 5 meters
        timeInterval: 3000, // Update every 3 seconds
        ...options,
      };

      this.onLocationUpdate = onUpdate;

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: trackingOptions.accuracy,
          timeInterval: trackingOptions.timeInterval,
          distanceInterval: trackingOptions.distanceInterval,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const coordinate: Coordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          this.lastKnownLocation = coordinate;
          this.onLocationUpdate?.(coordinate);
          this.checkCheckpointsProximity(coordinate);
        }
      );

      this.isTracking = true;
      console.log("Location tracking started");
      return true;
    } catch (error) {
      console.error("Error starting location tracking:", error);
      return false;
    }
  }

  /**
   * Dừng theo dõi vị trí
   */
  stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.isTracking = false;
    console.log("Location tracking stopped");
  }

  /**
   * Thiết lập checkpoints để theo dõi
   */
  setCheckpoints(checkpoints: Checkpoint[]): void {
    this.checkpoints = checkpoints.map((cp) => ({ ...cp, isReached: false }));
  }

  /**
   * Thiết lập callback khi đến checkpoint
   */
  setOnCheckpointReached(callback: (checkpoint: Checkpoint) => void): void {
    this.onCheckpointReached = callback;
  }

  /**
   * Kiểm tra xem có gần checkpoint nào không
   */
  private checkCheckpointsProximity(currentLocation: Coordinate): void {
    this.checkpoints.forEach((checkpoint) => {
      if (!checkpoint.isReached) {
        const distance = this.calculateDistance(
          currentLocation,
          checkpoint.location
        );

        if (distance <= checkpoint.radius) {
          checkpoint.isReached = true;
          checkpoint.reachedAt = new Date();
          console.log(`Reached checkpoint: ${checkpoint.title}`);
          this.onCheckpointReached?.(checkpoint);
        }
      }
    });
  }

  /**
   * Tính khoảng cách giữa 2 điểm (Haversine formula)
   */
  calculateDistance(point1: Coordinate, point2: Coordinate): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Tính bearing (hướng) từ điểm A đến điểm B
   */
  calculateBearing(from: Coordinate, to: Coordinate): number {
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return ((θ * 180) / Math.PI + 360) % 360; // Bearing in degrees
  }

  /**
   * Lấy vị trí cuối cùng đã biết
   */
  getLastKnownLocation(): Coordinate | null {
    return this.lastKnownLocation;
  }

  /**
   * Kiểm tra trạng thái tracking
   */
  getIsTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Lấy checkpoints đã đạt được
   */
  getReachedCheckpoints(): Checkpoint[] {
    return this.checkpoints.filter((cp) => cp.isReached);
  }

  /**
   * Lấy checkpoint gần nhất chưa đạt được
   */
  getNearestUnreachedCheckpoint(
    currentLocation?: Coordinate
  ): Checkpoint | null {
    const location = currentLocation || this.lastKnownLocation;
    if (!location) return null;

    const unreachedCheckpoints = this.checkpoints.filter((cp) => !cp.isReached);
    if (unreachedCheckpoints.length === 0) return null;

    let nearest = unreachedCheckpoints[0];
    let minDistance = this.calculateDistance(location, nearest.location);

    unreachedCheckpoints.forEach((checkpoint) => {
      const distance = this.calculateDistance(location, checkpoint.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = checkpoint;
      }
    });

    return nearest;
  }

  /**
   * Reset tất cả checkpoints
   */
  resetCheckpoints(): void {
    this.checkpoints = this.checkpoints.map((cp) => ({
      ...cp,
      isReached: false,
      reachedAt: undefined,
    }));
  }
}

// Singleton instance
export const locationService = new LocationService();
