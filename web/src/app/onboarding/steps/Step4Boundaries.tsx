"use client";

import StepShell from "@/components/onboarding/StepShell";
import Input from "@/components/ui/Input";
import ChipSelect from "@/components/ui/ChipSelect";
import { COMFORT_STYLE_OPTIONS, type QuestionnaireData } from "@/lib/types";

interface Props {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Step4Boundaries({ data, onChange, onPrev, onNext }: Props) {
  const canProceed = data.honorific.trim() !== "";

  return (
    <StepShell
      step={4}
      title="互动规则"
      subtitle="让对话更贴近你们的真实相处"
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={!canProceed}
    >
      <Input
        label="TA平时怎么称呼您？"
        id="honorific"
        placeholder="比如：小宝、闺女、儿子..."
        value={data.honorific}
        onChange={(e) => onChange({ honorific: e.target.value })}
        required
      />

      <ChipSelect
        label="您希望TA如何安慰您？（可多选）"
        options={COMFORT_STYLE_OPTIONS}
        hint="选填"
        value={data.comfortStyle}
        onChange={(value) => onChange({ comfortStyle: value as string[] })}
        multiple
      />
    </StepShell>
  );
}
