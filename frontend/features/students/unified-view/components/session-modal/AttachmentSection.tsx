import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, FileText } from 'lucide-react';
import React from 'react';

interface AttachmentSectionProps {
    lessons: { id: number; title: string; summary?: string }[];
    documents: { id: number; title?: string; fileName?: string }[];
    selectedLessonIds: number[];
    selectedDocIds: number[];
    toggleLesson: (id: number) => void;
    toggleDoc: (id: number) => void;
}

/**
 * Attachment selection lists (Lessons & Documents) for AddSessionModal.
 */
export function AttachmentSection({
    lessons,
    documents,
    selectedLessonIds,
    selectedDocIds,
    toggleLesson,
    toggleDoc
}: AttachmentSectionProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50 mt-5">
            {/* Lessons List */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    Đính kèm Bài giảng
                    <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">{selectedLessonIds.length} đã chọn</Badge>
                </Label>
                <ScrollArea className="h-[150px] w-full rounded-xl border border-border/50 bg-muted/20 p-2">
                    <div className="space-y-2">
                        {lessons?.map((lesson: { id: number; title: string; summary?: string }) => (
                            <div key={lesson.id} className="flex items-start space-x-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                                <Checkbox
                                    id={`lesson-${lesson.id}`}
                                    checked={selectedLessonIds.includes(lesson.id)}
                                    onCheckedChange={() => toggleLesson(lesson.id)}
                                />
                                <label
                                    htmlFor={`lesson-${lesson.id}`}
                                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer pt-0.5"
                                >
                                    {lesson.title}
                                    {lesson.summary && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{lesson.summary}</p>}
                                </label>
                            </div>
                        ))}
                        {!lessons?.length && <p className="text-xs text-muted-foreground text-center py-4">Chưa có bài giảng nào</p>}
                    </div>
                </ScrollArea>
            </div>

            {/* Documents List */}
            <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <FileText className="w-3.5 h-3.5" />
                    Đính kèm Tài liệu
                    <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">{selectedDocIds.length} đã chọn</Badge>
                </Label>
                <ScrollArea className="h-[150px] w-full rounded-xl border border-border/50 bg-muted/20 p-2">
                    <div className="space-y-2">
                        {documents?.map(doc => (
                            <div key={doc.id} className="flex items-center space-x-2 p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                                <Checkbox
                                    id={`doc-${doc.id}`}
                                    checked={selectedDocIds.includes(doc.id)}
                                    onCheckedChange={() => toggleDoc(doc.id)}
                                />
                                <label
                                    htmlFor={`doc-${doc.id}`}
                                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {doc.title || doc.fileName}
                                </label>
                            </div>
                        ))}
                        {!documents?.length && <p className="text-xs text-muted-foreground text-center py-4">Chưa có tài liệu nào</p>}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
