/**
 * 与 `next.config.ts` 同源：由 `NEXT_PUBLIC_BASE_PATH`（无尾斜杠）驱动。
 * - 子目录：设 `/CyberImmo`；独立根域名：留空或不设置。
 *
 * 注意：`next.config` 中的 `basePath` 会让 `Link`、`router.push`/`replace`、`redirect()`
 * 自动加上前缀。若在此处再把 base 拼进 href，会导致双重前缀。
 */

/** 构建期注入的 base，独立域名时为 `""` */
export function getPublicBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/$/, "");
}

/**
 * 应用内导航路径（供 `Link` `href`、`router.push`/`replace`、`redirect`）。
 * 只规范前导 `/` 并保留 `?query` `#hash`，不拼接 `basePath`。
 */
export function getPath(path: string): string {
  if (!path) return "/";
  const hashIdx = path.indexOf("#");
  const qIdx = path.indexOf("?");
  let splitAt = -1;
  if (qIdx !== -1 && hashIdx !== -1) splitAt = Math.min(qIdx, hashIdx);
  else if (qIdx !== -1) splitAt = qIdx;
  else if (hashIdx !== -1) splitAt = hashIdx;

  if (splitAt === -1) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const pathname = path.slice(0, splitAt);
  const rest = path.slice(splitAt);
  const norm =
    pathname === "" ? "" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${norm === "" ? "/" : norm}${rest}`;
}

/**
 * 浏览器地址栏式「完整路径」：`basePath + path`。
 * 用于拼接 `origin`、邮件确认链接、`NextResponse.redirect` 的 pathname 等
 * （这些场景 Next 不会自动加 basePath）。
 */
export function withPublicBasePath(path: string): string {
  const base = getPublicBasePath();
  const p = getPath(path);
  return `${base}${p}`;
}
