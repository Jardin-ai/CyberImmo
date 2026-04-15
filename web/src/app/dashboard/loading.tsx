export default function DashboardLoading() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      {/* Sidebar Loading Placeholder */}
      <div 
        className="hidden md:flex h-full w-64 flex-col animate-pulse"
        style={{ background: "#1F2229", borderRight: "1px solid #2D3139" }}
      >
        <div className="h-14 border-b border-[#2D3139] px-4 flex items-center">
            <div className="h-3 w-20 bg-white/5 rounded" />
        </div>
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5" />
                <div className="space-y-2">
                    <div className="h-3 w-24 bg-white/5 rounded" />
                    <div className="h-2 w-16 bg-white/5 rounded" />
                </div>
            </div>
            <div className="h-24 w-full rounded-xl bg-white/5" />
            <div className="space-y-3">
                <div className="h-10 w-full rounded-lg bg-white/5" />
                <div className="h-10 w-full rounded-lg bg-white/5" />
                <div className="h-10 w-full rounded-lg bg-white/5" />
            </div>
        </div>
      </div>

      {/* Main Content Loading Skeleton */}
      <div className="flex-1 flex flex-col">
        <header className="flex h-14 shrink-0 items-center px-4 border-b border-border bg-surface/30 md:hidden">
            <div className="h-8 w-8 rounded-lg bg-white/5 animate-pulse" />
        </header>

        <div className="flex-1 p-6 md:p-12 animate-pulse">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-white/5 rounded" />
                <div className="h-4 w-64 bg-white/5 rounded" />
              </div>
              <div className="h-10 w-32 bg-white/5 rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/5 border border-white/5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
