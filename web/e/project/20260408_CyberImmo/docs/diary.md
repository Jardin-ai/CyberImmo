### [2026-04-08 ]
- **Trigger**: Cloudflare Pages8000007 说明；GitHub Actions 从 Node 20 迁到 Node 24- **Execution**: .github/workflows/deploy.yml / ci-web.yml — 工作流级 FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true，ctions/setup-node@v4 node24；deploy 中 --project-name 支持变量 CLOUDFLARE_PAGES_PROJECT 否则默认 cyberimmo
- **Debt & Opt**: 须在 Cloudflare 创建同名 Pages 项目或设置 CLOUDFLARE_PAGES_PROJECT；确认 API token 含 Account 下 Pages 权限
