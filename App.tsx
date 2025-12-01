
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Room, RoomType, AppState, CompanyInfo, Project, KnowledgeItem, QuotationItem, ProjectStage, StageStatus, ProductionSettings, ProjectFinancials } from './types';
import RoomDetail from './components/RoomDetail';
import CompanySettings from './components/CompanySettings';
import SummaryExport from './components/SummaryExport';
import KnowledgeBase from './components/KnowledgeBase';
import ProjectProgress from './components/ProjectProgress';
import ResourceAnalysis from './components/ResourceAnalysis';
import { PlusIcon, SparklesIcon, TrashIcon, PhotoIcon, SettingsIcon, DocumentIcon, ArrowLeftIcon, FolderIcon, HomeIcon, DatabaseIcon, CloudArrowUpIcon, CloudArrowDownIcon, ClockIcon, CalculatorIcon, CartoonSofa, CartoonBed, CartoonKitchen, CartoonWardrobe, CartoonDesk, CartoonBath, CartoonLamp } from './components/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// New Professional Color Palette (Emerald/Teal based)
const COLORS = ['#059669', '#10b981', '#14b8a6', '#f59e0b', '#6366f1', '#8b5cf6', '#ef4444'];

const INITIAL_COMPANY_INFO: CompanyInfo = {
  name: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: ''
};

const DEFAULT_STAGES_LIST = [
    "Khảo sát đo đạc",
    "Lên bản vẽ sản xuất",
    "Thống nhất lại",
    "Làm file CNC",
    "Chuyển xuống xưởng cắt CNC",
    "Dán cạnh",
    "Sơn bả",
    "Bọc hàng",
    "Lắp đặt"
];

// Default Production Settings (Updated Market Standards 2025 - Realistic & Conservative)
export const DEFAULT_PRODUCTION_SETTINGS: ProductionSettings = {
    // --- GỖ CÔNG NGHIỆP ---
    sheetPrice: 850000, // MDF lõi xanh 17mm phủ Melamine
    sheetWidth: 1.22,
    sheetHeight: 2.44,
    wasteFactor: 1.20, // Hao hụt cắt 20%
    
    // Nẹp chỉ (Edge Banding) - Chi phí ẩn lớn
    edgeBandingPricePerM: 3500, // Nẹp nhựa PVC 1mm + Keo nhiệt
    edgePerSheetRatio: 28, // 1 tấm ván cắt ra trung bình sinh ra 28 mét dài cạnh cần dán

    materialCoefficient: 4.2, // Hệ số quy đổi diện tích mặt thành ván

    // --- GỖ TỰ NHIÊN ---
    naturalWoodPricePerM3: 18000000, // Gỗ Sồi (Oak) ~18-20tr/khối
    naturalWoodWasteFactor: 1.5, // Hao hụt gỗ thịt rất cao (50%) do bỏ giác, nứt, cong

    // --- NHÂN CÔNG ---
    workerDailyWage: 750000, 
    
    productionDaysPerSheet: 0.35, // ~2.8 tiếng/tấm
    installationDaysPerSheet: 0.25, // ~2 tiếng/tấm

    accessoryRatio: 15, 
    consumableRatio: 8, 

    // --- OVERHEAD & FINISHING ---
    overheadPerSheet: 150000, // Chi phí quản lý xưởng (Điện, nước, khấu hao máy, thuê xưởng) tính trên 1 tấm
    paintCostPerM2: 350000, // Sơn Inchem/Bệt/Acrylic
};

const DEFAULT_FINANCIALS: ProjectFinancials = {
    transportCost: 0,
    installationCost: 0,
    designFee: 0,
    surveyFee: 0,
    commission: 0,
    otherCosts: 0
};

// --- HARDCODED SYSTEM DEFAULT KNOWLEDGE BASE ---
export const SYSTEM_DEFAULT_KNOWLEDGE: KnowledgeItem[] = [
    { id: 'sys-01', itemName: 'Tủ áo (Cánh mở)', description: 'Thùng MDF chống ẩm, cánh Melamine', material: 'MDF An Cường', unit: 'm2', unitPrice: 2600000 },
    { id: 'sys-02', itemName: 'Tủ áo (Cánh lùa)', description: 'Thùng MDF chống ẩm, cánh lùa Melamine', material: 'MDF An Cường', unit: 'm2', unitPrice: 2800000 },
    { id: 'sys-03', itemName: 'Tủ áo (Cánh kính)', description: 'Thùng MDF, Cánh kính khung nhôm nhập khẩu', material: 'Kính cường lực', unit: 'm2', unitPrice: 4200000 },
    { id: 'sys-04', itemName: 'Giường ngủ (Bọc nỉ)', description: 'Giường bọc nỉ/da đầu giường, thang dát gỗ', material: 'MDF + Nỉ/Da', unit: 'cái', unitPrice: 7500000 },
    { id: 'sys-05', itemName: 'Giường ngủ (MDF)', description: 'Giường gỗ công nghiệp, đầu giường melamine', material: 'MDF An Cường', unit: 'cái', unitPrice: 5500000 },
    { id: 'sys-06', itemName: 'Tab đầu giường', description: 'Tab 2 ngăn kéo, ray bi', material: 'MDF An Cường', unit: 'cái', unitPrice: 1200000 },
    { id: 'sys-07', itemName: 'Bàn trang điểm', description: 'Bàn treo hoặc chân gỗ, gương led', material: 'MDF An Cường', unit: 'cái', unitPrice: 3200000 },
    { id: 'sys-08', itemName: 'Bàn làm việc', description: 'Bàn chân sắt hoặc gỗ, có hộc tủ', material: 'MDF + Sắt', unit: 'md', unitPrice: 2800000 },
    { id: 'sys-09', itemName: 'Kệ Tivi (Treo tường)', description: 'Kệ treo tường đơn giản', material: 'MDF An Cường', unit: 'md', unitPrice: 2200000 },
    { id: 'sys-10', itemName: 'Vách ốp tường', description: 'Vách ốp melamine phẳng', material: 'MDF An Cường', unit: 'm2', unitPrice: 1400000 },
    { id: 'sys-11', itemName: 'Vách nan gỗ', description: 'Vách nan sóng trang trí', material: 'Nhựa giả gỗ', unit: 'm2', unitPrice: 1800000 },
    { id: 'sys-12', itemName: 'Tủ bếp trên', description: 'Thùng MDF, cánh Melamine/Laminate', material: 'MDF An Cường', unit: 'md', unitPrice: 2800000 },
    { id: 'sys-13', itemName: 'Tủ bếp dưới', description: 'Thùng MDF, cánh Melamine/Laminate', material: 'MDF An Cường', unit: 'md', unitPrice: 3200000 },
    { id: 'sys-14', itemName: 'Tủ bếp trên (Acrylic)', description: 'Thùng MDF, cánh Acrylic bóng gương', material: 'Acrylic An Cường', unit: 'md', unitPrice: 3500000 },
    { id: 'sys-15', itemName: 'Tủ bếp dưới (Acrylic)', description: 'Thùng MDF, cánh Acrylic bóng gương', material: 'Acrylic An Cường', unit: 'md', unitPrice: 4200000 },
    { id: 'sys-16', itemName: 'Đá bàn bếp', description: 'Đá kim sa trung hoặc trắng vân mây', material: 'Đá nhân tạo', unit: 'md', unitPrice: 1600000 },
    { id: 'sys-17', itemName: 'Kính ốp bếp', description: 'Kính cường lực sơn màu 8mm', material: 'Kính cường lực', unit: 'md', unitPrice: 1100000 },
    { id: 'sys-18', itemName: 'Sofa da (Văng)', description: 'Sofa văng dài 2.2m-2.4m', material: 'Da công nghiệp', unit: 'cái', unitPrice: 9500000 },
    { id: 'sys-19', itemName: 'Bàn trà', description: 'Bàn trà mặt đá, chân sắt sơn tĩnh điện', material: 'Đá + Sắt', unit: 'cái', unitPrice: 3500000 },
    { id: 'sys-20', itemName: 'Bàn ăn (6 ghế)', description: 'Bàn mặt đá ceramic, 6 ghế bọc da', material: 'Đá + Da', unit: 'bộ', unitPrice: 16000000 },
    { id: 'sys-21', itemName: 'Tủ giày', description: 'Tủ giày kịch trần, cánh mở', material: 'MDF An Cường', unit: 'm2', unitPrice: 2600000 },
    { id: 'sys-22', itemName: 'Vách kính tắm', description: 'Vách kính cường lực 10mm, phụ kiện inox 304', material: 'Kính + Inox', unit: 'm2', unitPrice: 1800000 },
    { id: 'sys-23', itemName: 'Tủ Lavabo', description: 'Tủ nhựa Picomat chịu nước', material: 'Nhựa Picomat', unit: 'md', unitPrice: 3800000 },
    { id: 'sys-24', itemName: 'Sàn gỗ', description: 'Sàn gỗ công nghiệp Malaysia 12mm', material: 'Gỗ CN', unit: 'm2', unitPrice: 550000 },
    { id: 'sys-25', itemName: 'Trần thạch cao', description: 'Khung xương Vĩnh Tường, tấm Gyproc', material: 'Thạch cao', unit: 'm2', unitPrice: 260000 },
    { id: 'sys-26', itemName: 'Rèm vải', description: 'Rèm vải 2 lớp (Voan + Vải)', material: 'Vải polyester', unit: 'md', unitPrice: 1600000 },
    { id: 'sys-27', itemName: 'Đợt gỗ trang trí', description: 'Đợt gỗ treo tường', material: 'MDF An Cường', unit: 'cái', unitPrice: 450000 },
    { id: 'sys-28', itemName: 'Gương soi', description: 'Gương dán tường hoặc treo', material: 'Gương Bỉ', unit: 'm2', unitPrice: 1500000 },
    { id: 'sys-29', itemName: 'Phụ kiện bản lề', description: 'Bản lề giảm chấn inox 304', material: 'Inox 304', unit: 'cái', unitPrice: 45000 },
    { id: 'sys-30', itemName: 'Phụ kiện ray ngăn kéo', description: 'Ray bi 3 tầng giảm chấn', material: 'Thép sơn tĩnh điện', unit: 'bộ', unitPrice: 150000 }
];

const INITIAL_STATE: AppState = {
  projects: [],
  currentProjectId: null,
  currentRoomId: null,
  companyInfo: INITIAL_COMPANY_INFO,
  knowledgeBase: SYSTEM_DEFAULT_KNOWLEDGE, // Start with defaults
  globalProductionSettings: DEFAULT_PRODUCTION_SETTINGS, // Default global settings
  viewMode: 'projects'
};

// Robust ID Generator using performance.now() for high precision uniqueness
const generateId = (prefix = 'id') => {
  const timestamp = Date.now();
  const performanceNow = typeof performance !== 'undefined' ? performance.now() : 0;
  const random = Math.random().toString(36).substr(2, 9);
  // Combine timestamp, high-res timer, and random string to guarantee uniqueness even in fast loops
  return `${prefix}-${timestamp}-${Math.floor(performanceNow * 100)}-${random}`;
};

export const getRoomIcon = (type: RoomType) => {
    switch (type) {
        case RoomType.LIVING_ROOM: return <CartoonSofa className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-110" />;
        case RoomType.BEDROOM_MASTER: 
        case RoomType.BEDROOM_KID: return <CartoonBed className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-110" />;
        case RoomType.KITCHEN: return <CartoonKitchen className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-110" />;
        case RoomType.BATHROOM: return <CartoonBath className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-110" />;
        case RoomType.OFFICE: return <CartoonDesk className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-110" />;
        case RoomType.OTHER: return <CartoonWardrobe className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-110" />;
        default: return <CartoonSofa className="w-16 h-16 drop-shadow-md transition-transform group-hover:scale-110" />;
    }
};

export default function App() {
  const isDataLoadedRef = useRef(false);

  // --- SAFE HYDRATION LOGIC ---
  const [state, setState] = useState<AppState>(() => {
    try {
      const savedStateStr = localStorage.getItem('smartInteriorState');
      
      if (!savedStateStr) {
          isDataLoadedRef.current = true;
          return INITIAL_STATE;
      }

      const parsed = JSON.parse(savedStateStr);
      
      let loadedProjects: Project[] = [];
      if (parsed.rooms && Array.isArray(parsed.rooms) && (!parsed.projects || parsed.projects.length === 0)) {
            loadedProjects = [{
                id: generateId('legacy-proj'),
                name: 'Dự án đã lưu (Cũ)',
                createdAt: Date.now(),
                rooms: parsed.rooms,
                stages: [],
                totalCost: parsed.rooms.reduce((sum: number, r: Room) => sum + r.totalCost, 0),
                productionSettings: DEFAULT_PRODUCTION_SETTINGS,
                financials: DEFAULT_FINANCIALS
            }];
      } else {
            loadedProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
      }

      const sanitizedProjects = loadedProjects.map(p => {
          let stages = Array.isArray(p.stages) ? p.stages : [];
          if (stages.length === 0) {
              stages = DEFAULT_STAGES_LIST.map((name, idx) => ({
                  id: generateId(`stage-${idx}`),
                  name,
                  status: 'pending' as StageStatus,
                  updatedAt: Date.now()
              }));
          }

          const productionSettings = { ...DEFAULT_PRODUCTION_SETTINGS, ...(p.productionSettings || {}) };
          if (!productionSettings.edgeBandingPricePerM) productionSettings.edgeBandingPricePerM = DEFAULT_PRODUCTION_SETTINGS.edgeBandingPricePerM;
          if (!productionSettings.edgePerSheetRatio) productionSettings.edgePerSheetRatio = DEFAULT_PRODUCTION_SETTINGS.edgePerSheetRatio;
          if (!productionSettings.naturalWoodPricePerM3) productionSettings.naturalWoodPricePerM3 = DEFAULT_PRODUCTION_SETTINGS.naturalWoodPricePerM3;
          if (!productionSettings.naturalWoodWasteFactor) productionSettings.naturalWoodWasteFactor = DEFAULT_PRODUCTION_SETTINGS.naturalWoodWasteFactor;

          const financials = p.financials || DEFAULT_FINANCIALS;
          const rooms = Array.isArray(p.rooms) ? p.rooms : [];
          
          return {
              ...p,
              id: p.id || generateId('proj'),
              stages: stages,
              rooms: rooms,
              productionSettings,
              financials
          };
      });

      let loadedKnowledgeBase = Array.isArray(parsed.knowledgeBase) ? parsed.knowledgeBase : [];
      if (loadedKnowledgeBase.length === 0) {
          loadedKnowledgeBase = SYSTEM_DEFAULT_KNOWLEDGE;
      }

      // Safe load globalProductionSettings, fallback to DEFAULT if not exists in LS
      const loadedGlobalSettings = parsed.globalProductionSettings || DEFAULT_PRODUCTION_SETTINGS;

      const finalState: AppState = {
          projects: sanitizedProjects,
          knowledgeBase: loadedKnowledgeBase,
          companyInfo: parsed.companyInfo || INITIAL_COMPANY_INFO,
          globalProductionSettings: loadedGlobalSettings,
          currentProjectId: null,
          currentRoomId: null,
          viewMode: 'projects'
      };

      isDataLoadedRef.current = true;
      return finalState;

    } catch (error) {
      console.error("CRITICAL: Failed to load state from LocalStorage", error);
      return INITIAL_STATE;
    }
  });

  const [projectTab, setProjectTab] = useState<'rooms' | 'progress' | 'finance'>('rooms');

  useEffect(() => {
      if (!isDataLoadedRef.current) return;
      setState(prev => {
          let hasChanges = false;
          const newProjects = prev.projects.map(p => {
              const newRooms = p.rooms.map(r => {
                  const seenIds = new Set<string>();
                  let roomChanged = false;
                  const newItems = r.items.map((item, idx) => {
                      if (!item.id || seenIds.has(item.id) || !item.id.includes('-')) {
                          roomChanged = true;
                          const newId = generateId(`fixed-${idx}`);
                          seenIds.add(newId);
                          return { ...item, id: newId };
                      }
                      seenIds.add(item.id);
                      return item;
                  });

                  if (roomChanged) {
                      hasChanges = true;
                      return { ...r, items: newItems };
                  }
                  return r;
              });

              if (hasChanges) return { ...p, rooms: newRooms };
              return p;
          });

          if (hasChanges) {
              return { ...prev, projects: newProjects };
          }
          return prev;
      });
  }, []);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<RoomType>(RoomType.LIVING_ROOM);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (isDataLoadedRef.current) {
        try {
            localStorage.setItem('smartInteriorState', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
        }
    }
  }, [state]);

  const handleExportData = () => {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smart_interior_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = event.target?.result as string;
              const parsed = JSON.parse(json);
              
              if (window.confirm("Thao tác này sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại. Bạn có chắc chắn không?")) {
                  let importedProjects: Project[] = [];

                  if (Array.isArray(parsed.projects)) {
                      importedProjects = parsed.projects;
                  } else if (Array.isArray(parsed.rooms)) {
                      importedProjects = [{
                          id: generateId('imp-legacy'),
                          name: 'Dự án Import (Cũ)',
                          createdAt: Date.now(),
                          rooms: parsed.rooms,
                          totalCost: 0, 
                          stages: [],
                          productionSettings: DEFAULT_PRODUCTION_SETTINGS,
                          financials: DEFAULT_FINANCIALS
                      }];
                  } else {
                       throw new Error("File không đúng định dạng.");
                  }

                  importedProjects = importedProjects.map(p => {
                      const stages = (p.stages && p.stages.length > 0) ? p.stages : DEFAULT_STAGES_LIST.map((name, idx) => ({
                          id: generateId(`stage-imp-${idx}`),
                          name,
                          status: 'pending' as StageStatus
                      }));
                      
                      return {
                          ...p,
                          stages,
                          productionSettings: { ...DEFAULT_PRODUCTION_SETTINGS, ...(p.productionSettings || {}) },
                          financials: p.financials || DEFAULT_FINANCIALS
                      };
                  });
                  
                  let newKnowledgeBase = Array.isArray(parsed.knowledgeBase) ? parsed.knowledgeBase : [];
                  if (newKnowledgeBase.length === 0) {
                      newKnowledgeBase = SYSTEM_DEFAULT_KNOWLEDGE;
                  }

                  const newState: AppState = {
                      projects: importedProjects,
                      knowledgeBase: newKnowledgeBase,
                      companyInfo: { ...INITIAL_COMPANY_INFO, ...(parsed.companyInfo || {}) },
                      // Ensure global settings are imported or default
                      globalProductionSettings: parsed.globalProductionSettings || DEFAULT_PRODUCTION_SETTINGS,
                      currentProjectId: null,
                      currentRoomId: null,
                      viewMode: 'projects'
                  };

                  setState(newState);
                  isDataLoadedRef.current = true;
                  alert("Khôi phục dữ liệu thành công!");
              }
          } catch (err) {
              console.error(err);
              alert("Lỗi khi đọc file backup: " + (err as any).message);
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const activeProject = useMemo(() => 
    state.projects.find(p => p.id === state.currentProjectId), 
  [state.projects, state.currentProjectId]);

  const activeRoom = useMemo(() => 
    activeProject?.rooms.find(r => r.id === state.currentRoomId),
  [activeProject, state.currentRoomId]);

  const chartData = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.rooms
      .filter(r => r.totalCost > 0)
      .map(r => ({ name: r.name, value: r.totalCost }));
  }, [activeProject]);

  const addProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
        id: generateId('proj'),
        name: newProjectName,
        createdAt: Date.now(),
        rooms: [],
        stages: DEFAULT_STAGES_LIST.map((name, idx) => ({
            id: generateId(`stage-${idx}`),
            name,
            status: 'pending' as StageStatus
        })),
        totalCost: 0,
        // USE GLOBAL SETTINGS as default for new project
        productionSettings: { ...state.globalProductionSettings },
        financials: DEFAULT_FINANCIALS
    };
    setState(prev => ({
        ...prev,
        projects: [...prev.projects, newProject],
        currentProjectId: newProject.id, 
        viewMode: 'project_detail'
    }));
    setNewProjectName('');
    setIsProjectModalOpen(false);
  };

  const updateProject = (updatedProject: Project) => {
      setState(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
      }));
  };
  
  const updateGlobalProductionSettings = (settings: ProductionSettings) => {
      setState(prev => ({
          ...prev,
          globalProductionSettings: settings
      }));
  };

  const deleteProject = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm('CẢNH BÁO: Xóa dự án này sẽ xóa toàn bộ phòng và báo giá bên trong. Bạn có chắc chắn không?')) {
        setState(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== id),
            currentProjectId: prev.currentProjectId === id ? null : prev.currentProjectId,
            viewMode: prev.currentProjectId === id ? 'projects' : prev.viewMode
        }));
    }
  };

  const addRoom = () => {
    if (!newRoomName.trim() || !state.currentProjectId) return;
    
    const newRoom: Room = {
      id: generateId('room'),
      name: newRoomName,
      type: newRoomType,
      images: [],
      status: 'empty',
      items: [],
      totalCost: 0,
    };

    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
          if (p.id === prev.currentProjectId) {
              return {
                  ...p,
                  rooms: [...p.rooms, newRoom]
              };
          }
          return p;
      }),
      currentRoomId: newRoom.id,
      viewMode: 'room_detail' 
    }));

    setNewRoomName('');
    setIsRoomModalOpen(false);
  };

  const updateRoom = (updatedRoom: Room) => {
    setState(prev => {
        const newProjects = prev.projects.map(p => {
            if (p.id === prev.currentProjectId) {
                const newRooms = p.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
                const newTotalCost = newRooms.reduce((sum, r) => sum + r.totalCost, 0);
                return { ...p, rooms: newRooms, totalCost: newTotalCost };
            }
            return p;
        });
        return { ...prev, projects: newProjects };
    });
  };

  const updateProjectStages = (stageId: string) => {
      setState(prev => {
          const newProjects = prev.projects.map(p => {
              if (p.id === prev.currentProjectId) {
                  const newStages = p.stages.map(s => {
                      if (s.id === stageId) {
                          let nextStatus: StageStatus = 'pending';
                          if (s.status === 'pending') nextStatus = 'in_progress';
                          else if (s.status === 'in_progress') nextStatus = 'completed';
                          
                          return {
                              ...s,
                              status: nextStatus,
                              updatedAt: Date.now()
                          };
                      }
                      return s;
                  });
                  return { ...p, stages: newStages };
              }
              return p;
          });
          return { ...prev, projects: newProjects };
      });
  };

  const deleteRoom = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm('Bạn có chắc muốn xóa phòng này?')) {
        setState(prev => {
            const newProjects = prev.projects.map(p => {
                if (p.id === prev.currentProjectId) {
                    const newRooms = p.rooms.filter(r => r.id !== roomId);
                    const newTotalCost = newRooms.reduce((sum, r) => sum + r.totalCost, 0);
                    return { ...p, rooms: newRooms, totalCost: newTotalCost };
                }
                return p;
            });
            return { 
                ...prev, 
                projects: newProjects,
                currentRoomId: prev.currentRoomId === roomId ? null : prev.currentRoomId,
                viewMode: prev.currentRoomId === roomId ? 'project_detail' : prev.viewMode
            };
        });
    }
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    setState(prev => ({ ...prev, companyInfo: info }));
  };

  const updateKnowledgeBase = (items: KnowledgeItem[]) => {
      setState(prev => ({ ...prev, knowledgeBase: items }));
  };

  const resetAllData = () => {
    if (window.confirm("CẢNH BÁO: Xóa toàn bộ dữ liệu ứng dụng. Bạn có chắc chắn không?")) {
       setState(INITIAL_STATE);
       localStorage.removeItem('smartInteriorState');
       isDataLoadedRef.current = true;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const goHome = () => setState(prev => ({ ...prev, currentProjectId: null, currentRoomId: null, viewMode: 'projects' }));
  const goToProject = (id: string) => {
      setProjectTab('rooms'); 
      setState(prev => ({ ...prev, currentProjectId: id, currentRoomId: null, viewMode: 'project_detail' }));
  };

  const renderBreadcrumbs = () => {
      return (
          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-100 w-fit">
              <button onClick={goHome} className="hover:text-emerald-600 flex items-center transition-colors">
                  <HomeIcon className="w-4 h-4 mr-1.5" />
                  Dự án
              </button>
              {activeProject && (
                  <>
                    <span className="text-slate-300">/</span>
                    <button onClick={() => goToProject(activeProject.id)} className={`hover:text-emerald-600 font-medium transition-colors ${!activeRoom ? 'text-emerald-600' : ''}`}>
                        {activeProject.name}
                    </button>
                  </>
              )}
              {activeRoom && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-emerald-600 font-medium">{activeRoom.name}</span>
                  </>
              )}
          </div>
      );
  };

  const renderProjectList = () => (
      <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
              <div>
                 <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Danh sách Dự án</h2>
                 <p className="text-slate-500 mt-1">Quản lý tất cả các báo giá nội thất của bạn tại đây</p>
              </div>
              <button 
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center px-5 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg btn-3d"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Tạo Dự án mới
              </button>
          </div>

          {state.projects.length === 0 ? (
             <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-200 transition-colors animate-float">
                <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CartoonLamp className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có dự án nào</h3>
                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Hãy bắt đầu bằng cách tạo dự án đầu tiên để quản lý báo giá và tiến độ thi công.</p>
                <button 
                    onClick={() => setIsProjectModalOpen(true)}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl btn-3d font-medium"
                >
                    Tạo ngay
                </button>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {state.projects.map(project => (
                     <div 
                        key={project.id}
                        onClick={() => goToProject(project.id)}
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 transform hover:-translate-y-2 group relative overflow-hidden"
                     >
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 group-hover:bg-emerald-100"></div>
                         
                         <div className="flex items-start justify-between mb-6 relative z-10">
                             <div className="bg-emerald-50 p-3 rounded-2xl">
                                <CartoonDesk className="w-12 h-12" />
                             </div>
                             <button 
                                type="button"
                                onClick={(e) => deleteProject(e, project.id)}
                                className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors z-20"
                             >
                                 <TrashIcon className="w-5 h-5" />
                             </button>
                         </div>
                         <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors truncate">{project.name}</h3>
                         <div className="text-sm text-slate-500 mb-6 flex items-center">
                             <ClockIcon className="w-4 h-4 mr-1.5" />
                             {new Date(project.createdAt).toLocaleDateString('vi-VN')}
                         </div>
                         
                         <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                             <div className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{project.rooms.length} phòng</div>
                             <div className="font-extrabold text-lg text-emerald-600">{project.totalCost > 0 ? formatCurrency(project.totalCost) : '--'}</div>
                         </div>
                     </div>
                 ))}
             </div>
          )}
      </div>
  );

  const renderProjectDetail = () => {
    if (!activeProject) return null;

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="grid md:grid-cols-3 gap-6">
             <div className="md:col-span-1 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-xl flex flex-col justify-center relative overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black opacity-5 rounded-full -ml-10 -mb-10"></div>
                
                <h2 className="text-emerald-100 text-sm font-medium mb-2 uppercase tracking-wide">Tổng dự toán</h2>
                <div className="text-4xl font-extrabold mb-6 tracking-tight drop-shadow-md">{formatCurrency(activeProject.totalCost)}</div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg shadow-sm">
                        <FolderIcon className="w-3.5 h-3.5 mr-1.5"/> {activeProject.rooms.length} phòng
                    </div>
                </div>
             </div>
             {activeProject.totalCost > 0 ? (
                <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-64 flex flex-col hover:shadow-md transition-shadow">
                    <h3 className="text-slate-800 font-bold mb-4 flex items-center">
                        <span className="w-3 h-6 bg-emerald-500 rounded-sm mr-3 shadow-sm"></span>
                        Phân bổ ngân sách
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)} 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend iconType="circle" />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
             ) : (
                <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-64 flex flex-col items-center justify-center text-slate-400 border-dashed">
                    <div className="bg-slate-50 p-4 rounded-full mb-3 animate-pulse">
                        <CalculatorIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <span className="italic font-medium">Chưa có dữ liệu chi phí</span>
                </div>
             )}
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto gap-8">
            <button 
                onClick={() => setProjectTab('rooms')}
                className={`pb-3 font-bold text-sm border-b-4 transition-all flex items-center whitespace-nowrap px-1 rounded-t-lg ${
                    projectTab === 'rooms' 
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <FolderIcon className="w-5 h-5 mr-2" />
                Danh sách phòng
            </button>
            <button 
                onClick={() => setProjectTab('progress')}
                className={`pb-3 font-bold text-sm border-b-4 transition-all flex items-center whitespace-nowrap px-1 rounded-t-lg ${
                    projectTab === 'progress' 
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <ClockIcon className="w-5 h-5 mr-2" />
                Tiến độ thi công
            </button>
            <button 
                onClick={() => setProjectTab('finance')}
                className={`pb-3 font-bold text-sm border-b-4 transition-all flex items-center whitespace-nowrap px-1 rounded-t-lg ${
                    projectTab === 'finance' 
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
                <CalculatorIcon className="w-5 h-5 mr-2" />
                Tài chính & Sản xuất
            </button>
        </div>

        {projectTab === 'rooms' ? (
           <div className="animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {activeProject.rooms.map((room) => (
                     <div 
                        key={room.id} 
                        onClick={() => setState(prev => ({ ...prev, currentRoomId: room.id, viewMode: 'room_detail' }))}
                        className="bg-white rounded-3xl shadow-sm border-b-4 border-r-2 border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer group flex flex-col overflow-hidden hover:-translate-y-1 duration-300"
                     >
                        <div className="h-48 bg-slate-50 overflow-hidden relative flex items-center justify-center">
                           {room.images.length > 0 ? (
                             <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 group-hover:scale-110 transition-transform duration-500">
                                {getRoomIcon(room.type)}
                             </div>
                           )}
                           
                           {/* Overlay Gradient */}
                           {room.images.length > 0 && (
                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                           )}

                           <div className="absolute top-3 right-3 z-20">
                              <button 
                                type="button"
                                onClick={(e) => deleteRoom(e, room.id)}
                                className="p-2 bg-white/40 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors shadow-sm"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                           </div>
                           
                           <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                               <h3 className={`font-bold text-xl mb-1 drop-shadow-md ${room.images.length === 0 ? 'text-slate-800' : 'text-white'}`}>{room.name}</h3>
                               <p className={`text-xs font-semibold uppercase tracking-wide opacity-90 ${room.images.length === 0 ? 'text-emerald-600' : 'text-emerald-200'}`}>{room.type}</p>
                           </div>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col bg-white">
                           <div className="flex justify-between items-center mb-4">
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${
                                    room.status === 'done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    room.status === 'analyzing' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    room.status === 'review' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                    {room.status === 'done' ? 'Đã báo giá' : 
                                     room.status === 'analyzing' ? 'Đang xử lý' : 
                                     room.status === 'review' ? 'Đang xem xét' : 'Mới tạo'}
                                </span>
                           </div>
                           
                           <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100">
                              <div className="text-sm text-slate-500 font-medium">{room.items.length} hạng mục</div>
                              <div className="font-extrabold text-emerald-600 text-lg">{room.totalCost > 0 ? formatCurrency(room.totalCost) : '--'}</div>
                           </div>
                        </div>
                     </div>
                   ))}
                   
                   <div 
                      onClick={() => setIsRoomModalOpen(true)}
                      className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer flex flex-col items-center justify-center h-full min-h-[300px] group animate-float"
                   >
                      <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <PlusIcon className="w-8 h-8 text-emerald-500" />
                      </div>
                      <span className="font-bold text-slate-600 group-hover:text-emerald-700 text-lg">Thêm phòng mới</span>
                      <span className="text-xs text-slate-400 mt-1 font-medium">Sofa, Bếp, Ngủ...</span>
                   </div>
                 </div>
           </div>
        ) : projectTab === 'progress' ? (
            <div className="animate-fade-in">
                <ProjectProgress 
                    stages={activeProject.stages} 
                    onUpdateStage={updateProjectStages}
                    totalCost={activeProject.totalCost}
                />
            </div>
        ) : (
            <div className="animate-fade-in">
                <ResourceAnalysis 
                    project={activeProject} 
                    onUpdateProject={updateProject}
                    onUpdateGlobalSettings={updateGlobalProductionSettings}
                />
            </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (state.viewMode) {
        case 'settings':
            return (
                <CompanySettings 
                    info={state.companyInfo} 
                    globalSettings={state.globalProductionSettings}
                    onUpdate={updateCompanyInfo}
                    onUpdateGlobalSettings={updateGlobalProductionSettings}
                    onClose={goHome}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                />
            );
        case 'knowledge':
            return (
                <KnowledgeBase 
                    items={state.knowledgeBase}
                    onUpdate={updateKnowledgeBase}
                    onClose={goHome}
                />
            );
        case 'summary':
            if (!activeProject) return <div>Chọn dự án trước</div>;
            return (
                <SummaryExport 
                    rooms={activeProject.rooms}
                    companyInfo={state.companyInfo}
                    projectName={activeProject.name}
                    onNavigateToFinance={() => {
                        setProjectTab('finance');
                        setState(prev => ({ ...prev, viewMode: 'project_detail' }));
                    }}
                />
            );
        case 'room_detail':
            if (!activeRoom) return <div>Không tìm thấy phòng</div>;
            return (
                <RoomDetail 
                    room={activeRoom} 
                    knowledgeBase={state.knowledgeBase}
                    onUpdateRoom={updateRoom} 
                    onUpdateKnowledgeBase={updateKnowledgeBase}
                    onBack={() => setState(prev => ({ ...prev, viewMode: 'project_detail' }))}
                />
            );
        case 'project_detail':
            return renderProjectDetail();
        case 'projects':
        default:
            return renderProjectList();
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={goHome}
          >
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform btn-3d">
              <CartoonLamp className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none group-hover:text-emerald-600 transition-colors">SmartInterior</h1>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">AI Quotation</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
             <button
               onClick={resetAllData}
               className="text-slate-400 hover:text-red-600 px-3 py-2 text-xs font-bold transition-colors uppercase tracking-wide hover:bg-red-50 rounded-lg"
             >
                Reset
             </button>

             {activeProject && (
                 <button 
                    onClick={() => setState(prev => ({ ...prev, viewMode: 'summary', currentRoomId: null }))}
                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all text-sm font-bold ${
                        state.viewMode === 'summary' 
                        ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                        : 'text-slate-600 hover:bg-slate-100 btn-3d bg-white border border-slate-200'
                    }`}
                    >
                    <DocumentIcon className="w-5 h-5 mr-2" />
                    <span className="hidden md:inline">Xuất báo giá</span>
                 </button>
             )}

             <button 
                onClick={() => setState(prev => ({ ...prev, viewMode: 'knowledge' }))}
                className={`flex items-center px-4 py-2.5 rounded-xl transition-all text-sm font-bold ${
                  state.viewMode === 'knowledge' 
                  ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                  : 'text-slate-600 hover:bg-slate-100 btn-3d bg-white border border-slate-200'
                }`}
             >
               <DatabaseIcon className="w-5 h-5 mr-2" />
               <span className="hidden md:inline">Thư viện</span>
             </button>

             <button 
               onClick={() => setState(prev => ({ ...prev, viewMode: 'settings' }))}
               className={`flex items-center px-4 py-2.5 rounded-xl transition-all text-sm font-bold ${
                 state.viewMode === 'settings' 
                 ? 'bg-emerald-100 text-emerald-700 shadow-inner' 
                 : 'text-slate-600 hover:bg-slate-100 btn-3d bg-white border border-slate-200'
               }`}
             >
               <SettingsIcon className="w-5 h-5 mr-2" />
               <span className="hidden md:inline">Cấu hình</span>
             </button>
             
             <div className="w-px h-6 bg-slate-300 mx-2 hidden md:block"></div>

             {state.viewMode === 'projects' ? (
                <button 
                    onClick={() => setIsProjectModalOpen(true)}
                    className="flex items-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg btn-3d font-bold text-sm ml-2"
                >
                    <PlusIcon className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline">Dự án mới</span>
                </button>
             ) : (
                 <button 
                   onClick={() => activeProject && setIsRoomModalOpen(true)}
                   disabled={!activeProject}
                   className={`flex items-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg btn-3d font-bold text-sm ml-2 ${!activeProject ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   <PlusIcon className="w-5 h-5 md:mr-2" />
                   <span className="hidden md:inline">Thêm Phòng</span>
                 </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 pb-20">
        {renderBreadcrumbs()}
        {renderContent()}
      </main>

      {/* MODALS */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop border-4 border-slate-100 transform transition-all">
            <div className="p-8">
              <div className="flex justify-center mb-6">
                  <div className="bg-emerald-100 p-4 rounded-full animate-bounce">
                    <CartoonDesk className="w-16 h-16" />
                  </div>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-6 text-center">Khởi tạo Dự Án</h2>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Tên dự án / Khách hàng</label>
                <input 
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all shadow-sm font-semibold text-lg"
                  placeholder="VD: Biệt thự Mr. Hùng - Ecopark"
                  autoFocus
                />
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={addProject}
                  disabled={!newProjectName.trim()}
                  className="px-8 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-bold shadow-lg btn-3d disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tạo dự án
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRoomModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop border-4 border-slate-100">
            <div className="p-8">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-2 text-center">Thêm phòng mới</h2>
              <p className="text-sm text-slate-500 mb-6 text-center font-medium">Dự án: <span className="font-bold text-emerald-600">{activeProject?.name}</span></p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Tên phòng</label>
                  <input 
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all shadow-sm font-semibold"
                    placeholder="VD: Phòng ngủ Master"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Loại không gian</label>
                  <div className="relative">
                      <select 
                        value={newRoomType}
                        onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none bg-white appearance-none shadow-sm font-semibold"
                      >
                        {Object.values(RoomType).map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                      </div>
                  </div>
                </div>
                
                <div className="flex justify-center py-4">
                    {getRoomIcon(newRoomType)}
                </div>

              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-6 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={addRoom}
                  disabled={!newRoomName.trim()}
                  className="px-8 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-bold shadow-lg btn-3d disabled:opacity-50"
                >
                  Tạo phòng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
