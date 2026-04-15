"use client";

import StepShell from "@/components/onboarding/StepShell";
import ChipSelect from "@/components/ui/ChipSelect";
import Input from "@/components/ui/Input";
import { compressImage } from "@/lib/image-utils";
import { RELATIONSHIP_OPTIONS, type QuestionnaireData } from "@/lib/types";
import { Camera, X } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
  onNext: () => void;
}

export default function Step1Basic({ data, onChange, onNext }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [customRelationship, setCustomRelationship] = useState(
    RELATIONSHIP_OPTIONS.includes(
      data.relationship as (typeof RELATIONSHIP_OPTIONS)[number],
    )
      ? ""
      : data.relationship,
  );
  const isOther =
    data.relationship === "其他" ||
    (data.relationship &&
      !RELATIONSHIP_OPTIONS.includes(
        data.relationship as (typeof RELATIONSHIP_OPTIONS)[number],
      ));
  const canProceed =
    data.deceasedName.trim() !== "" && data.relationship.trim() !== "";

  function handleRelationshipChange(value: string | string[]) {
    const v = value as string;
    if (v === "其他") {
      onChange({ relationship: customRelationship || "其他" });
    } else {
      onChange({ relationship: v });
      setCustomRelationship("");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const isLarge = file.size > 1024 * 1024; // 1MB

      const reader = new FileReader();
      reader.onloadend = async () => {
        let result = reader.result as string;

        if (isLarge) {
          setIsCompressing(true);
          try {
            result = await compressImage(result);
          } catch (err) {
            console.error("Compression failed:", err);
          } finally {
            setIsCompressing(false);
          }
        }

        onChange({ avatarUrl: result });
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <StepShell
      step={1}
      title="关于TA"
      subtitle="告诉我们您想念的那个TA"
      onNext={onNext}
      nextDisabled={!canProceed || isCompressing}
    >
      <div className="flex flex-col items-center justify-center space-y-3 pb-4">
        <div
          className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface transition-all hover:border-accent/50"
          onClick={() => !isCompressing && fileInputRef.current?.click()}
        >
          {isCompressing ? (
            <div className="flex flex-col items-center justify-center text-accent/60">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent mb-1" />
              <span className="text-[10px]">压缩中...</span>
            </div>
          ) : data.avatarUrl ? (
            <>
              <img
                src={data.avatarUrl}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-foreground/40">
              <Camera className="h-8 w-8 mb-1" />
              <span className="text-[10px]">上传头像</span>
            </div>
          )}
        </div>

        {data.avatarUrl && (
          <button
            type="button"
            onClick={() => onChange({ avatarUrl: "" })}
            className="text-[11px] text-foreground/40 hover:text-red-400 flex items-center gap-1"
          >
            <X size={12} /> 移除头像
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <p className="text-[10px] text-foreground/30">
          上传一张TA的照片，让思念更有实感（可选）
        </p>
      </div>

      <Input
        label="您想怎么称呼TA？"
        id="deceasedName"
        placeholder="比如：妈妈、爸爸、奶奶..."
        value={data.deceasedName}
        onChange={(e) => onChange({ deceasedName: e.target.value })}
        required
      />

      <ChipSelect
        label="TA是您的"
        options={RELATIONSHIP_OPTIONS}
        value={isOther ? "其他" : data.relationship}
        onChange={handleRelationshipChange}
      />

      {isOther && (
        <Input
          label="请输入TA是您的什么？"
          id="customRelationship"
          placeholder="比如：师傅、同学..."
          value={customRelationship}
          onChange={(e) => {
            setCustomRelationship(e.target.value);
            onChange({ relationship: e.target.value });
          }}
        />
      )}
    </StepShell>
  );
}
