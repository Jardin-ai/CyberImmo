"use client";

import StepShell from "@/components/onboarding/StepShell";
import TextArea from "@/components/ui/TextArea";
import type { QuestionnaireData } from "@/lib/types";

interface Props {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Step3Memories({ data, onChange, onPrev, onNext }: Props) {
  // Now optional in the new 10-item flow
  const canProceed = true; 

  return (
    <StepShell
      step={3}
      title="情感连接"
      subtitle="那些值得珍藏的瞬间"
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={!canProceed}
    >
      <TextArea
        label="你们之间最珍贵的一段记忆是什么？"
        hint="选填，建议填写以获得更真实的互动"
        id="fondMemory"
        placeholder="一段故事、一个画面、一句话都可以..."
        value={data.fondMemory}
        onChange={(e) => onChange({ fondMemory: e.target.value })}
        maxLength={500}
      />
    </StepShell>
  );
}
