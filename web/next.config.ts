import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

/**
 * 子路径部署（主站 akifukaku.com + /cyberimmo）：
 *   CI / 本地构建前设置 NEXT_PUBLIC_BASE_PATH=/cyberimmo（不要尾斜杠）
 * 独立根域名（cyberimmo.xyz）：
 *   不设该变量或设为空字符串
 *
 * 纯静态导出（output: "export"）：
 *   设置 NEXT_STATIC_EXPORT=1
 *   注意：Route Handlers 与 static export 不兼容；日常 Cloudflare 部署用 `build:cf`（OpenNext）。
 */
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath = rawBase.replace(/\/$/, "");
const useStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(useStaticExport ? { output: "export" as const } : {}),
  images: {
    unoptimized: useStaticExport,
  },
  ...(basePath
    ? {
        basePath,
        assetPrefix: `${basePath}/`,
      }
    : {}),
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // 有 basePath 时，站点「根」在 /{basePath}/；直接访问 *.pages.dev/ 会 404，此处把 / 指到应用入口。
  async redirects() {
    if (!basePath) return [];
    return [
      {
        source: "/",
        destination: `${basePath}/`,
        permanent: false,
        basePath: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*.webm",
        headers: [
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Content-Type", value: "video/webm" },
        ],
      },
    ];
  },
};

export default nextConfig;
