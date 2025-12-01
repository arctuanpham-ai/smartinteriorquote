
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuotationItem, KnowledgeItem } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- FIXED SYSTEM PRICING DATA (DATA CỐ ĐỊNH TRONG CODE) ---
// Đây là kiến thức nền tảng cho AI, sẽ được dùng nếu không tìm thấy trong dữ liệu người dùng tải lên.
const FIXED_PRICING_GUIDELINES = `
DƯỚI ĐÂY LÀ BẢNG GIÁ THAM CHIẾU TIÊU CHUẨN (SYSTEM DEFAULT PRICES):
Hãy sử dụng các đơn giá này nếu không tìm thấy dữ liệu khớp trong "User Knowledge Base".

1. GỖ CÔNG NGHIỆP (MDF CHỐNG ẨM AN CƯỜNG):
- Tủ áo (Cánh mở, Melamine): 2.400.000 - 2.600.000 VNĐ/m2
- Tủ áo (Cánh lùa, Melamine): 2.600.000 - 2.800.000 VNĐ/m2
- Tủ áo (Cánh kính khung nhôm): 3.500.000 - 4.500.000 VNĐ/m2
- Giường ngủ (Bọc nỉ/da đầu giường): 6.000.000 - 8.500.000 VNĐ/cái
- Giường ngủ (Gỗ MDF thường): 4.500.000 - 6.000.000 VNĐ/cái
- Tab đầu giường: 800.000 - 1.500.000 VNĐ/cái
- Bàn trang điểm / Bàn làm việc: 2.500.000 - 3.500.000 VNĐ/md hoặc cái
- Kệ Tivi (Treo tường/Đặt đất): 1.800.000 - 2.500.000 VNĐ/md
- Vách ốp tường (Melamine phẳng): 1.200.000 - 1.500.000 VNĐ/m2
- Vách ốp tường (Lam sóng): 1.500.000 - 2.200.000 VNĐ/m2

2. TỦ BẾP (MDF CHỐNG ẨM):
- Tủ bếp trên (Thùng MDF, Cánh Melamine): 2.400.000 VNĐ/md
- Tủ bếp dưới (Thùng MDF, Cánh Melamine): 2.800.000 VNĐ/md
- Tủ bếp trên (Cánh Acrylic): 3.200.000 VNĐ/md
- Tủ bếp dưới (Cánh Acrylic): 3.800.000 VNĐ/md
- Tủ bếp (Thùng nhựa Picomat, Cánh Acrylic): 5.500.000 - 6.500.000 VNĐ/md (Cả trên dưới ~10-12tr)
- Đá bếp (Kim sa/Trắng vân mây): 1.200.000 - 1.800.000 VNĐ/md
- Kính ốp bếp: 900.000 - 1.200.000 VNĐ/md

3. GỖ TỰ NHIÊN (SỒI NGA / SỒI MỸ):
- Tủ áo: 3.800.000 - 4.500.000 VNĐ/m2
- Tủ bếp trên: 3.500.000 VNĐ/md
- Tủ bếp dưới: 4.200.000 VNĐ/md
- Giường ngủ: 8.000.000 - 12.000.000 VNĐ/cái

4. SOFA & ĐỒ RỜI:
- Sofa da công nghiệp (Văng): 6.000.000 - 10.000.000 VNĐ/cái
- Sofa da thật / Nỉ cao cấp (Góc L): 15.000.000 - 25.000.000 VNĐ/bộ
- Bàn trà (Mặt đá, chân sắt): 2.500.000 - 4.000.000 VNĐ/cái
- Bàn ăn (Mặt đá, 6 ghế): 12.000.000 - 18.000.000 VNĐ/bộ

5. SÀN & TRẦN:
- Sàn gỗ công nghiệp (Malaysia/Thái Lan 12mm): 450.000 - 650.000 VNĐ/m2
- Sàn nhựa hèm khóa: 350.000 - 450.000 VNĐ/m2
- Trần thạch cao (Khung xương Vĩnh Tường): 230.000 - 280.000 VNĐ/m2

6. PHỤ KIỆN:
- Bản lề giảm chấn: 35.000 - 50.000 VNĐ/cái
- Ray ngăn kéo (Bi 3 tầng): 120.000 - 180.000 VNĐ/bộ
`;

// New Schema: Object containing both Analysis Report and Items Array
const analysisResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analysisReport: {
      type: Type.STRING,
      description: "Đoạn văn phân tích chi tiết về phong cách thiết kế, vật liệu chủ đạo, màu sắc và đánh giá sơ bộ về hiện trạng phòng dựa trên hình ảnh.",
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemName: {
            type: Type.STRING,
            description: "Tên hạng mục nội thất (Ví dụ: Tủ áo, Giường ngủ, Sofa)",
          },
          description: {
            type: Type.STRING,
            description: "Mô tả chi tiết kiểu dáng và quy cách kỹ thuật ngắn gọn.",
          },
          material: {
            type: Type.STRING,
            description: "Đề xuất vật liệu phù hợp (Ví dụ: MDF An Cường, Gỗ sồi, Da bò, Nỉ cao cấp).",
          },
          unit: {
            type: Type.STRING,
            description: "Đơn vị tính (m2, md, cái, bộ).",
          },
          quantity: {
            type: Type.NUMBER,
            description: "Số lượng hoặc khối lượng ước tính từ ảnh.",
          },
          unitPrice: {
            type: Type.NUMBER,
            description: "Đơn giá ước tính theo thị trường Việt Nam (VND).",
          },
        },
        required: ["itemName", "description", "material", "unit", "quantity", "unitPrice"],
      },
    }
  },
  required: ["analysisReport", "items"]
};

const knowledgeExtractionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      itemName: { type: Type.STRING },
      description: { type: Type.STRING },
      material: { type: Type.STRING },
      unit: { type: Type.STRING },
      unitPrice: { type: Type.NUMBER },
    },
    required: ["itemName", "unitPrice"],
  },
};

export const analyzeRoomImages = async (
  roomType: string,
  base64Images: string[],
  knowledgeBase: KnowledgeItem[] = []
): Promise<{ items: QuotationItem[], analysisReport: string }> => {
  try {
    const model = "gemini-2.5-flash";
    
    const imageParts = base64Images.map((img) => {
      const base64Data = img.includes("base64,") ? img.split("base64,")[1] : img;
      return {
        inlineData: {
          mimeType: "image/jpeg", 
          data: base64Data,
        },
      };
    });

    // Ưu tiên dữ liệu người dùng tải lên
    const userLearnedContext = knowledgeBase.length > 0 
      ? JSON.stringify(knowledgeBase.map(k => ({
          name: k.itemName,
          desc: k.description,
          mat: k.material,
          price: k.unitPrice,
          unit: k.unit
        })))
      : "[]";

    const prompt = `
      Bạn là chuyên gia dự toán và thiết kế nội thất (Senior Interior Estimator) tại Việt Nam.
      Hãy phân tích các hình ảnh được cung cấp cho phòng: ${roomType}.
      
      HƯỚNG DẪN VỀ GIÁ (ƯU TIÊN THEO THỨ TỰ):
      1. Ưu tiên số 1 (Dữ liệu người dùng): ${userLearnedContext}
      2. Ưu tiên số 2 (Giá tiêu chuẩn hệ thống):
      ${FIXED_PRICING_GUIDELINES}

      YÊU CẦU CÔNG VIỆC:
      1. VIẾT BÁO CÁO PHÂN TÍCH (analysisReport): 
         - Viết một đoạn văn khoảng 100-150 từ diễn giải về phong cách thiết kế, tông màu chủ đạo.
         - Nhận xét về vật liệu chính.

      2. BÓC TÁCH KHỐI LƯỢNG (items):
         - Liệt kê chi tiết các hạng mục nội thất nhìn thấy trong ảnh.
         - Tự động điền Đơn giá (unitPrice) dựa trên 2 nguồn dữ liệu trên. 
         - Nếu hạng mục là gỗ công nghiệp, mặc định ưu tiên MDF An Cường nếu không rõ vật liệu.
      
      Trả về JSON object chứa 'analysisReport' và danh sách 'items'.
    `;

    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        role: "user",
        parts: [
          ...imageParts,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisResponseSchema,
        temperature: 0.2, 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được phản hồi từ AI.");
    }

    const result = JSON.parse(text);
    const rawItems = result.items || [];
    const analysisReport = result.analysisReport || "Chưa có phân tích chi tiết.";

    const items: QuotationItem[] = rawItems.map((item: any, index: number) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
      itemName: item.itemName,
      description: item.description,
      material: item.material,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      // Default estimated cost price to 70% of unit price (30% margin)
      costPrice: item.unitPrice * 0.7, 
      note: '',
      source: 'produced' // Default to produced unless specified
    }));

    return { items, analysisReport };

  } catch (error) {
    console.error("Lỗi khi phân tích ảnh:", error);
    throw error;
  }
};

export const extractKnowledgeFromImage = async (base64Image: string): Promise<KnowledgeItem[]> => {
  try {
    const model = "gemini-2.5-flash";
    const base64Data = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image;

    const prompt = `
      Hãy phân tích hình ảnh này (có thể là bảng báo giá in sẵn hoặc SỔ TAY VIẾT TAY).
      Trích xuất danh sách các hạng mục, vật liệu và đơn giá vào JSON.
      Nếu là chữ viết tay hơi khó đọc, hãy cố gắng luận giải dựa trên ngữ cảnh nội thất.
      
      Các trường cần lấy:
      - itemName: Tên hạng mục
      - description: Mô tả (nếu có)
      - material: Vật liệu (nếu có)
      - unit: Đơn vị tính
      - unitPrice: Đơn giá (Số VNĐ)
    `;

    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        role: "user",
        parts: [
          {
             inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
             }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: knowledgeExtractionSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const rawItems = JSON.parse(text) as any[];
    
    return rawItems.map((item, index) => ({
      id: `learned-img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${index}`,
      itemName: item.itemName || 'Chưa rõ tên',
      description: item.description || '',
      material: item.material || '',
      unit: item.unit || 'cái',
      unitPrice: item.unitPrice || 0
    }));

  } catch (error) {
    console.error("Lỗi trích xuất từ ảnh:", error);
    throw error;
  }
};
