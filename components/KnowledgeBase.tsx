
import React, { useRef, useState, useMemo } from 'react';
import { KnowledgeItem } from '../types';
import { DatabaseIcon, TrashIcon, DownloadIcon, CameraIcon, PlusCircleIcon, PencilIcon, DocumentDuplicateIcon, ArrowPathIcon } from './Icons';
import { extractKnowledgeFromImage } from '../services/geminiService';
import { SYSTEM_DEFAULT_KNOWLEDGE } from '../App';

// Access global XLSX
declare const XLSX: any;

interface KnowledgeBaseProps {
  items: KnowledgeItem[];
  onUpdate: (items: KnowledgeItem[]) => void;
  onClose: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ items, onUpdate, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // Manual Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // Track ID if editing
  
  // Template Search State
  const [templateSearch, setTemplateSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [newItem, setNewItem] = useState<{
      name: string;
      description: string;
      material: string;
      unit: string;
      price: number;
  }>({
      name: '',
      description: '',
      material: '',
      unit: 'cái',
      price: 0
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // --- TEMPLATE SEARCH ---
  const suggestions = useMemo(() => {
      if (!templateSearch.trim()) return [];
      const lower = templateSearch.toLowerCase();
      return items.filter(i => i.itemName.toLowerCase().includes(lower) || i.material.toLowerCase().includes(lower)).slice(0, 5);
  }, [items, templateSearch]);

  const handleSelectTemplate = (template: KnowledgeItem) => {
      setNewItem({
          name: template.itemName,
          description: template.description,
          material: template.material,
          unit: template.unit,
          price: template.unitPrice
      });
      setTemplateSearch('');
      setShowSuggestions(false);
  };

  // --- MANUAL ADD/UPDATE HANDLER ---
  const handleSaveItem = () => {
      if (!newItem.name.trim()) {
          alert("Vui lòng nhập tên hạng mục");
          return;
      }
      
      if (editingId) {
          // UPDATE MODE
          const updatedItems = items.map(item => {
              if (item.id === editingId) {
                  return {
                      ...item,
                      itemName: newItem.name,
                      description: newItem.description,
                      material: newItem.material,
                      unit: newItem.unit,
                      unitPrice: newItem.price
                  };
              }
              return item;
          });
          onUpdate(updatedItems);
      } else {
          // ADD MODE
          const item: KnowledgeItem = {
              id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              itemName: newItem.name,
              description: newItem.description,
              material: newItem.material,
              unit: newItem.unit,
              unitPrice: newItem.price
          };
          onUpdate([...items, item]);
      }
      
      resetForm();
      setIsModalOpen(false);
  };

  const handleEditClick = (item: KnowledgeItem) => {
      setEditingId(item.id);
      setNewItem({
          name: item.itemName,
          description: item.description,
          material: item.material,
          unit: item.unit,
          price: item.unitPrice
      });
      setTemplateSearch(''); 
      setIsModalOpen(true);
  };

  const resetForm = () => {
      setNewItem({
          name: '',
          description: '',
          material: '',
          unit: 'cái',
          price: 0
      });
      setEditingId(null);
      setTemplateSearch('');
  };

  const handleRestoreDefaults = () => {
      if (window.confirm("Bạn có muốn khôi phục danh sách đơn giá về mặc định của hệ thống? Dữ liệu hiện tại sẽ bị ghi đè.")) {
          onUpdate(SYSTEM_DEFAULT_KNOWLEDGE);
          alert("Đã khôi phục dữ liệu hệ thống thành công.");
      }
  };

  // --- EXCEL HANDLER ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (typeof XLSX === 'undefined') {
        alert("Thư viện Excel chưa tải xong. Vui lòng đợi 3 giây và thử lại.");
        return;
      }

      setIsProcessing(true);
      setProcessingStatus("Đang đọc Excel...");
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        try {
          const arrayBuffer = evt.target?.result;
          const wb = XLSX.read(arrayBuffer, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

          if (!data || data.length === 0) {
              alert("File Excel trống hoặc không đọc được dữ liệu.");
              setIsProcessing(false);
              return;
          }

          let headerRowIndex = -1;
          const columnMapping: Record<string, number> = {
              name: -1,
              desc: -1,
              material: -1,
              unit: -1,
              price: -1
          };

          for (let i = 0; i < Math.min(data.length, 20); i++) {
              const row = data[i] as any[];
              if (!row) continue;
              
              const rowStr = row.map(cell => String(cell).toLowerCase().trim());
              
              rowStr.forEach((cell, colIndex) => {
                  if (cell.includes('tên') || cell.includes('hạng mục') || cell.includes('nội dung') || cell === 'item') columnMapping.name = colIndex;
                  if (cell.includes('mô tả') || cell.includes('quy cách') || cell.includes('diễn giải') || cell.includes('kích thước')) columnMapping.desc = colIndex;
                  if (cell.includes('vật liệu') || cell.includes('chất liệu')) columnMapping.material = colIndex;
                  if (cell === 'đvt' || cell.includes('đơn vị') || cell === 'unit') columnMapping.unit = colIndex;
                  if (cell.includes('đơn giá') || cell.includes('giá') || cell === 'price') columnMapping.price = colIndex;
              });

              if (columnMapping.name !== -1 && columnMapping.price !== -1) {
                  headerRowIndex = i;
                  break;
              }
          }

          if (headerRowIndex === -1) {
              alert("Không tìm thấy dòng tiêu đề (Hạng mục, Đơn giá). Vui lòng kiểm tra lại file Excel.");
              setIsProcessing(false);
              return;
          }

          const newItems: KnowledgeItem[] = [];
          
          for (let i = headerRowIndex + 1; i < data.length; i++) {
              const row = data[i] as any[];
              if (!row || row.length === 0) continue;

              const name = columnMapping.name !== -1 ? row[columnMapping.name] : '';
              
              if (!name || String(name).toLowerCase().includes('tổng') || String(name).toLowerCase().includes('cộng')) continue;

              let price = columnMapping.price !== -1 ? row[columnMapping.price] : 0;
              
              if (typeof price === 'string') {
                   price = parseFloat(price.replace(/,/g, '').replace(/[^0-9.]/g, ''));
              }

              if (name) {
                  newItems.push({
                      id: `learned-${Date.now()}-${i}`,
                      itemName: String(name),
                      description: columnMapping.desc !== -1 ? String(row[columnMapping.desc] || '') : '',
                      material: columnMapping.material !== -1 ? String(row[columnMapping.material] || '') : '',
                      unit: columnMapping.unit !== -1 ? String(row[columnMapping.unit] || 'cái') : 'cái',
                      unitPrice: Number(price) || 0
                  });
              }
          }

          if (newItems.length > 0) {
              onUpdate([...items, ...newItems]);
              alert(`Thành công! Đã học được ${newItems.length} đầu mục mới.`);
          } else {
              alert("Không lấy được dữ liệu. Vui lòng đảm bảo file Excel có cột 'Tên hạng mục' và 'Đơn giá'.");
          }

        } catch (error) {
          console.error("Error reading excel", error);
          alert("Lỗi đọc file Excel: " + (error as any).message);
        } finally {
            setIsProcessing(false);
            setProcessingStatus('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      
      reader.readAsArrayBuffer(file);
    }
  };

  // --- IMAGE HANDLER ---
  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const maxWidth = 1024;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject("Canvas error"); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsProcessing(true);
          setProcessingStatus("Đang đọc ảnh & dịch chữ viết tay...");
          
          try {
              const base64Image = await compressImage(file);
              const extractedItems = await extractKnowledgeFromImage(base64Image);
              
              if (extractedItems.length > 0) {
                  onUpdate([...items, ...extractedItems]);
                  alert(`Đã trích xuất thành công ${extractedItems.length} mục từ ảnh.`);
              } else {
                  alert("Không tìm thấy dữ liệu báo giá nào trong ảnh.");
              }
          } catch (error) {
              console.error("Error OCR:", error);
              alert("Lỗi khi xử lý ảnh: " + (error as any).message);
          } finally {
              setIsProcessing(false);
              setProcessingStatus('');
              if (imageInputRef.current) imageInputRef.current.value = '';
          }
      }
  };

  const handleDelete = (id: string) => {
      onUpdate(items.filter(i => i.id !== id));
  };

  const handleClearAll = () => {
      if(window.confirm("Bạn có chắc muốn xóa toàn bộ dữ liệu đơn giá đã học?")) {
          onUpdate([]);
      }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[600px] relative animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                <DatabaseIcon className="w-8 h-8 mr-3 text-emerald-600" />
                Thư viện Đơn giá & Vật liệu
            </h2>
            <p className="text-slate-500 mt-2 ml-1">
                Quản lý cơ sở dữ liệu giá để AI tự động áp dụng khi báo giá.
            </p>
         </div>
         <div className="flex flex-wrap gap-2">
             {/* Manual Add */}
             <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm font-medium"
             >
                 <PlusCircleIcon className="w-5 h-5 mr-2" />
                 Thêm thủ công
             </button>

             {/* Excel Import */}
             <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium disabled:opacity-50"
             >
                 <DownloadIcon className="w-5 h-5 mr-2" />
                 Excel
             </button>
             <input 
                type="file" 
                accept=".xlsx, .xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
             />

             {/* Image Import */}
             <button 
                onClick={() => imageInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shadow-sm font-medium disabled:opacity-50"
             >
                 <CameraIcon className="w-5 h-5 mr-2" />
                 Ảnh / Viết tay
             </button>
             <input 
                type="file" 
                accept="image/*"
                className="hidden"
                ref={imageInputRef}
                onChange={handleImageUpload}
             />
             
             <button 
                onClick={onClose}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
             >
                 Đóng
             </button>
         </div>
      </div>
      
      {isProcessing && (
         <div className="mb-6 bg-indigo-50 text-indigo-700 px-6 py-4 rounded-xl flex items-center shadow-sm border border-indigo-100">
             <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             <span className="font-medium">{processingStatus}</span>
         </div>
      )}

      <div className="mb-4 flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span className="font-semibold text-slate-700 ml-2">Tổng số mục: <span className="text-emerald-600">{items.length}</span></span>
          <div className="flex space-x-3">
            <button 
                onClick={handleRestoreDefaults}
                className="text-emerald-700 text-sm hover:underline flex items-center px-3 py-1.5 bg-emerald-100/50 rounded-lg font-medium transition-colors"
            >
                <ArrowPathIcon className="w-4 h-4 mr-1.5" />
                Nạp dữ liệu gốc hệ thống
            </button>
            {items.length > 0 && (
                <button onClick={handleClearAll} className="text-red-500 text-sm hover:underline px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors font-medium">
                    Xóa tất cả
                </button>
            )}
          </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wide sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">Tên hạng mục</th>
                        <th className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">Mô tả / Vật liệu</th>
                        <th className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-center">ĐVT</th>
                        <th className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-right">Đơn giá</th>
                        <th className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                                <p className="mb-2 font-medium text-lg">Chưa có dữ liệu.</p>
                                <p className="text-sm">Hãy thêm thủ công, nhập từ Excel hoặc chụp ảnh báo giá cũ.</p>
                            </td>
                        </tr>
                    ) : (
                        items.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-5 py-3 font-semibold text-slate-800">{item.itemName}</td>
                                <td className="px-5 py-3">
                                    <div className="text-slate-600 mb-0.5">{item.description}</div>
                                    <div className="text-xs text-slate-400 italic group-hover:text-emerald-600 transition-colors">{item.material}</div>
                                </td>
                                <td className="px-5 py-3 text-center text-slate-500">{item.unit}</td>
                                <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-5 py-3 text-center">
                                    <div className="flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEditClick(item)} 
                                            className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                                            title="Chỉnh sửa"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)} 
                                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Xóa"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* MANUAL ADD/EDIT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up flex flex-col max-h-[90vh] border border-slate-100">
                  <div className="p-8 overflow-y-auto">
                      <h3 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                          {editingId ? "Cập Nhật Đơn Giá" : "Thêm Đơn Giá Mới"}
                      </h3>
                      
                      {/* TEMPLATE SEARCH (Only visible when adding new) */}
                      {!editingId && (
                          <div className="mb-6 relative bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                               <label className="block text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center tracking-wide">
                                    <DocumentDuplicateIcon className="w-3.5 h-3.5 mr-1.5"/> 
                                    Tạo nhanh từ thư viện (Gợi ý)
                               </label>
                               <input 
                                   type="text"
                                   className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm placeholder-slate-400 transition-all"
                                   placeholder="Gõ tên để sao chép từ mục có sẵn..."
                                   value={templateSearch}
                                   onChange={(e) => {
                                       setTemplateSearch(e.target.value);
                                       setShowSuggestions(true);
                                   }}
                                   onFocus={() => setShowSuggestions(true)}
                               />
                               {showSuggestions && suggestions.length > 0 && (
                                   <div className="absolute z-10 left-4 right-4 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto">
                                       {suggestions.map(s => (
                                           <div 
                                                key={s.id}
                                                className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 group"
                                                onClick={() => handleSelectTemplate(s)}
                                           >
                                               <div className="font-bold text-sm text-slate-700 group-hover:text-emerald-700">{s.itemName}</div>
                                               <div className="text-xs text-slate-500 flex justify-between mt-1">
                                                   <span>{s.material}</span>
                                                   <span className="font-bold text-emerald-600">{formatCurrency(s.unitPrice)}</span>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               )}
                          </div>
                      )}

                      <div className="space-y-5">
                          <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên hạng mục <span className="text-red-500">*</span></label>
                              <input 
                                  type="text"
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                  placeholder="VD: Tủ áo cánh kính"
                                  value={newItem.name}
                                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Vật liệu</label>
                              <input 
                                  type="text"
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                  placeholder="VD: MDF An Cường"
                                  value={newItem.material}
                                  onChange={(e) => setNewItem({...newItem, material: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả / Quy cách</label>
                              <input 
                                  type="text"
                                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                  placeholder="VD: Thùng MDF, cánh khung nhôm kính..."
                                  value={newItem.description}
                                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn vị tính</label>
                                  <input 
                                      type="text"
                                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                      placeholder="m2, md, cái..."
                                      value={newItem.unit}
                                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                                  <input 
                                      type="number"
                                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right font-medium"
                                      placeholder="0"
                                      value={newItem.price || ''}
                                      onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                          <button 
                              onClick={() => setIsModalOpen(false)}
                              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                          >
                              Hủy bỏ
                          </button>
                          <button 
                              onClick={handleSaveItem}
                              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-lg shadow-emerald-200"
                          >
                              {editingId ? "Cập Nhật" : "Thêm Mới"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
