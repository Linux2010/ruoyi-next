/**
 * /api/system/[model] —— 由注册表驱动的集合端点
 * 新增模块无需新增 route.ts；这是「注册即出 API」的核心。
 */

import { crud } from "@/lib/crud";
import { createCollectionHandlers } from "@/core/crud/handlers";

const handlers = createCollectionHandlers(crud, "system");

export const GET = handlers.GET;
export const POST = handlers.POST;
