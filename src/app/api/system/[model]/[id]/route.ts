/**
 * /api/system/[model]/[id] —— 由注册表驱动的单条端点
 */

import { crud } from "@/lib/crud";
import { createItemHandlers } from "@/core/crud/handlers";

const handlers = createItemHandlers(crud, "system");

export const GET = handlers.GET;
export const PUT = handlers.PUT;
export const DELETE = handlers.DELETE;
