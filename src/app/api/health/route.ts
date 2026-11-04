import { NextResponse } from "next/server";
import { CORE_CONFIG } from "@/core/config";

/**
 * GET /api/health —— 轻量探活（无数据库依赖）
 * 必须保持免鉴权：容器 HEALTHCHECK 与负载均衡探活依赖此端点。
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: CORE_CONFIG.serviceName,
    time: new Date().toISOString(),
  });
}
