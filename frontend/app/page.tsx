// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, TrendingUp, FileText } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import StudentList from '@/components/StudentList';
import MonthlyView from '@/components/MonthlyView';
import DocumentLibrary from '@/components/DocumentLibrary';

type View = 'dashboard' | 'students' | 'monthly' | 'documents';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Hệ Thống Quản Lý Gia Sư
              </h1>
              <p className="text-gray-600">
                Quản lý học sinh, buổi học và doanh thu theo tháng
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <TrendingUp className="inline mr-2" size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('students')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'students'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <User className="inline mr-2" size={18} />
              Học sinh
            </button>
            <button
              onClick={() => setCurrentView('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Calendar className="inline mr-2" size={18} />
              Theo tháng
            </button>
            <button
              onClick={() => setCurrentView('documents')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'documents'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FileText className="inline mr-2" size={18} />
              Tài liệu
            </button>
          </div>
        </div>

        {/* Content */}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'students' && <StudentList />}
        {currentView === 'monthly' && <MonthlyView />}
        {currentView === 'documents' && <DocumentLibrary />}
      </div>
    </div>
  );
}