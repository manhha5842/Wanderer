import * as Speech from "expo-speech";
import { AudioState, StorySegment } from "../types";

export interface TextToSpeechOptions {
  voice?: string;
  language?: string;
  rate?: number; // 0.5 to 2.0
  pitch?: number; // 0.5 to 2.0
  volume?: number; // 0.0 to 1.0
}

export class AudioService {
  private isInitialized = false;
  private currentSegment: StorySegment | null = null;
  private audioState: AudioState = {
    isPlaying: false,
    isPaused: false,
    currentPosition: 0,
    duration: 0,
    volume: 1.0,
    playbackRate: 1.0,
  };
  private onStateChange?: (state: AudioState) => void;

  constructor() {
    this.initializeAudio();
  }

  /**
   * Khởi tạo Audio system
   */
  private async initializeAudio(): Promise<void> {
    try {
      this.isInitialized = true;
      console.log("Audio system initialized");
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  }

  /**
   * Convert text thành speech và lưu thành file
   */
  async generateAudioFromText(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<string | null> {
    // expo-speech không hỗ trợ save file trực tiếp
    // Trong production, bạn có thể sử dụng external TTS service
    // hoặc pre-generated audio files
    console.log(
      "generateAudioFromText called with text:",
      text.substring(0, 50) + "..."
    );
    return null; // Placeholder - cần implement external TTS service
  }

  /**
   * Phát audio từ text trực tiếp (không lưu file)
   */
  async speakText(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<void> {
    try {
      // Dừng speech hiện tại nếu có
      await this.stopSpeaking();

      this.audioState.isPlaying = true;
      this.audioState.isPaused = false;
      this.notifyStateChange();

      await Speech.speak(text, {
        language: options.language || "vi-VN",
        rate: options.rate || this.audioState.playbackRate,
        pitch: options.pitch || 1.0,
        volume: options.volume || this.audioState.volume,
        voice: options.voice,
        onStart: () => {
          this.audioState.isPlaying = true;
          this.audioState.isPaused = false;
          this.notifyStateChange();
        },
        onDone: () => {
          this.audioState.isPlaying = false;
          this.audioState.isPaused = false;
          this.audioState.currentPosition = 0;
          this.notifyStateChange();
        },
        onStopped: () => {
          this.audioState.isPlaying = false;
          this.audioState.isPaused = true;
          this.notifyStateChange();
        },
        onError: (error) => {
          console.error("Speech error:", error);
          this.audioState.isPlaying = false;
          this.audioState.isPaused = false;
          this.notifyStateChange();
        },
      });
    } catch (error) {
      console.error("Error speaking text:", error);
      this.audioState.isPlaying = false;
      this.notifyStateChange();
    }
  }

  /**
   * Phát story segment
   */
  async playStorySegment(segment: StorySegment): Promise<void> {
    this.currentSegment = segment;

    // Chuyển text thành speech (cho đơn giản, không sử dụng audio files)
    await this.speakText(segment.content, {
      rate: this.audioState.playbackRate,
    });
  }

  /**
   * Tạm dừng audio
   */
  async pause(): Promise<void> {
    try {
      await Speech.stop();

      this.audioState.isPlaying = false;
      this.audioState.isPaused = true;
      this.notifyStateChange();
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  }

  /**
   * Tiếp tục phát audio
   */
  async resume(): Promise<void> {
    try {
      if (this.currentSegment) {
        // Phát lại segment hiện tại
        await this.playStorySegment(this.currentSegment);
      }
    } catch (error) {
      console.error("Error resuming audio:", error);
    }
  }

  /**
   * Dừng audio hoàn toàn
   */
  async stop(): Promise<void> {
    try {
      await this.stopSpeaking();

      this.audioState.isPlaying = false;
      this.audioState.isPaused = false;
      this.audioState.currentPosition = 0;
      this.currentSegment = null;
      this.notifyStateChange();
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  }

  /**
   * Dừng text-to-speech
   */
  async stopSpeaking(): Promise<void> {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }
    } catch (error) {
      console.error("Error stopping speech:", error);
    }
  }

  /**
   * Thay đổi tốc độ phát
   */
  async setPlaybackRate(rate: number): Promise<void> {
    this.audioState.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    this.notifyStateChange();
  }

  /**
   * Thay đổi âm lượng
   */
  async setVolume(volume: number): Promise<void> {
    this.audioState.volume = Math.max(0.0, Math.min(1.0, volume));
    this.notifyStateChange();
  }

  /**
   * Lấy trạng thái audio hiện tại
   */
  getAudioState(): AudioState {
    return { ...this.audioState };
  }

  /**
   * Đăng ký callback cho state changes
   */
  setOnStateChange(callback: (state: AudioState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Notify state change
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.audioState });
    }
  }

  /**
   * Kiểm tra xem có đang phát audio không
   */
  isPlaying(): boolean {
    return this.audioState.isPlaying;
  }

  /**
   * Kiểm tra xem có đang tạm dừng không
   */
  isPaused(): boolean {
    return this.audioState.isPaused;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.stop();
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

// Singleton instance
export const audioService = new AudioService();
