'use client';

import { invoicesApi, sessionsApi } from '@/lib/services';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useFinanceContext } from '../context/FinanceContext';
import { useFinanceData } from './useFinanceData';
import { isCancelledStatus } from '@/lib/types/lesson-status';
import type { SessionRecord } from '@/lib/types/finance';

interface UseFinanceActionsProps {
  confirm?: (options: { title: string; description: string; confirmText?: string; cancelText?: string; variant?: 'default' | 'destructive' }) => Promise<boolean>;
}

export function useFinanceActions({ confirm }: UseFinanceActionsProps = {}) {
  const { refreshData, records } = useFinanceData();
  const { selectedStudentIds, clearSelection } = useFinanceContext();
  const queryClient = useQueryClient();

  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Helper to safely execute confirmation
  const safeConfirm = async (message: string) => {
    if (confirm) {
      return await confirm({
        title: 'Xác nhận hành động',
        description: message,
        confirmText: 'Đồng ý',
        cancelText: 'Hủy bỏ'
      });
    }
    return window.confirm(message);
  };

  // Helper to get selected session Ids based on selected students
  const getSelectedSessionIds = () => {
    // records contains all raw sessions.
    // select sessions where studentId is in selectedStudentIds
    // AND exclude broken/cancelled sessions from financial actions
    return records
      .filter((r: SessionRecord) => selectedStudentIds.includes(r.studentId) && (!r.status || !isCancelledStatus(r.status)))
      .map((r: SessionRecord) => r.id);
  };

  const markSelectedPaid = async () => {
    const sessionIds = getSelectedSessionIds();
    if (sessionIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh!');
      return;
    }

    const isConfirmed = await safeConfirm(`Đánh dấu ${sessionIds.length} buổi học của ${selectedStudentIds.length} học sinh là đã thanh toán?`);
    if (!isConfirmed) return;

    const promise = async () => {
      // Parallelize? Be careful with backend limits. Serial for safety.
      for (const id of sessionIds) {
        await sessionsApi.togglePayment(id);
      }
      await refreshData();
      // Invalidate dashboard stats to reflect payment changes
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-monthly'] });
      clearSelection();
    };

    toast.promise(promise(), {
      loading: 'Đang cập nhật thanh toán...',
      success: 'Đã cập nhật thành công!',
      error: 'Có lỗi xảy ra khi cập nhật.'
    });
  };

  const generateBulkInvoice = async () => {
    const sessionIds = getSelectedSessionIds();
    if (sessionIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh!');
      return;
    }

    try {
      setGeneratingInvoice(true);

      // We assume the backend can handle multiple students if provided, 
      // OR we just use the first student's month?
      // Invoices typically are per month.
      // If we are in "All Time" mode, mixed months might be tricky.
      // Existing logic `useInvoiceActions` takes `studentId` and `month` from the first session.
      // Let's stick to that but pass `selectedStudentIds`.

      const firstSession = records.find(r => sessionIds.includes(r.id));
      if (!firstSession) return;

      const response = await invoicesApi.downloadInvoicePDF({
        studentId: selectedStudentIds[0], // Primary student (unused if multiple)
        month: firstSession.month, // Provide a month context 
        sessionRecordIds: sessionIds,
        multipleStudents: selectedStudentIds.length > 1,
        selectedStudentIds: selectedStudentIds
      });

      const filename = selectedStudentIds.length === 1
        ? `Bao-Gia-${selectedStudentIds[0]}.pdf`
        : `Bao-Gia-Tong-Hop-${selectedStudentIds.length}-HS.pdf`;

      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Đã tải xuống báo giá!');
    } catch (error: unknown) {
      console.error('Invoice error:', error);
      let message = 'Không thể tạo báo giá.';

      if (axios.isAxiosError(error)) {
        if (error.response?.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            if (text) message = text;
          } catch (e: unknown) {
            // Fallback to generic
          }
        } else if (error.response?.data?.message) {
          message = error.response.data.message;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const sendBulkEmail = async () => {
    const sessionIds = getSelectedSessionIds();
    if (selectedStudentIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh!');
      return;
    }

    const isConfirmed = await safeConfirm(`Gửi email báo giá cho ${selectedStudentIds.length} học sinh đã chọn?`);
    if (!isConfirmed) return;

    try {
      setSendingEmail(true);
      await invoicesApi.sendInvoiceEmailBatch({
        selectedStudentIds: selectedStudentIds,
        sessionRecordIds: sessionIds,
        month: '' // Backend likely deduces or ignores if session IDs provided
      });
      toast.success('Gửi email thành công!');
      clearSelection();
    } catch (error: unknown) {
      let message = 'Lỗi khi gửi email';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || error.response?.data?.error || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setSendingEmail(false);
    }
  };

  return {
    generatingInvoice,
    sendingEmail,
    markSelectedPaid,
    generateBulkInvoice,
    sendBulkEmail
  };
}
