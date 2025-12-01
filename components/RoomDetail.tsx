
import React, { useState, useRef, ChangeEvent } from 'react';
import { Room, QuotationItem, KnowledgeItem } from '../types';
import { analyzeRoomImages } from '../services/geminiService';
import { PhotoIcon, SparklesIcon, TrashIcon, ArrowLeftIcon, DocumentIcon, DatabaseIcon, ArrowUpTrayIcon } from './Icons';
import QuotationTable from './QuotationTable';
import { getRoomIcon } from '../App';

interface RoomDetailProps {
  room: Room;
  knowledgeBase: KnowledgeItem[];
  onUpdateRoom: (updatedRoom: Room) => void;
  onUpdateKnowledgeBase?: (items: KnowledgeItem[]) => void;
  onBack: () => void;
}

const RoomDetail: React.FC<RoomDetailProps> = ({ room, knowledgeBase, onUpdateRoom, onUpdateKnowledgeBase, onBack }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState(room.analysisReport || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to compress image
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
          if (!ctx) {
             reject("Could not get canvas context");
             return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const newImages: string[] = [];

      try {
        for (const file of files) {
          const compressedData = await compressImage(file);
          newImages.push(compressedData);
        }

        if (newImages.length > 0) {
           onUpdateRoom({
              ...room,
              images: [...room.images, ...newImages],
           });
        }
      } catch (error) {
        console.error("Error compressing images:", error);
        alert("Có lỗi khi xử lý ảnh. Vui lòng thử lại.");
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...room.images];
    newImages.splice(index, 1);
    onUpdateRoom({ ...room, images: newImages });
  };

  const handleAnalyze = async () => {
    if (room.images.length === 0) {
        alert("Vui lòng tải lên ít nhất 1 ảnh để phân tích.");
        return;
    }

    setIsAnalyzing(true);
    onUpdateRoom({ ...room, status: 'analyzing' });

    try {
      // Analyze returns { items, analysisReport }
      const { items, analysisReport } = await analyzeRoomImages(room.type, room.images, knowledgeBase);
      
      const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);
      setAnalysisText(analysisReport);

      onUpdateRoom({
        ...room,
        items,
        totalCost,
        analysisReport,
        status: 'review', // Go to Review status first
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error(error);
      onUpdateRoom({ ...room, status: 'error' });
      alert("Có lỗi xảy ra khi phân tích. Vui lòng thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateItems = (newItems: QuotationItem[]) => {
      const newTotalCost = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      onUpdateRoom({
          ...room,
          items: newItems,
          totalCost: newTotalCost
      });
  };

  const handleConfirmQuote = () => {
      onUpdateRoom({
          ...room,
          analysisReport: analysisText,
          status: 'done' // Move to final Quote status
      });
  };

  // --- Auto-fill prices from Knowledge Base ---
  const autoPriceItems = () => {
    if (knowledgeBase.length === 0) {
        alert("Thư viện đơn giá đang trống. Vui lòng cập nhật thư viện trước.");
        return;
    }

    const overwriteAll = window.confirm(
        "Bạn muốn áp dụng giá như thế nào?\n\n" +
        "- OK (Đồng ý): Ghi đè TẤT CẢ (kể cả các mục đã có giá).\n" +
        "- Cancel (Hủy): CHỈ điền vào các mục có giá = 0."
    );

    let matchCount = 0;
    const updatedItems = room.items.map(item => {
        // Skip if we are not overwriting and price is already set
        if (!overwriteAll && item.unitPrice > 0) return item;

        const itemName = item.itemName.toLowerCase().trim();
        const itemMaterial = item.material ? item.material.toLowerCase().trim() : '';

        // Strategy 1: Strict Match (Name + Material)
        let bestMatch = knowledgeBase.find(k => 
            k.itemName.toLowerCase().trim() === itemName && 
            k.material.toLowerCase().trim() === itemMaterial
        );

        // Strategy 2: Name Match only (if strict match failed)
        if (!bestMatch) {
            bestMatch = knowledgeBase.find(k => 
                k.itemName.toLowerCase().trim() === itemName
            );
        }

        // Strategy 3: Fuzzy / Partial Match (Name contains key words)
        if (!bestMatch) {
             const candidates = knowledgeBase.filter(k => {
                const kName = k.itemName.toLowerCase().trim();
                return itemName.includes(kName) || kName.includes(itemName);
             });
             
             if (candidates.length > 0) {
                 // Sort candidates to prefer the best match
                 candidates.sort((a, b) => {
                     const aMat = a.material.toLowerCase().trim();
                     const bMat = b.material.toLowerCase().trim();
                     
                     // 1. Material score
                     const getMatScore = (mat: string) => {
                         if (!itemMaterial || !mat) return 0;
                         if (mat === itemMaterial) return 2;
                         if (mat.includes(itemMaterial) || itemMaterial.includes(mat)) return 1;
                         return 0;
                     };
                     const scoreA = getMatScore(aMat);
                     const scoreB = getMatScore(bMat);
                     
                     if (scoreA !== scoreB) return scoreB - scoreA;

                     // 2. Specificity score (Longer name usually means more specific match in KB)
                     return b.itemName.length - a.itemName.length;
                 });
                 bestMatch = candidates[0];
             }
        }

        if (bestMatch && bestMatch.unitPrice > 0) {
            matchCount++;
            return {
                ...item,
                unitPrice: bestMatch.unitPrice,
                // If the knowledge item has a unit, prefer it, otherwise keep existing
                unit: bestMatch.unit || item.unit, 
                // Recalculate Total
                totalPrice: item.quantity * bestMatch.unitPrice,
                // Recalculate Cost Price (Assume 70% if not explicitly derived)
                costPrice: bestMatch.unitPrice * 0.7 
            };
        }

        return item;
    });

    if (matchCount > 0) {
        handleUpdateItems(updatedItems);
        alert(`Đã cập nhật đơn giá cho ${matchCount} hạng mục từ thư viện.`);
    } else {
        alert("Không tìm thấy hạng mục nào phù hợp trong thư viện để áp giá.");
    }
  };

  // --- SAVE BACK TO LIBRARY ---
  const handleSaveToLibrary = () => {
     if (!onUpdateKnowledgeBase) return;

     const itemsToSave = room.items.filter(item => item.unitPrice > 0);
     if (itemsToSave.length === 0) {
         alert("Không có hạng mục nào có đơn giá để lưu.");
         return;
     }

     if (window.confirm(`Bạn có muốn lưu ${itemsToSave.length} đơn giá hiện tại vào Thư viện không?\nViệc này giúp hệ thống tự động nhận diện giá cho các dự án sau.`)) {
         
         const newKnowledgeItems: KnowledgeItem[] = itemsToSave.map((item, idx) => ({
             id: `learned-${Date.now()}-${idx}`,
             itemName: item.itemName,
             description: item.description,
             material: item.material,
             unit: item.unit,
             unitPrice: item.unitPrice
         }));

         const mergedKB = [...knowledgeBase];
         let addedCount = 0;

         newKnowledgeItems.forEach(newItem => {
             const exists = mergedKB.some(k => 
                 k.itemName.toLowerCase() === newItem.itemName.toLowerCase() &&
                 k.material.toLowerCase() === newItem.material.toLowerCase() &&
                 k.unitPrice === newItem.unitPrice
             );
             
             if (!exists) {
                 mergedKB.push(newItem);
                 addedCount++;
             }
         });

         onUpdateKnowledgeBase(mergedKB);
         alert(`Đã thêm ${addedCount} đơn giá mới vào Thư viện thành công!`);
     }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          type="button"
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all font-bold btn-3d border border-transparent hover:border-emerald-100"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Quay lại
        </button>
        <div className="flex items-center gap-4">
            <div className="hidden md:block w-12 h-12">
                 {getRoomIcon(room.type)}
            </div>
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{room.name}</h2>
                <span className="text-emerald-600 font-bold uppercase tracking-wide text-sm">{room.type}</span>
            </div>
        </div>
        <div className="w-24"></div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-slate-100 hover:border-emerald-100 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Hình ảnh hiện trạng / Thiết kế</h3>
            <p className="text-slate-500 text-sm mt-1">AI sẽ dựa vào hình ảnh này để bóc tách khối lượng và đề xuất vật liệu.</p>
          </div>
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-6 py-3 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 hover:shadow-md transition-all btn-3d"
          >
            <PhotoIcon className="w-5 h-5 mr-2" />
            Thêm ảnh
          </button>
        </div>

        {room.images.length === 0 ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group animate-float"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                 <PhotoIcon className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <p className="text-slate-700 font-bold text-lg group-hover:text-emerald-700">Kéo thả hoặc bấm để tải ảnh phòng lên</p>
            <p className="text-slate-400 text-sm mt-2 font-medium">Hỗ trợ JPG, PNG</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {room.images.map((img, idx) => (
              <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm hover:shadow-lg transition-all hover:scale-105 transform duration-300">
                <img src={img} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-red-600 shadow-md hover:scale-110"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-400 hover:text-emerald-600 transition-all"
            >
                <span className="text-5xl font-light">+</span>
            </div>
          </div>
        )}

        {/* Analyze Button - 3D STYLE */}
        {room.images.length > 0 && (
          <div className="mt-10 flex justify-center relative z-20">
            <button
              type="button"
              onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAnalyze();
              }}
              disabled={isAnalyzing}
              className={`flex items-center px-10 py-5 rounded-2xl text-white text-xl font-extrabold shadow-xl transition-all btn-3d ${
                isAnalyzing 
                  ? 'bg-slate-400 cursor-not-allowed border-b-4 border-slate-600' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 border-b-4 border-emerald-700 hover:shadow-emerald-200 hover:-translate-y-1'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang suy nghĩ...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-8 h-8 mr-3 animate-pulse" />
                  {room.items.length > 0 ? 'Phân tích lại' : 'BẮT ĐẦU PHÂN TÍCH'}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ANALYSIS & REVIEW SECTION (Intermediate Step) */}
      {room.status === 'review' && (
        <div className="bg-emerald-50/30 border-2 border-emerald-100 rounded-3xl p-8 shadow-sm animate-pop">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-emerald-900 flex items-center">
                    <DocumentIcon className="w-8 h-8 mr-3 text-emerald-500" />
                    Kết quả Phân tích & Diễn giải
                </h3>
            </div>
            
            {/* Editable Analysis Text */}
            <div className="mb-8">
                <label className="block text-sm font-bold text-emerald-800 mb-3 uppercase tracking-wide">Đánh giá chung (AI):</label>
                <div className="relative">
                    <textarea 
                        value={analysisText}
                        onChange={(e) => setAnalysisText(e.target.value)}
                        className="w-full h-40 p-5 rounded-2xl border-2 border-emerald-200 bg-white text-slate-700 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none resize-y shadow-sm leading-relaxed text-base"
                        placeholder="Chưa có phân tích..."
                    />
                    <div className="absolute top-3 right-3 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">AI Writer</div>
                </div>
            </div>

            {/* Editable List (No Prices yet) */}
            <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                    <label className="block text-sm font-bold text-emerald-800 uppercase tracking-wide">Danh sách hạng mục dự kiến:</label>
                    
                    <button
                        type="button"
                        onClick={autoPriceItems}
                        className="text-xs flex items-center bg-white border-2 border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl hover:bg-emerald-50 hover:shadow-md transition-all font-bold btn-3d"
                        title="Tự động tìm và điền đơn giá từ Thư viện cho các mục này"
                    >
                        <DatabaseIcon className="w-4 h-4 mr-2" />
                        Tra cứu & Áp giá
                    </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-emerald-100">
                    <QuotationTable 
                        items={room.items} 
                        knowledgeBase={knowledgeBase}
                        onUpdateItems={handleUpdateItems}
                        mode="estimation" // Hide prices
                    />
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-emerald-200">
                 <button
                    onClick={handleConfirmQuote}
                    className="px-10 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-200 transition-all btn-3d text-lg"
                 >
                     Xác nhận & Lập Báo Giá
                 </button>
            </div>
        </div>
      )}

      {/* FINAL QUOTATION TABLE (Done Step) */}
      {room.status === 'done' && (
        <div className="animate-fade-in">
           {room.analysisReport && (
               <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 mb-8 shadow-sm">
                   <h4 className="font-bold text-slate-800 mb-3 flex items-center text-lg">
                       <DocumentIcon className="w-6 h-6 mr-2 text-emerald-500" />
                       Phân tích & Diễn giải:
                   </h4>
                   <p className="text-slate-600 whitespace-pre-wrap text-base leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">{room.analysisReport}</p>
                   <button 
                      onClick={() => onUpdateRoom({ ...room, status: 'review' })}
                      className="text-sm text-emerald-600 hover:text-emerald-800 hover:underline mt-4 font-bold"
                   >
                       Chỉnh sửa phân tích
                   </button>
               </div>
           )}
           
           <div className="flex justify-end mb-4 space-x-3">
                <button
                    type="button"
                    onClick={autoPriceItems}
                    className="flex items-center bg-white border-2 border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-emerald-700 transition-colors shadow-sm font-bold text-sm btn-3d"
                >
                    <DatabaseIcon className="w-4 h-4 mr-2" />
                    Auto-Fill Giá
                </button>
                <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    className="flex items-center bg-white border-2 border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors font-bold text-sm shadow-sm btn-3d"
                >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                    Lưu giá vào Thư viện
                </button>
           </div>

           <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <QuotationTable 
                    items={room.items} 
                    knowledgeBase={knowledgeBase}
                    onUpdateItems={handleUpdateItems}
                    mode="quotation" // Show prices
                />
           </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetail;
