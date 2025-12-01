
export enum RoomType {
  LIVING_ROOM = 'Phòng Khách',
  KITCHEN = 'Phòng Bếp',
  BEDROOM_MASTER = 'Phòng Ngủ Master',
  BEDROOM_KID = 'Phòng Ngủ Con',
  BATHROOM = 'Phòng Tắm',
  OFFICE = 'Phòng Làm Việc',
  OTHER = 'Khác'
}

export interface QuotationItem {
  id: string;
  itemName: string;
  description: string; // Mô tả kỹ thuật/vật liệu
  material: string; // Tên vật liệu chính
  unit: string; // ĐVT (md, m2, cái, bộ...)
  quantity: number;
  unitPrice: number; // Đơn giá VNĐ
  totalPrice: number;
  costPrice?: number; // Giá vốn (vật tư + nhân công)
  note?: string; // Ghi chú thêm
  source?: 'produced' | 'outsourced'; // 'produced': Tự sản xuất (tính ván/công), 'outsourced': Mua ngoài (chỉ tính tiền)
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  images: string[]; // Base64 strings
  status: 'empty' | 'analyzing' | 'review' | 'done' | 'error';
  analysisReport?: string;
  items: QuotationItem[];
  totalCost: number;
  lastUpdated?: number;
}

export type StageStatus = 'pending' | 'in_progress' | 'completed';

export interface ProjectStage {
  id: string;
  name: string; // Tên bước (VD: Khảo sát, CNC...)
  status: StageStatus;
  updatedAt?: number;
}

// Cấu hình định mức sản xuất (Lưu trữ các "Căn cứ" tính toán)
export interface ProductionSettings {
  // --- GỖ CÔNG NGHIỆP ---
  sheetPrice: number; // Giá nhập 1 tấm ván (TB - Melamine 17mm)
  sheetWidth: number; // 1.22
  sheetHeight: number; // 2.44
  wasteFactor: number; // Hệ số hao hụt cắt (VD: 1.2 = 20%)
  
  // Nẹp chỉ dán cạnh (Quan trọng)
  edgeBandingPricePerM: number; // Giá nẹp / mét dài (Vật tư + Keo)
  edgePerSheetRatio: number; // Trung bình 1 tấm ván cắt ra có bao nhiêu mét cạnh cần dán? (Thường 25-30md)

  // Hệ số cấu thành (Diện tích ván mở rộng / Diện tích sản phẩm)
  materialCoefficient: number; 

  // --- GỖ TỰ NHIÊN ---
  naturalWoodPricePerM3: number; // Giá nhập gỗ thịt / m3 (Sồi, Xoan đào...)
  naturalWoodWasteFactor: number; // Hao hụt gỗ thịt (Thường cao hơn: 1.4 - 1.5)

  // --- NHÂN CÔNG & XƯỞNG ---
  workerDailyWage: number; // Lương thợ / ngày
  
  // Định mức nhân công dựa trên VẬT TƯ (Số tấm ván)
  productionDaysPerSheet: number; // Số công thợ để sản xuất xong 1 tấm (Cắt, dán, khoan) - VD: 0.3
  installationDaysPerSheet: number; // Số công thợ để lắp đặt xong sp từ 1 tấm - VD: 0.2
  
  accessoryRatio: number; // Tỉ lệ chi phí phụ kiện / Gỗ (%) (Dùng để ước tính nhanh nếu không bóc tách)
  consumableRatio: number; // Tỉ lệ vật tư phụ (Keo, đinh, vít) / Gỗ (%)

  // Factory Overhead & Finishing
  overheadPerSheet: number; // Chi phí quản lý xưởng (Điện, nước, khấu hao máy, thuê xưởng) tính trên 1 tấm
  paintCostPerM2: number; // Chi phí sơn/gia công bề mặt đặc biệt (Acrylic/Inchem) trên m2
}

// Các chi phí cụ thể của dự án
export interface ProjectFinancials {
  transportCost: number; // Vận chuyển
  installationCost: number; // Lắp đặt (nếu thuê ngoài hoặc bồi dưỡng)
  designFee: number; // Chi phí thiết kế
  surveyFee: number; // Chi phí khảo sát
  commission: number; // Hoa hồng giới thiệu
  otherCosts: number; // Chi phí khác
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  rooms: Room[];
  stages: ProjectStage[];
  totalCost: number;
  // New fields for advanced analysis
  productionSettings?: ProductionSettings;
  financials?: ProjectFinancials;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string; // Base64 string
}

export interface KnowledgeItem {
  id: string;
  itemName: string;
  description: string;
  material: string;
  unitPrice: number;
  unit: string;
}

export interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  currentRoomId: string | null;
  companyInfo: CompanyInfo;
  knowledgeBase: KnowledgeItem[];
  // NEW: Global settings that persist across new projects
  globalProductionSettings: ProductionSettings;
  viewMode: 'projects' | 'project_detail' | 'room_detail' | 'settings' | 'summary' | 'knowledge';
}
