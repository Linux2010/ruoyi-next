/**
 * 模块总注册表
 *
 * 新增业务模块只需：定义 ModuleDef → 加入此数组。
 * API 路由、管理页面、菜单均由注册表驱动，无需写样板代码。
 */

import type { ModuleDef } from "@/core/crud/registry";
import { findModuleByResource } from "@/core/crud/registry";
import { SYSTEM_MODULES } from "./system-modules";
import { SAMPLE_MODULE } from "@/modules/sample/module";

export const MODULES: ModuleDef[] = [...SYSTEM_MODULES, SAMPLE_MODULE];

export function getModuleByResource(resource: string): ModuleDef | undefined {
  return findModuleByResource(MODULES, resource);
}

export { formatCell } from "./system-modules";
