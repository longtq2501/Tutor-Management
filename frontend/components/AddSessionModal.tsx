// src/components/AddSessionModal.tsx
'use client';

import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface AddSessionModalProps {
  onClose: () => void;
  onSubmit: (sessions: number, hoursPerSession: number, sessionDate: string, month: string) => void;
}

export default function AddSessionModal({ onClose, onSubmit }: AddSessionModalProps) {
  const [sessions, setSessions] = useState<number>(1);
  const [hoursPerSession, setHoursPerSession] = useState<number>(2);
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sessions < 1) {
      alert('Số buổi học phải lớn hơn 0');
      return;
    }
    
    if (hoursPerSession < 0.5) {
      alert('Số giờ mỗi buổi phải lớn hơn 0.5');
      return;
    }
    
    if (!sessionDate) {
      alert('Vui lòng chọn ngày dạy');
      return;
    }
    
    // Extract month from date (YYYY-MM)
    const month = sessionDate.substring(0, 7);
    
    onSubmit(sessions, hoursPerSession, sessionDate, month);
  };

  const totalHours = sessions * hoursPerSession;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Thêm buổi học</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Ngày dạy */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="inline mr-2" size={16} />
                Ngày dạy <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900"  // 🆕 Thêm text-gray-900 để chữ đen
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Chọn ngày cụ thể bạn dạy (có thể chọn ngày quá khứ)
              </p>
            </div>

            {/* Số buổi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số buổi học <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={sessions}
                onChange={(e) => setSessions(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900"  // 🆕 Thêm text-gray-900
                required
              />
            </div>

            {/* Số giờ mỗi buổi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="inline mr-2" size={16} />
                Số giờ mỗi buổi <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={hoursPerSession}
                onChange={(e) => setHoursPerSession(parseFloat(e.target.value) || 2)}
                min="0.5"
                step="0.5"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-gray-900"  // 🆕 Thêm text-gray-900
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mặc định: 2 giờ/buổi
              </p>
            </div>

            {/* Tổng kết */}
            <div className="bg-indigo-50 rounded-xl p-4 border-2 border-indigo-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Tổng giờ:</span>
                <span className="text-xl font-bold text-indigo-600">
                  {totalHours.toFixed(1)} giờ
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Tháng:</span>
                <span className="font-semibold">
                  {sessionDate.substring(0, 7)}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              Thêm buổi học
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold transition-all"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
