'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; // Shadcn Sheet as Drawer
import { motion } from 'framer-motion';
import { CheckCircle2, Download } from 'lucide-react';
import { useFinanceContext } from '../context/FinanceContext';

interface MobileActionDrawerProps {
    actions: {
        markSelectedPaid: () => void;
        generateBulkInvoice: () => void;
        generatingInvoice: boolean;
    }
}

export function MobileActionDrawer({ actions }: MobileActionDrawerProps) {
    const { selectedStudentIds, clearSelection } = useFinanceContext();
    const {
        markSelectedPaid,
        generateBulkInvoice,
        generatingInvoice,
    } = actions;

    // If no selection, maybe show "Quick Add"? Or just hide?
    // User requested "Bottom Sheet actions", likely context-aware.
    // If selection > 0, show bulk actions.
    // If selection == 0, maybe show generic actions (Export All for month?)

    if (selectedStudentIds.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 md:hidden z-50">
            <Sheet>
                <SheetTrigger asChild>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center border-4 border-background"
                    >
                        <span className="font-bold text-lg">{selectedStudentIds.length}</span>
                    </motion.button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] border-t-0 bg-background pt-8 pb-10 px-6">
                    <div className="space-y-4">
                        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
                        <h3 className="text-lg font-bold mb-4 text-center">Đang chọn {selectedStudentIds.length} học sinh</h3>

                        <Button
                            className="w-full h-12 rounded-xl text-base font-bold"
                            variant="default"
                            onClick={markSelectedPaid}
                        >
                            <CheckCircle2 className="w-5 h-5 mr-3" />
                            Đánh dấu đã thanh toán
                        </Button>

                        <Button
                            className="w-full h-12 rounded-xl font-bold"
                            variant="secondary"
                            onClick={generateBulkInvoice}
                            disabled={generatingInvoice}
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Báo Giá
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={clearSelection}
                        >
                            Bỏ chọn tất cả
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
