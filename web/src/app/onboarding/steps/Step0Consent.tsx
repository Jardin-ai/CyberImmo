import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StepShell from "@/components/onboarding/StepShell";
import Button from "@/components/ui/Button";
import { getPrivacyAgreement, agreeAndCheckPrivacyPolicy } from "../actions";

interface Props {
  onNext: () => void;
  isGuest?: boolean;
}

export default function Step0Consent({ onNext, isGuest = false }: Props) {
  const [content, setContent] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadContent() {
      const text = await getPrivacyAgreement();
      setContent(text);
      setLoading(false);
    }
    loadContent();
  }, []);

  return (
    <StepShell
      step={0}
      title="服务与数据隐私协议"
      subtitle="在进入数字依恋系统前，请您务必仔细阅读以下协议"
    >
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-surface/50 p-4 md:p-6 mb-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-foreground/50">
            加载协议中...
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-foreground/80">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center pt-1">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={submitting}
            />
            <div className="h-5 w-5 rounded border border-border bg-surface transition-colors peer-checked:bg-accent peer-checked:border-accent"></div>
            {agreed && (
              <svg
                className="absolute h-3 w-3 text-black pointer-events-none"
                viewBox="0 0 12 10"
                fill="none"
              >
                <path
                  d="M1 5L4.5 8.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium leading-tight group-hover:text-accent transition-colors">
            我已审慎阅读并完全同意《CyberImmo 用户服务与数据隐私协议》的全部内容，特别是免责声明与数据权限条款。
          </span>
        </label>

        <div className="flex justify-end pt-2">
          <Button
            onClick={async () => {
              if (isGuest) {
                // Guest: skip server action, go directly to next step
                onNext();
                return;
              }
              setSubmitting(true);
              const { success, hasPersonas } = await agreeAndCheckPrivacyPolicy();
              if (success) {
                if (hasPersonas) {
                  window.location.href = "/dashboard";
                } else {
                  onNext();
                }
              } else {
                setSubmitting(false);
                alert("发生错误，请稍后重试");
              }
            }}
            disabled={!agreed || submitting}
            className="min-w-[120px]"
          >
            {submitting ? "请稍候..." : "同意并继续"}
          </Button>
        </div>
      </div>
    </StepShell>
  );
}
