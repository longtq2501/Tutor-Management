'use client';

import { motion } from 'framer-motion';
import { FinanceProvider } from '../context/FinanceContext';
import { useFinanceActions } from '../hooks/useFinanceActions';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { FinanceContent } from './FinanceContent';
import { FinanceHeader } from './FinanceHeader';
import { FinanceStats } from './FinanceStats';
import { MobileActionDrawer } from './MobileActionDrawer';
import { DashboardHeader } from '@/contexts/UIContext';
import { useConfirm } from '@/hooks/useConfirm';

function DashboardInner() {
    const { confirm, ConfirmationDialog } = useConfirm();
    const actions = useFinanceActions({ confirm });

    return (
        <div className="flex flex-col min-w-0 overflow-hidden relative h-full">
            <DashboardHeader
                title="Quản Lý Tài Chính"
                subtitle="Theo dõi doanh thu, công nợ và trạng thái thanh toán"
                actions={<FinanceHeader />}
            />

            <div className="p-3 md:p-8 flex-1 overflow-y-auto space-y-4 md:space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    data-tour="finance-stats"
                >
                    <FinanceStats />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    data-tour="finance-content"
                >
                    <FinanceContent />
                </motion.div>
            </div>

            <BulkActionsToolbar actions={actions} />
            <MobileActionDrawer actions={actions} />

            <ConfirmationDialog />
        </div>
    );
}

export default function FinanceDashboard() {
    return (
        <FinanceProvider>
            <DashboardInner />
        </FinanceProvider>
    );
}
