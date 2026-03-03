import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Tutor, TutorStats } from '../../../lib/services/tutor';
import { TutorStatsCard } from './TutorStatsCard';
import { useEffect, useState } from 'react';
import { tutorsApi } from '../../../lib/services/tutor';

interface TutorDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tutor: Tutor | null;
    onEdit: () => void;
}

export const TutorDetailModal = ({ open, onOpenChange, tutor, onEdit }: TutorDetailModalProps) => {
    const [stats, setStats] = useState<TutorStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (tutor && open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoading(prev => prev !== true ? true : prev);
            tutorsApi.getStats(tutor.id).then(setStats).catch(console.error).finally(() => setIsLoading(prev => prev !== false ? false : prev));
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStats(prev => prev !== null ? null : prev);
        }
    }, [tutor, open]);

    if (!tutor) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>Tutor Details</DialogTitle></DialogHeader>

                {stats && <div className="mb-6"><TutorStatsCard stats={stats} isLoading={isLoading} /></div>}

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><label className="text-muted-foreground text-xs">Full Name</label><div className="font-medium">{tutor.fullName}</div></div>
                    <div><label className="text-muted-foreground text-xs">Email</label><div>{tutor.email}</div></div>
                    <div><label className="text-muted-foreground text-xs">Phone</label><div>{tutor.phone}</div></div>
                    <div><label className="text-muted-foreground text-xs">Since</label><div>{new Date(tutor.createdAt).toLocaleDateString()}</div></div>

                    <div><label className="text-muted-foreground text-xs">Plan</label>
                        <div><Badge variant="outline">{tutor.subscriptionPlan}</Badge></div>
                    </div>
                    <div><label className="text-muted-foreground text-xs">Status</label>
                        <div><Badge variant={tutor.subscriptionStatus === 'ACTIVE' ? 'default' : 'destructive'}>{tutor.subscriptionStatus}</Badge></div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={() => { onOpenChange(false); onEdit(); }}>Edit Tutor</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
