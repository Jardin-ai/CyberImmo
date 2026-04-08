"use client";

import StepShell from "@/components/onboarding/StepShell";
import Input from "@/components/ui/Input";
import ChipSelect from "@/components/ui/ChipSelect";
import { RELATIONSHIP_OPTIONS, type QuestionnaireData } from "@/lib/types";
import { useState } from "react";

interface Props {
  data: QuestionnaireData;
  onChange: (patch: Partial<QuestionnaireData>) => void;
  onNext: () => void;
}

export default function Step1Basic({ data, onChange, onNext }: Props) {
  const [customRelationship, setCustomRelationship] = useState(
    RELATIONSHIP_OPTIONS.includes(data.relationship as typeof RELATIONSHIP_OPTIONS[number])
      ? ""
      : data.relationship
  );
  const isOther = data.relationship === "其他" || (data.relationship && !RELATIONSHIP_OPTIONS.includes(data.relationship as typeof RELATIONSHIP_OPTIONS[number]));

  const canProceed = data.deceasedName.trim() !== "" && data.relationship.trim() !== "";

  function handleRelationshipChange(value: string | string[]) {
    const v = value as string;
    if (v === "其他") {
      onChange({ relationship: customRelationship || "其他" });
    } else {
      onChange({ relationship: v });
      setCustomRelationship("");
    }
  }

  return (
    <StepShell
      step={1}
      title="关于TA"
      subtitle="告诉我们您想念的那个人"
      onNext={onNext}
      nextDisabled={!canProceed}
    >
      <Input
        label="您想怎么称呼TA？"
        id="deceasedName"
        placeholder="比如：妈妈、爸爸、奶奶..."
        value={data.deceasedName}
        onChange={(e) => onChange({ deceasedName: e.target.value })}
        required
      />

      <ChipSelect
        label="您和TA的关系"
        options={RELATIONSHIP_OPTIONS}
        value={isOther ? "其他" : data.relationship}
        onChange={handleRelationshipChange}
      />

      {isOther && (
        <Input
          label="请输入您和TA的关系"
          id="customRelationship"
          placeholder="比如：师傅、战友..."
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
