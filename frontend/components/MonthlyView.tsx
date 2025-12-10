// src/components/MonthlyView.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trash2, Clock } from 'lucide-react';
import { sessionsApi } from '@/lib/api';
import type { SessionRecord } from '@/lib/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

const getMonthName = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  return `Tháng ${month}/${year}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
};

export default function MonthlyView() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, [selectedMonth]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await sessionsApi.getByMonth(selectedMonth);
      setRecords(response.data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction: number) => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() + direction);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const handleTogglePayment = async (id: number) => {
    try {
      await sessionsApi.togglePayment(id);
      loadRecords();
    } catch (error) {
      console.error('Error toggling payment:', error);
      alert('Không thể cập nhật trạng thái thanh toán!');
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Xóa buổi học này?')) return;

    try {
      await sessionsApi.delete(id);
      loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Không thể xóa buổi học!');
    }
  };

  // Group by student
  const groupedRecords = records.reduce((acc, record) => {
    const key = record.studentId;
    if (!acc[key]) {
      acc[key] = {
        studentId: record.studentId,
        studentName: record.studentName,
        pricePerHour: record.pricePerHour,
        sessions: [],
        totalSessions: 0,
        totalHours: 0,
        totalAmount: 0,
        allPaid: true,
      };
    }
    acc[key].sessions.push(record);
    acc[key].totalSessions += record.sessions;
    acc[key].totalHours += record.hours;
    acc[key].totalAmount += record.totalAmount;
    if (!record.paid) {
      acc[key].allPaid = false;
    }
    return acc;
  }, {} as Record<number, {
    studentId: number;
    studentName: string;
    pricePerHour: number;
    sessions: SessionRecord[];
    totalSessions: number;
    totalHours: number;
    totalAmount: number;
    allPaid: boolean;
  }>);

  const groupedRecordsArray = Object.values(groupedRecords);

  const totalSessions = records.reduce((sum, r) => sum + r.sessions, 0);
  const totalPaid = records
    .filter((r) => r.paid)
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const totalUnpaid = records
    .filter((r) => !r.paid)
    .reduce((sum, r) => sum + r.totalAmount, 0);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      {/* Month Selector */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {getMonthName(selectedMonth)}
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Tổng buổi học</p>
          <p className="text-2xl font-bold text-blue-600">{totalSessions} buổi</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Đã thu trong tháng</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Chưa thu trong tháng</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalUnpaid)}
          </p>
        </div>
      </div>

      {/* Records List */}
      {records.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 text-lg">
            Chưa có buổi học nào trong tháng này
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedRecordsArray.map((group) => (
            <div
              key={group.studentId}
              className="border-2 rounded-xl p-5 hover:shadow-md transition-all"
            >
              {/* Student Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {group.studentName}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                      {group.totalSessions} buổi × 2h = {group.totalHours}h
                    </span>
                    <span>{formatCurrency(group.pricePerHour)}/giờ</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-800">
                      Tổng: {formatCurrency(group.totalAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Toggle all sessions for this student
                      group.sessions.forEach((session) => {
                        handleTogglePayment(session.id);
                      });
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      group.allPaid
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {group.allPaid ? (
                      <>
                        <CheckCircle size={16} className="inline mr-1" />
                        Đã thanh toán
                      </>
                    ) : (
                      <>
                        <XCircle size={16} className="inline mr-1" />
                        Chưa thanh toán
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Session Dates List */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-gray-600" />
                  <h4 className="font-semibold text-gray-700">Ngày dạy:</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {group.sessions
                    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
                    .map((session) => (
                      <div
                        key={session.id}
                        className={`relative group border-2 rounded-lg p-3 transition-all ${
                          session.paid
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar size={14} className="text-gray-600" />
                              <span className="text-sm font-semibold text-gray-800">
                                {formatDate(session.sessionDate)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {session.sessions} buổi × {session.hours / session.sessions}h
                            </div>
                            <div className="text-xs font-medium text-indigo-600 mt-1">
                              {formatCurrency(session.totalAmount)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteRecord(session.id)}
                            className="opacity-0 group-hover:opacity-100 bg-red-100 hover:bg-red-200 text-red-600 p-1 rounded transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {session.paid && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle size={14} className="text-green-600" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}