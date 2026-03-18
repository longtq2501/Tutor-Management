'use client';

import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Download, Loader2 } from 'lucide-react';
import { useFinanceContext } from '../context/FinanceContext';

interface BulkActionsToolbarProps {
    actions: {
        markSelectedPaid: () => void;
        generateBulkInvoice: () => void;
        generatingInvoice: boolean;
    }
}

export function BulkActionsToolbar({ actions }: BulkActionsToolbarProps) {
    const { selectedStudentIds, clearSelection } = useFinanceContext();
    const {
        markSelectedPaid,
        generateBulkInvoice,
        generatingInvoice,
    } = actions;

    if (selectedStudentIds.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-300"
                style={{
                    paddingLeft: 'var(--sidebar-width, 0px)',
                }}
            >
                <div className="bg-foreground text-background p-3 md:p-4 rounded-[2rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-8 border border-white/10 backdrop-blur-xl w-fit max-w-[90vw] md:max-w-3xl pointer-events-auto mx-auto">
                    <div className="flex items-center gap-3 pl-2 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-primary">
                            {selectedStudentIds.length}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-bold whitespace-nowrap">Học sinh đã chọn</span>
                            <button
                                onClick={clearSelection}
                                className="text-[10px] md:text-xs text-muted-foreground hover:text-white underline text-left"
                            >
                                Bỏ chọn
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-xl font-bold h-9 md:h-10 px-3 md:px-4 shrink-0 transition-transform active:scale-95"
                            onClick={generateBulkInvoice}
                            disabled={generatingInvoice}
                        >
                            {generatingInvoice ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-2" /> : <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />}
                            <span className="text-xs md:text-sm">Báo Giá</span>
                        </Button>

                        <Button
                            size="sm"
                            onClick={markSelectedPaid}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 h-9 md:h-10 px-3 md:px-4 shrink-0 transition-transform active:scale-95"
                        >
                            <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                            <span className="text-xs md:text-sm">Thanh Toán</span>
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
