### [2026-04-08 11:04:44] [Claude Code]

- **Trigger**: 按 CTO 审阅意见修订 docs/plan.md（单栈 Next、四表、Sliding Window、简化安全、Supabase Auth、应用层计费事务、单容器部署与 D1–D7 计划）。
- **Execution**: docs/plan.md 全文重写：移除 FastAPI/摘要压缩/DB Trigger 余额；新增 Route Handlers + streamText、四表 schema、计费 SQL 修正为先 UPDATE 后 INSERT balance_after。
- **Debt & Opt**: 实现时用 FOR UPDATE 或封装 RPC 处理 applyBillingDelta 与流式落库顺序；Cloudflare Proxy 策略按实际上线再开。

### [2026-04-08 12:00:00] [Claude Code]

- **Action**: D1-D2 交付 — 项目骨架 + 数据库 + 问卷建档
  - 初始化 Next.js 16 App Router + Bun + Tailwind v4 (`web/`)
  - 安装 @supabase/supabase-js + @supabase/ssr
  - 创建 Supabase client 三件套 (client/server/admin) + proxy.ts (Next.js 16 的 middleware 替代)
  - 全局暗色主题 CSS 变量 (plan.md §9.3) + ambient glow 径向渐变
  - Auth 页面：邮箱+密码 登录/注册 + callback 路由
  - UI 组件库：Button, Input, TextArea, ProgressBar, ChipSelect, StepShell
  - 5 步问卷建档 (`/onboarding`)：14 题，useReducer 状态管理，最后一步统一提交
  - Server Action：upsert user → insert persona → grant 100 free tokens → redirect /chat/[id]
  - prompt-builder.ts：问卷答案拼接中文 system_prompt（含硬编码安全规则）
  - 占位页面：/chat/[id], /billing, /api/chat
  - 数据库 migration SQL：4 表 (users, personas, chat_logs, billing_tokens) + RLS + 索引
  - 问卷文档：docs/questionnaire.md（14 题完整记录）
- **Opinion/Decision**:
  - Next.js 16 将 middleware.ts 更名为 proxy.ts（breaking change），已适配
  - Tailwind v4 使用 CSS-based @theme 而非 tailwind.config.ts
  - 问卷采用 client-side 步进渲染，数据不离开浏览器直到最终提交
  - personas.questionnaire_data JSONB 存完整问卷原始数据，便于日后重建 prompt
  - 计费使用应用层事务（先 UPDATE users.token_balance 再 INSERT billing_tokens）
- **Handoff**:
  - 用户需要到 Supabase SQL Editor 执行 docs/migration_001_initial.sql
  - 用户需要创建 web/.env.local 并填入 Supabase anon key 和 service role key
  - Supabase 项目需关闭邮箱确认（Settings > Auth > 关闭 Confirm email）以便 MVP 快速注册
  - D3 待做：/chat/[id] 后端（DeepSeek 流式 + Vercel AI SDK + chat_logs 持久化）
  - D4 待做：/chat/[id] 前端（暗色 UI + 气泡 + 金色呼吸灯 + 胶囊输入框）

### [2026-04-08 12:34:00] [Antigravity]

- **Bug Fix — 控制台找不到建档资料的问题**: 因为数据库迁移文件中真正存储角色名字的字段名是 `display_name` 和 `relationship_label`，而 `/dashboard` 读取时错误使用了旧的命名 (`deceased_name`, `relationship`)，导致从数据库取回了 undefined 内容。这部分字段映射我已经修改过来，您再次进入 `/dashboard` 就能看到您之前已经建档通过的这 2 个资料卡片了。
- **Flow Logic — 登录及建档前置逻辑优化**: 我按照您要求的理想业务流，全面优化了整个应用的用户准入机制：1. 现在登录完成后，系统会自动检查当前账号 `user_metadata` 里是否包含同意最新隐私协议的状态（`privacy_agreed`）。2. 未同意时：系统会将其导向打断页（即建档的第一步 —— Step 0 协议页）。点击“同意并继续”时，后台将立马更新 `user_metadata` 并同时检查该用户历史是否已经有建过资料卡；- 如果有资料卡（老用户补签）：直接进入 `/dashboard` 控制台。- 如果没有资料卡（纯新账号）：自动流转进入填写问卷的第一步（Step 1），不需要跳转，直接填表。3. 已同意时：如果系统判断您之前已经点过同意，那么后续登录进来时，有卡片直奔控制台，没卡片直奔填表页（跳过 Step 0，体验更无缝）。
  这样一来，不仅确保了合规前置必填，老用户也免除了重新填一次资料的繁琐。您现在可以刷新页面走一遍体验看看是否符合业务预期。
### [2026-04-08 12:55:58]
- **Trigger**: 将 web 从子模块/嵌套仓库改为父仓库 CyberImmo 内的普通子目录（monorepo）。
- **Execution**: git rm --cached web 移除 gitlink；删除 web/.git；git add web/ 以普通文件纳入版本管理；已暂存待提交。
- **Debt & Opt**: 若团队曾单独推送过 web 远端，可归档旧仓库避免混淆；本地需一次 git commit --trailer "Made-with: Cursor" 提交该变更。
