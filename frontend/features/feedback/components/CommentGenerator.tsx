"use client";

import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { InlineKeywordInput } from "./generator/InlineKeywordInput";
import { GeneratorStyleSelector } from "./generator/GeneratorStyleSelector";
import { GeneratorActions } from "./generator/GeneratorActions";
import { RatingSelect } from "./generator/RatingSelect";
import { useSmartFeedback } from "../hooks/useSmartFeedback";
import type { LessonDetailFormData } from "../../calendar/calendar-view/components/LessonDetailModal/types";

/**
 * Props for the CommentGenerator component.
 */
interface CommentGeneratorProps {
    /** The form instance from react-hook-form */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any;
    /** Label for the section */
    label: string;
    /** The field name for the rating selection */
    ratingField: string;
    /** The field name for the final comment text */
    commentField: string;
    /** The feedback category (e.g., ATTITUDE, ABSORPTION) */
    category: "ATTITUDE" | "ABSORPTION" | "GAPS" | "SOLUTIONS";
    /** List of available rating values */
    ratings?: string[];
    /** Name of the student */
    studentName: string;
    /** If true, the rating selection UI is hidden (used for GAPS/SOLUTIONS) */
    hideRating?: boolean;
    /** The subject being taught */
    subject?: string;
    /** Targeted language for the comment */
    language?: string;
}

/**
 * A hybrid AI-powered feedback generator that provides smart suggestions
 * while allowing for manual keyword input and style customization.
 * 
 * DESIGN: Adheres to modular architecture by extracting UI sections into internal components.
 */
export function CommentGenerator(props: CommentGeneratorProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feedback = useSmartFeedback(props as any);

    const {
        form, label, ratingField, commentField, ratings, hideRating
    } = props;

    const { currentRating } = feedback;

    return (
        <div className="relative group/generator p-5 rounded-[2rem] bg-card/60 dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-slate-800 shadow-xl shadow-primary/5 space-y-5 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 overflow-hidden">
            {/* Background Accent Animation */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none opacity-0 group-hover/generator:opacity-100 transition-opacity duration-700" />

            <RatingHeaderSelection
                form={form} label={label} name={ratingField}
                ratings={ratings} hideRating={hideRating}
            />

            <GeneratorControls
                feedback={feedback}
                disabled={!currentRating && !hideRating}
            />

            <GeneratedCommentArea
                form={form}
                name={commentField}
            />
        </div>
    );
}

/**
 * Internal component for the Rating selection or static label header.
 */
function RatingHeaderSelection({
    form, label, name, ratings = [], hideRating
}: Pick<CommentGeneratorProps, "form" | "label" | "ratings" | "hideRating"> & { name: string }) {
    if (!hideRating) {
        return (
            <div className="space-y-3">
                <RatingSelect form={form} name={name} label={label} ratings={ratings} />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-4 bg-primary/40 rounded-full" />
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                {label}
            </div>
        </div>
    );
}

/**
 * Internal component for the AI generation settings and actions.
 */
function GeneratorControls({
    feedback, disabled
}: { feedback: ReturnType<typeof useSmartFeedback>; disabled: boolean }) {
    const {
        keywords, selectedKeywords, isGenerating, tone, length, inputValue,
        setTone, setLength, setInputValue, toggleKeyword, addCustomKeyword, removeKeyword, generate
    } = feedback;

    return (
        <div className="relative space-y-4">
            <GeneratorStyleSelector
                tone={tone} length={length}
                onToneChange={setTone} onLengthChange={setLength}
            />

            <InlineKeywordInput
                value={inputValue} onChange={setInputValue}
                suggestions={keywords} selected={selectedKeywords}
                onToggle={toggleKeyword} onAdd={addCustomKeyword} onRemove={removeKeyword}
            />

            <GeneratorActions
                onGenerate={() => generate(false)}
                onShuffle={() => generate(true)}
                isGenerating={isGenerating}
                disabled={disabled}
            />
        </div>
    );
}

/**
 * Internal component for the editable generated feedback text area.
 */
function GeneratedCommentArea({ form, name }: { form: any; name: string }) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="relative">
                    <FormControl>
                        <div className="relative">
                            <Textarea
                                {...field}
                                placeholder="Nhận xét chi tiết... (AI sẽ giúp bạn tinh chỉnh nội dung này)"
                                className="min-h-[7rem] resize-none focus-visible:ring-primary/20 rounded-2xl bg-muted/30 border-border/40 text-[13px] font-medium leading-relaxed p-4 transition-all duration-300 focus:bg-background shadow-inner"
                            />
                            <div className="absolute bottom-2 right-3 flex items-center gap-1.5 opacity-40">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">AI Assisted</span>
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
