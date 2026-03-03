// 📁 unpaid-sessions/components/EmailResultModal.tsx
import React from 'react';
import { CheckCircle, XCircle, X, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface EmailResultDetail {
  student: string;
  parent: string;
  email: string;
}

export interface EmailResult {
  success: boolean;
  message?: string;
  summary?: {
    total: number;
    sent: number;
    failed: number;
  };
  successDetails?: EmailResultDetail[];
  errors?: string[];
}

interface EmailResultModalProps {
  show: boolean;
  result: EmailResult | null;
  onClose: () => void;
}

export function EmailResultModal({ show, result, onClose }: EmailResultModalProps) {
  if (!show || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-card rounded-[3rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden border-none"
      >
        {/* Header with Gradient */}
        <div className={cn(
          "relative p-8 sm:p-10 pb-16 transition-all duration-500",
          result.success
            ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700"
            : "bg-gradient-to-br from-rose-500 via-red-600 to-orange-700"
        )}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] pointer-events-none" />

          <div className="relative flex items-center gap-6 text-white">
            <div className="w-20 h-20 rounded-[1.75rem] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-lg">
              {result.success ? <CheckCircle size={40} strokeWidth={2.5} /> : <XCircle size={40} strokeWidth={2.5} />}
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs opacity-60 mb-1">Kết quả gửi Email</h3>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {result.success ? 'Gửi thành công!' : 'Gửi thất bại'}
              </h2>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-6 right-6 rounded-full text-white/50 hover:text-white hover:bg-white/10 h-10 w-10 transition-colors"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Content Area */}
        <div className="relative z-10 -mt-10 mx-5 sm:mx-8 bg-card rounded-[2.5rem] border border-border/40 shadow-2xl flex flex-col overflow-hidden mb-8">
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-8 no-scrollbar custom-scrollbar bg-gradient-to-b from-card to-background">
            {result.summary && (
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 opacity-60">Tổng số</div>
                  <div className="text-2xl font-black">{result.summary.total}</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Đã gửi</div>
                  <div className="text-2xl font-black text-emerald-600">{result.summary.sent}</div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <div className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-1">Lỗi</div>
                  <div className="text-2xl font-black text-rose-600">{result.summary.failed || 0}</div>
                </div>
              </div>
            )}

            {((result.successDetails && result.successDetails.length > 0) || (result.errors && result.errors.length > 0)) && (
              <div className="space-y-6">
                {(result.successDetails?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 ml-3">
                      <CheckCircle size={14} />
                      <span>Email đã gửi được ({result.successDetails!.length})</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {result.successDetails!.map((detail: EmailResultDetail, index: number) => (
                        <div key={index} className="p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl flex justify-between items-center group hover:bg-emerald-500/[0.06] transition-colors">
                          <div>
                            <p className="font-black text-sm">{detail.student}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{detail.parent} • {detail.email}</p>
                          </div>
                          <CheckCircle size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(result.errors?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-600 ml-3">
                      <AlertTriangle size={14} />
                      <span>Các lỗi gặp phải ({result.errors!.length})</span>
                    </div>
                    <div className="space-y-2">
                      {result.errors!.map((error: string, index: number) => (
                        <div key={index} className="p-4 bg-rose-500/[0.03] border border-rose-500/10 rounded-2xl text-xs font-bold text-rose-600/80 italic">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.message && !result.summary && (
              <div className={cn(
                "p-6 rounded-[2rem] border-2 text-center",
                result.success
                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-800 font-bold"
                  : "bg-rose-50/50 border-rose-200 text-rose-800 font-bold"
              )}>
                {result.message}
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="p-6 sm:p-8 bg-muted/10 border-t border-border/40">
            <Button
              onClick={onClose}
              className="h-14 w-full rounded-2xl bg-muted/50 hover:bg-muted font-black uppercase tracking-widest text-[11px] transition-all"
            >
              Đóng Báo Cáo
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}