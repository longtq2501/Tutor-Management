'use client';

import { Progress } from '@/components/ui/progress';
import type { MonthlyReportData } from '@/lib/types';

interface ReportPreviewProps {
  data: MonthlyReportData;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN');

function formatCurrency(value: number) {
  return `${currencyFormatter.format(value || 0)}đ`;
}

export function ReportPreview({ data }: ReportPreviewProps) {
  return (
    <div id="report-preview" className="rounded-lg border bg-white p-6 text-black">
      <div className="mb-5 border-b pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Tutor Pro</p>
        <h2 className="text-2xl font-bold">BÁO CÁO TIẾN ĐỘ HỌC TẬP</h2>
        <p className="text-sm text-gray-600">
          Tháng {data.month}/{data.year} — Học sinh: <span className="font-semibold">{data.studentName}</span>
        </p>
      </div>

      <section className="mb-5 border-b pb-4">
        <h3 className="mb-2 text-lg font-semibold">CHUYÊN CẦN</h3>
        <div className="mb-2 flex items-center gap-4">
          <Progress className="h-3" value={data.attendanceRate || 0} />
          <span className="text-sm font-semibold">{(data.attendanceRate || 0).toFixed(1)}%</span>
        </div>
        <p className="text-sm text-gray-700">
          {data.attendedSessions}/{data.totalSessions} buổi có mặt • Vắng: {data.absentSessions}
        </p>
      </section>

      <section className="mb-5 border-b pb-4">
        <h3 className="mb-2 text-lg font-semibold">KẾT QUẢ KIỂM TRA</h3>
        <p className="text-sm text-gray-700">
          Điểm TB: <span className="font-semibold">{(data.averageScore ?? 0).toFixed(1)}</span>
          {data.scoreImprovement !== null && (
            <span className={data.scoreImprovement >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {' '}
              ({data.scoreImprovement >= 0 ? '↑' : '↓'}{Math.abs(data.scoreImprovement).toFixed(1)}% so với tháng trước)
            </span>
          )}
        </p>

        <div className="mt-3 overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-3 py-2">Bài kiểm tra</th>
                <th className="px-3 py-2 text-right">Điểm</th>
                <th className="px-3 py-2 text-right">Tối đa</th>
              </tr>
            </thead>
            <tbody>
              {data.assessments?.length ? (
                data.assessments.map((assessment, index) => (
                  <tr key={`${assessment.title}-${index}`} className="border-t">
                    <td className="px-3 py-2">{assessment.title}</td>
                    <td className="px-3 py-2 text-right">{(assessment.score ?? 0).toFixed(1)}</td>
                    <td className="px-3 py-2 text-right">{(assessment.maxScore ?? 0).toFixed(1)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-3 text-center text-gray-500" colSpan={3}>
                    Không có bài kiểm tra trong tháng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-5 border-b pb-4">
        <h3 className="mb-2 text-lg font-semibold">NHẬN XÉT CỦA GIA SƯ</h3>
        <p className="whitespace-pre-wrap text-sm text-gray-700">{data.tutorComment || 'Chưa có nhận xét'}</p>
      </section>

      <section>
        <h3 className="mb-2 text-lg font-semibold">HỌC PHÍ</h3>
        <p className="text-sm text-gray-700">
          Tổng tháng: <span className="font-semibold">{formatCurrency(data.totalFee || 0)}</span>
        </p>
        <p className="text-sm text-gray-700">
          Đã đóng: <span className="font-semibold">{formatCurrency(data.paidAmount || 0)}</span>
        </p>
        <p className="text-sm text-gray-700">
          Còn lại: <span className="font-semibold">{formatCurrency(data.remainingAmount || 0)}</span>
        </p>
        <p className="mt-1 text-sm font-semibold">Trạng thái: {data.paymentStatus || 'UNPAID'}</p>
      </section>
    </div>
  );
}
