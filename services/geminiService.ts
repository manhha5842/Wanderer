import { apiKeyManager } from "../config/apiKeyManager";
import { Coordinate } from "../types";

export interface StorySegment {
  id: string;
  content: string;
  duration: number; // seconds
  checkpointId?: string;
  choices?: StoryChoice[];
}

export interface StoryChoice {
  id: string;
  text: string;
  consequence: string;
  nextSegmentId?: string;
}

export interface Story {
  id: string;
  title: string;
  genre: "adventure" | "mystery" | "fantasy" | "historical" | "comedy";
  segments: StorySegment[];
  totalDuration: number;
}

export interface RouteInfo {
  checkpoints: Coordinate[];
  estimatedWalkingTime: number; // minutes
  totalDistance: number; // meters
  genre: Story["genre"];
}

class GeminiStoryService {
  private baseURL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  async generateStory(routeInfo: RouteInfo): Promise<Story> {
    const prompt = this.buildStoryPrompt(routeInfo);

    let attempts = 0;
    const maxAttempts = apiKeyManager.getGroqKeyStats().total;

    while (attempts < maxAttempts) {
      try {
        // Check if we should switch key due to request limit
        if (apiKeyManager.getGroqKeyStats().remaining > 0) {
          apiKeyManager.switchToNextGroqKey();
        }

        const currentKey = apiKeyManager.getCurrentGroqKey();

        const response = await fetch(`${this.baseURL}?key=${currentKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.8,
              topK: 40,
              topP: 0.9,
              maxOutputTokens: 4000,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content
        ) {
          // Success - no need to increment request count anymore
          const storyText = data.candidates[0].content.parts[0].text;
          return this.parseStoryResponse(storyText, routeInfo);
        } else {
          throw new Error("Invalid response format from Gemini API");
        }
      } catch (error) {
        console.error(
          `API Key ${apiKeyManager.getGroqKeyStats().current} failed:`,
          error
        );
        attempts++;

        // Try next key
        if (!apiKeyManager.switchToNextGroqKey()) {
          break;
        }
      }
    }

    // All keys failed, return fallback story
    console.log("All API keys failed, using fallback story");
    return this.generateFallbackStory(routeInfo);
  }

  private buildStoryPrompt(routeInfo: RouteInfo): string {
    const { checkpoints, estimatedWalkingTime, genre } = routeInfo;

    return `
Tạo một câu chuyện tương tác bằng tiếng Việt cho một cuộc đi bộ có ${
      checkpoints.length
    } điểm kiểm tra.

Yêu cầu:
- Thể loại: ${genre}
- Thời gian ước tính: ${estimatedWalkingTime} phút
- Số điểm kiểm tra: ${checkpoints.length}
- Mỗi đoạn câu chuyện cần kéo dài khoảng ${Math.floor(
      estimatedWalkingTime / checkpoints.length
    )} phút
- Tại mỗi điểm kiểm tra, người đi bộ sẽ có 2 lựa chọn hướng đi khác nhau
- Mỗi lựa chọn sẽ dẫn đến câu chuyện khác nhau cho đoạn tiếp theo

Trả về định dạng JSON chính xác:
{
  "id": "story_unique_id",
  "title": "Tên câu chuyện",
  "genre": "${genre}",
  "segments": [
    {
      "id": "segment_1",
      "content": "Nội dung câu chuyện đầy đủ cho đoạn này (tối thiểu 200 từ)",
      "duration": ${Math.floor(
        (estimatedWalkingTime * 60) / checkpoints.length
      )},
      "checkpointId": "checkpoint_1",
      "choices": [
        {
          "id": "choice_1",
          "text": "Đi theo con đường bên trái",
          "consequence": "Bạn sẽ khám phá một khu rừng bí ẩn"
        },
        {
          "id": "choice_2", 
          "text": "Đi theo con đường bên phải",
          "consequence": "Bạn sẽ gặp một ngôi làng cổ"
        }
      ]
    }
  ],
  "totalDuration": ${estimatedWalkingTime * 60}
}

Chỉ trả về JSON, không có text bổ sung nào khác.`;
  }

  private parseStoryResponse(response: string, routeInfo: RouteInfo): Story {
    try {
      // Clean the response - remove any markdown formatting
      let cleanedResponse = response.trim();

      // Remove ```json and ``` if present
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/g, "")
        .replace(/```\s*$/g, "");

      // Try to find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }

      const story = JSON.parse(cleanedResponse);

      // Validate and ensure required fields
      if (!story.segments || !Array.isArray(story.segments)) {
        throw new Error("Invalid story format");
      }

      return {
        id: story.id || `story_${Date.now()}`,
        title: story.title || "Cuộc phiêu lưu thú vị",
        genre: story.genre || routeInfo.genre,
        segments: story.segments,
        totalDuration:
          story.totalDuration || routeInfo.estimatedWalkingTime * 60,
      };
    } catch (error) {
      console.error("Failed to parse story response:", error);
      return this.generateFallbackStory(routeInfo);
    }
  }

  private generateFallbackStory(routeInfo: RouteInfo): Story {
    const { checkpoints, estimatedWalkingTime, genre } = routeInfo;
    const segmentDuration = Math.floor(
      (estimatedWalkingTime * 60) / checkpoints.length
    );

    const segments: StorySegment[] = checkpoints.map((checkpoint, index) => ({
      id: `segment_${index + 1}`,
      content: this.getFallbackSegmentContent(genre, index, checkpoints.length),
      duration: segmentDuration,
      checkpointId: `checkpoint_${index + 1}`,
      choices:
        index < checkpoints.length - 1
          ? [
              {
                id: `choice_${index * 2 + 1}`,
                text: "Đi theo con đường phía trước",
                consequence:
                  "Bạn tiếp tục cuộc hành trình một cách bình thường",
              },
              {
                id: `choice_${index * 2 + 2}`,
                text: "Khám phá khu vực xung quanh",
                consequence:
                  "Bạn khám phá thêm những điều thú vị ở khu vực này",
              },
            ]
          : undefined,
    }));

    return {
      id: `fallback_story_${Date.now()}`,
      title: this.getFallbackTitle(genre),
      genre,
      segments,
      totalDuration: estimatedWalkingTime * 60,
    };
  }

  private getFallbackSegmentContent(
    genre: Story["genre"],
    index: number,
    total: number
  ): string {
    const templates = {
      adventure: [
        "Bạn đang bước vào một cuộc phiêu lưu đầy thú vị. Trước mặt bạn là một con đường dẫn đến những điều bất ngờ. Từng bước chân của bạn đều mang theo sự háo hức và mong đợi về những điều kỳ diệu sắp xảy ra.",
        "Cuộc hành trình tiếp tục với những cảnh quan tuyệt đẹp xung quanh. Bạn cảm nhận được sự thay đổi trong không khí, báo hiệu rằng điều gì đó đặc biệt đang chờ đợi phía trước.",
        "Khi bạn tiến gần đến đích, tâm trạng trở nên phấn khích hơn bao giờ hết. Cuộc phiêu lưu này đã mang lại cho bạn những trải nghiệm không thể quên.",
      ],
      mystery: [
        "Một bí ẩn đang chờ đợi bạn giải mã. Những manh mối nhỏ bắt đầu xuất hiện xung quanh con đường bạn đi, từng chi tiết đều có thể là chìa khóa cho câu đố lớn.",
        "Bí ẩn ngày càng sâu sắc khi bạn tiến xa hơn. Những dấu hiệu kỳ lạ xuất hiện thường xuyên hơn, khiến bạn phải suy nghĩ và phân tích mọi thứ cẩn thận.",
        "Cuối cùng, mảnh ghép cuối cùng của bí ẩn đã được tìm thấy. Sự thật được hé lộ một cách bất ngờ và thú vị.",
      ],
      fantasy: [
        "Bạn bước vào một thế giới kỳ diệu nơi phép thuật và những sinh vật huyền bí tồn tại. Không khí tràn ngập năng lượng ma thuật, từng bước đi đều có thể dẫn đến những cuộc gặp gỡ phi thường.",
        "Thế giới phép thuật ngày càng mở ra trước mắt bạn. Những sinh vật thân thiện xuất hiện để chỉ đường, và bạn học được những phép thuật nhỏ để hỗ trợ cuộc hành trình.",
        "Cuộc phiêu lưu trong thế giới kỳ diệu kết thúc với một điều ước được thực hiện. Bạn mang theo những kỷ niệm đẹp và sức mạnh mới.",
      ],
      historical: [
        "Bạn đang du hành ngược thời gian, khám phá những câu chuyện lịch sử thú vị. Mỗi bước chân đều đưa bạn đến gần hơn với những sự kiện quan trọng đã định hình nên lịch sử.",
        "Hành trình lịch sử tiếp tục với những khám phá mới về quá khứ. Bạn như được chứng kiến những khoảnh khắc lịch sử quan trọng diễn ra trước mắt.",
        "Cuộc du hành thời gian kết thúc với những hiểu biết sâu sắc về lịch sử và những bài học quý giá cho hiện tại.",
      ],
      comedy: [
        "Một cuộc phiêu lưu vui nhộn đang chờ đợi bạn! Những tình huống hài hước bắt đầu xảy ra ngay từ những bước đầu tiên, khiến bạn không thể nhịn được cười.",
        "Cuộc hành trình trở nên thú vị hơn với những nhân vật hài hước và những tình huống dở khóc dở cười. Tiếng cười vang vọng khắp con đường.",
        "Cuối cùng, cuộc phiêu lưu hài hước kết thúc với một màn biểu diễn comedy tuyệt vời, khiến tất cả mọi người đều bật cười không ngừng.",
      ],
    };

    const segments = templates[genre] || templates.adventure;
    return segments[Math.min(index, segments.length - 1)];
  }

  private getFallbackTitle(genre: Story["genre"]): string {
    const titles = {
      adventure: "Cuộc phiêu lưu thú vị",
      mystery: "Bí ẩn cần giải mã",
      fantasy: "Thế giới phép thuật",
      historical: "Hành trình xuyên thời gian",
      comedy: "Chuyến đi vui nhộn",
    };

    return titles[genre] || "Cuộc phiêu lưu đặc biệt";
  }

  // Test connection with current API key
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    keyIndex: number;
  }> {
    try {
      const currentKey = apiKeyManager.getCurrentGroqKey();
      const testPrompt =
        "Chào bạn! Hãy trả lời bằng tiếng Việt: 'API hoạt động tốt!'";

      const response = await fetch(`${this.baseURL}?key=${currentKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: testPrompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 50,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        return {
          success: true,
          message: "API hoạt động tốt!",
          keyIndex: apiKeyManager.getGroqKeyStats().current,
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      return {
        success: false,
        message: `Lỗi: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        keyIndex: apiKeyManager.getGroqKeyStats().current,
      };
    }
  }
}

export const geminiStoryService = new GeminiStoryService();
