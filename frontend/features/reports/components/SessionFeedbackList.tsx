'use client';

import type { MonthlyReportSessionFeedback } from '@/lib/types';

interface SessionFeedbackListProps {
  feedbacks: MonthlyReportSessionFeedback[];
}

export function SessionFeedbackList({ feedbacks }: SessionFeedbackListProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">AI Feedback tham khảo</p>
      <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
        {feedbacks?.length ? (
          feedbacks.map((feedback, index) => (
            <div key={`${feedback.sessionDate}-${index}`} className="rounded-md border bg-muted/20 p-2">
              <p className="text-xs font-semibold text-muted-foreground">{feedback.sessionDate}</p>
              <p className="text-sm">{feedback.feedback || 'Không có nội dung'}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Không có feedback trong tháng này.</p>
        )}
      </div>
    </div>
  );
}
