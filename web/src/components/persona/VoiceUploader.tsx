"use client";

import { useRef, useState } from "react";
import { Mic, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface VoiceUploaderProps {
  personaId: string;
  existingVoiceId?: string | null;
}

type UploadState = "idle" | "loading" | "success" | "error";

export default function VoiceUploader({
  personaId,
  existingVoiceId,
}: VoiceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [resultVoiceId, setResultVoiceId] = useState<string | null>(
    existingVoiceId ?? null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.size > 5 * 1024 * 1024) {
      setFileError("音频文件不能超过 5MB");
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
    setUploadState("idle");
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploadState === "loading") return;

    setUploadState("loading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("audio", selectedFile);
    formData.append("personaId", personaId);

    try {
      const res = await fetch("/api/persona/clone", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message ?? "声纹克隆失败");
      }

      setResultVoiceId(json.voice_id);
      setUploadState("success");
      setSelectedFile(null);
    } catch (err) {
      setUploadState("error");
      setErrorMessage(err instanceof Error ? err.message : "上传失败，请重试");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Mic size={16} className="text-accent" />
        <h3 className="text-sm font-medium tracking-wide" style={{ color: "var(--text-primary)" }}>
          声纹克隆
        </h3>
        {resultVoiceId && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] text-green-400">
            <CheckCircle2 size={11} />
            已绑定声纹
          </span>
        )}
      </div>

      <p className="mb-4 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        上传一段 <strong>15–30秒</strong> 的纯净音频（.wav / .mp3），系统将提取声纹并用于语音合成。
        文件大小限制 5MB。
      </p>

      {/* File picker area */}
      <div
        className="mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/30 py-5 transition-colors hover:border-accent/40 hover:bg-accent/5"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,audio/wav,audio/mpeg"
          className="hidden"
          onChange={handleFileChange}
        />
        <Upload size={20} className="text-foreground/30" />
        {selectedFile ? (
          <span className="text-xs font-medium text-accent">{selectedFile.name}</span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            点击选择音频文件
          </span>
        )}
      </div>

      {/* Audio preview */}
      {selectedFile && (
        <audio
          controls
          src={URL.createObjectURL(selectedFile)}
          className="mb-3 w-full rounded-lg"
        />
      )}

      {fileError && (
        <p className="mb-2 flex items-center gap-1 text-xs text-red-400">
          <AlertCircle size={12} />
          {fileError}
        </p>
      )}

      {errorMessage && (
        <p className="mb-2 flex items-center gap-1 text-xs text-red-400">
          <AlertCircle size={12} />
          {errorMessage}
        </p>
      )}

      {uploadState === "success" && (
        <p className="mb-2 flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 size={12} />
          声纹提取成功！ID: {resultVoiceId}
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || uploadState === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-2.5 text-sm font-medium text-black transition-opacity hover:bg-accent/90 disabled:opacity-40"
      >
        {uploadState === "loading" ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            正在克隆声纹…
          </>
        ) : (
          <>
            <Mic size={14} />
            上传并克隆声纹
          </>
        )}
      </button>
    </div>
  );
}
