import { format, isSameDay } from 'date-fns';
import { AlertCircle, RefreshCw, CalendarDays, Clock, Video, Loader2 } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentSession } from '../hooks/useCurrentSession';
import { useUpcomingSessions } from '../hooks/useUpcomingSessions';
import { SessionCard } from './SessionCard';
import { DashboardHeader } from '@/contexts/UIContext';

interface LiveTeachingLobbyProps {
    onJoin: (roomId: string) => void;
    currentUserId: number;
    isTutor: boolean;
}

const SessionListSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4 border rounded-3xl p-6 bg-card">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="pt-4 flex gap-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>
        ))}
    </div>
);

/**
 * Main lobby component for Live Teaching.
 * Displays sessions categorized by "Today" and "Upcoming" for better organization.
 */
export const LiveTeachingLobby: React.FC<LiveTeachingLobbyProps> = ({
    onJoin,
    currentUserId,
    isTutor
}) => {
    const {
        data: currentSession,
        isLoading: isLoadingCurrent,
        isError: isErrorCurrent,
        refetch: refetchCurrent
    } = useCurrentSession();

    const {
        data: upcomingData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingUpcoming,
        isError: isErrorUpcoming,
        refetch: refetchUpcoming
    } = useUpcomingSessions(10);

    const sentinelRef = React.useRef<HTMLDivElement>(null);

    // P2: Infinite Scroll using IntersectionObserver sentinel pattern
    React.useEffect(() => {
        if (!hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) {
                observer.unobserve(currentSentinel);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleRefresh = () => {
        refetchCurrent();
        refetchUpcoming();
    };

    const hasError = isErrorCurrent || isErrorUpcoming;
    const isLoading = isLoadingCurrent || isLoadingUpcoming;

    const allSessions = upcomingData?.pages.flatMap(page => page.content) || [];

    // P1: Split sessions into Today and Upcoming, sorted by scheduled time
    const todaySessions = allSessions
        .filter(s => isSameDay(new Date(s.scheduledStart), new Date()))
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

    const upcomingSessions = allSessions
        .filter(s => !isSameDay(new Date(s.scheduledStart), new Date()))
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

    return (
        <div className="w-full space-y-16">
            <DashboardHeader
                title="Sảnh chờ Lớp học"
                subtitle={isTutor
                    ? "Quản lý các buổi dạy trực tuyến của bạn. Hãy bắt đầu đúng giờ để đảm bảo chất lượng giảng dạy."
                    : "Tham gia các buổi học trực tuyến cùng giáo viên của bạn. Vui lòng chuẩn bị thiết bị trước khi vào học."
                }
                actions={
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mr-2">
                            <Video className="w-3 h-3" />
                            Live Teaching Hub
                        </div>
                        <Button variant="outline" size="lg" onClick={handleRefresh} className="rounded-xl font-bold gap-2">
                            <RefreshCw className={`w-4 h-4 ${isFetchingNextPage ? 'animate-spin' : ''}`} />
                            Làm mới
                        </Button>
                    </div>
                }
            />

            <div className="px-4 sm:px-6 lg:px-8">
                {hasError && (
                    <Alert variant="destructive" className="rounded-2xl mb-8">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Đã xảy ra lỗi</AlertTitle>
                        <AlertDescription>
                            Không thể tải danh sách lớp học. Vui lòng kiểm tra kết nối mạng và thử lại.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Today's Priority Sessions */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 shadow-inner flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Buổi học hôm nay</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Lịch dạy trong ngày {format(new Date(), 'dd/MM/yyyy')}</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <SessionListSkeleton />
                    ) : todaySessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {todaySessions.map((session) => (
                                <div key={session.id} className="animate-in fade-in zoom-in-95 duration-500">
                                    <SessionCard
                                        session={session}
                                        onJoin={onJoin}
                                        currentUserId={currentUserId}
                                        onRefetch={handleRefresh}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-muted/10 border-2 border-dashed border-border/60 rounded-[2rem] p-16 text-center">
                            <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                            <h4 className="text-xl font-black mb-2 italic">Hôm nay không có buổi dạy nào.</h4>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                                {isTutor
                                    ? "Tất cả các buổi học online của hôm nay sẽ xuất hiện tại đây. Bạn có thể chuyển đổi buổi học từ lịch sang Online nếu cần."
                                    : "Chưa có lịch học online cho hôm nay. Vui lòng liên hệ giáo viên nếu bạn có thắc mắc."}
                            </p>
                        </div>
                    )}
                </section>

                {/* Upcoming Sessions List */}
                {(upcomingSessions.length > 0 || isLoading) && (
                    <section className="space-y-8 pt-8 mt-16 border-t border-dashed">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 shadow-inner flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Buổi học sắp tới</h3>
                                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Các buổi học đã lên lịch trước</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="rounded-full px-4 py-1 text-sm font-black border-2 border-primary/20">
                                {upcomingSessions.length} BUỔI
                            </Badge>
                        </div>

                        {isLoading ? (
                            <SessionListSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {upcomingSessions.map((session) => (
                                    <div key={session.id} className="opacity-80 hover:opacity-100 transition-opacity">
                                        <SessionCard
                                            key={session.id}
                                            session={session}
                                            onJoin={onJoin}
                                            currentUserId={currentUserId}
                                            onRefetch={handleRefresh}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sentinel for infinite scroll */}
                        {hasNextPage && (
                            <div ref={sentinelRef} className="py-12 flex flex-col items-center gap-4" aria-hidden="true">
                                <div className="h-12 w-12 relative">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary/20" />
                                    {isFetchingNextPage && <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-primary" />}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                    {isFetchingNextPage ? 'Đang tải thêm dữ liệu...' : 'Cuộn để xem thêm'}
                                </p>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

