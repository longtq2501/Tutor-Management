'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';
import { ExerciseListItemResponse } from '@/features/exercise-import/types/exercise.types';
import { Student } from '@/lib/types';

/**
 * Dialog for selecting a student and setting a deadline when assigning an exercise.
 */
interface AssignExerciseDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedExercise: ExerciseListItemResponse | null;
    students: Student[];
    isStudentsLoading: boolean;
    assignStudentId: string;
    setAssignStudentId: (id: string) => void;
    assignDeadline: string;
    setAssignDeadline: (deadline: string) => void;
    isAssigning: boolean;
    handleAssign: () => void;
}

export const AssignExerciseDialog: React.FC<AssignExerciseDialogProps> = ({
    isOpen,
    onOpenChange,
    selectedExercise,
    students,
    isStudentsLoading,
    assignStudentId,
    setAssignStudentId,
    assignDeadline,
    setAssignDeadline,
    isAssigning,
    handleAssign
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Giao bài tập</DialogTitle>
                    <DialogDescription>
                        Chọn học sinh để giao bài tập &quot;{selectedExercise?.title}&quot;
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="student">Học sinh</Label>
                        <Select onValueChange={setAssignStudentId} value={assignStudentId}>
                            <SelectTrigger>
                                <SelectValue placeholder={isStudentsLoading ? "Đang tải..." : "Chọn học sinh"} />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.isArray(students) && students.map(s => (
                                    <SelectItem key={s.id} value={s.accountId || ''}>
                                        {s.name} ({s.accountEmail})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deadline">Hạn chót (Tùy chọn)</Label>
                        <Input
                            id="deadline"
                            type="datetime-local"
                            value={assignDeadline}
                            onChange={(e) => setAssignDeadline(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
                    <Button onClick={handleAssign} disabled={!assignStudentId || isAssigning}>
                        {isAssigning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang giao...
                            </>
                        ) : "Giao bài tập"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
