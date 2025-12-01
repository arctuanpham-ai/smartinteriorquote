
import React, { useState } from 'react';
import { Room, CompanyInfo } from '../types';
import { DownloadIcon, BanknotesIcon, CalculatorIcon } from './Icons';

// Access global libraries loaded via script tags in index.html
declare const window: any;

interface SummaryExportProps {
  rooms: Room[];
  companyInfo: CompanyInfo;
  projectName?: string;
  onNavigateToFinance?: () => void; // New prop for navigation shortcut
}

const SummaryExport: React.FC<SummaryExportProps> = ({ rooms, companyInfo, projectName = "Dự án", onNavigateToFinance }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showInternalCost, setShowInternalCost] = useState(false); // Toggle state for Cost Price view
  
  const roomsWithItems = rooms.filter(r => r.items.length > 0);
  const totalProjectCost = rooms.reduce((sum, r) => sum + r.totalCost, 0);

  // Calculate Total Cost Price (Internal)
  const totalProjectInternalCost = rooms.reduce((sum, r) => {
      const roomCost = r.items.reduce((rSum, item) => {
          // Use item.costPrice if set, otherwise default to 70% of unitPrice
          const itemCost = item.costPrice && item.costPrice > 0 ? item.costPrice : item.unitPrice * 0.7;
          return rSum + (itemCost * item.quantity);
      }, 0);
      return sum + roomCost;
  }, 0);

  const totalProjectProfit = totalProjectCost - totalProjectInternalCost;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const calculateEstimatedDays = () => {
    const baseDays = 5;
    const daysPerValue = 15000000;
    const buffer = 2;
    const days = totalProjectCost > 0 ? (baseDays + Math.ceil(totalProjectCost / daysPerValue) + buffer) : 0;
    return days;
  };
  
  const estimatedDays = calculateEstimatedDays();

  // --- EXCEL EXPORT (HTML Method for Styles) ---
  const exportToExcel = () => {
    try {
        const fileName = `BaoGia_${projectName.replace(/[^a-z0-9]/gi, '_')}.xls`;
        
        // Build HTML Content
        let htmlRows = '';
        let stt = 1;

        roomsWithItems.forEach(room => {
            // Room Header Row
            htmlRows += `
                <tr style="background-color: #f3f4f6;">
                    <td colspan="10" style="font-weight: bold; border: 1px solid #000; padding: 5px;">${room.name} (${room.type})</td>
                </tr>
            `;
            
            // Items
            room.items.forEach(item => {
                htmlRows += `
                    <tr>
                        <td style="border: 1px solid #000; text-align: center; vertical-align: top;">${stt++}</td>
                        <td style="border: 1px solid #000; vertical-align: top;">${item.itemName}</td>
                        <td style="border: 1px solid #000; vertical-align: top;">
                            ${item.description} 
                            <br style="mso-data-placement:same-cell;" />
                            <b>Vật liệu:</b> ${item.material}
                        </td>
                        <td style="border: 1px solid #000; text-align: center; vertical-align: top;">${item.unit}</td>
                        <td style="border: 1px solid #000; text-align: center; vertical-align: top;">${item.quantity}</td>
                        <td style="border: 1px solid #000; text-align: right; vertical-align: top;">${item.unitPrice}</td>
                        <td style="border: 1px solid #000; text-align: right; vertical-align: top;">${item.totalPrice}</td>
                        <td style="border: 1px solid #000; vertical-align: top;">${item.note || ''}</td>
                    </tr>
                `;
            });

            // Room Total
             htmlRows += `
                <tr>
                    <td colspan="6" style="border: 1px solid #000; text-align: right; font-weight: bold;">Cộng ${room.name}:</td>
                    <td style="border: 1px solid #000; text-align: right; font-weight: bold; color: #059669;">${room.totalCost}</td>
                    <td style="border: 1px solid #000;"></td>
                </tr>
            `;
        });

        const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8" />
                <style>
                    body { font-family: 'Times New Roman', Times, serif; }
                    table { border-collapse: collapse; width: 100%; }
                    td, th { border: 1px solid #000000; padding: 5px; vertical-align: top; }
                    .header { font-weight: bold; background-color: #f0f0f0; }
                    .title { font-size: 18px; font-weight: bold; text-align: center; border: none; }
                </style>
            </head>
            <body>
                <table>
                    <tr><td colspan="8" style="border:none; font-weight:bold; font-size:14px;">${companyInfo.name.toUpperCase()}</td></tr>
                    <tr><td colspan="8" style="border:none;">${companyInfo.address}</td></tr>
                    <tr><td colspan="8" style="border:none;">SĐT: ${companyInfo.phone} - Email: ${companyInfo.email}</td></tr>
                    <tr><td colspan="8" style="border:none;"></td></tr>
                    <tr><td colspan="8" style="border:none; text-align:center; font-size:20px; font-weight:bold;">BẢNG BÁO GIÁ NỘI THẤT</td></tr>
                    <tr><td colspan="8" style="border:none; text-align:center;">Dự án: ${projectName}</td></tr>
                    <tr><td colspan="8" style="border:none; text-align:center;">Ngày: ${new Date().toLocaleDateString('vi-VN')}</td></tr>
                    <tr><td colspan="8" style="border:none; text-align:center;">Thời gian thi công dự kiến: ${estimatedDays} ngày</td></tr>
                    <tr><td colspan="8" style="border:none;"></td></tr>
                    
                    <tr style="background-color: #4f46e5; color: white;">
                        <th style="border: 1px solid #000; width: 50px;">STT</th>
                        <th style="border: 1px solid #000; width: 200px;">Hạng mục</th>
                        <th style="border: 1px solid #000; width: 300px;">Mô tả & Vật liệu</th>
                        <th style="border: 1px solid #000;">ĐVT</th>
                        <th style="border: 1px solid #000;">SL</th>
                        <th style="border: 1px solid #000;">Đơn giá</th>
                        <th style="border: 1px solid #000;">Thành tiền</th>
                        <th style="border: 1px solid #000; width: 150px;">Ghi chú</th>
                    </tr>
                    ${htmlRows}
                    <tr>
                        <td colspan="6" style="border: 1px solid #000; text-align: right; font-weight: bold; font-size: 16px;">TỔNG CỘNG TOÀN CÔNG TRÌNH:</td>
                        <td style="border: 1px solid #000; text-align: right; font-weight: bold; font-size: 16px; color: #dc2626;">${totalProjectCost}</td>
                        <td style="border: 1px solid #000;"></td>
                    </tr>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Excel Export Error:", error);
        alert("Lỗi xuất Excel: " + (error as any).message);
    }
  };


  // --- PDF EXPORT ---
  // Font loader with timeout to prevent hanging
  const loadFontWithTimeout = async (url: string, timeout = 3000): Promise<string> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          if (!response.ok) throw new Error("Fetch failed");
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  resolve(result.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
          });
      } catch (error) {
          clearTimeout(id);
          throw error;
      }
  };

  const exportToPDF = async () => {
    if (!window.jspdf) {
        alert("Thư viện PDF chưa sẵn sàng. Vui lòng tải lại trang.");
        return;
    }

    setIsExporting(true);
    setStatusMessage("Đang chuẩn bị...");

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Try to load Tinos (Times New Roman compatible)
      let fontLoaded = false;
      try {
          setStatusMessage("Đang tải font tiếng Việt...");
          // Use a reliable CDN for Tinos
          const fontUrl = "https://fonts.gstatic.com/s/tinos/v28/LL2ZDK04Xy5VM8m8-gs.ttf";
          const fontBase64 = await loadFontWithTimeout(fontUrl, 4000); // 4s timeout
          
          doc.addFileToVFS("TimesNewRoman.ttf", fontBase64);
          doc.addFont("TimesNewRoman.ttf", "TimesNewRoman", "normal");
          doc.setFont("TimesNewRoman");
          fontLoaded = true;
      } catch (fontError) {
          console.warn("Font load failed, falling back to default", fontError);
      }

      setStatusMessage("Đang tạo file PDF...");

      // --- PDF GENERATION CONTENT ---
      let yPos = 15;
      
      // LOGO
      if (companyInfo.logo) {
          try {
              doc.addImage(companyInfo.logo, 'JPEG', 15, 10, 25, 25);
          } catch (e) {}
      }
      
      // COMPANY INFO
      const textX = companyInfo.logo ? 45 : 15;
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      
      // Use standard font if custom failed, but warn user
      if (!fontLoaded) {
          doc.text("WARNING: Font failed to load. Vietnamese text may be garbled.", 15, 290);
      }

      const companyName = companyInfo.name ? companyInfo.name.toUpperCase() : 'CÔNG TY NỘI THẤT';
      doc.text(companyName, textX, yPos);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Đ/c: ${companyInfo.address}`, textX, yPos + 6);
      doc.text(`SĐT: ${companyInfo.phone} | Email: ${companyInfo.email}`, textX, yPos + 11);
      
      yPos += 35;
      
      // TITLE
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("BẢNG BÁO GIÁ DỰ TOÁN NỘI THẤT", 105, yPos, { align: "center" });
      yPos += 8;
      
      doc.setFontSize(12);
      doc.text(`Dự án: ${projectName}`, 105, yPos, { align: "center" });
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`Ngày: ${new Date().toLocaleDateString('vi-VN')} - Thời gian thi công: ${estimatedDays} ngày`, 105, yPos, { align: "center" });
      
      yPos += 10;

      // TABLE
      const tableBody: any[] = [];
      
      roomsWithItems.forEach(room => {
          tableBody.push([{ content: `${room.name.toUpperCase()} (${room.type})`, colSpan: 8, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
          
          room.items.forEach((item, index) => {
              tableBody.push([
                  index + 1,
                  item.itemName,
                  `${item.description}\nVL: ${item.material}`,
                  item.unit,
                  item.quantity,
                  formatCurrency(item.totalPrice),
                  item.note || ''
              ]);
          });
          
          tableBody.push([{ content: `Cộng ${room.name}:`, colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatCurrency(room.totalCost), styles: { fontStyle: 'bold', textColor: [16, 185, 129] } }]);
      });

      tableBody.push([{ content: 'TỔNG CỘNG TOÀN CÔNG TRÌNH:', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: [220, 252, 231] } }, { content: formatCurrency(totalProjectCost), styles: { fontStyle: 'bold', textColor: [220, 38, 38], fillColor: [220, 252, 231] } }]);

      doc.autoTable({
          startY: yPos,
          head: [['STT', 'Hạng mục', 'Mô tả & Vật liệu', 'ĐVT', 'SL', 'Thành tiền', 'Ghi chú']],
          body: tableBody,
          theme: 'grid',
          styles: { 
              font: fontLoaded ? 'TimesNewRoman' : 'helvetica', 
              fontSize: 9, 
              cellPadding: 2, 
              valign: 'middle',
              lineColor: [200, 200, 200]
          },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
              0: { cellWidth: 8, halign: 'center' },
              1: { cellWidth: 35 },
              2: { cellWidth: 'auto' },
              3: { cellWidth: 12, halign: 'center' },
              4: { cellWidth: 12, halign: 'center' },
              5: { cellWidth: 25, halign: 'right' },
              6: { cellWidth: 25 },
          },
          margin: { top: 20 },
      });

      const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`Bao_Gia_${safeName}.pdf`);

    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Lỗi xuất PDF (Chi tiết: " + (error as any).message + "). Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
      setStatusMessage('');
    }
  };

  return (
    <div className={`rounded-2xl shadow-sm border p-8 transition-colors duration-300 animate-fade-in ${showInternalCost ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b border-slate-100 pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
              {showInternalCost ? 'Bảng Giá Vốn (Nội Bộ)' : 'Tổng hợp Báo giá'}
          </h2>
          <p className={`text-xl font-bold mt-2 ${showInternalCost ? 'text-orange-600' : 'text-emerald-600'}`}>{projectName}</p>
          <p className="text-slate-500 text-sm mt-1">
              {showInternalCost 
               ? 'CẢNH BÁO: Đây là dữ liệu nội bộ. Không gửi file này cho khách hàng.' 
               : 'Xuất file báo giá chuẩn font Times New Roman.'}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1.5 shadow-inner">
                 <button 
                    onClick={() => setShowInternalCost(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!showInternalCost ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     Báo giá Khách
                 </button>
                 <button 
                    onClick={() => setShowInternalCost(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center ${showInternalCost ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     <BanknotesIcon className="w-4 h-4 mr-2" />
                     Giá Vốn
                 </button>
            </div>

            <div className="flex space-x-3">
                {onNavigateToFinance && (
                    <button 
                        onClick={onNavigateToFinance}
                        className="flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm hover:border-slate-400"
                    >
                        <CalculatorIcon className="w-5 h-5 mr-2 text-slate-500" />
                        Phân tích SX
                    </button>
                )}

                {!showInternalCost && (
                    <>
                        <button 
                            onClick={exportToExcel}
                            className="flex items-center px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm hover:shadow-emerald-200"
                        >
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            Excel
                        </button>
                        <button 
                            onClick={exportToPDF}
                            disabled={isExporting}
                            className={`flex items-center px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow-red-200 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isExporting ? 'Đang tạo...' : 'PDF'}
                        </button>
                    </>
                )}
            </div>
        </div>
      </div>

      <div className="space-y-8">
         {/* Preview Section */}
         <div className="border border-slate-200 rounded-xl p-8 bg-slate-100/50 min-h-[600px] overflow-auto shadow-inner">
            <div className="bg-white shadow-2xl w-[210mm] mx-auto p-12 min-h-[297mm] font-serif border border-slate-100">
                {/* Simulated A4 Paper Header */}
                <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-800">
                    {companyInfo.logo && (
                        <img src={companyInfo.logo} alt="Logo" className="h-24 object-contain max-w-[200px]" />
                    )}
                    <div className={companyInfo.logo ? "text-right" : "text-left"}>
                        <h1 className="font-bold text-xl text-slate-900 uppercase tracking-wide" style={{ fontFamily: 'Times New Roman' }}>{companyInfo.name || "Tên Công Ty"}</h1>
                        <p className="text-slate-600 mt-1" style={{ fontFamily: 'Times New Roman' }}>{companyInfo.address || "Địa chỉ công ty"}</p>
                        <p className="text-slate-600" style={{ fontFamily: 'Times New Roman' }}>{companyInfo.phone} - {companyInfo.email}</p>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h2 className={`text-3xl font-bold uppercase tracking-wider ${showInternalCost ? 'text-orange-600' : 'text-slate-900'}`} style={{ fontFamily: 'Times New Roman' }}>
                        {showInternalCost ? 'BẢNG TÍNH GIÁ VỐN & LỢI NHUẬN' : 'BẢNG BÁO GIÁ NỘI THẤT'}
                    </h2>
                    <p className="font-bold text-xl text-slate-800 mt-2" style={{ fontFamily: 'Times New Roman' }}>{projectName}</p>
                    <div className="flex justify-center items-center gap-4 mt-2 text-slate-500 italic" style={{ fontFamily: 'Times New Roman' }}>
                        <span>Ngày: {new Date().toLocaleDateString('vi-VN')}</span>
                        {!showInternalCost && (
                            <>
                                <span>|</span>
                                <span className="text-emerald-700 font-bold not-italic">Thời gian thi công dự kiến: {estimatedDays} ngày</span>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {roomsWithItems.length === 0 ? (
                        <p className="text-center text-slate-400 italic py-10">Chưa có dữ liệu báo giá trong dự án này.</p>
                    ) : (
                        roomsWithItems.map(room => {
                            // Calculate Room Cost Stats
                             const roomInternalCost = room.items.reduce((sum, item) => {
                                 const c = item.costPrice && item.costPrice > 0 ? item.costPrice : item.unitPrice * 0.7;
                                 return sum + (c * item.quantity);
                             }, 0);
                             const roomProfit = room.totalCost - roomInternalCost;

                            return (
                                <div key={room.id}>
                                    <h3 className={`font-bold text-lg text-slate-800 bg-slate-100 p-3 mb-1 border-l-4 ${showInternalCost ? 'border-orange-500' : 'border-slate-800'}`} style={{ fontFamily: 'Times New Roman' }}>
                                        {room.name} ({room.type})
                                    </h3>
                                    <table className="w-full text-sm" style={{ fontFamily: 'Times New Roman' }}>
                                        <thead className="bg-slate-50 border-b border-slate-300">
                                            <tr className="text-left font-bold text-slate-900">
                                                <th className="py-2 pl-2 w-10 text-center border-r border-slate-300">STT</th>
                                                <th className="py-2 pl-2 w-1/4 border-r border-slate-300">Hạng mục</th>
                                                {!showInternalCost && <th className="py-2 pl-2 w-1/4 border-r border-slate-300">Mô tả & Vật liệu</th>}
                                                <th className="py-2 text-center border-r border-slate-300">ĐVT</th>
                                                <th className="py-2 text-center border-r border-slate-300">SL</th>
                                                
                                                {showInternalCost ? (
                                                    <>
                                                        <th className="py-2 text-right border-r border-slate-300 text-orange-600">Giá Vốn</th>
                                                        <th className="py-2 text-right border-r border-slate-300 text-emerald-600">Giá Bán</th>
                                                        <th className="py-2 text-right pr-2 text-indigo-600">Lợi Nhuận</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="py-2 text-right border-r border-slate-300">Đơn giá</th>
                                                        <th className="py-2 text-right pr-2">Thành tiền</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {room.items.map((item, idx) => {
                                                const itemCost = item.costPrice && item.costPrice > 0 ? item.costPrice : item.unitPrice * 0.7;
                                                const itemTotalCost = itemCost * item.quantity;
                                                const itemProfit = item.totalPrice - itemTotalCost;

                                                return (
                                                    <tr key={idx} className="border-b border-slate-200">
                                                        <td className="py-2 text-center text-slate-600 border-r border-slate-200">{idx + 1}</td>
                                                        <td className="py-2 pl-2 font-medium border-r border-slate-200">{item.itemName}</td>
                                                        {!showInternalCost && (
                                                            <td className="py-2 pl-2 text-slate-600 border-r border-slate-200 italic">
                                                                {item.description}
                                                                <br/>
                                                                <b>Vật liệu:</b> {item.material}
                                                            </td>
                                                        )}
                                                        <td className="py-2 text-center border-r border-slate-200">{item.unit}</td>
                                                        <td className="py-2 text-center border-r border-slate-200">{item.quantity}</td>
                                                        
                                                        {showInternalCost ? (
                                                            <>
                                                                <td className="py-2 text-right border-r border-slate-200 text-orange-600">{formatCurrency(itemCost)}</td>
                                                                <td className="py-2 text-right border-r border-slate-200">{formatCurrency(item.unitPrice)}</td>
                                                                <td className="py-2 text-right pr-2 font-bold text-indigo-600">{formatCurrency(itemProfit)}</td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <td className="py-2 text-right border-r border-slate-200">{formatCurrency(item.unitPrice)}</td>
                                                                <td className="py-2 text-right pr-2 font-medium">{formatCurrency(item.totalPrice)}</td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50">
                                                <td colSpan={showInternalCost ? 5 : 6} className="py-2 text-right font-bold border-t border-slate-300 pr-2">Cộng {room.name}:</td>
                                                {showInternalCost && (
                                                     <td className="py-2 text-right font-bold text-orange-600 border-t border-slate-300">{formatCurrency(roomInternalCost)}</td>
                                                )}
                                                <td className={`py-2 text-right font-bold border-t border-slate-300 ${showInternalCost ? '' : 'pr-2 text-emerald-600'}`}>
                                                    {formatCurrency(room.totalCost)}
                                                </td>
                                                {showInternalCost && (
                                                     <td className="py-2 text-right font-bold text-indigo-600 border-t border-slate-300 pr-2">{formatCurrency(roomProfit)}</td>
                                                )}
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-12 pt-6 border-t-2 border-slate-900 flex justify-between items-end">
                    <div>
                         <div className="text-xl font-bold text-slate-900 uppercase" style={{ fontFamily: 'Times New Roman' }}>TỔNG CỘNG TOÀN CÔNG TRÌNH:</div>
                         <div className="text-sm italic text-slate-500 mt-1" style={{ fontFamily: 'Times New Roman' }}>(Bằng chữ: .........................................................................................)</div>
                    </div>
                    <div className="text-right">
                         <div className="text-3xl font-bold text-red-600" style={{ fontFamily: 'Times New Roman' }}>{formatCurrency(totalProjectCost)}</div>
                         {showInternalCost && (
                             <div className="text-sm text-slate-500 mt-1">
                                 Lợi nhuận gộp: <span className="font-bold text-indigo-600">{formatCurrency(totalProjectProfit)}</span>
                             </div>
                         )}
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default SummaryExport;
