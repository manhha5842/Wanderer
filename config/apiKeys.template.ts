// Copy file này thành apiKeys.ts và điền API keys của bạn
// KHÔNG commit file apiKeys.ts lên git!

export const API_KEYS = {
  GOOGLE_MAPS: [
    "YOUR_GOOGLE_MAPS_API_KEY_1",
    "YOUR_GOOGLE_MAPS_API_KEY_2",
    "YOUR_GOOGLE_MAPS_API_KEY_3",
    "YOUR_GOOGLE_MAPS_API_KEY_4",
    "YOUR_GOOGLE_MAPS_API_KEY_5",
    // Thêm tới 15 keys để tránh hết quota
  ],

  GROQ: [
    "YOUR_GROQ_API_KEY_1",
    "YOUR_GROQ_API_KEY_2",
    "YOUR_GROQ_API_KEY_3",
    // Multiple Groq keys for story generation
  ],

  OPENROUTE_SERVICE: [
    "YOUR_ORS_API_KEY_1",
    "YOUR_ORS_API_KEY_2",
    "YOUR_ORS_API_KEY_3",
    // Multiple ORS keys (optional fallback)
  ],
};

export const API_CONFIG = {
  CURRENT_GOOGLE_MAPS_INDEX: 0,
  CURRENT_GROQ_INDEX: 0,
  CURRENT_ORS_INDEX: 0,
  MAX_RETRIES: 3,
  ENABLE_GOOGLE_MAPS: true,
  ENABLE_GROQ: true,
  ENABLE_ORS: false,
};
