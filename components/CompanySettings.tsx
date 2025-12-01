
import React, { useRef, useState } from 'react';
import { CompanyInfo, ProductionSettings } from '../types';
import { PhotoIcon, CogIcon, WrenchIcon, CalculatorIcon } from './Icons';

// Icons for Cloud features
const CloudArrowUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);

const CloudArrowDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
  </svg>
);

interface CompanySettingsProps {
  info: CompanyInfo;
  globalSettings: ProductionSettings;
  onUpdate: (info: CompanyInfo) => void;
  onUpdateGlobalSettings: (settings: ProductionSettings) => void;
  onClose: () => void;
  onExportData?: () => void;
  onImportData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ info, globalSettings, onUpdate, onUpdateGlobalSettings, onClose, onExportData, onImportData }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'production'>('info');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    onUpdate({ ...info, [field]: value });
  };
  
  const handleSettingChange = (field: keyof ProductionSettings, value: number) => {
      onUpdateGlobalSettings({ ...globalSettings, [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onUpdate({ ...info, logo: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-4xl mx-auto p-8 animate-fade-in min-h-[600px] flex flex-col">
      <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'info' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              Thông tin Công ty & Backup
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center ${activeTab === 'production' ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
              <CogIcon className="w-4 h-4 mr-2" />
              Định mức Sản xuất (Mặc định)
          </button>
      </div>

      {activeTab === 'info' ? (
      <>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Thông tin Công ty / Template</h2>
        <p className="text-slate-500 mb-8 bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
            Thông tin dưới đây sẽ được sử dụng làm tiêu đề (Header) cho các file PDF và Excel khi xuất báo giá.
        </p>

        <div className="space-y-6 flex-1">
            {/* Logo Upload */}
            <div className="flex items-start space-x-8">
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-36 h-36 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all overflow-hidden relative group"
            >
                {info.logo ? (
                <img src={info.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                <>
                    <PhotoIcon className="w-10 h-10 text-slate-300 mb-2 group-hover:text-emerald-500" />
                    <span className="text-xs text-slate-400 group-hover:text-emerald-600 font-medium">Tải Logo lên</span>
                </>
                )}
                <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleLogoUpload}
                />
            </div>
            <div className="flex-1 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên công ty / Đơn vị</label>
                    <input 
                    type="text" 
                    value={info.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="VD: Công Ty Nội Thất ABC"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-300"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Website (Tùy chọn)</label>
                    <input 
                        type="text" 
                        value={info.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="VD: www.noithatabc.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-300"
                    />
                </div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input 
                type="text" 
                value={info.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="VD: 0912 345 678"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-300"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input 
                type="email" 
                value={info.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="VD: contact@noithatabc.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-300"
                />
            </div>
            </div>

            <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ</label>
            <input 
                type="text" 
                value={info.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="VD: 123 Đường Nguyễn Huệ, Quận 1, TP.HCM"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-slate-300"
            />
            </div>
        </div>
        
        {/* Backup & Restore Section */}
        <div className="mt-10 border-t border-slate-100 pt-8">
            <h3 className="font-bold text-slate-800 mb-5 flex items-center">
                Sao lưu & Khôi phục dữ liệu
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-normal">An toàn dữ liệu</span>
            </h3>
            <div className="flex gap-4">
                <button
                    onClick={onExportData}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl hover:bg-emerald-100 hover:shadow-sm transition-all font-medium"
                >
                    <CloudArrowDownIcon className="w-5 h-5 mr-2" />
                    Tải dữ liệu về (Backup)
                </button>
                
                <button
                    onClick={() => backupInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all font-medium"
                >
                    <CloudArrowUpIcon className="w-5 h-5 mr-2" />
                    Khôi phục từ file (Restore)
                </button>
                <input 
                    type="file"
                    accept=".json"
                    className="hidden"
                    ref={backupInputRef}
                    onChange={onImportData}
                />
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center italic">
                * Khuyến nghị: Tải file backup về máy tính hàng tuần để đảm bảo an toàn dữ liệu.
            </p>
        </div>
      </>
      ) : (
          // --- PRODUCTION SETTINGS TAB ---
          <>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Cấu hình Định mức Mặc định</h2>
            <p className="text-slate-500 mb-8 bg-blue-50 p-3 rounded-lg text-sm border border-blue-100 text-blue-800">
                Các thông số dưới đây sẽ được áp dụng cho tất cả <b>Dự án Mới</b> tạo sau này. Hãy điều chỉnh theo thực tế xưởng của bạn để việc tính giá vốn được chính xác ngay từ đầu.
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 flex-1 overflow-y-auto pr-2">
                 {/* Material Settings */}
                 <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 flex items-center border-b pb-2">
                        <CogIcon className="w-5 h-5 mr-2 text-emerald-500" />
                        Giá Vật Tư & Hệ Số
                    </h4>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Giá ván MDF Melamine (17mm) / Tấm</label>
                        <input type="number" className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:bg-white transition-all text-right font-bold text-slate-800"
                            value={globalSettings.sheetPrice} onChange={(e) => handleSettingChange('sheetPrice', Number(e.target.value))} />
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Giá Gỗ Tự nhiên (m3)</label>
                        <input type="number" className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:bg-white transition-all text-right font-bold text-slate-800"
                            value={globalSettings.naturalWoodPricePerM3} onChange={(e) => handleSettingChange('naturalWoodPricePerM3', Number(e.target.value))} />
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-indigo-700 mb-1">Giá Nẹp chỉ dán cạnh (md)</label>
                        <input type="number" className="w-full px-4 py-2 border border-indigo-200 rounded-xl bg-indigo-50/50 focus:bg-white transition-all text-right font-bold text-indigo-700"
                            value={globalSettings.edgeBandingPricePerM} onChange={(e) => handleSettingChange('edgeBandingPricePerM', Number(e.target.value))} />
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-orange-700 mb-1">Chi phí Sơn / Gia công bề mặt (m2)</label>
                        <input type="number" className="w-full px-4 py-2 border border-orange-200 rounded-xl bg-orange-50/50 focus:bg-white transition-all text-right font-bold text-orange-700"
                            value={globalSettings.paintCostPerM2} onChange={(e) => handleSettingChange('paintCostPerM2', Number(e.target.value))} />
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Hệ số hao hụt cắt ván (VD: 1.2 = 20%)</label>
                        <input type="number" step="0.05" className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:bg-white transition-all text-right font-medium"
                            value={globalSettings.wasteFactor} onChange={(e) => handleSettingChange('wasteFactor', Number(e.target.value))} />
                    </div>
                 </div>

                 {/* Labor Settings */}
                 <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 flex items-center border-b pb-2">
                        <WrenchIcon className="w-5 h-5 mr-2 text-emerald-500" />
                        Nhân công & Xưởng
                    </h4>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Lương thợ trung bình / ngày</label>
                        <input type="number" className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:bg-white transition-all text-right font-bold text-slate-800"
                            value={globalSettings.workerDailyWage} onChange={(e) => handleSettingChange('workerDailyWage', Number(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Chi phí quản lý xưởng / tấm (Điện, khấu hao...)</label>
                        <input type="number" className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:bg-white transition-all text-right font-bold text-slate-800"
                            value={globalSettings.overheadPerSheet} onChange={(e) => handleSettingChange('overheadPerSheet', Number(e.target.value))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Công Sản xuất / Tấm</label>
                            <input type="number" step="0.05" className="w-full px-3 py-2 border rounded-lg text-right font-medium"
                                value={globalSettings.productionDaysPerSheet} onChange={(e) => handleSettingChange('productionDaysPerSheet', Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Công Lắp đặt / Tấm</label>
                            <input type="number" step="0.05" className="w-full px-3 py-2 border rounded-lg text-right font-medium"
                                value={globalSettings.installationDaysPerSheet} onChange={(e) => handleSettingChange('installationDaysPerSheet', Number(e.target.value))} />
                        </div>
                    </div>
                 </div>
            </div>
          </>
      )}

      <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
        <button 
          onClick={onClose}
          className="px-8 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-bold shadow-lg shadow-slate-200 transform hover:-translate-y-0.5"
        >
          Lưu Cài Đặt
        </button>
      </div>
    </div>
  );
};

export default CompanySettings;
