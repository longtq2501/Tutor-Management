'use client';

import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useMemo, useRef, useState } from 'react';

interface TutorCommentBoxProps {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function TutorCommentBox({ value, disabled = false, onChange, onSave }: TutorCommentBoxProps) {
  const debouncedValue = useDebounce(value, 1000);
  const lastSavedValueRef = useRef(value);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    lastSavedValueRef.current = value;
    setSaveState('idle');
  }, []);

  useEffect(() => {
    if (disabled) {
      return;
    }

    if (debouncedValue === lastSavedValueRef.current) {
      return;
    }

    let cancelled = false;
    setSaveState('saving');

    onSave(debouncedValue)
      .then(() => {
        if (cancelled) return;
        lastSavedValueRef.current = debouncedValue;
        setSaveState('saved');
      })
      .catch(() => {
        if (cancelled) return;
        setSaveState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedValue, disabled, onSave]);

  const saveLabel = useMemo(() => {
    if (saveState === 'saving') return 'Đang lưu...';
    if (saveState === 'saved') return 'Đã lưu ✓';
    if (saveState === 'error') return 'Lưu thất bại, thử lại';
    return 'Tự động lưu sau 1 giây';
  }, [saveState]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Nhận xét của gia sư</p>
      <Textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nhập nhận xét tổng kết tháng..."
        className="min-h-40"
      />
      <p
        className={`text-xs ${
          saveState === 'error' ? 'text-red-500' : saveState === 'saved' ? 'text-emerald-600' : 'text-muted-foreground'
        }`}
      >
        {saveLabel}
      </p>
    </div>
  );
}
