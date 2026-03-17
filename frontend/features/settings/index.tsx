"use client";

import ProfilePage from '@/app/(tutor)/profile/page';
import { DashboardHeader } from '@/contexts/UIContext';

export default function SettingsView() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-[90rem] mx-auto">
      <DashboardHeader
        title="Cài đặt"
        subtitle="Quản lý thông tin cá nhân và cấu hình tài khoản"
      />

      {/* Có thể mở rộng thêm nhiều tab cài đặt khác trong tương lai */}
      <div data-tour="settings-profile" className="w-full">
        <ProfilePage />
      </div>
    </div>
  );
}

