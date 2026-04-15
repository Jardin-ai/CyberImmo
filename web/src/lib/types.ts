/* ============================================================
   Database row types (mirrors Supabase schema)
   ============================================================ */

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  status: "active" | "suspended" | "churned";
  token_balance: number;       // legacy — migrated to echo_balance
  echo_balance: number;
  subscription_tier: string;   // FREE | MONTHLY_BASIC | MONTHLY_PRO | ANNUAL_BASIC | 5YEAR_ULTRA
  subscription_expires_at: string | null;
  daily_free_text_used: number;
  last_checkin_date: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const SUBSCRIPTION_TIERS: Record<
  string,
  { label: string; price: string; echoes: number; color: string }
> = {
  FREE:           { label: "寄托体验",    price: "免费",     echoes: 0,     color: "#6B7280" },
  MONTHLY_BASIC:  { label: "灵犀通讯",    price: "¥29.9/月", echoes: 6000,  color: "#3B82F6" },
  MONTHLY_PRO:    { label: "深度共鸣",    price: "¥49.9/月", echoes: 15000, color: "#8B5CF6" },
  ANNUAL_BASIC:   { label: "岁月长卷",    price: "¥268/年",  echoes: 8000,  color: "#D4AF37" },
  "5YEAR_ULTRA":  { label: "时空契约",    price: "¥999/5年", echoes: 20000, color: "#EC4899" },
};

export interface Persona {
  id: string;
  user_id: string;
  display_name: string;
  relationship_label: string;
  speaking_style: string | null;
  opening_message: string | null;
  system_prompt: string;
  questionnaire_data: QuestionnaireData;
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
  avatarUrl?: string;

  // Step 2 — Personality & speaking style
  personalityTraits: string[];
  speakingStyle: string;
  catchphrases: string;

  // Step 3 — Shared memories
  fondMemory: string;

  // Step 4 — Comfort boundaries
  honorific: string;
  comfortStyle: string[];

  // Step 5 — Opening
  openingMessage: string;
  aiFirstMessage: string;
}

export const INITIAL_QUESTIONNAIRE: QuestionnaireData = {
  deceasedName: "",
  relationship: "",
  avatarUrl: "",
  personalityTraits: [],
  speakingStyle: "",
  catchphrases: "",
  fondMemory: "",
  honorific: "",
  comfortStyle: [],
  openingMessage: "",
  aiFirstMessage: "",
};

/* ============================================================
   Chip option presets
   ============================================================ */

export const RELATIONSHIP_OPTIONS = [
  "父亲", "母亲", "爷爷", "奶奶", "外公", "外婆",
  "丈夫", "妻子", "儿子", "女儿",
  "兄弟", "姐妹", "朋友", "恋人", "宠物", "战友", "其他",
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
