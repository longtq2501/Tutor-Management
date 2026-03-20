import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { lessonCategoryApi } from '@/lib/services/lesson-category';
import { AlertTriangle, Check, CheckCircle2, Edit2, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { ActionTooltip } from '@/features/exercises/components/ActionTooltip';
import React, { useRef, useState } from 'react';
import {
    CreateExerciseRequest,
    ExerciseStatus,
    ImportPreviewResponse,
    QuestionPreview,
    QuestionType
} from '../types/exercise.types';
import { exerciseService } from '../services/exerciseService';

interface ImportPreviewStepProps {
    initialData: ImportPreviewResponse;
    onSave: (data: CreateExerciseRequest) => void;
    onBack: () => void;
    isLoading: boolean;
}

export const ImportPreviewStep: React.FC<ImportPreviewStepProps> = ({
    initialData,
    onSave,
    onBack,
    isLoading
}) => {
    const [metadata, setMetadata] = useState(initialData.metadata);
    const [questions, setQuestions] = useState<QuestionPreview[]>(initialData.questions);
    const [editingQuestion, setEditingQuestion] = useState<{ index: number; data: QuestionPreview } | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const questionImageInputRef = useRef<HTMLInputElement | null>(null);

    // Verify total points match
    const calculatedTotal = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const hasPointsMismatch = metadata.totalPoints !== undefined && metadata.totalPoints !== calculatedTotal;


    const handleSaveQuestion = () => {
        if (editingQuestion) {
            const newQuestions = [...questions];
            newQuestions[editingQuestion.index] = editingQuestion.data;
            setQuestions(newQuestions);
            setEditingQuestion(null);
        }
    };

    const handleDeleteQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handlePublish = () => {
        if (!metadata.title) {
            toast.error("Validation Error", {
                description: "Title is required"
            });
            return;
        }

        if (questions.length === 0) {
            toast.error("Validation Error", {
                description: "At least one question is required"
            });
            return;
        }

        // Transform QuestionPreview to QuestionRequest
        const questionRequests = questions.map((q, idx) => ({
            type: q.type,
            questionText: q.questionText,
            imageUrl: q.imageUrl,
            points: q.points,
            orderIndex: idx, // Re-index to ensure order
            rubric: q.rubric,
            // Map options if MCQ
            options: q.options?.map(o => ({
                label: o.label,
                optionText: o.optionText
            })),
            correctAnswer: q.options?.find(o => o.isCorrect)?.label
        }));

        const request: CreateExerciseRequest = {
            title: metadata.title,
            description: metadata.description,
            timeLimit: metadata.timeLimit,
            totalPoints: metadata.totalPoints || 0,
            classId: metadata.classId,
            status: ExerciseStatus.PUBLISHED,
            questions: questionRequests
        };

        onSave(request);
    };

    const handleQuestionImageUpload = async (file: File) => {
        if (!editingQuestion) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Invalid file', { description: 'Please select an image file.' });
            return;
        }

        const maxSizeInBytes = 10 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            toast.error('Image too large', { description: 'Please choose an image smaller than 10MB.' });
            return;
        }

        try {
            setIsUploadingImage(true);
            const imageUrl = await exerciseService.uploadQuestionImage(file);
            setEditingQuestion({
                ...editingQuestion,
                data: { ...editingQuestion.data, imageUrl }
            });
            toast.success('Image uploaded', { description: 'Question image has been attached.' });
        } catch {
            toast.error('Upload failed', { description: 'Could not upload question image.' });
        } finally {
            setIsUploadingImage(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0 overflow-hidden">
            {/* Left Column: Metadata & Actions */}
            <div className="md:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
            <Card>
                <CardHeader>
                    <CardTitle>Exercise Details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <CategorySelect
                            value={metadata.classId || ''}
                            onChange={val => setMetadata(prev => ({ ...prev, classId: val }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={metadata.title || ''}
                            onChange={e => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Exercise Title"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="space-y-2 flex-1">
                            <Label>Time Limit (minutes)</Label>
                            <Input
                                type="number"
                                value={metadata.timeLimit || ''}
                                onChange={e => setMetadata(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                            />
                        </div>
                        <div className="space-y-2 flex-1 relative">
                            <Label>Total Points (Metadata)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="any"
                                    value={metadata.totalPoints || 0}
                                    onChange={e => setMetadata(prev => ({ ...prev, totalPoints: parseFloat(e.target.value) || 0 }))}
                                    className={cn(hasPointsMismatch && "border-yellow-500 focus-visible:ring-yellow-500")}
                                />
                                {hasPointsMismatch && (
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-500 bg-yellow-50 shrink-0 absolute right-2 top-8">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> Mismatch
                                    </Badge>
                                )}
                            </div>
                            {hasPointsMismatch && (
                                <p className="text-[10px] text-yellow-600 mt-1 absolute -bottom-4">
                                    Metadata: {metadata.totalPoints} vs Questions: {calculatedTotal}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                            value={metadata.description || ''}
                            onChange={e => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                            className="min-h-[150px] resize-y"
                            placeholder="Enter exercise description, instructions, or notes here..."
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Actions moved here to be sticky or scrollable at bottom of left column */}
            <div className="flex justify-between pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                <Button variant="outline" onClick={onBack}>Back to Import</Button>
                <div className="space-x-2">
                    <Button onClick={handlePublish} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                        {isLoading ? "Publishing..." : <>Publish Exercise <Check className="ml-2 h-4 w-4" /></>}
                    </Button>
                </div>
            </div>
            
            </div> {/* End Left Column */}

            {/* Right Column: Questions List */}
            <div className="md:col-span-8 flex flex-col h-full overflow-hidden border rounded-xl bg-card/50">
                <div className="flex justify-between items-center p-4 border-b bg-muted/40 shrink-0">
                    <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
                    <ActionTooltip label="Thêm một câu hỏi mới vào cuối danh sách">
                        <Button variant="outline" size="sm" onClick={() => {
                            const newQ: QuestionPreview = {
                                type: QuestionType.MCQ,
                                questionText: "New Question",
                                points: 10,
                                orderIndex: questions.length,
                                options: [
                                    { label: "A", optionText: "Option A", isCorrect: true },
                                    { label: "B", optionText: "Option B", isCorrect: false },
                                    { label: "C", optionText: "Option C", isCorrect: false },
                                    { label: "D", optionText: "Option D", isCorrect: false },
                                ]
                            };
                            setQuestions([...questions, newQ]);
                            setEditingQuestion({ index: questions.length, data: newQ });
                        }}>
                            <Plus className="h-4 w-4 mr-2" /> Add Question
                        </Button>
                    </ActionTooltip>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-4">
                        {questions.map((q, idx) => (
                            <Card key={idx} className="relative group">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">#{idx + 1}</Badge>
                                            <Badge className={cn(
                                                q.type === QuestionType.MCQ ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                            )}>
                                                {q.type}
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">{q.points} pts</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <ActionTooltip label="Chỉnh sửa câu hỏi">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingQuestion({ index: idx, data: q })}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </ActionTooltip>
                                            <ActionTooltip label="Xóa câu hỏi">
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteQuestion(idx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </ActionTooltip>
                                        </div>
                                    </div>
                                    <CardTitle className="text-base mt-2 whitespace-pre-wrap leading-relaxed break-words">
                                        {q.questionText}
                                    </CardTitle>
                                    {q.imageUrl && (
                                        <div className="mt-3 rounded-md overflow-hidden border border-border bg-muted/20">
                                            <Image
                                                src={q.imageUrl}
                                                alt={`Question ${idx + 1} image`}
                                                width={900}
                                                height={500}
                                                className="w-full max-h-64 object-contain"
                                            />
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {q.type === QuestionType.MCQ ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                            {q.options?.map((opt, i) => (
                                                <div key={i} className={cn(
                                                    "p-2 rounded border flex items-center gap-2 text-sm transition-colors",
                                                    opt.isCorrect
                                                        ? "border-green-500 bg-green-50 dark:bg-green-900/30 dark:text-green-100"
                                                        : "border-gray-200 dark:border-border"
                                                )}>
                                                    <span className={cn(
                                                        "font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs",
                                                        opt.isCorrect
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-100 dark:bg-muted text-gray-500 dark:text-muted-foreground"
                                                    )}>{opt.label}</span>
                                                    <span>{opt.optionText}</span>
                                                    {opt.isCorrect && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-sm bg-muted p-3 rounded">
                                            <p className="font-semibold mb-1">Rubric:</p>
                                            <p className="whitespace-pre-wrap leading-relaxed break-words">{q.rubric || 'No rubric provided'}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div> {/* End Right Column */}

            {/* Edit Question Dialog */}
            <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                    </DialogHeader>
                    {editingQuestion && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <Label>Question Text</Label>
                                    <Textarea
                                        className="min-h-[160px] resize-y"
                                        value={editingQuestion.data.questionText}
                                        onChange={e => setEditingQuestion({
                                            ...editingQuestion,
                                            data: { ...editingQuestion.data, questionText: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label>Points</Label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={editingQuestion.data.points}
                                        onChange={e => setEditingQuestion({
                                            ...editingQuestion,
                                            data: { ...editingQuestion.data, points: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Question Image (Optional)</Label>
                                {editingQuestion.data.imageUrl ? (
                                    <div className="space-y-2">
                                        <div className="rounded-md overflow-hidden border border-border bg-muted/20">
                                            <Image
                                                src={editingQuestion.data.imageUrl}
                                                alt="Question image"
                                                width={900}
                                                height={500}
                                                className="w-full max-h-[320px] object-contain"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                disabled={isUploadingImage}
                                                onClick={() => questionImageInputRef.current?.click()}
                                            >
                                                {isUploadingImage ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <ImagePlus className="h-4 w-4 mr-2" />
                                                )}
                                                Replace Image
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => setEditingQuestion({
                                                    ...editingQuestion,
                                                    data: { ...editingQuestion.data, imageUrl: undefined }
                                                })}
                                            >
                                                Remove Image
                                            </Button>
                                        </div>
                                        <Input
                                            ref={questionImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={isUploadingImage}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    await handleQuestionImageUpload(file);
                                                }
                                                e.currentTarget.value = '';
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed border-primary/40 bg-primary/[0.04] p-4">
                                        <Input
                                            ref={questionImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={isUploadingImage}
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    await handleQuestionImageUpload(file);
                                                }
                                                e.currentTarget.value = '';
                                            }}
                                        />
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">Add an image to this question</p>
                                                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP. Max size 10MB.</p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => questionImageInputRef.current?.click()}
                                                disabled={isUploadingImage}
                                            >
                                                {isUploadingImage ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <ImagePlus className="h-4 w-4 mr-2" />
                                                )}
                                                {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">Supports both MCQ and Essay questions.</p>
                            </div>

                            {editingQuestion.data.type === QuestionType.MCQ && (
                                <div className="space-y-2">
                                    <Label>Options</Label>
                                    {editingQuestion.data.options?.map((opt, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <Button
                                                variant={opt.isCorrect ? "default" : "outline"}
                                                size="sm"
                                                className={cn("w-10 h-10 p-0", opt.isCorrect && "bg-green-500 hover:bg-green-600")}
                                                onClick={() => {
                                                    const newOptions = editingQuestion.data.options?.map((o, idx) => ({
                                                        ...o,
                                                        isCorrect: idx === i
                                                    }));
                                                    setEditingQuestion({
                                                        ...editingQuestion,
                                                        data: { ...editingQuestion.data, options: newOptions }
                                                    });
                                                }}
                                            >
                                                {opt.label}
                                            </Button>
                                            <Input
                                                value={opt.optionText}
                                                onChange={e => {
                                                    const newOptions = [...(editingQuestion.data.options || [])];
                                                    newOptions[i].optionText = e.target.value;
                                                    setEditingQuestion({
                                                        ...editingQuestion,
                                                        data: { ...editingQuestion.data, options: newOptions }
                                                    });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {editingQuestion.data.type === QuestionType.ESSAY && (
                                <div>
                                    <Label>Rubric</Label>
                                    <Textarea
                                        className="min-h-[200px] resize-y"
                                        value={editingQuestion.data.rubric || ''}
                                        onChange={e => setEditingQuestion({
                                            ...editingQuestion,
                                            data: { ...editingQuestion.data, rubric: e.target.value }
                                        })}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
                        <Button onClick={handleSaveQuestion} disabled={isUploadingImage}>
                            {isUploadingImage && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {isUploadingImage ? 'Uploading...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const CategorySelect: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const { data: categories = [] } = useQuery({
        queryKey: ['lesson-categories'],
        queryFn: () => lessonCategoryApi.getAll()
    });

    // Ensure we handle "NONE" vs undefined/empty string
    const safeValue = value === "NONE" ? "NONE" : value || "NONE";

    return (
        <Select value={safeValue} onValueChange={(val) => onChange(val === "NONE" ? "" : val)}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="NONE">No Category</SelectItem>
                {categories.map((cat: { id: number; name: string }) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
