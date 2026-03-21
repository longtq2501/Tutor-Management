import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SmartFeedbackForm } from "@/features/feedback/components/SmartFeedbackForm";
import type { LessonStatus } from '@/lib/types/lesson-status';
import { isCompletedStatus } from '@/lib/types/lesson-status';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

// Internal Components
import { EditModeForm } from './components/EditModeForm';
import { ModalFooter } from './components/ModalFooter';
import { ModalHeader } from './components/ModalHeader';
import { StudentCard } from './components/StudentCard';
import { ViewModeContent } from './components/ViewModeContent';
import { LessonDetailModalProps } from './types';
import { useLessonDetailModal } from './useLessonDetailModal';

export function LessonDetailModal(props: LessonDetailModalProps) {
    const {
        localSession,
        mode,
        setMode,
        formData,
        setFormData,
        loading,
        isDirty,
        confirmDeleteOpen,
        setConfirmDeleteOpen,
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedLessonIds,
        selectedDocumentIds,
        filteredItems,
        categories,
        globalSelectedCount,
        currentTabSelectedCount,
        toggleSelection,
        handleSubmit,
        handleDuplicate,
        handleDelete,
        handleConvertToOnline,
        handleRevertToOffline,
        canConvert,
        isConverting,
        showConvertConfirm,
        setShowConvertConfirm,
        showRevertConfirm,
        setShowRevertConfirm,
        getCategoryName
    } = useLessonDetailModal(props);

    const { onClose } = props;
    const isTaughtOrPaid = isCompletedStatus(localSession.status as LessonStatus);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "20%", opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                    "relative bg-card rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full border border-border/60 flex flex-col overflow-hidden",
                    isTaughtOrPaid
                        ? "max-w-6xl h-[95vh] sm:h-[90vh]"
                        : mode === 'edit'
                            ? "max-w-4xl h-[95vh] sm:h-[90vh]"
                            : "max-w-lg h-auto sm:max-h-[90vh]"
                )}
            >
                <ModalHeader session={localSession} onClose={onClose} />

                {/* Main Content */}
                <div className={cn(
                    "flex-1 w-full overflow-hidden flex flex-col lg:flex-row",
                    isTaughtOrPaid ? "" : ""
                )}>

                    {/* LEFT COLUMN */}
                    <div className={cn(
                        "flex flex-col bg-background min-h-0",
                        isTaughtOrPaid
                            ? "lg:h-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-border/60"
                            : "w-full h-full"
                    )}>
                        <div className={cn(
                            "flex-1 p-4 sm:p-6",
                            mode === 'edit' ? "flex flex-col h-full overflow-y-auto gap-4 sm:gap-6" : "overflow-y-auto space-y-6"
                        )}>
                            <StudentCard session={localSession} />

                            {mode === 'view' ? (
                                <ViewModeContent session={localSession} />
                            ) : (
                                <EditModeForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    handleSubmit={handleSubmit}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    selectedCategory={selectedCategory}
                                    setSelectedCategory={setSelectedCategory}
                                    categories={categories}
                                    filteredItems={filteredItems}
                                    selectedLessonIds={selectedLessonIds}
                                    selectedDocumentIds={selectedDocumentIds}
                                    currentTabSelectedCount={currentTabSelectedCount}
                                    toggleSelection={toggleSelection}
                                    getCategoryName={getCategoryName}
                                />
                            )}
                        </div>

                        <ModalFooter
                            mode={mode}
                            setMode={setMode}
                            loading={loading}
                            isDirty={isDirty}
                            globalSelectedCount={globalSelectedCount}
                            handleDuplicate={handleDuplicate}
                            setConfirmDeleteOpen={setConfirmDeleteOpen}
                            onConvertToOnline={() => setShowConvertConfirm(true)}
                            onRevertToOffline={() => setShowRevertConfirm(true)}
                            canConvert={canConvert}
                            isConverting={isConverting}
                            isOnline={!!localSession.isOnline}
                        />
                    </div>

                    {/* RIGHT COLUMN */}
                    {isTaughtOrPaid && (
                        <div className="flex-1 bg-muted/5 flex flex-col min-h-0 lg:h-full overflow-y-auto lg:overflow-hidden">
                            <SmartFeedbackForm
                                sessionRecordId={localSession.id}
                                studentId={localSession.studentId}
                                studentName={localSession.studentName}
                            />
                        </div>
                    )}
                </div>

                {/* Floating Badge */}
                <AnimatePresence>
                    {mode === 'edit' && globalSelectedCount > 0 && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="fixed bottom-8 right-8 z-50 pointer-events-none"
                        >
                            <div className="bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-2xl flex items-center gap-3">
                                <span className="bg-primary-foreground/20 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black">
                                    {globalSelectedCount}
                                </span>
                                <span className="text-xs font-black">✓ {globalSelectedCount} mục đã chọn</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {confirmDeleteOpen && (
                <ConfirmDialog
                    open={confirmDeleteOpen}
                    onOpenChange={setConfirmDeleteOpen}
                    onConfirm={handleDelete}
                    title="Xác nhận xóa?"
                    description="Buổi học này sẽ bị xóa vĩnh viễn khỏi lịch dạy. Bạn không thể hoàn tác thao tác này."
                    confirmText="Xác nhận xóa"
                    variant="destructive"
                />
            )}

            {showConvertConfirm && (
                <ConfirmDialog
                    open={showConvertConfirm}
                    onOpenChange={setShowConvertConfirm}
                    onConfirm={handleConvertToOnline}
                    title="Chuyển sang Online?"
                    description="Học sinh sẽ nhận được thông báo với link tham gia buổi học online. Bạn có muốn tiếp tục?"
                    confirmText="Xác nhận"
                />
            )}

            {showRevertConfirm && (
                <ConfirmDialog
                    open={showRevertConfirm}
                    onOpenChange={setShowRevertConfirm}
                    onConfirm={handleRevertToOffline}
                    title="Hủy phòng học Online?"
                    description="Thao tác này sẽ xóa phòng học online hiện tại. Dữ liệu chat/bảng trắng (nếu có) sẽ bị mất. Bạn có chắc chắn không?"
                    confirmText="Hủy Online"
                    variant="destructive"
                />
            )}
        </div>,
        document.body
    );
}
