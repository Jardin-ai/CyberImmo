# Cloudflare + GitHub Actions：主站（akifukaku.com）与 CyberImmo 双仓库部署指南

本文约定：

- **主站**：仓库例如 `your-org/akifukaku-site`，`output: "export"`，托管在 **Cloudflare Pages**（或 R2 + CDN，思路类似）。
- **CyberImmo**：本仓库（`web/` 为 Next 应用），可与主站 **同一 Cloudflare 账号**下单独一个 Pages 项目；以后要挂 **cyberimmo.xyz** 时同一套代码不设 `NEXT_PUBLIC_BASE_PATH` 即可。

---

## 一、CyberImmo 本仓库：`next.config` 与两种发布形态

[`web/next.config.ts`](../web/next.config.ts) 已支持：

| 场景 | 环境变量 |
|------|----------|
| 主站子路径 `https://akifukaku.com/cyberimmo/...` | `NEXT_PUBLIC_BASE_PATH=/cyberimmo`（**不要**尾斜杠） |
| 独立根域名 `https://cyberimmo.xyz/...` | 不设置或设为空字符串 |
| 纯静态导出 `out/` | `NEXT_STATIC_EXPORT=1` |

**重要限制（必读）：**

- 当前 CyberImmo 使用 **App Router 的 Route Handlers**（如 `/api/chat`、`/auth/callback`），与 **`output: "export"` 纯静态** 不兼容。
- 若要坚持「主站 out + 子目录拷贝 CyberImmo 的 out」方案，需要先把这些能力迁到 **Supabase Edge Functions** 等外部 HTTP API，再对 CyberImmo 打开 `NEXT_STATIC_EXPORT=1`。
- **现阶段推荐（与本仓库一致）**：用 [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)，走 **`bun run build:cf`**（`next build` + **`@opennextjs/cloudflare`**），再用 `wrangler pages deploy .open-next/assets` 发布到 Cloudflare Pages（与 diary 中「选 OpenNext 而非 next-on-pages」的决策一致）。

---

## 二、Cloudflare 侧准备（一次性）

### 1. 创建 API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) →右上角头像 → **My Profile** → **API Tokens**。
2. **Create Token** → 可使用模板 **Edit Cloudflare Workers** 或自定义权限，至少包含：
   - **Account** → **Cloudflare Pages** → **Edit**
   - （若用 Workers 更多能力再补）
3. 生成后 **只显示一次**，复制保存。

### 2. 查看 Account ID

Dashboard右侧 **Account** 任意域名概览页下方，或 **Workers & Pages** →右侧 **Account ID**。

### 3. 创建 Pages 项目（CyberImmo）

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**（也可先不连，仅用 CLI/Action 上传）。
2. 项目名称例如：`cyberimmo`（与下面 GitHub Variable 一致）。

### 4. 自定义域名（可选）

- **cyberimmo 独立站**：在 Pages 项目 → **Custom domains** 绑定 `cyberimmo.xyz`。
- **主站子路径**：通常由 **主站一次部署的目录结构** 决定（见第五节），不一定给 CyberImmo 单独绑根域名。

---

## 三、CyberImmo 仓库：GitHub Secrets与 Variables

打开 **GitHub 仓库** → **Settings** → **Secrets and variables** → **Actions**。

### Secrets（敏感）

| 名称 | 说明 |
|------|------|
| `CLOUDFLARE_API_TOKEN` | 上一节创建的 Token |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

### Variables（非敏感，可选）

| 名称 | 说明 |
|------|------|
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Pages 项目名，例如 `cyberimmo`（与 workflow 中 `vars.CLOUDFLARE_PAGES_PROJECT_NAME` 对应） |

若不用 Variables，可在 [`deploy.yml`](../.github/workflows/deploy.yml) 里把 `--project-name=cyberimmo` 改成你的固定项目名。

---

## 四、CyberImmo 本仓库自带 Workflow说明

### 1. `ci-web.yml`（若存在）

- **触发**：`web/**` 变更。
- **作用**：`bun install` → `lint` → **标准** `next build`（不启用 `NEXT_STATIC_EXPORT`）。
- **Secrets**：建议同样配置 `NEXT_PUBLIC_*`，否则构建期可能因缺少环境变量失败。

### 2. `deploy.yml`（云上正式部署）

- **触发**：`push main` 或 **手动** `workflow_dispatch`。
- **步骤**：在 `web/` 下 `bun install` → **`bun run build:cf`** → `wrangler pages deploy .open-next/assets --project-name=cyberimmo`。
- **Secrets**：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`（与 diary 中上线 Checklist 一致）。

---

## 五、主站仓库：一次构建「根目录 + /cyberimmo」合并上传（模板）

以下文件 **不要放在 CyberImmo 仓库**，应放在 **主站仓库** `akifukaku-site` 的 `.github/workflows/`。

### 思路

1. `checkout` 主站 →安装依赖 → `npm run build`（或 `bun run build`）→ 得到主站 `out/`。
2. 再 `checkout` **CyberImmo** 到子目录 `cyberimmo/`（第二份 checkout需 `path`）。
3. 在 `cyberimmo/` 内：`NEXT_PUBLIC_BASE_PATH=/cyberimmo` + **`NEXT_STATIC_EXPORT=1`** 执行构建 →得到 `cyberimmo/out/`（**仅当** CyberImmo 已改为可静态导出）。
4. `mkdir -p out/cyberimmo && cp -r cyberimmo/out/* out/cyberimmo/`。
5. 用 **wrangler pages deploy out** 或 **R2 sync** 上传整棵 `out/`。

### Private CyberImmo 仓库

第二次 checkout 需要权限：

- 在主站仓库 Secrets 添加 **`CYBERIMMO_PAT`**（Fine-grained 或 classic PAT，至少 **Contents: Read** 对 CyberImmo 仓库）。
- `actions/checkout@v4` 使用 `token: ${{ secrets.CYBERIMMO_PAT }}`。

### 示例 `deploy-combined.yml`（Linux runner）

```yaml
name: Deploy akifukaku.com + /cyberimmo

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: package-lock.json

      - name: Build main site (static export)
        run: |
          npm ci
          npm run build
        env:
          CI: true

      - name: Checkout CyberImmo
        uses: actions/checkout@v4
        with:
          repository: your-org/cyberimmo
          path: cyberimmo
          token: ${{ secrets.CYBERIMMO_PAT }}

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Build CyberImmo for subpath (static only)
        working-directory: cyberimmo/web
        run: |
          bun install --frozen-lockfile
          bun run build
        env:
          CI: true
          NEXT_STATIC_EXPORT: "1"
          NEXT_PUBLIC_BASE_PATH: /cyberimmo
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.CYBERIMMO_NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.CYBERIMMO_NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Merge Cyberimmo into site out/
        run: |
          mkdir -p out/cyberimmo
          cp -r cyberimmo/web/out/* out/cyberimmo/

      - name: Deploy to Cloudflare Pages (full site)
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy out --project-name=${{ vars.CLOUDFLARE_MAIN_SITE_PROJECT_NAME }}
```

将 `your-org/cyberimmo`、项目名称、`npm`/`bun` 与主站实际路径改成你的仓库结构。

---

## 六、仅更新 CyberImmo 时如何更新主站子目录

可选策略：

1. **推荐**：CyberImmo push 后，用 **`workflow_dispatch`** 或 **`repository_dispatch`** 触发主站仓库再跑一遍「合并部署」，保证 `out/cyberimmo` 与线上一致。
2. **偷懒**：只部署 CyberImmo 独立 Pages；主站子路径用 **反向代理** 把 `/cyberimmo` 指到另一主机（架构不同，需自己配 Nginx/Workers）。

---

## 七、本地自测子路径静态包（在已支持 static export 之后）

在 `web/` 目录：

```bash
# Linux / macOS
NEXT_STATIC_EXPORT=1 NEXT_PUBLIC_BASE_PATH=/cyberimmo bun run build
npx serve out -p 3000
```

浏览器访问：`http://localhost:3000/cyberimmo`（以 `serve` 实际行为为准）。

Windows PowerShell：

```powershell
$env:NEXT_STATIC_EXPORT="1"
$env:NEXT_PUBLIC_BASE_PATH="/cyberimmo"
bun run build
npx serve out -p 3000
```

---

## 八、检查清单（避免白屏 / 404）

-站内跳转用 **`<Link>`**，勿手写死 `/xxx` 忽略 `basePath`。
- `NEXT_PUBLIC_SITE_URL`、canonical、OG 等若需要，在 CI 里为「子路径站」与「根域名站」分别设不同值。
- Cloudflare 上 **trailing slash** 与 Next `trailingSlash` 配置保持一致。
- 合并部署时：**整棵** `cyberimmo/out/*` 拷入 `out/cyberimmo/`，不要拆 `_next` 结构。

---

## 九、你需要提供给协作者的三项信息（便于定制 workflow）

1. 主站实际托管：**Cloudflare Pages** 项目名称、是否已绑 `akifukaku.com`。
2. CyberImmo 是否已能 **`NEXT_STATIC_EXPORT=1` 构建通过**（若不能，主站合并步骤需改为全栈方案或延后）。
3. 两个仓库的 GitHub 完整名（如 `Jardin-ai/akifukaku-site` / `Jardin-ai/cyberimmo`）。

把以上信息填进第五节模板中的占位符即可得到可粘贴的终稿。
