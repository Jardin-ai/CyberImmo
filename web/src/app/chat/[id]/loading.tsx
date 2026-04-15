export default function ChatLoading() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <header className="relative z-10 flex h-14 shrink-0 items-center border-b border-border bg-surface/50 px-4 backdrop-blur-md">
        <div className="h-4 w-24 bg-white/5 rounded" />
        <div className="flex-1 flex justify-center">
            <div className="h-5 w-32 bg-white/5 rounded" />
        </div>
        <div className="w-[84px]" />
      </header>

      {/* Messages Skeleton */}
      <div className="relative z-10 flex-1 overflow-hidden p-4 md:p-6 space-y-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full bg-white/5" />
            <div className="h-16 w-3/4 rounded-2xl bg-white/5 shadow-sm" />
          </div>
          <div className="flex items-start gap-4 flex-row-reverse">
            <div className="h-8 w-8 rounded-full bg-white/5" />
            <div className="h-12 w-1/2 rounded-2xl bg-white/5 shadow-sm" />
          </div>
          <div className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full bg-white/5" />
            <div className="h-24 w-2/3 rounded-2xl bg-white/5 shadow-sm" />
          </div>
        </div>
      </div>

      {/* Input Box Skeleton */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10 px-4">
        <div className="mx-auto max-w-3xl h-14 rounded-full border border-border bg-surface/80" />
      </div>
    </div>
  );
}
