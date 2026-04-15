import Link from "next/link";
import { Pencil } from "lucide-react";

interface PersonaCardProps {
  id: string;
  displayName: string;
  relationshipLabel: string;
  avatarUrl?: string | null;
  createdAt: string;
  lastChatAt?: string;
}

// Helper for relative time
function getRelativeTime(dateString?: string) {
  if (!dateString) return "暂无";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString();
}

export default function PersonaCard({
  id,
  displayName,
  relationshipLabel,
  avatarUrl,
  createdAt,
  lastChatAt,
}: PersonaCardProps) {
  return (
    <div className="group relative transition-all duration-500 hover:-translate-y-1">
      {/* Container Background & Glow */}
      <div 
        className="flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-2xl p-5 backdrop-blur-md relative"
        style={{
          background: "linear-gradient(135deg, #16171D 0%, #1E1F24 100%)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderTop: "1px solid rgba(212, 160, 23, 0.2)",
        }}
      >
        
        {/* Top Section */}
        <div className="relative z-10 flex items-start gap-4">
          {/* Avatar Area */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative">
              <div 
                className="flex h-16 w-16 items-center justify-center rounded-full bg-background overflow-hidden transition-all duration-500 shadow-amber-900/50 shadow-[0_0_15px_-3px_rgba(212,160,23,0.5)] group-hover:shadow-[0_0_25px_-3px_rgba(212,160,23,0.6)]"
                style={{ border: "1px solid rgba(212, 160, 23, 0.15)" }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-serif italic text-accent/80">
                    {displayName ? displayName[0] : ""}
                  </span>
                )}
              </div>
              {/* Breathing Energy Dot */}
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#16171D] bg-[#D4A017] shadow-[0_0_10px_rgba(212,160,23,0.8)] animate-pulse" />
            </div>
            
            <span className="text-[9px] uppercase tracking-tighter opacity-30 whitespace-nowrap" style={{ color: "#475569" }}>
              识于 {new Date(createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-0.5 flex-1 pt-1">
            <div className="flex items-center justify-between">
              <h2 
                className="text-xl font-bold tracking-wide" 
                style={{ color: "#D4A017", textShadow: "0 1px 0 rgba(212, 160, 23, 0.4)" }}
              >
                {displayName}
              </h2>
              <Link 
                href={`/dashboard/edit/${id}`}
                className="p-1 rounded-full text-[#475569] transition-colors hover:text-[#D4A017] hover:bg-white/5 z-20"
                title="修改档案"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-sm tracking-wide" style={{ color: "#64748B" }}>
              {relationshipLabel}
            </p>
          </div>
        </div>

        {/* Bottom Section (Status & Action) */}
        <div className="relative z-10 mt-8 flex items-end justify-between border-t border-white/5 pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-medium opacity-30" style={{ color: "#475569" }}>
              上次对话:
            </span>
            <span className="text-xs opacity-70" style={{ color: lastChatAt ? "#D4A017" : "#475569" }}>
              {getRelativeTime(lastChatAt)}
            </span>
          </div>

          <Link href={`/chat/${id}`} className="z-20">
            <button 
              className="rounded-full px-5 py-2 text-xs font-medium transition-all hover:bg-[#D4A017] hover:text-[#16171D] whitespace-nowrap"
              style={{
                background: "rgba(212, 160, 23, 0.05)",
                border: "1px solid rgba(212, 160, 23, 0.3)",
                color: "#D4A017"
              }}
            >
              进入会话
            </button>
          </Link>
        </div>
        
        {/* Whole card clickable overlay layer */}
        <Link href={`/chat/${id}`} className="absolute inset-0 z-0" />
      </div>
    </div>
  );
}
