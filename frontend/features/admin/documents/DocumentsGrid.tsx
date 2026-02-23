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
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--admin-text3)]">
                        <button
                            onClick={() => handleNavigate(null)}
                            className={`p-2 rounded-lg hover:bg-[var(--admin-surface2)] transition-all ${!currentFolder ? 'text-[var(--admin-accent)]' : ''}`}
                        >
                            <Home className="h-4 w-4" />
                        </button>
                        {breadcrumbs.map((b, idx) => (
                            <div key={b.id} className="flex items-center gap-2">
                                <ChevronRight className="h-3 w-3 opacity-30" />
                                <button
                                    onClick={() => handleNavigate(b)}
                                    className={`hover:text-[var(--admin-text)] transition-colors ${idx === breadcrumbs.length - 1 ? 'text-[var(--admin-text)]' : ''}`}
                                >
                                    {b.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCreateFolder}
                            className="bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text)] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:border-[var(--admin-accent)] transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Thư mục mới</span>
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                multiple
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => handleUpload(e.target.files)}
                                disabled={uploading}
                            />
                            <button className="bg-[var(--admin-accent)] text-[var(--admin-bg)] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-[var(--admin-accent)]/20 hover:scale-105 active:scale-95 transition-all">
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                <span>{uploading ? `Đang tải ${uploadProgress}%` : 'Tải tài liệu'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text3)]" />
                    <input
                        type="text"
                        placeholder="Tìm tài liệu hoặc thư mục..."
                        className="w-full h-11 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl pl-10 pr-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all shadow-sm"
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* Folders */}
                    {folders.map((folder) => (
                        <div
                            key={folder.id}
                            onClick={() => handleNavigate(folder)}
                            className="group relative bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--admin-accent)] hover:shadow-xl hover:shadow-[var(--admin-accent)]/5 cursor-pointer transition-all duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-amber-500/10 rounded-xl group-hover:scale-110 transition-transform">
                                    <FolderIcon className="h-6 w-6 text-amber-500 fill-amber-500/20" />
                                </div>
                                <button
                                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                                    className="p-1.5 opacity-0 group-hover:opacity-100 text-[var(--admin-text3)] hover:text-rose-500 rounded-lg transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-bold text-[var(--admin-text)] truncate">{folder.name}</span>
                                <span className="text-[10px] font-medium text-[var(--admin-text3)] uppercase">{folder.documentCount} tài liệu</span>
                            </div>
                        </div>
                    ))}

                    {/* Documents */}
                    {docs.map((doc) => (
                        <div
                            key={doc.id}
                            className="group relative bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-4 flex flex-col gap-4 hover:border-[var(--admin-accent)] transition-all duration-300"
                        >
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-[var(--admin-surface2)] rounded-xl group-hover:scale-110 transition-transform">
                                    {getFileIcon(doc.fileType)}
                                </div>
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleDeleteDoc(doc.id)}
                                        className="p-1.5 text-[var(--admin-text3)] hover:text-rose-500 rounded-lg transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                    <a
                                        href={doc.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-[var(--admin-text3)] hover:text-[var(--admin-accent)] rounded-lg transition-all"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-[var(--admin-text)] line-clamp-2 leading-relaxed" title={doc.title}>
                                    {doc.title}
                                </span>
                                <div className="flex items-center gap-2 text-[9px] font-black text-[var(--admin-text3)] uppercase tracking-wider">
                                    <span>{doc.fileType.split('/')[1] || 'FILE'}</span>
                                    <span className="w-1 h-1 rounded-full bg-[var(--admin-border)]" />
                                    <span>{(doc.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {!loading && folders.length === 0 && docs.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                            <Upload className="h-12 w-12" />
                            <p className="text-sm font-bold uppercase tracking-widest">Thư mục trống. Kéo thả file để tải lên.</p>
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
