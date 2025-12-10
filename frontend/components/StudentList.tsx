// src/components/StudentList.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Calendar, DollarSign, Clock, Power } from 'lucide-react';
import { studentsApi, sessionsApi } from '@/lib/api';
import type { Student } from '@/lib/types';
import StudentModal from './StudentModal';
import AddSessionModal from './AddSessionModal';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [selectedStudentIdForSession, setSelectedStudentIdForSession] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (showAddSessionModal || showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddSessionModal, showModal]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsApi.getAll();
      setStudents(response.data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Xóa học sinh sẽ xóa toàn bộ lịch sử học của học sinh này. Bạn có chắc?')) {
      return;
    }
    try {
      await studentsApi.delete(id);
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Không thể xóa học sinh!');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await studentsApi.toggleActive(id);
      loadStudents();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Không thể thay đổi trạng thái!');
    }
  };

  const openAddSessionModal = (studentId: number) => {
    setSelectedStudentIdForSession(studentId);
    setShowAddSessionModal(true);
  };

  const handleAddSessionSubmit = async (
    sessionsCount: number,
    hoursPerSession: number,
    sessionDate: string,
    month: string,
  ) => {
    if (!selectedStudentIdForSession) return;
    try {
      await sessionsApi.create({
        studentId: selectedStudentIdForSession,
        month: month,
        sessions: sessionsCount,
        sessionDate: sessionDate,
        hoursPerSession: hoursPerSession
      });
      setShowAddSessionModal(false);
      setSelectedStudentIdForSession(null);
      loadStudents();
      alert(`Đã thêm buổi học ngày ${sessionDate} thành công!`);
    } catch (error) {
      console.error('Error adding session:', error);
      alert('Không thể thêm buổi học!');
    }
  };

  const filteredStudents = students.filter(student => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return student.active;
    if (filterStatus === 'inactive') return !student.active;
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  const activeCount = students.filter(s => s.active).length;
  const inactiveCount = students.filter(s => !s.active).length;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Danh sách học sinh</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeCount} đang học • {inactiveCount} đã nghỉ
            </p>
          </div>
          <button
            onClick={handleAddStudent}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Thêm học sinh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả ({students.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đang học ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'inactive'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Đã nghỉ ({inactiveCount})
          </button>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <User className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg mb-4">Chưa có học sinh nào</p>
            <button
              onClick={handleAddStudent}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Thêm học sinh đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`border-2 rounded-xl p-6 hover:shadow-md transition-shadow ${
                  student.active ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center flex-1">
                    <div className={`rounded-full p-3 mr-3 ${
                      student.active ? 'bg-indigo-100' : 'bg-gray-200'
                    }`}>
                      <User className={student.active ? 'text-indigo-600' : 'text-gray-500'} size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">{student.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {student.active ? '✓ Đang học' : '✕ Đã nghỉ'}
                        </span>
                      </div>
                      {student.phone && <p className="text-sm text-gray-600">{student.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(student.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        student.active
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                      title={student.active ? 'Đánh dấu đã nghỉ' : 'Đánh dấu đang học'}
                    >
                      <Power size={18} />
                    </button>
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* 🆕 Learning Duration */}
                {student.learningDuration && (
                  <div className="mb-3 px-3 py-2 bg-indigo-50 border-l-4 border-indigo-500 rounded">
                    <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium">
                      <Clock size={14} />
                      {student.learningDuration}
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="mr-2" size={16} />
                    {student.schedule}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="mr-2" size={16} />
                    {formatCurrency(student.pricePerHour)}/giờ
                  </div>
                </div>

                {student.notes && (
                  <p className="text-sm text-gray-600 mb-4 italic">{student.notes}</p>
                )}

                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Đã thu:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(student.totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Chưa thu:</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(student.totalUnpaid)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openAddSessionModal(student.id)}
                  disabled={!student.active}
                  className={`w-full py-2 rounded-lg font-medium transition-colors ${
                    student.active
                      ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  + Thêm buổi học
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <StudentModal
          student={editingStudent}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadStudents();
          }}
        />
      )}

      {showAddSessionModal && selectedStudentIdForSession && (
        <AddSessionModal
          onClose={() => {
            setShowAddSessionModal(false);
            setSelectedStudentIdForSession(null);
          }}
          onSubmit={handleAddSessionSubmit}
        />
      )}
    </>
  );
}