"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ModelId = "glm-4" | "glm-4-flash";

export const MODEL_CONFIG: Record<
  ModelId,
  { label: string; description: string; cost: number; badge?: string }
> = {
  "glm-4": {
    label: "GLM-4",
    description: "深度推理，情感更丰富",
    cost: 5,
  },
  "glm-4-flash": {
    label: "GLM-4-Flash",
    description: "轻量快速，对话流畅",
    cost: 0,
    badge: "免费",
  },
};

interface ModelContextValue {
  modelId: ModelId;
  setModelId: (id: ModelId) => void;
}

const ModelContext = createContext<ModelContextValue>({
  modelId: "glm-4",
  setModelId: () => {},
});

export function ModelProvider({ children }: { children: ReactNode }) {
  const [modelId, setModelIdState] = useState<ModelId>(() => {
    if (typeof window === "undefined") return "glm-4";
    const saved = localStorage.getItem("cyberimmo_model");
    if (saved === "deepseek-chat" || saved === "glm-4") return "glm-4";
    if (saved === "glm-4-flash") return "glm-4-flash";
    return "glm-4";
  });

  const setModelId = (id: ModelId) => {
    setModelIdState(id);
    localStorage.setItem("cyberimmo_model", id);
  };

  return (
    <ModelContext.Provider value={{ modelId, setModelId }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  return useContext(ModelContext);
}
