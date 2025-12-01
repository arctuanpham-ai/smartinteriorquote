
import React from 'react';
import { ProjectStage } from '../types';

interface ProjectProgressProps {
  stages: ProjectStage[];
  onUpdateStage: (stageId: string) => void;
  totalCost: number;
}

const STAGE_WEIGHTS = [
    0.05, 0.15, 0.05, 0.05, 0.10, 0.15, 0.20, 0.05, 0.20
];

const ProjectProgress: React.FC<ProjectProgressProps> = ({ stages, onUpdateStage, totalCost }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 border-emerald-600 ring-4 ring-emerald-100 shadow-emerald-200';
      case 'in_progress': return 'bg-teal-400 border-teal-500 animate-pulse ring-4 ring-teal-100';
      default: return 'bg-white border-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang thực hiện';
      default: return 'Chờ thực hiện';
    }
  };

  const getStatusTextColor = (status: string) => {
     switch (status) {
      case 'completed': return 'text-emerald-600 font-bold';
      case 'in_progress': return 'text-teal-600 font-bold';
      default: return 'text-slate-400';
    }
  };

  const calculateEstimate = () => {
      const baseDays = 5;
      const daysPerValue = 15000000;
      const buffer = 2;
      
      const productionDays = Math.ceil(totalCost / daysPerValue);
      const totalDays = totalCost > 0 ? (baseDays + productionDays + buffer) : 0;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + totalDays);

      return { totalDays, startDate, endDate };
  };

  const { totalDays, startDate, endDate } = calculateEstimate();

  const getStageDuration = (index: number) => {
      if (totalDays === 0) return 0;
      const weight = STAGE_WEIGHTS[index] || 0.1;
      return Math.max(1, Math.round(totalDays * weight));
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-fade-in">
      {/* Estimation Card - 3D Block */}
      <div className="mb-10 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center shadow-lg transform hover:-translate-y-1 transition-transform duration-300">
          <div>
              <h3 className="text-xl font-extrabold text-emerald-900 mb-2">Dự kiến thời gian thi công</h3>
              <p className="text-emerald-700/80 font-medium">
                  Dựa trên khối lượng công việc và giá trị hợp đồng ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCost)}).
              </p>
          </div>
          <div className="mt-6 md:mt-0 flex gap-8 text-center bg-white/80 p-5 rounded-xl backdrop-blur-sm border border-emerald-200 shadow-sm">
              <div>
                  <div className="text-4xl font-black text-emerald-500 drop-shadow-sm">{totalDays}</div>
                  <div className="text-xs text-emerald-800 uppercase font-bold tracking-wider mt-1">Ngày</div>
              </div>
              <div className="w-0.5 bg-emerald-100 h-12 self-center"></div>
               <div>
                  <div className="text-2xl font-bold text-slate-800">{endDate.toLocaleDateString('vi-VN')}</div>
                  <div className="text-xs text-emerald-800 uppercase font-bold tracking-wider mt-1">Bàn giao (Dự kiến)</div>
              </div>
          </div>
      </div>

      <h3 className="text-2xl font-extrabold text-slate-800 mb-8 pl-4 border-l-8 border-emerald-400">Tiến độ thi công chi tiết</h3>
      
      <div className="relative pl-6">
        {/* Vertical Line */}
        <div className="absolute top-4 left-[34px] bottom-10 w-1 bg-slate-100 rounded-full -z-0"></div>

        <div className="space-y-6">
          {stages.map((stage, index) => {
            const estimatedStageDays = getStageDuration(index);
            const isCompleted = stage.status === 'completed';

            return (
                <div 
                    key={stage.id} 
                    className="relative flex items-center cursor-pointer group"
                    onClick={() => onUpdateStage(stage.id)}
                >
                {/* Dot */}
                <div className={`w-6 h-6 rounded-full border-4 z-10 transition-all duration-300 flex-shrink-0 mr-6 shadow-md ${getStatusColor(stage.status)} group-hover:scale-125`}>
                    {isCompleted && (
                        <svg className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    )}
                </div>

                {/* Content Card */}
                <div className={`flex-1 p-5 rounded-2xl border-2 transition-all duration-200 btn-3d ${
                    isCompleted 
                    ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-emerald-300 shadow-sm hover:shadow-md'
                }`}>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                        <div>
                            <h4 className={`text-base font-bold ${stage.status === 'pending' ? 'text-slate-400' : 'text-slate-800'} group-hover:text-emerald-700 transition-colors`}>
                                {index + 1}. {stage.name}
                            </h4>
                            <div className={`text-sm mt-1.5 flex items-center gap-3`}>
                                <span className={getStatusTextColor(stage.status)}>
                                    {getStatusText(stage.status)}
                                </span>
                                {estimatedStageDays > 0 && (
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                                        ~ {estimatedStageDays} ngày
                                    </span>
                                )}
                            </div>
                        </div>
                        {stage.updatedAt && stage.status !== 'pending' && (
                            <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap font-bold shadow-sm">
                                {new Date(stage.updatedAt).toLocaleDateString('vi-VN')}
                            </div>
                        )}
                    </div>
                </div>
                </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs text-slate-400 font-bold uppercase tracking-wider bg-slate-50 py-3 rounded-full">
         Bấm vào từng bước để chuyển trạng thái: Chờ → Đang làm → Hoàn thành
      </div>
    </div>
  );
};

export default ProjectProgress;
