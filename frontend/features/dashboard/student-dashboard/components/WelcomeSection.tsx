// ============================================================================
// FILE: student-dashboard/components/WelcomeSection.tsx
// ============================================================================
export const WelcomeSection = ({ userName, quote }: { userName: string; quote: string }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-3xl p-8 border border-blue-100 dark:border-blue-900/30 shadow-sm relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />

    <div className="relative z-10">
      <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-2">
        👋 Xin chào, <span className="text-blue-600 dark:text-blue-400">{userName}</span>!
      </h1>
      <p className="text-muted-foreground font-medium text-lg">
        &quot;{quote}&quot;
      </p>
    </div>
  </div>
);