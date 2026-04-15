# CyberImmo 问卷问题清单 (精简版)

共 **10 题**，分 **5 步**。支持在 Step 2 直接“快速建立连接”。

---

## Step 1 — 核心身份 (必填)

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 1 | 您想怎么称呼TA？ | 文本输入 | 是 | `personas.display_name` |
| 2 | 您和TA的关系 | 单选 Chip | 是 | `personas.relationship_label` |

---

## Step 2 — 性格设定 (必填)

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 3 | TA是什么样的人？(多选) | 多选 Chip | 是 | `questionnaire_data.personalityTraits` |
| 4 | TA说话是什么风格？ | 单选 Chip | 是 | `personas.speaking_style` |
| 5 | 有什么口头禅或特定称呼？ | 文本输入 | 否 | `questionnaire_data.catchphrases` |

**快速入口**：用户在完成 Step 2 后可选择“立即开启连接”，直接跳转生成档案。

---

## Step 3 — 情感连接 (可选)

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 6 | 你们之间最珍贵的一段记忆？ | 文本域 | 否 | `questionnaire_data.fondMemory` |

---

## Step 4 — 互动规则 (必填项)

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 7 | TA平时怎么称呼您？ | 文本输入 | 是 | `questionnaire_data.honorific` |
| 8 | 您希望TA如何安慰您？ | 多选 Chip | 否 | `questionnaire_data.comfortStyle` |


## 前端状态管理 (PersonaFormState)

所有 10 项数据统一存储在 `QuestionnaireData` 对象中。
跳过跳过字段时，系统自动填充 `null` 或默认值。

## Prompt 生成逻辑

`prompt-builder.ts` 采用“宽容模式”：
- 如果没有 `catchphrases`，则生成：“使用符合你性格的自然口语”。
- 如果在 Step 2 之后快速连接且没有 `opening_message`，系统将触发“引导式开场白”逻辑。
