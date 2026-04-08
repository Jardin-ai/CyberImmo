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
  const canProceed = data.fondMemory.trim() !== "";

  return (
    <StepShell
      step={3}
      title="共同记忆"
      subtitle="那些值得珍藏的瞬间"
      onPrev={onPrev}
      onNext={onNext}
      nextDisabled={!canProceed}
    >
      <TextArea
        label="你们之间最珍贵的一段记忆是什么？"
        id="fondMemory"
        placeholder="一段故事、一个画面、一句话都可以..."
        value={data.fondMemory}
        onChange={(e) => onChange({ fondMemory: e.target.value })}
        maxLength={500}
        required
      />

      <TextArea
        label="TA让您印象深刻的生活习惯？"
        hint="选填"
        id="dailyHabit"
        placeholder="比如：每天早起泡茶、喜欢在院子里种花..."
        value={data.dailyHabit}
        onChange={(e) => onChange({ dailyHabit: e.target.value })}
        maxLength={300}
      />

      <TextArea
        label="你们经常一起做什么？"
        hint="选填"
        id="sharedActivity"
        placeholder="比如：一起散步、一起看电视、一起做饭..."
        value={data.sharedActivity}
        onChange={(e) => onChange({ sharedActivity: e.target.value })}
        maxLength={300}
      />
    </StepShell>
  );
}
