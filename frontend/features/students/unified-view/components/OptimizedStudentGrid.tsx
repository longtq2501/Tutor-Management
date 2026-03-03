import { Student } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import { StudentCardSkeleton } from './StudentCardSkeleton';
import { UnifiedStudentCard } from './UnifiedStudentCard';

interface OptimizedStudentGridProps {
    students: Student[];
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    onViewSchedule: (student: Student) => void;
    onAddSession: (student: Student) => void;
    onEdit?: (student: Student) => void;
    onViewDetails?: (student: Student) => void;
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => <StudentCardSkeleton key={i} />)}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-[40px] border-2 border-dashed border-muted-foreground/20">
            <p className="text-muted-foreground font-medium">Không tìm thấy học sinh nào.</p>
        </div>
    );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-[40px] border-2 border-dashed border-destructive/20 gap-4">
            <div className="text-center">
                <p className="text-destructive font-bold text-lg">Đã có lỗi xảy ra khi tải dữ liệu</p>
                <p className="text-muted-foreground text-sm">Vui lòng thử lại hoặc tải lại trang</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                    Thử lại ngay
                </button>
            )}
        </div>
    );
}

export function OptimizedStudentGrid(props: OptimizedStudentGridProps) {
    const [visibleCount, setVisibleCount] = useState(6);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setVisibleCount(prev => prev !== 6 ? 6 : prev); }, [props.students, props.students.length]);

    useEffect(() => {
        const currentRef = loadMoreRef.current;
        const total = props.students.length;
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleCount < total) {
                setVisibleCount(prev => Math.min(prev + 6, total));
            }
        }, { rootMargin: '200px' });

        if (currentRef) obs.observe(currentRef);
        return () => obs.disconnect();
    }, [visibleCount, props.students.length]);

    if (props.isLoading) return <LoadingGrid />;
    if (props.isError) return <ErrorState onRetry={props.onRetry} />;
    if (props.students.length === 0) return <EmptyState />;

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {props.students.slice(0, visibleCount).map((student) => (
                    <UnifiedStudentCard
                        key={student.id}
                        student={student}
                        onViewSchedule={props.onViewSchedule}
                        onAddSession={props.onAddSession}
                        onEdit={props.onEdit}
                        onViewDetails={props.onViewDetails}
                    />
                ))}
            </div>
            {visibleCount < props.students.length && (
                <div ref={loadMoreRef} className="h-20 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
            )}
        </>
    );
}
