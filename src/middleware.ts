/**
 * 中间件入口（薄壳）
 *
 * 通用鉴权算法在 @/core/middleware/guard；路径白名单在 @/app-config。
 * 业务仓 fork 后只需改 app-config.ts，无需触碰核心。
 */

import { createAuthGuard } from "@/core/middleware/guard";
import { AUTH_CONFIG } from "@/app-config";

const guard = createAuthGuard(AUTH_CONFIG);

export const PUBLIC_PATHS = guard.PUBLIC_PATHS;
export const SERVICE_TOKEN_PATHS = guard.SERVICE_TOKEN_PATHS;
export const middleware = guard.middleware;

// Next.js 静态分析要求 config 为对象字面量。与 guard.DEFAULT_MATCHER 保持一致。
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
