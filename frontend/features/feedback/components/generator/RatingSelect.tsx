"use client";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";

/**
 * Interface for RatingSelect component props.
 */
interface RatingSelectProps<TFieldValues extends FieldValues> {
    /** The form instance from react-hook-form */
    form: UseFormReturn<TFieldValues>;
    /** The field name to map to the select value */
    name: Path<TFieldValues>;
    /** Display label for the rating field */
    label: string;
    /** List of available rating options */
    ratings: string[];
}

/**
 * A themed select component for choosing student performance levels.
 */
export function RatingSelect<TFieldValues extends FieldValues>({ form, name, label, ratings }: RatingSelectProps<TFieldValues>) {
    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-4 w-1 bg-primary/60 rounded-full" />
                        <FormLabel className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                            {label}
                        </FormLabel>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger className="bg-background/50 backdrop-blur-sm h-11 text-xs font-bold rounded-2xl border-border/40 focus:ring-primary/20 shadow-sm transition-all hover:bg-background/80">
                                <SelectValue placeholder="Chọn mức độ" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-[1.5rem] border-border/40 shadow-2xl backdrop-blur-xl bg-background/95">
                            {ratings.map((r) => (
                                <SelectItem key={r} value={r} className="text-xs font-semibold py-2.5 px-4 focus:bg-primary/5 transition-colors">
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
