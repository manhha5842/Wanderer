// Wanderer Core Types

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RoutePoint extends Coordinate {
  id: string;
  timestamp?: number;
  isCheckpoint?: boolean;
  checkpointType?: "start" | "junction" | "end";
}

export interface Route {
  id: string;
  name: string;
  startPoint: Coordinate;
  endPoint: Coordinate;
  waypoints: RoutePoint[];
  estimatedDuration: number; // in minutes
  estimatedDistance: number; // in meters
  difficulty: "easy" | "medium" | "hard";
  createdAt: Date;
}

export interface StoryChoice {
  id: string;
  text: string;
  direction: "left" | "right" | "straight";
  consequence: string; // Short description of what happens
}

export interface StorySegment {
  id: string;
  content: string; // The actual story text/script
  audioUrl?: string; // URL to audio file
  duration: number; // in seconds
  choices?: StoryChoice[];
  nextSegmentId?: string;
  triggerLocation?: Coordinate;
  triggerRadius?: number; // in meters
}

export interface Story {
  id: string;
  title: string;
  description: string;
  genre:
    | "adventure"
    | "mystery"
    | "romance"
    | "sci-fi"
    | "fantasy"
    | "horror"
    | "comedy";
  segments: StorySegment[];
  estimatedDuration: number; // in minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export interface WalkSession {
  id: string;
  routeId: string;
  storyId: string;
  startTime: Date;
  endTime?: Date;
  currentLocation?: Coordinate;
  currentSegmentId?: string;
  visitedCheckpoints: string[];
  totalDistance: number;
  totalSteps?: number;
  totalCalories?: number;
  isActive: boolean;
  isPaused: boolean;
  choicesMade: {
    checkpointId: string;
    choiceId: string;
    timestamp: Date;
  }[];
}

export interface UserPreferences {
  preferredGenres: Story["genre"][];
  walkingSpeed: "slow" | "normal" | "fast"; // km/h: 3/5/7
  audioSpeed: number; // 0.5 to 2.0
  enableStepCounting: boolean;
  enableCalorieTracking: boolean;
  notificationSettings: {
    checkpointReminders: boolean;
    storyPrompts: boolean;
    completionCelebrations: boolean;
  };
}

export interface Checkpoint {
  id: string;
  location: Coordinate;
  type: "start" | "junction" | "poi" | "end"; // poi = point of interest
  title: string;
  description?: string;
  radius: number; // trigger radius in meters
  storySegmentId?: string;
  isReached: boolean;
  reachedAt?: Date;
}

export interface NavigationState {
  currentRoute?: Route;
  currentStory?: Story;
  currentSession?: WalkSession;
  isTracking: boolean;
  locationPermission: "granted" | "denied" | "undetermined";
  userLocation?: Coordinate;
  nearestCheckpoint?: Checkpoint;
  distanceToNextCheckpoint?: number;
}

export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSegment?: StorySegment;
  currentPosition: number; // in seconds
  duration: number;
  volume: number;
  playbackRate: number;
}

// API Response Types
export interface RouteApiResponse {
  coordinates: number[][];
  distance: number;
  duration: number;
}

export interface StoryGenerationRequest {
  genre: Story["genre"];
  routeInfo: {
    distance: number;
    duration: number;
    waypoints: number;
  };
  userPreferences: Partial<UserPreferences>;
}

export interface StoryGenerationResponse {
  story: Omit<Story, "id">;
  segments: Omit<StorySegment, "id">[];
}
