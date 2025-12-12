// src/components/MonthlyView.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trash2, Clock, FileText, Check, Users } from 'lucide-react';
import { sessionsApi, invoicesApi } from '@/lib/api';
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
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]); // Array of student IDs
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [selectedMonth]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await sessionsApi.getByMonth(selectedMonth);
      setRecords(response);
      // Reset selections when month changes
      setSelectedStudents([]);
      setSelectAll(false);
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

  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      const allStudentIds = Object.keys(groupedRecords).map(Number);
      setSelectedStudents(allStudentIds);
    }
    setSelectAll(!selectAll);
  };

  const handleGenerateCombinedInvoice = async () => {
    if (selectedStudents.length === 0) {
      alert('Vui lòng chọn ít nhất một học sinh!');
      return;
    }

    try {
      setGeneratingInvoice(true);
      
      // Collect all session IDs from selected students
      const allSessionIds: number[] = [];
      selectedStudents.forEach(studentId => {
        const group = groupedRecords[studentId];
        if (group) {
          group.sessions.forEach(session => {
            allSessionIds.push(session.id);
          });
        }
      });

      if (allSessionIds.length === 0) {
        alert('Không có buổi học nào để tạo báo giá!');
        return;
      }

      // For combined invoice, we need to modify the backend to handle multiple students
      // For now, use the first student as reference (will update backend later)
      const response = await invoicesApi.downloadInvoicePDF({
        studentId: selectedStudents[0],
        month: selectedMonth,
        sessionRecordIds: allSessionIds,
        multipleStudents: true, // New flag to indicate multiple students
        selectedStudentIds: selectedStudents // Send all selected student IDs
      });

      // Generate filename with selected student count
      const studentCount = selectedStudents.length;
      const filename = studentCount === 1 
        ? `Bao-Gia-${selectedMonth}.pdf`
        : `Bao-Gia-${selectedMonth}-${studentCount}-hoc-sinh.pdf`;

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating combined invoice:', error);
      alert('Không thể tạo báo giá chung!');
    } finally {
      setGeneratingInvoice(false);
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

  // Calculate totals for selected students
  const selectedStudentsTotal = selectedStudents.reduce((acc, studentId) => {
    const group = groupedRecords[studentId];
    if (group) {
      acc.totalSessions += group.totalSessions;
      acc.totalHours += group.totalHours;
      acc.totalAmount += group.totalAmount;
    }
    return acc;
  }, { totalSessions: 0, totalHours: 0, totalAmount: 0 });

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

      {/* Combined Invoice Section */}
      {records.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-800">Tạo báo giá chung</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
              >
                {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              <div className="text-sm text-gray-600">
                Đã chọn: <span className="font-bold text-blue-600">{selectedStudents.length}/{groupedRecordsArray.length}</span> học sinh
              </div>
            </div>
          </div>
          
          {selectedStudents.length > 0 && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tổng buổi học đã chọn</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedStudentsTotal.totalSessions} buổi</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tổng giờ học</p>
                  <p className="text-2xl font-bold text-green-600">{selectedStudentsTotal.totalHours} giờ</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tổng tiền</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(selectedStudentsTotal.totalAmount)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Báo giá chung sẽ bao gồm tất cả buổi học của {selectedStudents.length} học sinh đã chọn
              </p>
            </div>
          )}

          <button
            onClick={handleGenerateCombinedInvoice}
            disabled={generatingInvoice || selectedStudents.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingInvoice ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Đang tạo báo giá...
              </>
            ) : (
              <>
                <FileText size={20} />
                {selectedStudents.length === 1 
                  ? 'Tạo báo giá cho 1 học sinh' 
                  : `Tạo báo giá chung (${selectedStudents.length} học sinh)`}
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-3 text-center">
            Lưu ý: Chọn nhiều học sinh để tạo một báo giá chung cho phụ huynh có nhiều con học cùng lúc
          </p>
        </div>
      )}

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
              className={`border-2 rounded-xl p-5 hover:shadow-md transition-all ${
                selectedStudents.includes(group.studentId) 
                  ? 'border-indigo-300 bg-indigo-50' 
                  : 'border-gray-200'
              }`}
            >
              {/* Student Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(group.studentId)}
                    onChange={() => toggleStudentSelection(group.studentId)}
                    className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
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
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Generate individual invoice
                      const sessionIds = group.sessions.map(s => s.id);
                      handleGenerateInvoice(group.studentId, sessionIds);
                    }}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    title="Xuất báo giá riêng"
                  >
                    <FileText size={16} />
                    Báo giá riêng
                  </button>
                  <button
                    onClick={() => {
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

  // Helper function for individual invoice (kept from previous version)
  const handleGenerateInvoice = async (studentId: number, sessionIds: number[]) => {
    try {
      const response = await invoicesApi.downloadInvoicePDF({
        studentId,
        month: selectedMonth,
        sessionRecordIds: sessionIds,
      });

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao-Gia-${selectedMonth}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Không thể tạo báo giá!');
    }
  };
}