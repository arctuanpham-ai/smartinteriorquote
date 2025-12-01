import React, { useMemo, useState } from 'react';
import { Project, ProjectFinancials, ProductionSettings, Room } from '../types';
import { CalculatorIcon, BanknotesIcon, DocumentIcon, TruckIcon, CogIcon, WrenchIcon, ArrowUpTrayIcon } from './Icons';

interface ResourceAnalysisProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onUpdateGlobalSettings?: (settings: ProductionSettings) => void;
}

const ResourceAnalysis: React.FC<ResourceAnalysisProps> = ({ project, onUpdateProject, onUpdateGlobalSettings }) => {
  const [showSettings, setShowSettings] = useState(false);

  // Fallback default settings
  const defaultSettings: ProductionSettings = {
      sheetPrice: 850000,
      sheetWidth: 1.22,
      sheetHeight: 2.44,
      wasteFactor: 1.25,
      materialCoefficient: 4.2, 
      edgeBandingPricePerM: 3500,
      edgePerSheetRatio: 28,
      naturalWoodPricePerM3: 18000000,
      naturalWoodWasteFactor: 1.5,
      workerDailyWage: 750000,
      productionDaysPerSheet: 0.35, 
      installationDaysPerSheet: 0.25,
      accessoryRatio: 15,
      consumableRatio: 8,
      overheadPerSheet: 150000,
      paintCostPerM2: 350000
  };

  // Merge project settings with defaults to ensure all fields exist and are typed correctly
  const settings: ProductionSettings = { ...defaultSettings, ...(project.productionSettings || {}) };

  const financials = project.financials || {
      transportCost: 0,
      installationCost: 0,
      designFee: 0,
      surveyFee: 0,
      commission: 0,
      otherCosts: 0
  };

  const updateSettings = (field: keyof ProductionSettings, value: number) => {
      onUpdateProject({
          ...project,
          productionSettings: { ...settings, [field]: value }
      });
  };

  const updateFinancials = (field: keyof ProjectFinancials, value: number) => {
      onUpdateProject({
          ...project,
          financials: { ...financials, [field]: value }
      });
  };

  const handleSaveAsDefault = () => {
      if (window.confirm("Bạn có muốn lưu các thông số hiện tại làm Mặc định cho toàn hệ thống không?\nCác dự án mới tạo sau này sẽ sử dụng bộ thông số này.")) {
          if (onUpdateGlobalSettings) {
              onUpdateGlobalSettings(settings);
              alert("Đã lưu thành công!");
          }
      }
  };

  const allItems = useMemo(() => {
    return project.rooms.flatMap(r => r.items);
  }, [project.rooms]);

  const totalRevenue = allItems.reduce((sum, i) => sum + i.totalPrice, 0);

  // --- 1. DETAILED MATERIAL BREAKDOWN (Separated Logic) ---
  const materialBreakdown = useMemo(() => {
    // Industrial Wood Tracking
    const industrialMaterials: Record<string, { sheets: number; totalArea: number; estimatedCost: number }> = {};
    // Natural Wood Tracking
    const naturalMaterials: Record<string, { m3: number; totalArea: number; estimatedCost: number }> = {};
    
    const accessories: { name: string; quantity: number; estimatedCost: number }[] = [];
    
    let totalPaintedArea = 0; // Surface requiring paint 
    let totalIndustrialSheets = 0;
    
    // Track Outsourced Cost separately
    let outsourcedCost = 0;

    allItems.forEach(item => {
        if (item.source === 'outsourced') {
            const cost = (item.costPrice && item.costPrice > 0) ? item.costPrice : (item.unitPrice * 0.7); // Fallback logic
            outsourcedCost += cost * item.quantity;
            return;
        }

        if (!item.itemName) return;
        
        const lowerName = item.itemName.toLowerCase();
        const lowerUnit = item.unit.toLowerCase();
        const lowerMat = item.material ? item.material.toLowerCase() : '';

        const isAccessory = lowerName.includes('bản lề') || 
                            lowerName.includes('ray') || 
                            lowerName.includes('tay nắm') || 
                            lowerName.includes('phụ kiện') ||
                            lowerUnit.includes('bộ') || 
                            lowerUnit.includes('chiếc') || 
                            lowerUnit.includes('cái');

        if (isAccessory && item.unitPrice < 2000000) { 
            accessories.push({
                name: item.itemName,
                quantity: item.quantity,
                estimatedCost: item.costPrice ? item.costPrice * item.quantity : item.totalPrice * 0.7 
            });
            return; 
        }

        let area = 0; 
        if (lowerUnit.includes('m2')) {
            area = item.quantity;
        } else if (lowerUnit.includes('md')) {
            area = item.quantity * 0.6;
        } else {
             if (lowerName.includes('giường')) area = 3.5;
             else if (lowerName.includes('tab')) area = 0.5;
             else if (lowerName.includes('bàn')) area = 1.5;
             else area = item.quantity * 1.5; 
        }

        const isNaturalWood = lowerMat.includes('sồi') || lowerMat.includes('óc chó') || lowerMat.includes('gõ') || lowerMat.includes('tự nhiên') || lowerMat.includes('xoan');
        const isPaintFinish = lowerMat.includes('sơn') || lowerMat.includes('acrylic') || lowerMat.includes('inchem') || lowerMat.includes('bệt') || isNaturalWood;

        if (isPaintFinish) {
            totalPaintedArea += area * 1.5; 
        }

        if (isNaturalWood) {
             const matName = item.material || 'Gỗ Tự Nhiên';
             if (!naturalMaterials[matName]) naturalMaterials[matName] = { m3: 0, totalArea: 0, estimatedCost: 0 };
             
             const thickness = 0.02; 
             const structureCoeff = 2.5;
             // Ensure operands are numbers
             const wasteFactor = settings.naturalWoodWasteFactor || 1.5;
             const volume = area * structureCoeff * thickness * wasteFactor;
             
             naturalMaterials[matName].totalArea += area;
             naturalMaterials[matName].m3 += volume;
             const pricePerM3 = settings.naturalWoodPricePerM3 || 18000000;
             naturalMaterials[matName].estimatedCost += volume * pricePerM3;

        } else {
             const matName = item.material || 'MDF Melamine';
             if (!industrialMaterials[matName]) industrialMaterials[matName] = { sheets: 0, totalArea: 0, estimatedCost: 0 };

             let itemCoefficient = settings.materialCoefficient || 4.2; 
             if (lowerName.includes('vách') || lowerName.includes('sàn') || lowerName.includes('trần')) itemCoefficient = 1.1;
             else if (lowerName.includes('giường') || lowerName.includes('bàn')) itemCoefficient = 2.0;
             else if (lowerName.includes('kệ')) itemCoefficient = 2.5; 

             const expandedArea = area * itemCoefficient;
             const sheetWidth = Number(settings.sheetWidth) || 1.22;
             const sheetHeight = Number(settings.sheetHeight) || 2.44;
             const sheetArea = sheetWidth * sheetHeight;
             const wasteFactor = settings.wasteFactor || 1.2;
             const sheetsNeeded = (expandedArea * wasteFactor) / sheetArea;

             industrialMaterials[matName].totalArea += area;
             industrialMaterials[matName].sheets += sheetsNeeded;
             const sheetPrice = settings.sheetPrice || 850000;
             industrialMaterials[matName].estimatedCost += sheetsNeeded * sheetPrice;
             
             totalIndustrialSheets += sheetsNeeded;
        }
    });

    const totalIndustrialCost = Object.values(industrialMaterials).reduce((sum, m) => sum + m.estimatedCost, 0);
    const totalNaturalCost = Object.values(naturalMaterials).reduce((sum, m) => sum + m.estimatedCost, 0);
    const totalAccessoryCost = accessories.reduce((sum, a) => sum + a.estimatedCost, 0);
    
    const edgeRatio = settings.edgePerSheetRatio || 28;
    const totalEdgeMeters = Math.ceil(totalIndustrialSheets * edgeRatio);
    const edgePrice = settings.edgeBandingPricePerM || 3500;
    const edgeBandingCost = totalEdgeMeters * edgePrice;

    const producedCostBase = totalIndustrialCost + totalNaturalCost;
    const consumableRatio = settings.consumableRatio || 8;
    const consumableCost = producedCostBase * (consumableRatio / 100);

    const paintCost = settings.paintCostPerM2 || 350000;
    const finishingCost = totalPaintedArea * paintCost;

    return { 
        industrialMaterials, totalIndustrialCost, totalIndustrialSheets,
        naturalMaterials, totalNaturalCost,
        accessories, totalAccessoryCost, 
        edgeBandingCost, totalEdgeMeters,
        consumableCost, 
        finishingCost, totalPaintedArea,
        outsourcedCost
    };
  }, [allItems, settings]);

  const laborEstimation = useMemo(() => {
      const prodDays = settings.productionDaysPerSheet || 0.35;
      const installDays = settings.installationDaysPerSheet || 0.25;

      const indProductionDays = materialBreakdown.totalIndustrialSheets * prodDays;
      const indInstallDays = materialBreakdown.totalIndustrialSheets * installDays;
      
      const totalNaturalArea = Object.values(materialBreakdown.naturalMaterials).reduce((sum, m: any) => sum + m.totalArea, 0);
      const naturalComplexityFactor = 3.5; 
      const sheetWidth = Number(settings.sheetWidth) || 1.22;
      const sheetHeight = Number(settings.sheetHeight) || 2.44;
      const sheetArea = sheetWidth * sheetHeight;
      const matCoeff = settings.materialCoefficient || 4.2;
      const naturalEquivalentSheets = (totalNaturalArea * matCoeff) / sheetArea;
      const natProductionDays = naturalEquivalentSheets * prodDays * naturalComplexityFactor;
      const natInstallDays = naturalEquivalentSheets * installDays * 1.5; 

      const totalManDays = Math.ceil(indProductionDays + indInstallDays + natProductionDays + natInstallDays);
      const wage = settings.workerDailyWage || 750000;
      const totalLaborCost = totalManDays * wage;

      const totalEquivalentSheetsForOverhead = materialBreakdown.totalIndustrialSheets + (naturalEquivalentSheets * 2);
      const overhead = settings.overheadPerSheet || 150000;
      const totalOverheadCost = Math.ceil(totalEquivalentSheetsForOverhead) * overhead;

      return { totalManDays, totalLaborCost, totalOverheadCost };
  }, [materialBreakdown, settings]);

  const finalSummary = useMemo(() => {
      const { transportCost, installationCost, designFee, surveyFee, commission, otherCosts } = financials;
      
      const directProductionCost = materialBreakdown.totalIndustrialCost + 
                                   materialBreakdown.totalNaturalCost +
                                   materialBreakdown.totalAccessoryCost + 
                                   materialBreakdown.edgeBandingCost +
                                   materialBreakdown.consumableCost + 
                                   materialBreakdown.finishingCost + 
                                   materialBreakdown.outsourcedCost + 
                                   laborEstimation.totalLaborCost + 
                                   laborEstimation.totalOverheadCost;

      const projectOverhead = transportCost + installationCost + designFee + surveyFee + commission + otherCosts;
      
      const totalCostBase = directProductionCost + projectOverhead;
      const netProfit = totalRevenue - totalCostBase;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      return { directProductionCost, projectOverhead, totalCostBase, netProfit, profitMargin };
  }, [materialBreakdown, laborEstimation, financials, totalRevenue]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-8 animate-fade-in">
        
        {/* SETTINGS TOGGLE */}
        <div className="flex justify-end gap-3">
            {showSettings && onUpdateGlobalSettings && (
                <button 
                    onClick={handleSaveAsDefault}
                    className="flex items-center text-sm font-bold text-slate-600 bg-white border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                    title="Lưu các thông số hiện tại làm mặc định cho các dự án mới sau này"
                >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                    Lưu làm mặc định hệ thống
                </button>
            )}
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center text-sm font-bold text-emerald-700 bg-white border-2 border-emerald-200 px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-sm btn-3d"
            >
                <CogIcon className="w-4 h-4 mr-2" />
                {showSettings ? 'Ẩn cấu hình định mức' : 'Cấu hình Định mức & Giá vật tư'}
            </button>
        </div>

        {/* CONFIGURATION PANEL */}
        {showSettings && (
            <div className="bg-slate-50 rounded-3xl p-8 border-2 border-slate-200 grid md:grid-cols-2 gap-10 shadow-inner animate-pop">
                <div>
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg border-b-2 border-slate-200 pb-2">
                        <CogIcon className="w-6 h-6 mr-2 text-emerald-500" />
                        Vật tư Gỗ CN & Tự nhiên
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Giá ván (MDF 17mm):</span>
                            <input type="number" className="w-36 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-medium"
                                value={settings.sheetPrice} onChange={(e) => updateSettings('sheetPrice', Number(e.target.value))} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Giá gỗ thịt (m3):</span>
                            <input type="number" className="w-36 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-medium"
                                value={settings.naturalWoodPricePerM3 || 18000000} onChange={(e) => updateSettings('naturalWoodPricePerM3', Number(e.target.value))} />
                        </div>
                         <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-indigo-200 shadow-sm">
                            <span className="text-sm text-indigo-800 font-bold">Giá Nẹp chỉ / md:</span>
                            <input type="number" className="w-36 px-3 py-2 border-2 border-indigo-200 rounded-lg text-right font-bold text-indigo-700 focus:ring-4 focus:ring-indigo-100 outline-none"
                                value={settings.edgeBandingPricePerM || 3500} onChange={(e) => updateSettings('edgeBandingPricePerM', Number(e.target.value))} />
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-200 shadow-sm">
                            <span className="text-sm text-orange-800 font-bold">Chi phí Sơn/Bề mặt (m2):</span>
                            <input type="number" className="w-36 px-3 py-2 border-2 border-orange-200 rounded-lg text-right text-orange-700 font-bold focus:ring-4 focus:ring-orange-100 outline-none"
                                value={settings.paintCostPerM2 || 1200000} onChange={(e) => updateSettings('paintCostPerM2', Number(e.target.value))} />
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center text-lg border-b-2 border-slate-200 pb-2">
                        <WrenchIcon className="w-6 h-6 mr-2 text-emerald-500" />
                        Định mức Xưởng
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Lương thợ / ngày:</span>
                            <input type="number" className="w-36 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-medium"
                                value={settings.workerDailyWage} onChange={(e) => updateSettings('workerDailyWage', Number(e.target.value))} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Phí quản lý xưởng/tấm:</span>
                            <input type="number" className="w-36 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-medium"
                                value={settings.overheadPerSheet || 150000} onChange={(e) => updateSettings('overheadPerSheet', Number(e.target.value))} />
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Công SX/tấm ván:</span>
                            <input type="number" step="0.05" className="w-36 px-3 py-2 border-2 border-slate-300 rounded-lg text-right focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none font-medium"
                                value={settings.productionDaysPerSheet || 0.35} onChange={(e) => updateSettings('productionDaysPerSheet', Number(e.target.value))} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* FINANCIAL SUMMARY - 3D CARDS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
             <h3 className="text-2xl font-extrabold text-slate-800 mb-8 flex items-center">
                <BanknotesIcon className="w-8 h-8 mr-3 text-emerald-500" />
                Tổng hợp Lợi Nhuận (P&L)
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="p-6 bg-indigo-50 rounded-2xl border-b-4 border-indigo-200 shadow-md hover:-translate-y-1 transition-transform">
                    <div className="text-xs text-indigo-800 uppercase font-black tracking-wider mb-2">Doanh thu</div>
                    <div className="text-2xl font-black text-indigo-700">{formatCurrency(totalRevenue)}</div>
                </div>
                 <div className="p-6 bg-orange-50 rounded-2xl border-b-4 border-orange-200 shadow-md hover:-translate-y-1 transition-transform">
                    <div className="text-xs text-orange-800 uppercase font-black tracking-wider mb-2">Tổng chi phí</div>
                    <div className="text-2xl font-black text-orange-700">{formatCurrency(finalSummary.totalCostBase)}</div>
                </div>
                 <div className="p-6 bg-emerald-50 rounded-2xl border-b-4 border-emerald-200 shadow-md hover:-translate-y-1 transition-transform">
                    <div className="text-xs text-emerald-800 uppercase font-black tracking-wider mb-2">Lợi nhuận ròng</div>
                    <div className="text-2xl font-black text-emerald-600">{formatCurrency(finalSummary.netProfit)}</div>
                </div>
                 <div className="p-6 bg-blue-50 rounded-2xl border-b-4 border-blue-200 shadow-md hover:-translate-y-1 transition-transform flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-xs text-blue-800 uppercase font-black tracking-wider mb-1">Tỉ suất LN</div>
                        <div className={`text-3xl font-black ${finalSummary.profitMargin < 15 ? 'text-red-500' : 'text-blue-600'}`}>{finalSummary.profitMargin.toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-sm border-t border-slate-100 pt-6">
                <div className="flex justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                    <span className="text-slate-600 font-bold">1. Gỗ Công nghiệp (Ván + Nẹp)</span>
                    <span className="font-bold text-slate-800">{formatCurrency(materialBreakdown.totalIndustrialCost + materialBreakdown.edgeBandingCost)}</span>
                </div>
                {materialBreakdown.totalNaturalCost > 0 && (
                    <div className="flex justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="text-amber-800 font-bold">2. Gỗ Tự nhiên (Khối + Hao hụt)</span>
                        <span className="font-bold text-amber-700">{formatCurrency(materialBreakdown.totalNaturalCost)}</span>
                    </div>
                )}
                 {materialBreakdown.finishingCost > 0 && (
                    <div className="flex justify-between p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <span className="text-orange-800 font-bold">3. Sơn / Gia công bề mặt (Inchem/Acrylic)</span>
                        <span className="font-bold text-orange-700">{formatCurrency(materialBreakdown.finishingCost)}</span>
                    </div>
                )}
                {materialBreakdown.outsourcedCost > 0 && (
                    <div className="flex justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <span className="text-purple-800 font-bold">4. Hàng Mua Ngoài / Thuê ngoài</span>
                        <span className="font-bold text-purple-700">{formatCurrency(materialBreakdown.outsourcedCost)}</span>
                    </div>
                )}
                <div className="flex justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                    <span className="text-slate-600 font-bold">5. Phụ kiện + Vật tư phụ (SX)</span>
                    <span className="font-bold text-slate-800">{formatCurrency(materialBreakdown.totalAccessoryCost + materialBreakdown.consumableCost)}</span>
                </div>
                <div className="flex justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                    <span className="text-slate-600 font-bold">6. Nhân công Xưởng ({laborEstimation.totalManDays} công)</span>
                    <span className="font-bold text-slate-800">{formatCurrency(laborEstimation.totalLaborCost)}</span>
                </div>
                <div className="flex justify-between p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <span className="text-indigo-800 font-bold">7. Quản lý xưởng & Khấu hao máy</span>
                    <span className="font-bold text-indigo-700">{formatCurrency(laborEstimation.totalOverheadCost)}</span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                    <span className="text-slate-700 font-bold">8. Chi phí Dự án khác (VC, Lắp đặt...)</span>
                    <span className="font-bold text-red-500">{formatCurrency(finalSummary.projectOverhead)}</span>
                </div>
            </div>
        </div>

        {/* DETAILED MATERIAL TABLE */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <DocumentIcon className="w-6 h-6 mr-3 text-emerald-500" />
                Bóc tách Vật tư Chi tiết (Sản xuất)
            </h3>
             <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-5 py-4 text-left">Vật liệu</th>
                            <th className="px-5 py-4 text-center">Diện tích mặt</th>
                            <th className="px-5 py-4 text-center">Quy đổi</th>
                            <th className="px-5 py-4 text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {/* Industrial */}
                        {Object.entries(materialBreakdown.industrialMaterials).map(([name, stat]: [string, any], idx) => (
                            <tr key={`ind-${idx}`} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-4 font-bold text-slate-700">{name}</td>
                                <td className="px-5 py-4 text-center text-slate-500 font-medium">{stat.totalArea.toFixed(1)} m2</td>
                                <td className="px-5 py-4 text-center font-bold text-indigo-600 bg-indigo-50/30 rounded-lg m-1">{Math.ceil(stat.sheets)} tấm</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-800">{formatCurrency(stat.estimatedCost)}</td>
                            </tr>
                        ))}
                        {/* Edge Banding Row */}
                        {materialBreakdown.totalEdgeMeters > 0 && (
                             <tr className="bg-indigo-50/50">
                                <td className="px-5 py-4 font-bold text-indigo-700">Nẹp chỉ dán cạnh (PVC/ABS)</td>
                                <td className="px-5 py-4 text-center text-slate-500">-</td>
                                <td className="px-5 py-4 text-center font-bold text-indigo-600">{materialBreakdown.totalEdgeMeters} md</td>
                                <td className="px-5 py-4 text-right font-bold text-indigo-700">{formatCurrency(materialBreakdown.edgeBandingCost)}</td>
                            </tr>
                        )}
                        {/* Natural */}
                        {Object.entries(materialBreakdown.naturalMaterials).map(([name, stat]: [string, any], idx) => (
                            <tr key={`nat-${idx}`} className="bg-amber-50/50">
                                <td className="px-5 py-4 font-bold text-amber-800">{name} (Gỗ thịt)</td>
                                <td className="px-5 py-4 text-center text-slate-500 font-medium">{stat.totalArea.toFixed(1)} m2</td>
                                <td className="px-5 py-4 text-center font-bold text-amber-700">{stat.m3.toFixed(3)} m3</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-800">{formatCurrency(stat.estimatedCost)}</td>
                            </tr>
                        ))}
                        {Object.keys(materialBreakdown.industrialMaterials).length === 0 && Object.keys(materialBreakdown.naturalMaterials).length === 0 && (
                             <tr>
                                 <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic font-medium">
                                     Không có hạng mục "Tự sản xuất" nào cần bóc tách ván.
                                 </td>
                             </tr>
                        )}
                    </tbody>
                </table>
            </div>
         </div>
    </div>
  );
};

export default ResourceAnalysis;