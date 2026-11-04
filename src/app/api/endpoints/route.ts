import { NextRequest, NextResponse } from "next/server";
import { MODULES } from "@/lib/modules";

/**
 * GET /api/endpoints —— 自描述端点清单
 * 直接由注册表生成，新增模块自动出现在清单里，无需手工维护。
 */
export async function GET(_request: NextRequest) {
  const base: Array<{ path: string; methods: string[]; description: string; module: string }> = [
    { path: "/api/health", methods: ["GET"], description: "健康检查", module: "infra" },
    { path: "/api/endpoints", methods: ["GET"], description: "端点清单", module: "infra" },
    { path: "/api/auth/login", methods: ["POST"], description: "用户登录", module: "auth" },
    { path: "/api/auth/logout", methods: ["POST"], description: "用户登出", module: "auth" },
    { path: "/api/auth/info", methods: ["GET"], description: "当前用户信息", module: "auth" },
    { path: "/api/auth/roles", methods: ["GET", "POST", "PUT", "DELETE"], description: "角色管理", module: "auth" },
    { path: "/api/auth/users", methods: ["GET", "POST", "PUT", "DELETE"], description: "用户管理", module: "auth" },
    { path: "/api/auth/permissions", methods: ["GET", "POST"], description: "权限配置", module: "auth" },
    { path: "/api/dict/type/{dictType}", methods: ["GET"], description: "字典数据", module: "system" },
  ];

  const generated = MODULES.map((m) => ({
    path: `/api/system/${m.resource}`,
    methods: m.readOnly ? ["GET"] : ["GET", "POST"],
    description: `${m.label}（集合）`,
    module: m.resource,
  }));

  const generatedItems = MODULES.map((m) => ({
    path: `/api/system/${m.resource}/{id}`,
    methods: m.readOnly ? ["GET"] : ["GET", "PUT", "DELETE"],
    description: `${m.label}（单条）`,
    module: m.resource,
  }));

  return NextResponse.json({
    total: base.length + generated.length + generatedItems.length,
    endpoints: [...base, ...generated, ...generatedItems],
  });
}
