'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, CreditCard, AlertCircle } from 'lucide-react';
import { DashboardStats } from '../types/dashboard.types';

interface AnalyticsViewProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

export function AnalyticsView({ stats, isLoading = false }: AnalyticsViewProps) {
  const studentData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Đang học', value: stats.activeStudents || 0 },
      { name: 'Nghỉ học', value: stats.totalStudents - (stats.activeStudents || 0) }
    ];
  }, [stats]);

  const accountData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Gói Pro', value: stats.proAccounts || 0 },
      { name: 'Gói Free', value: stats.freeAccounts || 0 }
    ];
  }, [stats]);

  const financialData = useMemo(() => {
    if (!stats) return [];
    return [
      {
        name: 'Tài chính',
        Đã_thu: stats.totalRevenue || 0,
        Chưa_thu: stats.totalDebt || 0
      }
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[350px] rounded-3xl bg-muted/40 animate-pulse border" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Student Status Pie Chart */}
      <Card className="rounded-3xl border-none bg-gradient-to-b from-card to-muted/20 shadow-xl overflow-hidden group">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Users size={20} />
            </div>
            <CardTitle className="text-lg">Trình trạng học sinh</CardTitle>
          </div>
          <CardDescription>Phân bổ học sinh cũ và mới</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={studentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {studentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Account Type Pie Chart */}
      <Card className="rounded-3xl border-none bg-gradient-to-b from-card to-muted/20 shadow-xl overflow-hidden group">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
              <CreditCard size={20} />
            </div>
            <CardTitle className="text-lg">Loại tài khoản</CardTitle>
          </div>
          <CardDescription>Gói dịch vụ của gia sư</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={accountData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {accountData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Debt vs Revenue Bar Chart */}
      <Card className="rounded-3xl border-none bg-gradient-to-b from-card to-muted/20 shadow-xl overflow-hidden group">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <AlertCircle size={20} />
            </div>
            <CardTitle className="text-lg">Tỷ lệ thu hồi nợ</CardTitle>
          </div>
          <CardDescription>Đã thu vs Còn nợ (All-time)</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} layout="vertical" margin={{ left: -20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="Đã thu" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Chưa thu" stackId="a" fill="#ef4444" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground italic">
              * Dựa trên tổng dữ liệu lịch sử
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
