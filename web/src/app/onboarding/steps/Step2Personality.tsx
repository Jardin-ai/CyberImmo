"use client";

import StepShell from "@/components/onboarding/StepShell";
import Input from "@/components/ui/Input";
import TextArea from "@/components/ui/TextArea";
import ChipSelect from "@/components/ui/ChipSelect";
import {
  PERSONALITY_OPTIONS,
  SPEAKING_STYLE_OPTIONS,
  type QuestionnaireData,
} from "@/lib/types";

interface Props {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Step2Personality({ data, onChange, onPrev, onNext }: Props) {
  const canProceed =
    data.personalityTraits.length > 0 && data.speakingStyle.trim() !== "";

  return (
    <StepShell
      step={2}
      title="TA的性格"
      subtitle="帮助我们了解TA是什么样的人"
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={!canProceed}
    >
      <ChipSelect
        label="TA是什么样的人？（可多选）"
        options={PERSONALITY_OPTIONS}
        value={data.personalityTraits}
        onChange={(value) => onChange({ personalityTraits: value as string[] })}
        multiple
      />

      <ChipSelect
        label="TA说话什么风格？"
        options={SPEAKING_STYLE_OPTIONS}
        value={data.speakingStyle}
        onChange={(value) => onChange({ speakingStyle: value as string })}
      />

      <TextArea
        label="TA常说的口头禅或句子"
        hint="选填，帮助还原TA的说话方式"
        id="catchphrases"
        placeholder="比如：'慢慢来，不着急'、'吃饭了没'..."
        value={data.catchphrases}
        onChange={(e) => onChange({ catchphrases: e.target.value })}
        maxLength={300}
      />

      <Input
        label="TA有方言或语言习惯吗？"
        id="dialect"
        placeholder="选填，比如：四川话、东北腔..."
        value={data.dialect}
        onChange={(e) => onChange({ dialect: e.target.value })}
      />
    </StepShell>
  );
}
