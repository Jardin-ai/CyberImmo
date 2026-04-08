// @ts-nocheck
"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "@ai-sdk/react";
import { Send, User as UserIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface ChatClientProps {
  personaId: string;
}

export default function ChatClient({ personaId }: ChatClientProps) {
  // @ts-ignore
  const chatProps = useChat({
    api: "/api/chat",
    body: {
      data: {
        personaId,
      },
    },
  }) as any;

  const messages: UIMessage[] = chatProps.messages || [];
  const input = chatProps.input || "";
  const handleInputChange = chatProps.handleInputChange;
  const handleSubmit = chatProps.handleSubmit;
  const isLoading = chatProps.isLoading || false;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background text-foreground overflow-hidden">
      {/* Ambient background glow (金色呼吸灯 radial gradient) */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-accent/5 opacity-50 blur-[120px] mix-blend-screen" />
      <div className="pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-accent/5 opacity-40 blur-[100px] mix-blend-screen" />

      {/* Header */}
      <header className="relative z-10 flex h-14 shrink-0 items-center border-b border-border bg-surface/50 px-4 backdrop-blur-md">
        <Link href="/dashboard" className="text-sm text-foreground/60 transition-colors hover:text-accent">
          &larr; 返回控制台
        </Link>
        <h1 className="flex-1 text-center font-serif text-lg font-medium tracking-wide text-foreground/90">
          记忆会话
        </h1>
        <div className="w-[84px]"></div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 pb-32">
        <div className="mx-auto flex max-w-3xl flex-col space-y-6">
          {messages.length === 0 && (
            <div className="flex h-[50vh] flex-col items-center justify-center text-center opacity-80">
              <div className="mb-4 h-12 w-12 rounded-full border border-accent/20 bg-accent/10 flex items-center justify-center">
                <span className="text-xl" style={{ color: "var(--accent-gold)" }}>✨</span>
              </div>
              <p className="text-sm font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>
                连接已建立。请发送消息开始对话。
              </p>
            </div>
          )}

          {messages.map((message: any) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    isUser
                      ? "border-border bg-surface text-foreground/60"
                      : "border-accent/30 bg-accent/10 shadow-[0_0_15px_rgba(212,175,55,0.1)] text-accent"
                  }`}
                >
                  {isUser ? <UserIcon size={14} /> : <span className="font-serif italic">M</span>}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                    isUser
                      ? "bg-surface text-foreground/90 rounded-tr-sm border border-border"
                      : "bg-background/80 text-foreground/90 rounded-tl-sm border border-accent/10 shadow-sm backdrop-blur-sm prose-invert prose-sm"
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap text-[15px]">{message.content}</div>
                  ) : (
                    <div className="text-[15px] leading-relaxed">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 shadow-[0_0_15px_rgba(212,175,55,0.1)] text-accent animate-pulse">
                <span className="font-serif italic">M</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-background/80 px-5 py-4 border border-accent/10 rounded-tl-sm backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Box ( Capsule ) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background to-transparent pb-6 pt-10 px-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="relative flex items-center rounded-full border border-border bg-surface/80 p-1 shadow-lg backdrop-blur-md focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="诉说你的思念..."
              className="flex-1 bg-transparent px-6 py-3 text-[15px] text-foreground outline-none placeholder:text-foreground/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-black transition-opacity disabled:opacity-50 hover:bg-accent/90 ml-2 mr-1"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </div>
          <div className="mt-3 text-center text-[11px] tracking-wide text-foreground/30">
            由大语言模型生成映射，请注意甄别非真实信息。
          </div>
        </form>
      </div>
    </div>
  );
}
