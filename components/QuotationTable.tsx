
import React, { useState, useEffect, useMemo } from 'react';
import { QuotationItem, KnowledgeItem } from '../types';
import { TrashIcon, BanknotesIcon } from './Icons';

interface QuotationTableProps {
  items: QuotationItem[];
  onUpdateItems: (newItems: QuotationItem[]) => void;
  knowledgeBase?: KnowledgeItem[]; // NEW: For autocomplete suggestions
  readOnly?: boolean;
  mode?: 'quotation' | 'estimation'; 
}

const QuotationTable: React.FC<QuotationTableProps> = ({ 
  items, 
  onUpdateItems, 
  knowledgeBase = [],
  readOnly = false,
  mode = 'quotation' 
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showInternalCost, setShowInternalCost] = useState(false); // Toggle for Cost & Profit view
  
  const showPrices = mode === 'quotation';

  // --- AUTOCOMPLETE SUGGESTIONS ---
  const { uniqueMaterials, uniqueDescriptions } = useMemo(() => {
    const materials = new Set<string>();
    const descriptions = new Set<string>();
    
    knowledgeBase.forEach(k => {
        if(k.material) materials.add(k.material);
        if(k.description) descriptions.add(k.description);
    });

    return {
        uniqueMaterials: Array.from(materials),
        uniqueDescriptions: Array.from(descriptions)
    };
  }, [knowledgeBase]);

  // Reset selection only when items array length changes drastically
  useEffect(() => {
    setSelectedIds(new Set());
  }, [items.length]);

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleItemChange = (id: string, field: keyof QuotationItem, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const newItem = { ...item };
        
        if (field === 'quantity' || field === 'unitPrice' || field === 'totalPrice' || field === 'costPrice') {
             const numValue = value === '' ? 0 : Number(value);
             (newItem as any)[field] = numValue;
             
             if (field === 'quantity') {
                 newItem.totalPrice = numValue * newItem.unitPrice;
             } else if (field === 'unitPrice') {
                 newItem.totalPrice = newItem.quantity * numValue;
                 // Only auto-update cost price if in basic mode and cost is 0
                 if (!showInternalCost && (!newItem.costPrice || newItem.costPrice === 0)) {
                    newItem.costPrice = numValue * 0.7; 
                 }
             } else if (field === 'totalPrice') {
                 if (newItem.quantity !== 0) {
                     newItem.unitPrice = numValue / newItem.quantity;
                 }
             }
        } else {
             (newItem as any)[field] = value;
        }
        return newItem;
      }
      return item;
    });
    onUpdateItems(updatedItems);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(items.map(i => i.id));
      setSelectedIds(allIds);
    }
  };

  const deleteSelectedItems = () => {
    if (selectedIds.size === 0) return;
    setTimeout(() => {
        if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.size} dòng đã chọn?`)) {
            const remainingItems = items.filter(item => !selectedIds.has(item.id));
            onUpdateItems(remainingItems);
            setSelectedIds(new Set());
        }
    }, 50);
  };

  const deleteSingleItem = (id: string) => {
     setTimeout(() => {
         const remainingItems = items.filter(item => item.id !== id);
         onUpdateItems(remainingItems);
         if (selectedIds.has(id)) {
             const newSelected = new Set(selectedIds);
             newSelected.delete(id);
             setSelectedIds(newSelected);
         }
     }, 50);
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemName: 'Hạng mục mới',
      description: '',
      material: '',
      unit: 'cái',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      costPrice: 0,
      note: '',
      source: 'produced'
    };
    onUpdateItems([...items, newItem]);
  };

  const totalCost = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className={`flex flex-col h-full bg-white`}>
      {/* DATALISTS FOR AUTOCOMPLETE */}
      {!readOnly && (
          <>
            <datalist id="kb-materials">
                {uniqueMaterials.map((mat, idx) => <option key={idx} value={mat} />)}
            </datalist>
            <datalist id="kb-descriptions">
                {uniqueDescriptions.map((desc, idx) => <option key={idx} value={desc} />)}
            </datalist>
          </>
      )}

      {/* Header Toolbar */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center space-x-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                {showPrices ? 'Chi tiết dự toán' : 'Danh sách hạng mục'}
            </h3>
            
            {!readOnly && showPrices && (
                <button 
                   onClick={() => setShowInternalCost(!showInternalCost)}
                   className={`flex items-center text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                       showInternalCost 
                       ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' 
                       : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                   }`}
                >
                    <BanknotesIcon className="w-3.5 h-3.5 mr-1.5" />
                    {showInternalCost ? 'Ẩn Giá Vốn' : 'Hiện Giá Vốn (Nội bộ)'}
                </button>
            )}

            {!readOnly && selectedIds.size > 0 && (
                <button 
                    type="button"
                    onClick={deleteSelectedItems}
                    className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                    <TrashIcon className="w-3.5 h-3.5 mr-1.5" />
                    Xóa ({selectedIds.size})
                </button>
            )}
        </div>
        {showPrices && (
            <div className="text-lg font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                Tổng: {formatCurrency(totalCost)}
            </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10">
            <tr>
              {!readOnly && (
                <th className="px-4 py-3 w-10 text-center border-b border-slate-200">
                    <input 
                        type="checkbox" 
                        checked={items.length > 0 && selectedIds.size === items.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                </th>
              )}
              <th className="px-2 py-3 w-10 text-center border-b border-slate-200">STT</th>
              <th className="px-4 py-3 w-1/5 border-b border-slate-200">Hạng mục</th>
              <th className="px-4 py-3 border-b border-slate-200">Mô tả & Vật liệu</th>
              {showInternalCost && <th className="px-2 py-3 w-28 border-b border-slate-200">Nguồn</th>}
              <th className="px-2 py-3 text-center w-16 border-b border-slate-200">ĐVT</th>
              <th className="px-2 py-3 text-center w-16 border-b border-slate-200">SL</th>
              
              {showPrices && (
                  <>
                    <th className="px-4 py-3 text-right w-32 border-b border-slate-200">Đơn giá</th>
                    {showInternalCost && (
                         <th className="px-4 py-3 text-right w-28 border-b border-slate-200 text-orange-600 bg-orange-50/50">Giá Vốn</th>
                    )}
                    <th className="px-4 py-3 text-right w-36 border-b border-slate-200 text-emerald-700">Thành tiền</th>
                    {showInternalCost && (
                         <th className="px-4 py-3 text-right w-28 border-b border-slate-200 text-indigo-600 bg-indigo-50/50">Lãi Gộp</th>
                    )}
                  </>
              )}
              <th className="px-4 py-3 w-32 border-b border-slate-200">Ghi chú</th>
              {!readOnly && <th className="px-2 py-3 w-10 border-b border-slate-200"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
                const profit = (item.totalPrice) - ((item.costPrice || 0) * item.quantity);
                const profitMargin = item.totalPrice > 0 ? (profit / item.totalPrice) * 100 : 0;

                return (
                <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50 transition-colors ${selectedIds.has(item.id) ? 'bg-emerald-50/60' : ''}`}
                >
                    {!readOnly && (
                        <td className="px-4 py-3 text-center align-top">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelect(item.id)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer mt-2"
                            />
                        </td>
                    )}
                    <td className="px-2 py-3 text-center text-slate-400 font-medium align-top pt-4 text-xs">
                    {index + 1}
                    </td>
                    <td className="px-4 py-2 align-top">
                    {readOnly ? (
                        <div className="font-medium text-slate-900 py-1">{item.itemName}</div>
                    ) : (
                        <input 
                        type="text" 
                        value={item.itemName}
                        onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none py-1.5 px-2 rounded-lg font-medium text-slate-900 transition-all placeholder-slate-300"
                        placeholder="Tên hạng mục"
                        />
                    )}
                    </td>
                    <td className="px-4 py-2 align-top">
                    {readOnly ? (
                        <>
                            <div className="text-slate-800">{item.description}</div>
                            <div className="text-slate-500 text-xs mt-1">VL: {item.material}</div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            {/* CHANGED to INPUT to support DATALIST autocomplete */}
                            <input 
                                type="text"
                                list="kb-descriptions"
                                value={item.description}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-lg p-1.5 text-slate-800 text-xs transition-all"
                                placeholder="Mô tả kỹ thuật (Gõ để gợi ý)..."
                            />
                            <div className="flex items-center text-xs group">
                            <span className="text-slate-400 mr-2 whitespace-nowrap group-hover:text-emerald-500 font-medium">VL:</span>
                            <input 
                                type="text"
                                list="kb-materials"
                                value={item.material}
                                onChange={(e) => handleItemChange(item.id, 'material', e.target.value)}
                                className="flex-1 bg-transparent border-b border-slate-200 focus:border-emerald-500 focus:outline-none text-slate-600 pb-0.5"
                                placeholder="Chất liệu (Gõ để gợi ý)..."
                            />
                            </div>
                        </div>
                    )}
                    </td>

                    {/* SOURCE COLUMN */}
                    {showInternalCost && (
                         <td className="px-2 py-2 align-top">
                             <select
                                value={item.source || 'produced'}
                                onChange={(e) => handleItemChange(item.id, 'source', e.target.value)}
                                className={`w-full text-[11px] p-1.5 rounded-lg border outline-none font-medium ${
                                    item.source === 'outsourced' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                             >
                                 <option value="produced">Xưởng SX</option>
                                 <option value="outsourced">Mua ngoài</option>
                             </select>
                         </td>
                    )}

                    <td className="px-2 py-2 text-center align-top">
                    {readOnly ? (
                        <div className="py-1">{item.unit}</div>
                    ) : (
                        <input 
                        type="text" 
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        className="w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none py-1.5 px-1 rounded-lg text-slate-600 transition-all"
                        />
                    )}
                    </td>
                    <td className="px-2 py-2 text-center align-top">
                    {readOnly ? (
                        <div className="font-medium text-slate-800 py-1">{item.quantity}</div>
                    ) : (
                        <input 
                        type="number" 
                        min="0"
                        step="0.1"
                        value={item.quantity === 0 ? '' : item.quantity} 
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full text-center bg-transparent border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none py-1.5 px-1 font-bold text-slate-800 focus:bg-white transition-all focus:ring-2 focus:ring-emerald-100"
                        />
                    )}
                    </td>
                    
                    {showPrices && (
                        <>
                            <td className="px-4 py-2 text-right align-top">
                                <input 
                                type="number" 
                                min="0"
                                step="1000"
                                value={item.unitPrice === 0 ? '' : item.unitPrice}
                                onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                className="w-full text-right bg-transparent border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none py-1.5 px-2 text-slate-700 focus:bg-white transition-all focus:ring-2 focus:ring-emerald-100 font-medium"
                                />
                            </td>
                            {showInternalCost && (
                                <td className="px-4 py-2 text-right align-top bg-orange-50/30">
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="1000"
                                        value={item.costPrice === 0 ? '' : item.costPrice}
                                        onChange={(e) => handleItemChange(item.id, 'costPrice', e.target.value)}
                                        className="w-full text-right bg-transparent border border-orange-200 rounded-lg focus:border-orange-500 focus:outline-none py-1.5 px-2 text-orange-700 font-medium focus:bg-white transition-all"
                                    />
                                </td>
                            )}
                            <td className="px-4 py-2 text-right font-bold text-emerald-600 align-top">
                                <input 
                                type="number" 
                                min="0"
                                step="1000"
                                value={item.totalPrice === 0 ? '' : item.totalPrice}
                                onChange={(e) => handleItemChange(item.id, 'totalPrice', e.target.value)}
                                className="w-full text-right bg-transparent border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none py-1.5 px-2 text-emerald-600 font-bold focus:bg-white transition-all"
                                />
                            </td>
                            {showInternalCost && (
                                <td className="px-4 py-2 text-right align-top bg-indigo-50/30">
                                    <div className={`text-xs font-bold ${profit >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                                        {formatCurrency(profit)}
                                    </div>
                                    <div className={`text-[10px] font-medium mt-1 px-1 rounded inline-block ${profitMargin >= 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                        {profitMargin.toFixed(1)}%
                                    </div>
                                </td>
                            )}
                        </>
                    )}
                    
                    <td className="px-4 py-2 align-top">
                    {readOnly ? (
                        <div className="text-slate-600 text-sm py-1">{item.note}</div>
                    ) : (
                        <textarea 
                        value={item.note || ''}
                        onChange={(e) => handleItemChange(item.id, 'note', e.target.value)}
                        rows={2}
                        placeholder="..."
                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-lg p-1.5 text-slate-600 resize-none text-xs transition-all italic"
                        />
                    )}
                    </td>
                    {!readOnly && (
                        <td className="px-2 py-3 align-top text-center">
                            <button 
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => deleteSingleItem(item.id)}
                                className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors shadow-sm"
                                title="Xóa dòng này"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </td>
                    )}
                </tr>
                );
            })}
          </tbody>
          {!readOnly && (
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={showPrices ? (showInternalCost ? 13 : 11) : 9} className="px-4 py-4">
                  <button 
                    onClick={addItem}
                    className="w-full py-2.5 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-600 font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center shadow-sm"
                  >
                    + Thêm hạng mục
                  </button>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default QuotationTable;
