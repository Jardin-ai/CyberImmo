# CyberImmo 问卷问题清单

共 **14 题**，分 **5 步**，预计用户 3-5 分钟完成。

---

## Step 1 — 基本信息（关于TA）

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 1 | 您想怎么称呼TA？ | 文本输入 | 是 | `personas.display_name` |
| 2 | 您和TA的关系 | 单选 Chip（预设 + 自定义） | 是 | `personas.relationship_label` |

**关系选项**：父亲、母亲、爷爷、奶奶、外公、外婆、丈夫、妻子、儿子、女儿、兄弟、姐妹、朋友、恋人、其他（自定义输入）

---

## Step 2 — 性格与说话方式

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 3 | TA是什么样的人？（可多选） | 多选 Chip | 是 | `questionnaire_data.personalityTraits` |
| 4 | TA说话什么风格？ | 单选 Chip | 是 | `personas.speaking_style` + `questionnaire_data` |
| 5 | TA常说的口头禅或句子 | 文本域（≤300字） | 否 | `questionnaire_data.catchphrases` |
| 6 | TA有方言或语言习惯吗？ | 文本输入 | 否 | `questionnaire_data.dialect` |

**性格选项**：温柔体贴、严厉认真、幽默风趣、沉默寡言、开朗乐观、细心周到、固执倔强、慈祥和蔼、直爽豪气、文雅知性

**说话风格选项**：温柔亲切、简短直接、啰嗦关心、幽默调侃、严肃正经、像写信一样

---

## Step 3 — 共同记忆

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 7 | 你们之间最珍贵的一段记忆是什么？ | 文本域（≤500字） | 是 | `questionnaire_data.fondMemory` |
| 8 | TA让您印象深刻的生活习惯？ | 文本域（≤300字） | 否 | `questionnaire_data.dailyHabit` |
| 9 | 你们经常一起做什么？ | 文本域（≤300字） | 否 | `questionnaire_data.sharedActivity` |

---

## Step 4 — 沟通边界

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 10 | TA怎么称呼您？ | 文本输入 | 是 | `questionnaire_data.honorific` |
| 11 | 您希望TA用什么方式安慰您？（可多选） | 多选 Chip | 是 | `questionnaire_data.comfortStyle` |
| 12 | 有没有不希望提到的话题？ | 文本域（≤300字） | 否 | `questionnaire_data.avoidTopics` |

**安慰方式选项**：静静陪伴、说鼓励的话、回忆往事、像平常一样聊天、给建议和指导

---

## Step 5 — 开始对话

| # | 问题文案 | 类型 | 必填 | 数据库映射 |
|---|---------|------|------|-----------|
| 13 | 您最想对TA说的第一句话是什么？ | 文本域（≤200字） | 否 | `personas.opening_message` |
| 14 | 您希望TA对您说的第一句话是什么？（留空则系统生成） | 文本域（≤200字） | 否 | `questionnaire_data.aiFirstMessage` |

---

## 数据存储策略

- **核心字段**直接存入 `personas` 表对应列：`display_name`、`relationship_label`、`speaking_style`、`opening_message`
- **全部 14 题答案**完整存入 `personas.questionnaire_data` (JSONB)，便于日后重新生成 system_prompt
- **`system_prompt`** 由 `prompt-builder.ts` 根据问卷答案自动拼接生成，包含角色设定、记忆上下文、边界规则和硬编码安全规则

## 安全设计

- 用户每次只看到一个步骤的问题（client-side 步进式渲染）
- 所有数据在最后一步统一提交（单次 Server Action 调用）
- 中间步骤不发送任何 API 请求
