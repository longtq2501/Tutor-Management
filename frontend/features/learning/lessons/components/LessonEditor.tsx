'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Type,
    Undo,
    Redo,
    Link as LinkIcon,
    Image as ImageIcon,
    Table as TableIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Plus,
    Trash2,
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CloudinaryUploader } from './CloudinaryUploader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LessonEditorProps {
    content: string;
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
}

const EditorToolbar = ({ editor, disabled }: { editor: Editor | null, disabled?: boolean }) => {
    const [, setUpdateTick] = useState(0);

    useEffect(() => {
        if (!editor) return;

        const handler = () => setUpdateTick(tick => tick + 1);

        editor.on('selectionUpdate', handler);
        editor.on('transaction', handler);

        return () => {
            editor.off('selectionUpdate', handler);
            editor.off('transaction', handler);
        };
    }, [editor]);

    if (!editor) return null;

    const getCurrentStyle = () => {
        if (editor.isActive('heading', { level: 1 })) return 'h1';
        if (editor.isActive('heading', { level: 2 })) return 'h2';
        if (editor.isActive('heading', { level: 3 })) return 'h3';
        if (editor.isActive('heading', { level: 4 })) return 'h4';
        if (editor.isActive('heading', { level: 5 })) return 'h5';
        return 'p';
    };

    return (
        <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/20 items-center">
            {/* Style Selector */}
            <Select
                value={getCurrentStyle()}
                onValueChange={(value) => {
                    if (value === 'p') {
                        editor.chain().focus().setParagraph().run();
                    } else {
                        const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5;
                        editor.chain().focus().toggleHeading({ level }).run();
                    }
                }}
                disabled={disabled}
            >
                <SelectTrigger className="h-8 w-[230px] bg-background">
                    <SelectValue placeholder="Định dạng" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="p">Văn bản thường</SelectItem>
                    <SelectItem value="h1" className="font-black text-lg">Tiêu đề</SelectItem>
                    <SelectItem value="h2" className="text-muted-foreground">Phụ đề</SelectItem>
                    <SelectItem value="h3" className="font-bold">Tiêu đề 1</SelectItem>
                    <SelectItem value="h4" className="font-semibold text-sm">Tiêu đề 2</SelectItem>
                    <SelectItem value="h5" className="font-medium text-xs">Tiêu đề 3</SelectItem>
                </SelectContent>
            </Select>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Đậm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
                className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-muted")}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Nghiêng"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
                className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-muted")}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Gạch chân"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                disabled={disabled || !editor.can().chain().focus().toggleUnderline().run()}
                className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-muted")}
            >
                <UnderlineIcon className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex bg-muted/40 rounded-md p-0.5 gap-0.5">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    disabled={disabled}
                    className={cn("h-7 w-7 p-0 rounded-sm", editor.isActive({ textAlign: 'left' }) && "bg-background shadow-sm")}
                >
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    disabled={disabled}
                    className={cn("h-7 w-7 p-0 rounded-sm", editor.isActive({ textAlign: 'center' }) && "bg-background shadow-sm")}
                >
                    <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    disabled={disabled}
                    className={cn("h-7 w-7 p-0 rounded-sm", editor.isActive({ textAlign: 'right' }) && "bg-background shadow-sm")}
                >
                    <AlignRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                disabled={disabled}
                className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-muted")}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                disabled={disabled}
                className={cn("h-8 w-8 p-0", editor.isActive('orderedList') && "bg-muted")}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Basic Link */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                    const previousUrl = editor.getAttributes('link').href;
                    const url = window.prompt('URL:', previousUrl);
                    if (url === null) return;
                    if (url === '') {
                        editor.chain().focus().extendMarkRange('link').unsetLink().run();
                        return;
                    }
                    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                }}
                disabled={disabled}
                className={cn("h-8 w-8 p-0", editor.isActive('link') && "bg-muted")}
            >
                <LinkIcon className="h-4 w-4" />
            </Button>

            {/* Image Upload Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className="h-8 w-8 p-0"
                    >
                        <ImageIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-4">
                        <CloudinaryUploader
                            type="image"
                            value=""
                            onUploadSuccess={(url) => {
                                if (url) {
                                    editor.chain().focus().setImage({ src: url }).run();
                                }
                            }}
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-center">Tải ảnh lên để chèn vào bài viết</p>
                    </div>
                </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Table Management */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Quản lý bảng"
                        disabled={disabled}
                        className={cn("h-8 w-8 p-0", editor.isActive('table') && "bg-muted")}
                    >
                        <TableIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                    <div className="flex flex-col gap-1">
                        {!editor.isActive('table') ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start gap-2"
                                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            >
                                <Plus className="h-4 w-4" /> Chèn bảng (3x3)
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                                >
                                    Thêm cột bên trái
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                                >
                                    Thêm cột bên phải
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().deleteColumn().run()}
                                >
                                    <Trash2 className="h-4 w-4" /> Xóa cột
                                </Button>
                                <div className="h-px bg-border my-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().addRowBefore().run()}
                                >
                                    Thêm hàng lên trên
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().addRowAfter().run()}
                                >
                                    Thêm hàng xuống dưới
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().deleteRow().run()}
                                >
                                    <Trash2 className="h-4 w-4" /> Xóa hàng
                                </Button>
                                <div className="h-px bg-border my-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().mergeCells().run()}
                                >
                                    Gộp ô
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => editor.chain().focus().splitCell().run()}
                                >
                                    Tách ô
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 text-destructive hover:text-destructive"
                                    onClick={() => editor.chain().focus().deleteTable().run()}
                                >
                                    <Trash2 className="h-4 w-4" /> Xóa bảng
                                </Button>
                            </>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={disabled || !editor.can().chain().focus().undo().run()}
                className="h-8 w-8 p-0"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={disabled || !editor.can().chain().focus().redo().run()}
                className="h-8 w-8 p-0"
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>
    );
};

interface MarkdownStorage {
    getMarkdown(): string;
}

const CustomHeading = Heading.extend({
    parseHTML() {
        return [
            { tag: 'h1', attrs: { level: 1 } },
            { tag: 'h2', attrs: { level: 2 } },
            { tag: 'h3', attrs: { level: 3 } },
            { tag: 'h4', attrs: { level: 4 } },
            { tag: 'h5', attrs: { level: 5 } },
            // Google Docs style detection
            {
                tag: 'p',
                getAttrs: (element) => {
                    const el = element as HTMLElement;
                    const style = el.getAttribute('style') || '';

                    // Check for bold in self or any child (especially spans from Google Docs)
                    const hasBold = el.querySelector('b, strong, span[style*="700"], span[style*="bold"]') ||
                        style.includes('font-weight:700') ||
                        style.includes('bold');

                    // Check font size in self or first child span
                    const firstSpanStyle = el.querySelector('span')?.getAttribute('style') || '';
                    const combinedStyle = style + firstSpanStyle;

                    const fontSizeMatch = combinedStyle.match(/font-size:\s*(\d+(?:\.\d+)?)(pt|px)/);
                    if (fontSizeMatch) {
                        const size = parseFloat(fontSizeMatch[1]);
                        const unit = fontSizeMatch[2];
                        const ptSize = unit === 'px' ? size * 0.75 : size;

                        if (ptSize >= 24) return { level: 1 };
                        if (ptSize >= 18) return { level: 2 };
                        if (ptSize >= 14 && hasBold) return { level: 3 };
                    }

                    // Specific case: Bold + All Caps + Centered/Large enough
                    const text = el.textContent?.trim() || '';
                    if (hasBold && text === text.toUpperCase() && text.length > 3 && text.length < 100) {
                        return { level: 3 };
                    }

                    return false;
                },
                priority: 1100,
            },
        ];
    },
});

interface MarkdownStorage {
    getMarkdown: () => string;
}

export function LessonEditor({ content, onChange, className, disabled = false }: LessonEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Disable default heading
            }),
            CustomHeading.configure({
                levels: [1, 2, 3, 4, 5],
            }),
            Underline,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Link.configure({ openOnClick: false }),
            Image,
            Markdown.configure({
                html: true,
                tightLists: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
                defaultAlignment: 'left',
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4",
                    "text-foreground ring-offset-background tiptap"
                ),
            },
        },
        onUpdate: ({ editor }) => {
            const storage = editor.storage as unknown as { markdown: MarkdownStorage };
            const markdown = storage.markdown.getMarkdown();
            onChange(markdown);
        },
        immediatelyRender: false,
    });

    // Content Sync Logic
    const isInitialMount = useRef(true);
    const previousContent = useRef(content);

    // Reset isInitialMount when content changes from outside (e.g., opening dialog with different lesson)
    useEffect(() => {
        if (content !== previousContent.current) {
            isInitialMount.current = true;
            previousContent.current = content;
        }
    }, [content]);

    useEffect(() => {
        if (!editor || content === undefined) return;

        // Sync process:
        // Get current markdown from editor
        const storage = editor.storage as unknown as { markdown: MarkdownStorage };
        const currentMarkdown = storage.markdown.getMarkdown();

        // Update if there is a mismatch
        if (content !== currentMarkdown) {
            // Priority update:
            // - Initial mount (content arriving late from API)
            // - Editor not focused (avoid jumping while typing)
            // - Explicit clearing of content
            if (isInitialMount.current || !editor.isFocused || content === '') {
                editor.commands.setContent(content);
                isInitialMount.current = false;
            }
        }
    }, [content, editor]);


    return (
        <div className={cn("border rounded-md overflow-hidden bg-background flex flex-col", className)}>
            <EditorToolbar editor={editor} disabled={disabled} />
            <div className="flex-1 overflow-y-auto min-h-[200px]">
                <EditorContent editor={editor} disabled={disabled} />
            </div>
        </div>
    );
}
