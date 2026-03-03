"use client";

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
} from '@/components/ui/dialog';
import type { Student } from '@/lib/types';
import {
    CalendarClock,
    Plus
} from 'lucide-react';
import React, { useState } from 'react';
import { DetailModalHeader } from './details/DetailModalHeader';
import { FinancialSummary } from './details/FinancialSummary';
import { StudentInfoSections } from './details/StudentInfoSections';
import { QuickAddParentModal } from './QuickAddParentModal';

interface StudentDetailModalProps {
    open: boolean;
    onClose: () => void;
    student: Student;
    onEdit: (student: Student) => void;
    onAddSession: (student: Student) => void;
    onViewSchedule: (student: Student) => void;
}

export function StudentDetailModal({
    open,
    onClose,
    student,
    onEdit,
    onAddSession,
    onViewSchedule
}: StudentDetailModalProps) {
    const [editParentModalOpen, setEditParentModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState<any>(null);

    const handleEditParent = (parent: any) => {
        setEditingParent(parent);
        setEditParentModalOpen(true);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] w-[95vw] max-w-[95vw] sm:w-full max-h-[90vh] p-0 overflow-hidden bg-card rounded-[32px] shadow-2xl border-none animate-in fade-in zoom-in-95 duration-300">
                <DetailModalHeader student={student} />

                <div className="px-8 pb-8 space-y-8 max-h-[calc(85vh-200px)] overflow-y-auto scrollbar-thin">
                    <FinancialSummary
                        totalUnpaid={student.totalUnpaidTaught}
                        totalPaid={student.totalPaid}
                    />

                    <StudentInfoSections
                        student={student}
                        onEdit={onEdit}
                        onEditParent={handleEditParent}
                    />
                </div>

                <div className="p-6 border-t bg-muted/10 flex flex-wrap gap-4">
                    <Button
                        variant="outline"
                        className="flex-1 min-w-[140px] h-12 rounded-2xl gap-2 font-bold border-2 hover:bg-slate-50 dark:hover:bg-muted"
                        onClick={() => onViewSchedule(student)}
                    >
                        <CalendarClock className="w-5 h-5" />
                        Quản lý lịch
                    </Button>
                    <Button
                        className="flex-1 min-w-[140px] h-12 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20"
                        onClick={() => onAddSession(student)}
                        disabled={!student.active}
                    >
                        <Plus className="w-5 h-5" />
                        Thêm buổi học
                    </Button>
                </div>
            </DialogContent>

            {editParentModalOpen && (
                <QuickAddParentModal
                    open={editParentModalOpen}
                    initialData={editingParent}
                    onClose={() => setEditParentModalOpen(false)}
                    onSuccess={() => {
                        setEditParentModalOpen(false);
                    }}
                />
            )}
        </Dialog>
    );
}
