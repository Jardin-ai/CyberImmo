"use client";

import StepShell from "@/components/onboarding/StepShell";
import Input from "@/components/ui/Input";
import TextArea from "@/components/ui/TextArea";
import ChipSelect from "@/components/ui/ChipSelect";
import { COMFORT_STYLE_OPTIONS, type QuestionnaireData } from "@/lib/types";

interface Props {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Step4Boundaries({ data, onChange, onPrev, onNext }: Props) {
  const canProceed =
    data.comfortStyle.length > 0 && data.honorific.trim() !== "";

  return (
    <StepShell
      step={4}
      title="沟通方式"
      subtitle="让对话更贴近你们的真实相处"
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={!canProceed}
    >
      <Input
        label="TA怎么称呼您？"
        id="honorific"
        placeholder="比如：小宝、闺女、儿子..."
        value={data.honorific}
        onChange={(e) => onChange({ honorific: e.target.value })}
        required
      />

      <ChipSelect
        label="您希望TA用什么方式安慰您？（可多选）"
        options={COMFORT_STYLE_OPTIONS}
        value={data.comfortStyle}
        onChange={(value) => onChange({ comfortStyle: value as string[] })}
        multiple
      />

      <TextArea
        label="有没有不希望提到的话题？"
        hint="选填，这些话题在对话中会被避免"
        id="avoidTopics"
        placeholder="比如：不想提到某段经历、某个人..."
        value={data.avoidTopics}
        onChange={(e) => onChange({ avoidTopics: e.target.value })}
        maxLength={300}
      />
    </StepShell>
  );
}
