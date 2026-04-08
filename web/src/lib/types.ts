/* ============================================================
   Database row types (mirrors Supabase schema)
   ============================================================ */

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  status: "active" | "suspended" | "churned";
  token_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: string;
  user_id: string;
  display_name: string;
  relationship_label: string;
  speaking_style: string | null;
  opening_message: string | null;
  system_prompt: string;
  questionnaire_data: QuestionnaireData | null;
  language: string;
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface ChatLog {
  id: string;
  persona_id: string;
  user_id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  token_cost: number;
  created_at: string;
}

export interface BillingToken {
  id: string;
  user_id: string;
  persona_id: string | null;
  delta: number;
  balance_after: number;
  event_type: "grant_free" | "consume_chat" | "manual_adjust" | "recharge" | "expire";
  source_ref: string | null;
  created_at: string;
}

/* ============================================================
   Onboarding questionnaire form state
   ============================================================ */

export interface QuestionnaireData {
  // Step 1 — Basic info
  deceasedName: string;
  relationship: string;

  // Step 2 — Personality & speaking style
  personalityTraits: string[];
  speakingStyle: string;
  catchphrases: string;
  dialect: string;

  // Step 3 — Shared memories
  fondMemory: string;
  dailyHabit: string;
  sharedActivity: string;

  // Step 4 — Comfort boundaries
  avoidTopics: string;
  comfortStyle: string[];
  honorific: string;

  // Step 5 — Opening
  openingMessage: string;
  aiFirstMessage: string;
}

export const INITIAL_QUESTIONNAIRE: QuestionnaireData = {
  deceasedName: "",
  relationship: "",
  personalityTraits: [],
  speakingStyle: "",
  catchphrases: "",
  dialect: "",
  fondMemory: "",
  dailyHabit: "",
  sharedActivity: "",
  avoidTopics: "",
  comfortStyle: [],
  honorific: "",
  openingMessage: "",
  aiFirstMessage: "",
};

/* ============================================================
   Chip option presets
   ============================================================ */

export const RELATIONSHIP_OPTIONS = [
  "父亲", "母亲", "爷爷", "奶奶", "外公", "外婆",
  "丈夫", "妻子", "儿子", "女儿",
  "兄弟", "姐妹", "朋友", "恋人", "其他",
] as const;

export const PERSONALITY_OPTIONS = [
  "温柔体贴", "严厉认真", "幽默风趣", "沉默寡言", "开朗乐观",
  "细心周到", "固执倔强", "慈祥和蔼", "直爽豪气", "文雅知性",
] as const;

export const SPEAKING_STYLE_OPTIONS = [
  "温柔亲切", "简短直接", "啰嗦关心", "幽默调侃", "严肃正经", "像写信一样",
] as const;

export const COMFORT_STYLE_OPTIONS = [
  "静静陪伴", "说鼓励的话", "回忆往事", "像平常一样聊天", "给建议和指导",
] as const;
