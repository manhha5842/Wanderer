import { API_CONFIG, API_KEYS } from "./apiKeys";

export interface APIKeyStats {
  total: number;
  current: number;
  remaining: number;
  hasKeys: boolean;
}

class APIKeyManager {
  private googleMapsIndex = 0;
  private groqIndex = 0;
  private orsIndex = 0;

  constructor() {
    this.validateKeys();
  }

  private validateKeys() {
    try {
      // Check if apiKeys.ts exists
      if (!API_KEYS) {
        console.warn(
          "⚠️ API_KEYS not found. Please copy apiKeys.template.ts to apiKeys.ts"
        );
        return;
      }

      const stats = this.getAllKeyStats();
      console.log("🔑 API Keys loaded:", {
        googleMaps: `${stats.googleMaps.total} keys`,
        groq: `${stats.groq.total} keys`,
        ors: `${stats.ors.total} keys`,
      });
    } catch {
      console.error(
        "❌ Failed to load API keys. Please ensure apiKeys.ts exists."
      );
    }
  }

  // Google Maps Keys
  getCurrentGoogleMapsKey(): string {
    if (!API_KEYS?.GOOGLE_MAPS || API_KEYS.GOOGLE_MAPS.length === 0) {
      throw new Error("No Google Maps API keys configured");
    }
    return API_KEYS.GOOGLE_MAPS[this.googleMapsIndex];
  }

  switchToNextGoogleMapsKey(): boolean {
    this.googleMapsIndex++;
    const hasMore = this.googleMapsIndex < (API_KEYS?.GOOGLE_MAPS?.length || 0);

    if (!hasMore) {
      console.warn("🔑 All Google Maps API keys exhausted");
    }

    return hasMore;
  }

  resetGoogleMapsKeyIndex(): void {
    this.googleMapsIndex = 0;
  }

  getGoogleMapsKeyStats(): APIKeyStats {
    const total = API_KEYS?.GOOGLE_MAPS?.length || 0;
    return {
      total,
      current: this.googleMapsIndex + 1,
      remaining: Math.max(0, total - this.googleMapsIndex),
      hasKeys: total > 0,
    };
  }

  // Groq Keys
  getCurrentGroqKey(): string {
    if (!API_KEYS?.GROQ || API_KEYS.GROQ.length === 0) {
      throw new Error("No Groq API keys configured");
    }
    return API_KEYS.GROQ[this.groqIndex];
  }

  switchToNextGroqKey(): boolean {
    this.groqIndex++;
    const hasMore = this.groqIndex < (API_KEYS?.GROQ?.length || 0);

    if (!hasMore) {
      console.warn("🔑 All Groq API keys exhausted");
    }

    return hasMore;
  }

  resetGroqKeyIndex(): void {
    this.groqIndex = 0;
  }

  getGroqKeyStats(): APIKeyStats {
    const total = API_KEYS?.GROQ?.length || 0;
    return {
      total,
      current: this.groqIndex + 1,
      remaining: Math.max(0, total - this.groqIndex),
      hasKeys: total > 0,
    };
  }

  // OpenRouteService Keys
  getCurrentORSKey(): string {
    if (
      !API_KEYS?.OPENROUTE_SERVICE ||
      API_KEYS.OPENROUTE_SERVICE.length === 0
    ) {
      throw new Error("No OpenRouteService API keys configured");
    }
    return API_KEYS.OPENROUTE_SERVICE[this.orsIndex];
  }

  switchToNextORSKey(): boolean {
    this.orsIndex++;
    const hasMore = this.orsIndex < (API_KEYS?.OPENROUTE_SERVICE?.length || 0);

    if (!hasMore) {
      console.warn("🔑 All ORS API keys exhausted");
    }

    return hasMore;
  }

  resetORSKeyIndex(): void {
    this.orsIndex = 0;
  }

  getORSKeyStats(): APIKeyStats {
    const total = API_KEYS?.OPENROUTE_SERVICE?.length || 0;
    return {
      total,
      current: this.orsIndex + 1,
      remaining: Math.max(0, total - this.orsIndex),
      hasKeys: total > 0,
    };
  }

  // Utility methods
  getAllKeyStats() {
    return {
      googleMaps: this.getGoogleMapsKeyStats(),
      groq: this.getGroqKeyStats(),
      ors: this.getORSKeyStats(),
    };
  }

  resetAllKeys(): void {
    this.resetGoogleMapsKeyIndex();
    this.resetGroqKeyIndex();
    this.resetORSKeyIndex();
    console.log("🔄 All API key indices reset");
  }

  getServiceStatus() {
    const stats = this.getAllKeyStats();
    return {
      googleMaps: {
        enabled: API_CONFIG?.ENABLE_GOOGLE_MAPS || false,
        available: stats.googleMaps.hasKeys,
        status:
          stats.googleMaps.hasKeys && API_CONFIG?.ENABLE_GOOGLE_MAPS
            ? "ready"
            : "disabled",
      },
      groq: {
        enabled: API_CONFIG?.ENABLE_GROQ || false,
        available: stats.groq.hasKeys,
        status:
          stats.groq.hasKeys && API_CONFIG?.ENABLE_GROQ ? "ready" : "disabled",
      },
      ors: {
        enabled: API_CONFIG?.ENABLE_ORS || false,
        available: stats.ors.hasKeys,
        status:
          stats.ors.hasKeys && API_CONFIG?.ENABLE_ORS ? "ready" : "disabled",
      },
    };
  }

  // Debug method
  logStatus(): void {
    const stats = this.getAllKeyStats();
    const serviceStatus = this.getServiceStatus();

    console.log("🔑 API Key Manager Status:");
    console.log("Google Maps:", serviceStatus.googleMaps);
    console.log("Groq:", serviceStatus.groq);
    console.log("ORS:", serviceStatus.ors);
    console.log("Key Statistics:", stats);
  }
}

export const apiKeyManager = new APIKeyManager();
