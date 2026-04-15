# Cloudflare + GitHub Actions：主站（akifukaku.com）与 CyberImmo 双仓库部署指南

本文约定：

- **主站**：仓库例如 `your-org/akifukaku-site`，`output: "export"`，托管在 **Cloudflare Pages**（或 R2 + CDN，思路类似）。
- **CyberImmo**：本仓库（`web/` 为 Next 应用），OpenNext 通过 **`wrangler deploy`** 发布为 **Cloudflare Worker**（`web/wrangler.toml` 的 `name`），静态资源走 **Workers Static Assets**；与「仅 Pages 静态托管」不同。以后要挂 **cyberimmo.xyz** 时在 Worker 上绑自定义域名即可，同一套代码不设 `NEXT_PUBLIC_BASE_PATH` 即根路径构建。

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
- **现阶段推荐（与本仓库一致）**：用 [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)，走 **`bun run build:cf`**，再 **`wrangler deploy`**（读取 [`web/wrangler.toml`](../web/wrangler.toml)的 `main` + `[assets]`）。**不要**使用 `wrangler pages deploy .open-next/assets` 或把 `worker.js` 单独复制为 `_worker.js`：Wrangler 在 Pages 模式下会再打包入口，OpenNext 的相对路径导入会全部失败。

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

### 3. Worker 名称（与 OpenNext 一致）

1. 部署目标由 [`web/wrangler.toml`](../web/wrangler.toml) 的 **`name`** 决定（默认 `cyberimmo`），首次 **`wrangler deploy`** 会在账号下创建该 **Worker**。
2. 控制台 **Workers & Pages** → **cyberimmo** 可查看默认域名，形如 **`https://cyberimmo.<你的子域>.workers.dev`**（以控制台为准，**不是** `*.pages.dev`）。

### 4. 自定义域名（可选）

- **cyberimmo 独立站**：在该 **Worker** → **Triggers / Custom domains** 绑定 `cyberimmo.xyz`（此时构建不要带 `NEXT_PUBLIC_BASE_PATH`，或 Variable 填 `__ROOT__`）。
- **主站子路径**：通常由 **主站一次部署的目录结构** 决定（见第五节），不一定给 CyberImmo 单独绑根域名。

### 5. 主域名子路径 `https://akifukaku.com/cyberimmo`（独立 Pages + Worker 反代）

Cloudflare **Pages 自定义域名**按「主机名」绑定，不能把本项目**单独**挂成只占用 `akifukaku.com/cyberimmo` 又不影响 apex 根站。做法是：CyberImmo 用 **`wrangler deploy`** 得到 **`*.workers.dev`** 上的 Worker（构建须带 [`NEXT_PUBLIC_BASE_PATH`](../web/next.config.ts) 若走子路径），在 **akifukaku.com 所在 Zone** 再建 **边缘 Worker**，只把 `/cyberimmo*` 反代到该默认域名。

#### 5.1 路由怎么配（推荐写法 A）

**A）只挂子路径路由（推荐）**  
Workers → 该 Worker → **Triggers** → **Routes** → Add route：

- **Route**：`akifukaku.com/cyberimmo*`（或 `*akifukaku.com/cyberimmo*`，以控制台为准）
- **Zone**：`akifukaku.com`

这样 **只有** 匹配该模式的请求会进 Worker，**主站其余流量不经过本 Worker**，逻辑最简单。

**B）整站 `akifukaku.com/*` 进 Worker**（少用）  
此时才需要「匹配则转发 CyberImmo，否则 `fetch(request)` 回源」；回源要配合源站/DNS，比 A 复杂，当前阶段不必采用。

在采用 **A** 时，Worker 内 **只保留「改 host + 转发」即可**；若 Route 已限定 `/cyberimmo*`，`pathname` 分支里的 `else` 可删，或留注释说明「仅当整站路由时才需要回源分支」。

#### 5.2 路径匹配（避免误伤 `/cyberimmoxxx`）

不要用 `pathname.startsWith("/cyberimmo")`（会把 `/cyberimmoxxx` 也算进来）。收紧为：

```javascript
const p = url.pathname;
const isCyberimmo = p === "/cyberimmo" || p.startsWith("/cyberimmo/");
```

#### 5.3 与 Pages 上「真实路径」对齐（易踩坑）

Worker **只改 `hostname`、不改 `pathname`** 时，浏览器访问：

`https://akifukaku.com/cyberimmo/...` → 边缘 Worker → `https://cyberimmo.<子域>.workers.dev/cyberimmo/...`（hostname 以控制台为准）

因此 **构建必须带 `basePath`**（本仓库通过 `NEXT_PUBLIC_BASE_PATH=/cyberimmo`），使 Pages 上页面与 `/_next` 等静态资源都在 **`/cyberimmo/...`** 下可访问。

- **验证**：浏览器直接打开 **`https://cyberimmo.<子域>.workers.dev/cyberimmo/`**（注意带 **`/cyberimmo`**）应能正常打开；再看 Network 里静态资源是否 200。
- **根 URL**：带 `basePath` 时站根在 **`/cyberimmo/`**；[`next.config.ts`](../web/next.config.ts) 中配置了 **`/` → `/cyberimmo/`** 的 redirect（`basePath: false`）。若根路径仍异常，直接访问 **`/cyberimmo/`**。

若 Pages 上始终是「站根」结构（`/`, `/_next/...`）而无 `basePath`，则 **不能** 只用「只改 host」的脚本，而要在 Worker 里做 **去前缀** 重写（成本高）；**更推荐** 与当前仓库一致：**带 basePath 的构建 + 只改 host**。

以后上 **独立域名 cyberimmo.xyz**：用 **同一仓库** 再打一份 **不设 `NEXT_PUBLIC_BASE_PATH`** 的构建并绑该域名；与子目录版是 **两条构建/流水线**，不是同一份产物硬套两个域名。

#### 5.4 推荐 Worker 脚本（Route 仅为 `/cyberimmo*` 时）

将 `target.hostname` 换成 **该 Worker 的默认访问域名**（部署成功后终端或控制台会显示，一般为 **`https://cyberimmo.<子域>.workers.dev`**）。若仍写 `*.pages.dev` 而实际已改为 Worker 部署，反代会404。

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const p = url.pathname;
    const isCyberimmo = p === "/cyberimmo" || p.startsWith("/cyberimmo/");
    //若 Trigger 已写死 akifukaku.com/cyberimmo*，下面分支理论上不会走到 false；保留便于日后改成整站路由时扩展。
    if (!isCyberimmo) {
      return fetch(request);
    }
    const targetHost = "cyberimmo.<你的子域>.workers.dev"; // 控制台 Worker 默认域名，勿照抄
    const newUrl = new URL(request.url);
    newUrl.hostname = targetHost;
    newUrl.protocol = "https:";
    return fetch(new Request(newUrl.toString(), request));
  },
};
```

说明：`new Request(newUrl.toString(), request)` 会带上原 Cookie；显式 `https:` 避免极少数环境协议异常。若响应 **302 `Location`** 仍指向 `*.workers.dev`，再按需把 `Location` 改写到 `akifukaku.com`。

#### 5.5 控制台操作顺序（精简）

1. **Workers & Pages** → Create → **Worker**，粘贴脚本 → Save and deploy。  
2. 同一 Worker → **Settings** → **Triggers** → **Routes** → Add：`akifukaku.com/cyberimmo*`。  
3. 确认 CyberImmo **Worker** 已部署（`wrangler deploy` 成功），且 **`https://cyberimmo.<子域>.workers.dev/cyberimmo/`** 可访问。  
4. 再测 **`https://akifukaku.com/cyberimmo/`** 与内页、静态资源（`_next` 等）是否 200。

#### 5.6 Supabase

Dashboard → Authentication → URL configuration → **Redirect URLs** 增加：

`https://akifukaku.com/cyberimmo/auth/callback`（本地可另加 `http://localhost:3000/auth/callback` 等）。

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
| `CLOUDFLARE_PAGES_PROJECT` / `CLOUDFLARE_PAGES_PROJECT_NAME` | **可选、已不用于当前 deploy**（部署以 `wrangler.toml` 的 `name` 为准）。保留仅兼容旧文档；可删除。 |
| `NEXT_PUBLIC_BASE_PATH` | **可选**。不设时 CI **默认 `/cyberimmo`**（与 akifukaku子路径一致）。若需其它前缀可设为例如 `/app`。**独立根域名**（无 basePath）请设为 **`__ROOT__`**（字面量），与 [`web/next.config.ts`](../web/next.config.ts) 联动 |

若不用 Variables，可在 [`deploy.yml`](../.github/workflows/deploy.yml) 里把 `--project-name=cyberimmo` 改成你的固定项目名。

#### 排错：`workers.dev/cyberimmo` 或反代后 404

- **最常见 A — 用了 Pages 上传或错误的 `_worker.js` 拷贝**  
  OpenNext 入口 **`worker.js`** 含大量 **相对路径** `import`（`./cloudflare/...`、`./server-functions/...`）。**`wrangler pages deploy`** 会把 `_worker.js` 当单独入口再打包，路径全部解析失败；把 `worker.js` **只复制**到 `assets/_worker.js` 也同样失败。  
  **修复**（已写入 [`deploy.yml`](../.github/workflows/deploy.yml)）：使用 **`wrangler deploy`**，并在 [`web/wrangler.toml`](../web/wrangler.toml) 配置 `main = ".open-next/worker.js"` 与 `[assets]`（见 [OpenNext 文档](https://opennext.js.org/cloudflare/get-started)）。

- **最常见 B — basePath 与 URL 不一致**  
  线上构建 **没有** 带上 `NEXT_PUBLIC_BASE_PATH`，产物在 **`/_next/...`**（站根），而你在浏览器访问的是 **`/cyberimmo/...`**，必然 404。  
  **自检**：本地 `NEXT_PUBLIC_BASE_PATH=/cyberimmo bun run build:cf` 后，看 `.open-next/assets` 下应有 **`cyberimmo/_next/`**；若只有 **`_next/`** 在 assets 根目录，说明本次构建是「根路径站」。  
  **修复**：在 GitHub Variables 里设置 `NEXT_PUBLIC_BASE_PATH=/cyberimmo`（或依赖 workflow 默认）；独立域名用 `__ROOT__` 再部署一份即可。

---

## 四、CyberImmo 本仓库自带 Workflow说明

### 1. `ci-web.yml`（若存在）

- **触发**：`web/**` 变更。
- **作用**：`bun install` → `lint` → **标准** `next build`（不启用 `NEXT_STATIC_EXPORT`）。
- **Secrets**：建议同样配置 `NEXT_PUBLIC_*`，否则构建期可能因缺少环境变量失败。

### 2. `deploy.yml`（云上正式部署）

- **触发**：`push main` 或 **手动** `workflow_dispatch`。
- **步骤**：在 `web/` 下 `bun install` → **`bun run build:cf`** → **`wrangler deploy`**（需 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`）。
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
