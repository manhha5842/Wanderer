import { apiKeyManager } from "../config/apiKeyManager";
import { Coordinate, Route, Story, StoryChoice, StorySegment } from "../types";

// Free AI services options
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export interface StoryOptions {
  genre:
    | "romance"
    | "mystery"
    | "adventure"
    | "sci-fi"
    | "horror"
    | "comedy"
    | "fantasy";
  mood: "relaxing" | "exciting" | "creative" | "adventurous";
  routeInfo: {
    startLocation: string;
    endLocation: string;
    distance: number; // in km
    duration: number; // in minutes
    waypoints: number;
  };
  userPreferences?: {
    voice?: "male" | "female";
    speed?: number;
    complexity?: "simple" | "moderate" | "complex";
  };
}

export interface StoryChapter {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  location: Coordinate;
  choices?: StoryChoice[];
  nextChapterId?: string;
  estimatedDuration: number; // seconds
}

export class StoryService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || this.getApiKey();
  }

  private getApiKey(): string {
    try {
      return apiKeyManager.getCurrentGroqKey();
    } catch {
      console.warn("⚠️ Groq API key not configured");
      return "";
    }
  }

  /**
   * Tạo câu chuyện hoàn chỉnh dựa trên route và preferences
   */
  async generateStory(route: Route, options: StoryOptions): Promise<Story> {
    try {
      const prompt = this.buildStoryPrompt(route, options);

      // Call Groq API (or fallback to local generation)
      const storyResponse = await this.callGroqAPI(prompt);

      // Parse response và tạo story structure
      const story = this.parseStoryResponse(storyResponse, route, options);

      return story;
    } catch (error) {
      console.error("Error generating story:", error);
      // Fallback to predefined story templates
      return this.generateFallbackStory(route, options);
    }
  }

  /**
   * Tạo interactive story với choices tại checkpoints
   */
  async generateInteractiveStory(
    route: Route,
    options: StoryOptions
  ): Promise<Story> {
    const baseStory = await this.generateStory(route, options);

    // Add interactive choices at junction checkpoints
    const enhancedSegments = await Promise.all(
      baseStory.segments.map(async (segment, index) => {
        const correspondingWaypoint = route.waypoints[index];

        if (correspondingWaypoint?.checkpointType === "junction") {
          const choices = await this.generateChoicesForLocation(
            segment.content,
            correspondingWaypoint,
            options.genre
          );

          return {
            ...segment,
            choices,
          };
        }

        return segment;
      })
    );

    return {
      ...baseStory,
      segments: enhancedSegments,
    };
  }

  /**
   * Build prompt cho AI dựa trên route và options
   */
  private buildStoryPrompt(route: Route, options: StoryOptions): string {
    const genreDescriptions = {
      romance: "một câu chuyện tình yêu lãng mạn, ngọt ngào",
      mystery: "một câu chuyện bí ẩn, ly kỳ với những manh mối",
      adventure: "một cuộc phiêu lưu đầy thử thách và khám phá",
      "sci-fi": "một câu chuyện khoa học viễn tưởng với công nghệ tương lai",
      horror: "một câu chuyện kinh dị, bí ẩn và đáng sợ",
      comedy: "một câu chuyện hài hước, vui nhộn",
      fantasy: "một câu chuyện thần thoại với phép thuật và sinh vật kỳ bí",
    };

    const durationPerChapter = Math.floor(
      options.routeInfo.duration / options.routeInfo.waypoints
    );
    const wordsPerMinute = 150; // Tốc độ đọc trung bình tiếng Việt
    const wordsPerChapter = durationPerChapter * wordsPerMinute;

    return `
Hãy tạo ${
      genreDescriptions[options.genre]
    } cho một chuyến đi bộ có các thông tin sau:

THÔNG TIN TUYẾN ĐƯỜNG:
- Điểm bắt đầu: ${options.routeInfo.startLocation}
- Điểm kết thúc: ${options.routeInfo.endLocation}
- Khoảng cách: ${options.routeInfo.distance}km
- Thời gian ước tính: ${options.routeInfo.duration} phút
- Số điểm đến: ${options.routeInfo.waypoints} điểm

YÊU CẦU CHI TIẾT:
1. Chia câu chuyện thành ${
      options.routeInfo.waypoints
    } chương tương ứng với số điểm trên tuyến đường
2. Mỗi chương phải dài khoảng ${durationPerChapter} phút kể (tương đương ${wordsPerChapter} từ)
3. Nội dung mỗi chương phải CHI TIẾT, SINH ĐỘNG, MÔ TẢ RÕ RÀNG:
   - Mô tả cảnh vật, không gian xung quanh
   - Diễn biến cốt truyện cụ thể
   - Tâm lý nhân vật
   - Đối thoại (nếu có)
   - Chi tiết về hành động, sự kiện
4. Câu chuyện phải có tính liên kết chặt chẽ từ chương này sang chương khác
5. Tích hợp các địa điểm thực tế vào cốt truyện một cách tự nhiên và sáng tạo
6. Phong cách kể chuyện: ${options.mood}, hấp dẫn, cuốn hút
7. Ngôn ngữ: tiếng Việt, dễ hiểu, sinh động, sử dụng nhiều từ ngữ miêu tả

QUAN TRỌNG VỀ CHIỀU DÀI:
- MỖI chương phải có ít nhất 3-4 đoạn văn dài
- Mỗi đoạn văn có 4-5 câu chi tiết
- Tổng cộng mỗi chương khoảng ${wordsPerChapter} từ để đủ ${durationPerChapter} phút nghe
- Không viết tóm tắt mà phải viết đầy đủ, chi tiết

ĐỊNH DẠNG TRẢ LỜI:
Chỉ trả lời bằng JSON thuần túy, không có text giải thích nào khác. Format chính xác:
{
  "title": "Tên câu chuyện hấp dẫn",
  "description": "Mô tả câu chuyện chi tiết và cuốn hút",
  "chapters": [
    {
      "title": "Tên chương bắt mắt",
      "content": "Nội dung chi tiết rất dài của chương (${wordsPerChapter} từ)",
      "estimatedDuration": ${durationPerChapter * 60}
    }
  ]
}

QUAN TRỌNG: Chỉ trả về JSON, không có text nào khác! Nội dung phải DÀI và CHI TIẾT!

Bắt đầu tạo câu chuyện dài và hấp dẫn:
`;
  }

  /**
   * Call Groq API để generate story
   */
  private async callGroqAPI(prompt: string): Promise<any> {
    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Groq's free model
          messages: [
            {
              role: "system",
              content:
                "Bạn là một nhà kể chuyện chuyên nghiệp, giỏi tạo ra những câu chuyện DÀI, CHI TIẾT và hấp dẫn. Hãy viết nội dung phong phú, sinh động với mô tả cụ thể, đối thoại và diễn biến tâm lý. QUAN TRỌNG: Chỉ trả về JSON thuần túy, không có text giải thích hoặc markdown. Bắt đầu response bằng { và kết thúc bằng }. Nội dung mỗi chương phải DÀI và DETAIL.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 8000, // Tăng gấp đôi để có thể tạo nội dung dài hơn
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content;
    } catch (error) {
      console.error("Groq API call failed:", error);
      throw error;
    }
  }

  /**
   * Parse AI response thành Story object
   */
  private parseStoryResponse(
    response: string,
    route: Route,
    options: StoryOptions
  ): Story {
    try {
      // Clean response - remove markdown formatting and extra text
      let cleanResponse = response.trim();

      // Remove any text before the first opening brace
      const jsonStart = cleanResponse.indexOf("{");
      if (jsonStart === -1) {
        throw new Error("No valid JSON found in response");
      }

      // Find the last closing brace
      const jsonEnd = cleanResponse.lastIndexOf("}");
      if (jsonEnd === -1 || jsonEnd < jsonStart) {
        throw new Error("No valid JSON found in response");
      }

      // Extract only the JSON part
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);

      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/```json\n?|\n?```/g, "").trim();

      // Additional cleanup - remove any remaining non-JSON text
      cleanResponse = cleanResponse.replace(/^[^{]*/, "").replace(/[^}]*$/, "");

      console.log(
        "Cleaned JSON for parsing:",
        cleanResponse.substring(0, 200) + "..."
      );

      const parsed = JSON.parse(cleanResponse);

      // Validate parsed structure
      if (
        !parsed.title ||
        !parsed.chapters ||
        !Array.isArray(parsed.chapters)
      ) {
        throw new Error("Invalid story structure in response");
      }

      const segments: StorySegment[] = parsed.chapters.map(
        (chapter: any, index: number) => {
          // Tính toán duration dựa trên độ dài nội dung thực tế
          const wordCount = (chapter.content || "").split(" ").length;
          const estimatedDuration = Math.max(
            chapter.estimatedDuration || 60,
            Math.floor(wordCount / 2.5) // ~2.5 từ/giây cho tiếng Việt
          );

          return {
            id: `segment_${index}`,
            content: chapter.content || `Chương ${index + 1}`,
            duration: estimatedDuration,
            triggerLocation: route.waypoints[index] || route.startPoint,
            triggerRadius: 20,
            nextSegmentId:
              index < parsed.chapters.length - 1
                ? `segment_${index + 1}`
                : undefined,
          };
        }
      );

      const story: Story = {
        id: `story_${Date.now()}`,
        title: parsed.title || `Câu chuyện ${options.genre}`,
        description:
          parsed.description ||
          "Một câu chuyện được tạo ra riêng cho hành trình của bạn",
        genre: options.genre,
        segments,
        estimatedDuration: options.routeInfo.duration,
        difficulty: "beginner",
        tags: [options.genre, options.mood, "ai-generated"],
      };

      return story;
    } catch (error) {
      console.error("Error parsing story response:", error);
      console.error("Raw response:", response.substring(0, 500) + "...");

      // Try alternative parsing methods
      try {
        return this.tryAlternativeParsing(response, route, options);
      } catch (altError) {
        console.error("Alternative parsing also failed:", altError);
        throw new Error("Không thể phân tích phản hồi từ AI");
      }
    }
  }

  /**
   * Alternative parsing method for malformed AI responses
   */
  private tryAlternativeParsing(
    response: string,
    route: Route,
    options: StoryOptions
  ): Story {
    console.log("Trying alternative parsing...");

    // Look for title and chapters patterns in the text
    const titleMatch = response.match(/"title":\s*"([^"]+)"/);
    const descMatch = response.match(/"description":\s*"([^"]+)"/);

    // Extract chapters using regex
    const chapterMatches = [
      ...response.matchAll(/"title":\s*"([^"]+)"[^}]*?"content":\s*"([^"]+)"/g),
    ];

    if (titleMatch && chapterMatches.length > 0) {
      const segments: StorySegment[] = chapterMatches.map((match, index) => ({
        id: `segment_${index}`,
        content: match[2] || `Chương ${index + 1}`,
        duration: 60,
        triggerLocation: route.waypoints[index] || route.startPoint,
        triggerRadius: 20,
        nextSegmentId:
          index < chapterMatches.length - 1
            ? `segment_${index + 1}`
            : undefined,
      }));

      return {
        id: `story_${Date.now()}`,
        title: titleMatch[1] || `Câu chuyện ${options.genre}`,
        description:
          descMatch?.[1] ||
          "Một câu chuyện được tạo ra riêng cho hành trình của bạn",
        genre: options.genre,
        segments,
        estimatedDuration: options.routeInfo.duration,
        difficulty: "beginner",
        tags: [options.genre, options.mood, "ai-generated-alt"],
      };
    }

    throw new Error("Could not parse response with alternative method");
  }

  /**
   * Generate choices cho interactive story
   */
  private async generateChoicesForLocation(
    currentContent: string,
    waypoint: any,
    genre: string
  ): Promise<StoryChoice[]> {
    const choicesPrompt = `
Dựa trên đoạn truyện: "${currentContent.substring(0, 200)}..."
Và thể loại: ${genre}

Tạo 2 lựa chọn khác nhau cho nhân vật tại ngã rẽ này:
1. Hướng trái (left)
2. Hướng phải (right)

Mỗi lựa chọn nên:
- Ngắn gọn (1-2 câu)
- Tạo sự tò mò
- Phù hợp với cốt truyện hiện tại

Trả lời dưới dạng JSON:
{
  "choices": [
    {
      "text": "Mô tả lựa chọn",
      "direction": "left",
      "consequence": "Điều gì sẽ xảy ra"
    }
  ]
}
`;

    try {
      const response = await this.callGroqAPI(choicesPrompt);
      const parsed = JSON.parse(
        response.replace(/```json\n|\n```/g, "").trim()
      );

      return parsed.choices.map((choice: any, index: number) => ({
        id: `choice_${index}`,
        text: choice.text,
        direction: choice.direction,
        consequence: choice.consequence,
      }));
    } catch (error) {
      console.error("Error generating choices:", error);
      // Return default choices
      return [
        {
          id: "choice_left",
          text: "Rẽ trái để khám phá con đường bí ẩn",
          direction: "left",
          consequence: "Bạn sẽ gặp điều bất ngờ",
        },
        {
          id: "choice_right",
          text: "Rẽ phải theo lối mòn quen thuộc",
          direction: "right",
          consequence: "Câu chuyện tiếp tục bình thường",
        },
      ];
    }
  }

  /**
   * Fallback story generation khi AI không khả dụng
   */
  private generateFallbackStory(route: Route, options: StoryOptions): Story {
    console.log("Generating fallback story for genre:", options.genre);

    const templates: Record<
      string,
      { title: string; description: string; contentTemplate: string }
    > = {
      adventure: {
        title: "Cuộc phiêu lưu đô thị",
        description: "Một cuộc phiêu lưu thú vị giữa lòng thành phố",
        contentTemplate:
          "Bạn đang bắt đầu một cuộc phiêu lưu thú vị. Mỗi bước chân đều mang đến những khám phá mới...",
      },
      romance: {
        title: "Câu chuyện tình yêu trên phố",
        description:
          "Một câu chuyện tình yêu ngọt ngào diễn ra trong hành trình của bạn",
        contentTemplate:
          "Khi bước chân trên con đường này, bạn như được quay về những kỷ niệm đẹp về tình yêu...",
      },
      mystery: {
        title: "Bí ẩn trong thành phố",
        description: "Một câu chuyện bí ẩn chờ đợi được khám phá",
        contentTemplate:
          "Có điều gì đó kỳ lạ đang xảy ra ở khu vực này. Những manh mối bí ẩn xuất hiện từng bước...",
      },
      comedy: {
        title: "Những điều vui nhộn trên đường",
        description: "Một cuộc phiêu lưu đầy tiếng cười",
        contentTemplate:
          "Hành trình này sẽ mang đến cho bạn những khoảnh khắc vui nhộn và bất ngờ...",
      },
      horror: {
        title: "Những bóng ma trong đêm",
        description: "Một câu chuyện đáng sợ trong bóng tối",
        contentTemplate:
          "Khi màn đêm buông xuống, những bí ẩn đáng sợ bắt đầu hiện ra...",
      },
      fantasy: {
        title: "Vương quốc phép thuật",
        description: "Một cuộc phiêu lưu đầy ma thuật",
        contentTemplate:
          "Phép thuật cổ xưa đang thức dậy xung quanh bạn. Những sinh vật kỳ bí xuất hiện...",
      },
      "sci-fi": {
        title: "Tương lai trong tầm tay",
        description: "Một cuộc phiêu lưu khoa học viễn tưởng",
        contentTemplate:
          "Công nghệ tương lai đang chờ đợi bạn khám phá. Những phát minh kỳ diệu xuất hiện...",
      },
    };

    const template = templates[options.genre] || templates.adventure;
    const segmentCount = Math.max(3, Math.min(route.waypoints.length, 5));

    const segments: StorySegment[] = Array.from(
      { length: segmentCount },
      (_, index) => {
        const chapterDuration = Math.floor(
          (options.routeInfo.duration * 60) / segmentCount
        );
        const detailedContent = `${template.contentTemplate} 

Đây là phần ${
          index + 1
        } của hành trình đầy thú vị này. Khi bạn bước đi trên con đường này, hãy để tâm hồn mình thả lỏng và cảm nhận từng khoảnh khắc. Những ngôi nhà xung quanh như đang thì thầm kể những câu chuyện cũ, những con phố quen thuộc bỗng trở nên bí ẩn dưới ánh sáng mới.

Gió nhẹ thổi qua, mang theo hương thơm của những bông hoa nở rộ ven đường. Tiếng chân bước của bạn tạo nên nhịp điệu đều đặn, như một bản nhạc du dương hòa quyện với âm thanh của thành phố. Từng bước chân đều là một khám phá mới, từng hơi thở đều mang đến cảm giác sảng khoái.

Hãy tiếp tục bước đi để khám phá những điều kỳ diệu đang chờ đợi phía trước. Câu chuyện còn dài, và mỗi điểm đến sẽ mang đến cho bạn những trải nghiệm đáng nhớ khác nhau.`;

        return {
          id: `segment_${index}`,
          content: detailedContent,
          duration: chapterDuration,
          triggerLocation: route.waypoints[index] || route.startPoint,
          triggerRadius: 20,
          nextSegmentId:
            index < segmentCount - 1 ? `segment_${index + 1}` : undefined,
        };
      }
    );

    return {
      id: `story_${Date.now()}`,
      title: template.title,
      description: template.description,
      genre: options.genre,
      segments,
      estimatedDuration: options.routeInfo.duration,
      difficulty: "beginner",
      tags: [options.genre, "fallback", "vietnamese"],
    };
  }

  /**
   * Kiểm tra API key có hoạt động không
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${GROQ_BASE_URL}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const storyService = new StoryService();
