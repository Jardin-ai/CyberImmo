"use client";

import StepShell from "@/components/onboarding/StepShell";
import TextArea from "@/components/ui/TextArea";
import type { QuestionnaireData } from "@/lib/types";

interface Props {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
  onPrev: () => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function Step5Opening({
  data,
  onChange,
  onPrev,
  onSubmit,
  loading,
}: Props) {
  return (
    <StepShell
      step={5}
      title="开始对话"
      subtitle="准备好了，就让我们开始吧"
      onPrev={onPrev}
      onNext={onSubmit}
      nextLabel="完成建档"
      loading={loading}
    >
      <TextArea
        label="您最想对TA说的第一句话是什么？"
        hint="选填，留空也没关系"
        id="openingMessage"
        placeholder="想说什么都可以..."
        value={data.openingMessage}
        onChange={(e) => onChange({ openingMessage: e.target.value })}
        maxLength={200}
      />

      <TextArea
        label="您希望TA对您说的第一句话是什么？"
        hint="选填，留空则由系统根据TA的性格自动生成"
        id="aiFirstMessage"
        placeholder="比如：'好久不见，你最近还好吗？'"
        value={data.aiFirstMessage}
        onChange={(e) => onChange({ aiFirstMessage: e.target.value })}
        maxLength={200}
      />
    </StepShell>
  );
}
