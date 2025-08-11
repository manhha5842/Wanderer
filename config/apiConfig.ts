export interface APIConfig {
  geminiKeys: string[];
  currentKeyIndex: number;
  requestCount: number;
  maxRequestsPerKey: number;
}

// Default configuration - user sẽ input keys vào đây
export const defaultAPIConfig: APIConfig = {
  geminiKeys: [
    // Người dùng sẽ nhập keys vào config/apiKeys.ts thay vì đây
    "YOUR_GEMINI_API_KEY_1",
    "YOUR_GEMINI_API_KEY_2",
  ],
  currentKeyIndex: 0,
  requestCount: 0,
  maxRequestsPerKey: 1000, // Limit mỗi key trước khi chuyển sang key tiếp theo
};

class APIConfigManager {
  private config: APIConfig;

  constructor() {
    this.config = { ...defaultAPIConfig };
  }

  // Get current active API key
  getCurrentKey(): string {
    return this.config.geminiKeys[this.config.currentKeyIndex];
  }

  // Switch to next API key when current key fails or reaches limit
  switchToNextKey(): boolean {
    if (this.config.currentKeyIndex < this.config.geminiKeys.length - 1) {
      this.config.currentKeyIndex++;
      this.config.requestCount = 0;
      console.log(`Switched to API key ${this.config.currentKeyIndex + 1}`);
      return true;
    }
    console.error("All API keys exhausted!");
    return false;
  }

  // Check if we should switch key due to request limit
  shouldSwitchKey(): boolean {
    return this.config.requestCount >= this.config.maxRequestsPerKey;
  }

  // Increment request count for current key
  incrementRequestCount(): void {
    this.config.requestCount++;
  }

  // Update API keys configuration
  updateAPIKeys(newKeys: string[]): void {
    this.config.geminiKeys = newKeys.filter(
      (key) => key && key !== "YOUR_GEMINI_API_KEY_"
    );
    this.config.currentKeyIndex = 0;
    this.config.requestCount = 0;
  }

  // Get all configured keys (for settings display)
  getAllKeys(): string[] {
    return this.config.geminiKeys;
  }

  // Get current status
  getStatus(): {
    currentIndex: number;
    totalKeys: number;
    requestCount: number;
  } {
    return {
      currentIndex: this.config.currentKeyIndex,
      totalKeys: this.config.geminiKeys.length,
      requestCount: this.config.requestCount,
    };
  }
}

export const apiConfigManager = new APIConfigManager();
