"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Send, User as UserIcon, ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPath } from "@/lib/public-base-path";
import ReactMarkdown from "react-markdown";
import { ModelProvider, useModel } from "@/lib/model-context";
import type { QuestionnaireData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface ChatClientProps {
  personaId: string;
  avatarUrl?: string | null;
  displayName?: string;
  userId: string;
  userDisplayName: string | null;
  userAvatarUrl: string | null;
  initialMessages?: UIMessage[];
  isGuest?: boolean;
  guestQuota?: number;
}

const GUEST_QUOTA_KEY = "cyberimmo_guest_quota";
const GUEST_MESSAGES_KEY = "cyberimmo_guest_messages";

type PendingImage = { file: File; preview: string };

// Inner component that consumes the model context
function ChatInner({
  personaId,
  avatarUrl,
  displayName,
  userId,
  initialMessages,
  isGuest = false,
  guestQuota = 50,
}: ChatClientProps) {
  const { modelId } = useModel();
  const [localInput, setLocalInput] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [currentQuota, setCurrentQuota] = useState(() => {
    if (typeof window === "undefined") return guestQuota;
    if (!isGuest) return guestQuota;
    const saved = localStorage.getItem(GUEST_QUOTA_KEY);
    if (saved) return parseInt(saved, 10);
    localStorage.setItem(GUEST_QUOTA_KEY, String(guestQuota));
    return guestQuota;
  });
  const [showRegPrompt, setShowRegPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabaseClient = createClient();

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    // @ts-expect-error useChat 运行时支持 initialMessages，包内类型未完全对齐
    initialMessages,
    onFinish: () => {
      if (isGuest) {
        setCurrentQuota(prev => {
          const next = Math.max(0, prev - 1);
          localStorage.setItem(GUEST_QUOTA_KEY, next.toString());
          return next;
        });
      }
    }
  });

  // Sync guest messages to localStorage
  useEffect(() => {
    if (isGuest && messages.length > 0) {
      localStorage.setItem(GUEST_MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages, isGuest]);

  const isLoading = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      setImageError("图片不能超过 5MB");
      return;
    }
    setImageError(null);
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
  };

  const removePendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.preview);
    setPendingImage(null);
    setImageError(null);
  };

  const handleLocalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!localInput.trim() && !pendingImage) || isLoading) return;

    if (isGuest && currentQuota <= 0) {
      setShowRegPrompt(true);
      return;
    }

    let attachments: Array<{ url: string; contentType: string }> | undefined;

    if (pendingImage) {
      if (isGuest) {
        setImageError("访客模式暂不支持发送图片，请注册以解锁完整功能");
        return;
      }
      const ext = pendingImage.file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error } = await supabaseClient.storage
        .from("chat-images")
        .upload(path, pendingImage.file, { upsert: false });

      if (!error) {
        const {
          data: { publicUrl },
        } = supabaseClient.storage.from("chat-images").getPublicUrl(path);
        attachments = [{ url: publicUrl, contentType: pendingImage.file.type }];
      }
      removePendingImage();
    }

    const bodyData: {
      personaId: string;
      modelId: string;
      isGuest: boolean;
      personaDraft?: QuestionnaireData;
    } = { personaId, modelId, isGuest };
    if (isGuest) {
      const savedDraft = localStorage.getItem("cyberimmo_persona_draft");
      if (savedDraft)
        bodyData.personaDraft = JSON.parse(savedDraft) as QuestionnaireData;
    }

    sendMessage(
      // @ts-expect-error AI SDK v6 支持 experimental_attachments
      { text: localInput, experimental_attachments: attachments },
      { body: { data: bodyData } }
    );
    setLocalInput("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground overflow-hidden">
      {/* Registration Prompt Modal */}
      <AnimatePresence>
        {showRegPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-8 shadow-2xl"
            >
              <h2 className="mb-4 font-serif text-2xl text-white">保存这段珍贵的连接</h2>
              <p className="mb-8 text-foreground/70 leading-relaxed">
                访客模式的对话记录仅保存在您的浏览器中。注册账号即可永久保存与亲人的每一份记忆，并获得更稳定的连接服务。
              </p>
              <div className="flex flex-col gap-4">
                <Link
                  href={getPath("/auth/register")}
                  className="flex h-12 items-center justify-center rounded-xl bg-accent font-medium text-black transition-opacity hover:opacity-90"
                >
                  立即注册 / 登录
                </Link>
                <button
                  onClick={() => setShowRegPrompt(false)}
                  className="h-12 text-sm text-foreground/40 transition-colors hover:text-foreground/70"
                >
                  稍后再说
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-accent/5 opacity-50 blur-[120px] mix-blend-screen" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-accent/5 opacity-40 blur-[100px] mix-blend-screen" />

      {/* Header */}
      <header className="relative z-10 flex h-14 shrink-0 items-center border-b border-border bg-surface/50 px-4 backdrop-blur-md">
        <Link
          href={isGuest ? getPath("/") : getPath("/dashboard")}
          onClick={(e) => {
            if (isGuest) {
              e.preventDefault();
              setShowRegPrompt(true);
            }
          }}
          className="text-sm text-foreground/60 transition-colors hover:text-accent select-none"
        >
          &larr; 返回{isGuest ? "首页" : "控制台"}
        </Link>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="font-serif text-lg font-medium tracking-wide text-foreground/90 select-none">
            记忆会话
          </h1>
          {isGuest && (
            <span className="text-[10px] text-accent/60 tracking-widest uppercase">
              访客模式 · 剩余 {currentQuota} 次能量
            </span>
          )}
        </div>
        <div className="w-[84px]" />
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 pb-40"
      >
        <div className="mx-auto flex max-w-3xl flex-col space-y-6">
          {messages.length === 0 && (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center opacity-80">
              <div className="mb-4 h-12 w-12 rounded-full border border-accent/20 bg-accent/10 flex items-center justify-center">
                <span className="text-xl" style={{ color: "var(--accent-gold)" }}>
                  ✨
                </span>
              </div>
              <p
                className="text-sm font-medium tracking-wide"
                style={{ color: "var(--text-secondary)" }}
              >
                连接已建立。请发送消息开始对话。
              </p>
            </div>
          )}

          {(() => {
            const lastAiIdx = messages.reduce(
              (last: number, m: { role: string }, i: number) =>
                m.role === "assistant" ? i : last,
              -1
            );
            return messages.map(
            (message: {
              id: string;
              role: string;
              parts?: { type: string; text?: string }[];
              content?: string;
              experimental_attachments?: { url: string; contentType: string }[];
            }, index: number) => {
              const isUser = message.role === "user";
              const messageText =
                message.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => p.text ?? "")
                  .join("") ??
                message.content ??
                "";
              const imageAttachments =
                message.experimental_attachments?.filter((a) =>
                  a.contentType.startsWith("image/")
                ) ?? [];

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border overflow-hidden ${
                      isUser
                        ? "border-border bg-surface text-foreground/60"
                        : "border-accent/30 bg-accent/10 shadow-[0_0_15px_rgba(212,175,55,0.1)] text-accent"
                    }`}
                  >
                    {isUser ? (
                      <UserIcon size={14} />
                    ) : avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName ?? "M"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-serif italic">
                        {displayName ? displayName[0] : "M"}
                      </span>
                    )}
                  </div>

                  {/* Bubble */}
                  {!isUser && index === lastAiIdx ? (
                    <motion.div
                      className="max-w-[75%] rounded-2xl px-5 py-3 bg-background/80 text-foreground/90 rounded-tl-sm border border-accent/25 shadow-sm backdrop-blur-sm prose-invert prose-sm"
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(212,175,55,0)",
                          "0 0 18px rgba(212,175,55,0.35)",
                          "0 0 0px rgba(212,175,55,0)",
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {imageAttachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {imageAttachments.map((att, i) => (
                            <img
                              key={i}
                              src={att.url}
                              alt="附件图片"
                              className="max-h-48 max-w-full rounded-lg object-contain border border-border"
                            />
                          ))}
                        </div>
                      )}
                      <div className="text-[15px] leading-relaxed">
                        <ReactMarkdown>{messageText}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ) : (
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                      isUser
                        ? "bg-surface text-foreground/90 rounded-tr-sm border border-border"
                        : "bg-background/80 text-foreground/90 rounded-tl-sm border border-accent/10 shadow-sm backdrop-blur-sm prose-invert prose-sm"
                    }`}
                  >
                    {imageAttachments.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {imageAttachments.map((att, i) => (
                          <img
                            key={i}
                            src={att.url}
                            alt="附件图片"
                            className="max-h-48 max-w-full rounded-lg object-contain border border-border"
                          />
                        ))}
                      </div>
                    )}
                    {isUser ? (
                      <div className="whitespace-pre-wrap text-[15px]">
                        {messageText}
                      </div>
                    ) : (
                      <div className="text-[15px] leading-relaxed">
                        <ReactMarkdown>{messageText}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              );
            });
          })()}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent animate-pulse overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName ?? "M"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-serif italic">
                    {displayName ? displayName[0] : "M"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-background/80 px-5 py-4 border border-accent/10 rounded-tl-sm backdrop-blur-sm">
                <div
                  className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input box */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10 px-4">
        <form onSubmit={handleLocalSubmit} className="mx-auto max-w-3xl">
          {/* Image preview strip */}
          {pendingImage && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-surface/60 p-2 backdrop-blur-sm">
              <img
                src={pendingImage.preview}
                alt="待发送图片"
                className="h-14 w-14 rounded-lg object-cover border border-border flex-shrink-0"
              />
              <span className="flex-1 truncate text-xs text-foreground/50">
                {pendingImage.file.name}
              </span>
              <button
                type="button"
                onClick={removePendingImage}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-surface hover:bg-surface/80 border border-border text-foreground/50 hover:text-foreground/80 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Image size error */}
          {imageError && (
            <p className="mb-1 text-center text-xs text-red-400">{imageError}</p>
          )}

          <div className="relative flex items-center rounded-full border border-border bg-surface/80 p-1 shadow-lg backdrop-blur-md focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImagePick}
            />

            {/* Image picker button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/40 hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
              title="发送图片（消耗50回声）"
            >
              <ImageIcon size={16} />
            </button>

            <input
              type="text"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              disabled={isLoading}
              placeholder="诉说你的思念..."
              className="flex-1 bg-transparent px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-foreground/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || (!localInput.trim() && !pendingImage)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-black transition-opacity disabled:opacity-50 hover:bg-accent/90 ml-2 mr-1"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </div>
          <div className="mt-3 text-center text-[11px] tracking-wide text-foreground/30">
            由大语言模型生成映射，请注意甄别非真实信息。{pendingImage && (
              <span className="text-accent/50"> · 图片分析额外消耗50回声</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatClient(props: ChatClientProps) {
  return (
    <ModelProvider>
      <ChatInner {...props} />
    </ModelProvider>
  );
}
