import { Button } from '@/components/ui/button';
import { Copy, Globe, Pencil, Save, Trash2 } from 'lucide-react';
import { Loader2 } from './Loader2';
import { motion } from 'framer-motion';

interface ModalFooterProps {
    mode: 'view' | 'edit';
    setMode: (mode: 'view' | 'edit') => void;
    loading: boolean;
    isDirty: boolean;
    globalSelectedCount: number;
    handleDuplicate: () => void;
    setConfirmDeleteOpen: (open: boolean) => void;
    onConvertToOnline?: () => void;
    onRevertToOffline?: () => void;
    canConvert?: boolean;
    isConverting?: boolean;
    isOnline?: boolean;
}

export function ModalFooter({
    mode,
    setMode,
    loading,
    isDirty,
    globalSelectedCount,
    handleDuplicate,
    setConfirmDeleteOpen,
    onConvertToOnline,
    onRevertToOffline,
    canConvert,
    isConverting,
    isOnline
}: ModalFooterProps) {
    return (
        <div className="p-2.5 sm:p-4 bg-muted/10 border-t border-border/60 shrink-0">
            <div className="flex gap-2">
                {mode === 'view' ? (
                    <>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setConfirmDeleteOpen(true)}
                            className="h-[30px] w-[30px] sm:h-10 sm:w-10 p-0 rounded-lg sm:rounded-xl text-red-500 hover:bg-red-500/10 shrink-0"
                        >
                            <Trash2 size={12} className="sm:hidden" />
                            <Trash2 size={16} className="hidden sm:block" />
                        </Button>

                        {canConvert && (
                            <Button
                                variant="outline"
                                onClick={onConvertToOnline}
                                disabled={isConverting || loading}
                                className="h-[30px] sm:h-10 flex-[1.5] rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px] px-2 border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 group overflow-hidden relative"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                                {isConverting ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                    <Globe className="w-3.5 h-3.5 mr-1.5 shrink-0 group-hover:rotate-12 transition-transform duration-500" />
                                )}
                                <span className="relative z-10 hidden xs:inline truncate">CHUYỂN ONLINE</span>
                                <span className="relative z-10 xs:hidden truncate">Online</span>
                            </Button>
                        )}

                        {!loading && mode === 'view' && isOnline && canConvert && (
                            <Button
                                variant="outline"
                                onClick={onRevertToOffline}
                                disabled={isConverting || loading}
                                className="h-[30px] sm:h-10 flex-[1.5] rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px] px-2 border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-900/10 text-red-600 dark:text-red-400 group overflow-hidden relative"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                                {isConverting ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                    <Globe className="w-3.5 h-3.5 mr-1.5 shrink-0 group-hover:rotate-12 transition-transform duration-500" />
                                )}
                                <span className="relative z-10 hidden xs:inline truncate">HỦY ONLINE</span>
                                <span className="relative z-10 xs:hidden truncate">Offline</span>
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleDuplicate}
                            disabled={loading}
                            className="h-[30px] sm:h-10 flex-1 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px] px-2 active:scale-95 transition-transform"
                        >
                            <Copy className="w-3 w-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                            <span className="truncate">Nhân bản</span>
                        </Button>
                        <Button
                            onClick={() => setMode('edit')}
                            className="h-[30px] sm:h-10 flex-1 rounded-lg sm:rounded-xl bg-primary shadow-lg shadow-primary/20 font-black text-[9px] sm:text-[11px] px-2"
                        >
                            <Pencil className="w-3 w-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 shrink-0" />
                            <span className="truncate">Sửa</span>
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setMode('view')}
                            className="h-[30px] sm:h-10 flex-1 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[11px]"
                        >
                            Hủy
                        </Button>
                        <Button
                            form="premium-edit-form"
                            type="submit"
                            disabled={loading || !isDirty}
                            className="h-[30px] sm:h-10 flex-[2] rounded-lg sm:rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 font-black text-[9px] sm:text-[11px]"
                        >
                            {loading ? (
                                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                            ) : (
                                <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                            )}
                            LƯU {globalSelectedCount > 0 && `(${globalSelectedCount})`}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
