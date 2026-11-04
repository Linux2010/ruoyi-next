/**
 * 通用鉴权守卫（技术核心，不含任何业务路径）
 *
 * 业务仓通过 AuthGuardConfig 注入公开路径、机器 token 白名单、内部自动化端点。
 * 核心只实现「校验算法 + 决策流程」，不认识任何具体资源名。
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";

export interface AuthGuardConfig {
  /** 免鉴权路径（精确匹配） */
  publicPaths: string[];
  /** 机器接口前缀（startsWith 匹配），通过 service token 放行 */
  serviceTokenPaths?: string[];
  /** 内部自动化端点（无 JWT，由业务侧自身开关保护） */
  internalAutomationPaths?: string[];
  /** service token 环境变量名，默认 SERVICE_TOKEN */
  serviceTokenEnvVar?: string;
  /** service token 请求头名，默认 x-service-token */
  serviceTokenHeader?: string;
  /** service token query 参数名，默认 token */
  serviceTokenQueryParam?: string;
  /** Next.js middleware matcher */
  matcher?: string[];
}

export const DEFAULT_MATCHER = [
  "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
];

/** 机器 token 常量时间比较，防时序攻击 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function createAuthGuard(config: AuthGuardConfig) {
  const {
    publicPaths,
    serviceTokenPaths = [],
    internalAutomationPaths = [],
    serviceTokenEnvVar = "SERVICE_TOKEN",
    serviceTokenHeader = "x-service-token",
    serviceTokenQueryParam = "token",
    matcher = DEFAULT_MATCHER,
  } = config;

  function validServiceToken(request: NextRequest): boolean {
    const expected = process.env[serviceTokenEnvVar];
    if (!expected) return false;
    const provided =
      request.headers.get(serviceTokenHeader) ||
      request.nextUrl.searchParams.get(serviceTokenQueryParam) ||
      "";
    return timingSafeEqual(provided, expected);
  }

  async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
      publicPaths.some((p) => pathname === p || pathname.startsWith("/_next")) ||
      internalAutomationPaths.some((p) => pathname === p || pathname.startsWith(p))
    ) {
      return NextResponse.next();
    }

    // 机器接口：service token 通过则放行（浏览器 JWT 不适用于外部 Bot）
    if (serviceTokenPaths.some((p) => pathname.startsWith(p)) && validServiceToken(request)) {
      return NextResponse.next();
    }

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ code: 401, msg: "未登录" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ code: 401, msg: "登录已过期" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  return {
    middleware,
    PUBLIC_PATHS: publicPaths,
    SERVICE_TOKEN_PATHS: serviceTokenPaths,
    config: { matcher },
  };
}
