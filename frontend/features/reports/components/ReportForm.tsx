'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Student } from '@/lib/types';

interface ReportFormProps {
  students: Student[];
  selectedStudentId: number | null;
  monthValue: string;
  isLoading: boolean;
  onStudentChange: (value: number) => void;
  onMonthChange: (value: string) => void;
  onGenerate: () => void;
}

export function ReportForm({
  students,
  selectedStudentId,
  monthValue,
  isLoading,
  onStudentChange,
  onMonthChange,
  onGenerate,
}: ReportFormProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_auto] md:items-end">
      <div className="space-y-2">
        <p className="text-sm font-semibold">Học sinh</p>
        <Select
          value={selectedStudentId ? String(selectedStudentId) : undefined}
          onValueChange={(value) => onStudentChange(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn học sinh" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={String(student.id)}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Tháng</p>
        <input
          type="month"
          value={monthValue}
          onChange={(event) => onMonthChange(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <Button onClick={onGenerate} disabled={!selectedStudentId || !monthValue || isLoading}>
        {isLoading ? 'Đang tải...' : 'Tạo báo cáo'}
      </Button>
    </div>
  );
}
