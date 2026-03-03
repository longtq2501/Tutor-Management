import React, { useRef, useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileVideo, Play } from 'lucide-react';

interface RecordingPreviewDialogProps {
    isOpen: boolean;
    videoUrl: string | null;
    fileSize?: number;
    duration?: number;
    onDownload: () => void;
    onDiscard: () => void;
}

export const RecordingPreviewDialog: React.FC<RecordingPreviewDialogProps> = ({
    isOpen,
    videoUrl,
    fileSize,
    duration,
    onDownload,
    onDiscard,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [autoplayFailed, setAutoplayFailed] = useState(false);

    // Auto-play when opened with safe handling
    useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play()
                .catch((error) => {
                    console.warn('Autoplay failed, user interaction needed:', error);
                    setAutoplayFailed(prev => prev !== true ? true : prev);
                });
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAutoplayFailed(prev => prev !== false ? false : prev);
        }
    }, [isOpen]);

    const formatDuration = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onDiscard()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Xác nhận bản ghi hình</DialogTitle>
                    <DialogDescription>
                        Xem lại bản ghi trước khi tải xuống. Bạn có thể hủy bỏ nếu không hài lòng.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {videoUrl ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black border">
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                controls
                                className="w-full h-full"
                                data-testid="preview-video"
                            />
                            {autoplayFailed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            videoRef.current?.play();
                                            setAutoplayFailed(false);
                                        }}
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        Phát video
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="aspect-video bg-muted flex items-center justify-center rounded-lg">
                            <span className="text-muted-foreground">Đang xử lý video...</span>
                        </div>
                    )}

                    <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground border">
                        <p className="font-medium text-foreground mb-1">💡 Lưu ý quan trọng:</p>
                        File ghi hình sẽ được lưu trực tiếp vào máy tính của bạn. Để chia sẻ cho học viên,
                        bạn nên tải lên <span className="font-medium text-foreground">Google Drive</span> hoặc <span className="font-medium text-foreground">Youtube (Unlisted)</span>.
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                        <div className="flex items-center gap-2">
                            <FileVideo className="w-4 h-4" />
                            <span>{fileSize ? formatSize(fileSize) : 'Unknown size'}</span>
                        </div>
                        <div>
                            Thời lượng: {duration ? formatDuration(duration) : '--:--'}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="destructive" onClick={onDiscard} className="flex-1 sm:flex-none">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hủy bỏ
                    </Button>
                    <Button onClick={onDownload} className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        Tải xuống
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
