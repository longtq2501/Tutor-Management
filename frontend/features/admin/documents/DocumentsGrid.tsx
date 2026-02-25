'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    FileImage,
    File as FileIcon,
    Search,
    Download,
    Clock,
    User,
    Trash2,
    Folder as FolderIcon,
    ChevronRight,
    Home,
    Plus,
    Upload,
    ArrowLeft,
    X,
    Loader2
} from 'lucide-react';
import { adminDocumentsApi } from '@/lib/services/admin-documents';
import type { AdminDocument, AdminFolder } from '@/lib/types/admin';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/useConfirm';

export function DocumentsGrid() {
    const [docs, setDocs] = useState<AdminDocument[]>([]);
    const [folders, setFolders] = useState<AdminFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Navigation State
    const [currentFolder, setCurrentFolder] = useState<AdminFolder | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<AdminFolder[]>([]);

    // Upload State
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);

    const { confirm, ConfirmationDialog } = useConfirm();

    const fetchContent = async () => {
        setLoading(true);
        try {
            const folderId = currentFolder?.id;
            const isRoot = !folderId;

            const [docsData, foldersData] = await Promise.all([
                adminDocumentsApi.getAll(0, 50, searchTerm, folderId, isRoot),
                isRoot
                    ? adminDocumentsApi.getRootFolders()
                    : adminDocumentsApi.getSubfolders(folderId)
            ]);

            setDocs(docsData.content);
            setFolders(foldersData);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            toast.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, [currentFolder, searchTerm]);

    const handleNavigate = (folder: AdminFolder | null) => {
        if (!folder) {
            setCurrentFolder(null);
            setBreadcrumbs([]);
        } else {
            setCurrentFolder(folder);
            // Simple breadcrumb logic (for real nested breadcrumbs, we'd need more logic or backend support)
            setBreadcrumbs(prev => {
                const idx = prev.findIndex(b => b.id === folder.id);
                if (idx !== -1) return prev.slice(0, idx + 1);
                return [...prev, folder];
            });
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt('Nhập tên thư mục mới:');
        if (!name) return;

        try {
            await adminDocumentsApi.createFolder(name, currentFolder?.id);
            toast.success('Đã tạo thư mục');
            fetchContent();
        } catch (error) {
            toast.error('Không thể tạo thư mục');
        }
    };

    const handleDeleteFolder = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const isConfirmed = await confirm({
            title: 'XÓA THƯ MỤC',
            description: 'Bạn có chắc chắn muốn xóa thư mục này và tất cả nội dung bên trong?',
            variant: 'destructive'
        });

        if (isConfirmed) {
            try {
                await adminDocumentsApi.deleteFolder(id);
                toast.success('Đã xóa thư mục');
                fetchContent();
            } catch (error) {
                toast.error('Xóa thư mục thất bại');
            }
        }
    };

    const handleDeleteDoc = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'XÓA TÀI LIỆU',
            description: 'Bạn có chắc chắn muốn xóa tài liệu này? Thao tác này không thể hoàn tác.',
            variant: 'destructive'
        });

        if (isConfirmed) {
            try {
                await adminDocumentsApi.delete(id);
                toast.success('Đã xóa tài liệu');
                fetchContent();
            } catch (error) {
                toast.error('Xóa tài liệu thất bại');
            }
        }
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);

                // Construct basic metadata
                const metadata = {
                    title: file.name.split('.')[0],
                    category: 'OTHER',
                    folderId: currentFolder?.id
                };
                formData.append('data', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

                await adminDocumentsApi.upload(formData, (p) => setUploadProgress(p));
            }
            toast.success('Đã tải tài liệu lên thành công');
            fetchContent();
        } catch (error) {
            toast.error('Tải lên thất bại');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const getFileIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <FileText className="h-8 w-8 text-rose-500" />;
        if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <FileImage className="h-8 w-8 text-emerald-500" />;
        return <FileIcon className="h-8 w-8 text-blue-500" />;
    };

    return (
        <div
            className={`flex flex-col gap-6 p-4 rounded-3xl transition-all ${isDragOver ? 'bg-[var(--admin-accent)]/5 border-2 border-dashed border-[var(--admin-accent)]' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleUpload(e.dataTransfer.files);
            }}
        >
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-8 backdrop-blur-xl p-8 bg-white/40 dark:bg-black/40 border-premium rounded-[3rem] shadow-premium mb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl shadow-premium">
                            <button
                                onClick={() => handleNavigate(null)}
                                className={`p-2 rounded-xl transition-all ${!currentFolder ? 'bg-primary text-white shadow-glow-sm shadow-primary/30' : 'hover:bg-primary/10 text-muted-foreground hover:text-primary'}`}
                            >
                                <Home className="h-4 w-4" />
                            </button>
                            {breadcrumbs.length > 0 && <ChevronRight className="h-4 w-4 opacity-30" />}
                            <div className="flex items-center gap-1 overflow-x-auto max-w-[300px] no-scrollbar">
                                {breadcrumbs.map((b, idx) => (
                                    <div key={b.id} className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleNavigate(b)}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${idx === breadcrumbs.length - 1 ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                                        >
                                            {b.name}
                                        </button>
                                        {idx < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 opacity-20" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreateFolder}
                            className="bg-white/50 dark:bg-white/5 border border-border/50 text-foreground px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2.5 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-premium"
                        >
                            <Plus className="h-4.5 w-4.5 text-primary" />
                            <span>Thư mục mới</span>
                        </button>
                        <div className="relative group/upload">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={(e) => handleUpload(e.target.files)}
                                disabled={uploading}
                            />
                            <button className="bg-primary text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-glow-md shadow-primary/30 group-hover/upload:scale-[1.03] active:scale-95 transition-all duration-300">
                                {uploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Upload className="h-4.5 w-4.5" />}
                                <span>{uploading ? `Đang tải ${uploadProgress}%` : 'Tải tài liệu'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative max-w-xl group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm tài liệu hoặc thư mục..."
                        className="w-full h-14 bg-white/50 dark:bg-white/5 border border-border/50 rounded-[2rem] pl-14 pr-6 text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-premium backdrop-blur-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Grid */}
            {loading && !uploading ? (
                <div className="flex flex-col items-center justify-center h-80 gap-4 opacity-50">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--admin-accent)]" />
                    <span className="text-xs font-bold uppercase tracking-widest">Đang kết nối thư viện...</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {/* Folders */}
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            onClick={() => handleNavigate(folder)}
                            className="group relative glass border-premium rounded-[2.5rem] p-6 flex flex-col gap-4 shadow-premium backdrop-blur-xl hover:scale-[1.03] hover:border-amber-500/30 cursor-pointer transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -z-10 group-hover:bg-amber-500/10 transition-colors" />

                            <div className="flex items-start justify-between">
                                <div className="p-4 bg-amber-500/10 rounded-2xl group-hover:bg-amber-500/20 group-hover:rotate-6 transition-all duration-500 shadow-glow-sm shadow-amber-500/10">
                                    <FolderIcon className="h-8 w-8 text-amber-500 fill-amber-500/20" />
                                </div>
                                <button
                                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                                    className="w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 bg-white/50 dark:bg-white/5 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                                >
                                    <Trash2 className="h-4.5 w-4.5" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-black text-foreground group-hover:text-amber-600 transition-colors duration-300 truncate">{folder.name}</span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{folder.documentCount} tài liệu</span>
                            </div>
                        </div>
                    ))}

                    {/* Documents */}
                    {docs.map((doc) => (
                        <div
                            key={doc.id}
                            className="group relative glass border-premium rounded-[2.5rem] p-6 flex flex-col gap-5 shadow-premium backdrop-blur-xl hover:scale-[1.03] transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-start justify-between">
                                <div className="p-4 bg-primary/5 dark:bg-white/5 rounded-2xl group-hover:rotate-6 transition-all duration-500 border border-border/50">
                                    {getFileIcon(doc.fileType)}
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => handleDeleteDoc(doc.id)}
                                        className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-red-500 bg-white/50 dark:bg-white/5 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <a
                                        href={doc.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary bg-white/50 dark:bg-white/5 hover:bg-primary/10 rounded-xl transition-all"
                                    >
                                        <Download className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-black text-foreground line-clamp-2 leading-relaxed group-hover:text-primary transition-colors duration-300" title={doc.title}>
                                    {doc.title}
                                </span>
                                <div className="flex items-center gap-2.5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] opacity-40">
                                    <div className="px-2 py-0.5 bg-border/50 rounded-md">{doc.fileType.split('/')[1] || 'FILE'}</div>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{(doc.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {!loading && folders.length === 0 && docs.length === 0 && (
                        <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 opacity-30">
                            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center border-2 border-dashed border-primary/20">
                                <Upload className="h-10 w-10 text-primary" />
                            </div>
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Thư mục trống. Kéo thả file để tải lên.</p>
                        </div>
                    )}
                </div>
            )}

            {uploading && (
                <div className="fixed bottom-8 right-8 z-50 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[300px] animate-in slide-in-from-bottom-4">
                    <div className="p-2 bg-[var(--admin-accent)]/10 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--admin-accent)]" />
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                            <span>Đang tải tệp lên...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--admin-surface2)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--admin-accent)] transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationDialog />
        </div>
    );
}
