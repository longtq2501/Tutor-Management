'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Users, Check, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useStudents } from '../../lessons/hooks/useStudents';
import { useCourseAssignments, useAssignCourse, useUnassignCourse } from '../hooks/useAdminCourses';
import type { CourseDTO } from '../types';
import { cn } from '@/lib/utils';

interface AssignCourseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course: CourseDTO;
}

export function AssignCourseDialog({
    open,
    onOpenChange,
    course,
}: AssignCourseDialogProps) {
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: students = [], isLoading: isLoadingStudents } = useStudents();
    const { data: assignedStudents = [], isLoading: isLoadingAssigned } = useCourseAssignments(course.id);

    const assignMutation = useAssignCourse();
    const unassignMutation = useUnassignCourse();

    const [prevOpen, setPrevOpen] = useState(open);

    // Sync state when dialog opens
    if (open && !prevOpen) {
        setPrevOpen(true);
        const currentAssignedIds = assignedStudents.map((a) => a.studentId);
        setSelectedStudentIds(currentAssignedIds);
        setDeadline(undefined);
        setSearchQuery('');
    } else if (!open && prevOpen) {
        setPrevOpen(false);
    }

    const handleToggleStudent = (studentId: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSave = async () => {
        const currentAssignedIds = assignedStudents.map((a) => a.studentId);
        const toAssign = selectedStudentIds.filter(id => !currentAssignedIds.includes(id));
        const toUnassign = currentAssignedIds.filter(id => !selectedStudentIds.includes(id));

        try {
            if (toAssign.length > 0) {
                await assignMutation.mutateAsync({
                    id: course.id,
                    data: {
                        studentIds: toAssign,
                        deadline: deadline?.toISOString()
                    },
                });
            }

            for (const studentId of toUnassign) {
                await unassignMutation.mutateAsync({
                    courseId: course.id,
                    studentId: studentId
                });
            }

            onOpenChange(false);
        } catch (error) {
            // Errors handled by hooks
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.phone && s.phone.includes(searchQuery))
    );

    const isSaving = assignMutation.isPending || unassignMutation.isPending;

    const currentAssignedIds = assignedStudents.map((a) => a.studentId);
    const hasChanges = JSON.stringify([...selectedStudentIds].sort()) !==
        JSON.stringify([...currentAssignedIds].sort()) ||
        deadline !== undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-1rem)] max-w-[calc(100vw-1rem)] sm:w-full sm:max-w-[550px] md:max-w-[600px] h-[95vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0 rounded-2xl sm:rounded-lg">
                <DialogHeader className="px-4 py-4 sm:p-6 sm:pb-4 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                        <span className="truncate">Giao khóa học</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm line-clamp-2">
                        Chọn học sinh và đặt hạn hoàn thành cho khóa học &quot;{course.title}&quot;
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 py-3 sm:p-6 sm:pt-4 flex flex-col gap-3 sm:gap-4 min-h-0">
                    {/* Deadline Picker */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs sm:text-sm">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            Hạn hoàn thành (Tùy chọn)
                        </Label>
                        <DatePicker
                            value={deadline}
                            onChange={setDeadline}
                            placeholder="Chọn ngày hết hạn..."
                        />
                    </div>

                    <Separator />

                    {/* Search & Stats */}
                    <div className="space-y-2.5 sm:space-y-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 sm:left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tìm tên hoặc SĐT..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                            <span className="text-muted-foreground truncate">
                                Tổng: <span className="font-medium text-foreground">{students.length}</span> học sinh
                            </span>
                            <Badge variant="secondary" className="text-xs shrink-0">
                                Đã chọn: {selectedStudentIds.length}
                            </Badge>
                        </div>
                    </div>

                    {/* Student List */}
                    <ScrollArea className="flex-1 border rounded-xl sm:rounded-md p-1.5 sm:p-2 min-h-[200px]">
                        {isLoadingStudents || isLoadingAssigned ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-12 text-xs sm:text-sm text-muted-foreground px-4">
                                Không tìm thấy học sinh nào
                            </div>
                        ) : (
                            <div className="space-y-1.5 sm:space-y-2">
                                {filteredStudents.map((student) => {
                                    const isSelected = selectedStudentIds.includes(student.id);
                                    const isAlreadyAssigned = assignedStudents.some(a => a.studentId === student.id);

                                    return (
                                        <div
                                            key={student.id}
                                            className={cn(
                                                "flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 rounded-xl sm:rounded-lg border transition-all cursor-pointer hover:bg-accent active:scale-[0.98]",
                                                isSelected && "bg-primary/5 border-primary/30"
                                            )}
                                            onClick={() => handleToggleStudent(student.id)}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggleStudent(student.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs sm:text-sm font-medium leading-none truncate">
                                                        {student.name}
                                                    </p>
                                                    {isAlreadyAssigned && (
                                                        <Badge variant="outline" className="text-[9px] sm:text-[10px] h-4 sm:h-5 px-1 sm:px-1.5 bg-background shrink-0">
                                                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                                            <span className="hidden xs:inline">Đã giao</span>
                                                            <span className="xs:hidden">Giao</span>
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
                                                    {student.phone || 'Chưa cập nhật SĐT'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                <DialogFooter className="px-4 py-3 sm:p-6 sm:pt-3 bg-muted/20 border-t shrink-0 flex-row gap-2 sm:gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none h-9 sm:h-10 text-sm"
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="flex-1 sm:flex-none h-9 sm:h-10 text-sm"
                    >
                        {isSaving && <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}