/**
 * 全站 CRUD 实例
 *
 * 所有动态路由共用这一个实例；差异由 ModuleDef 与 CrudOptions 表达。
 * 若你的业务需要派生字段、高级过滤或批量删除，见 @/core/crud/engine 的 CrudOptions。
 */

import { createCrud } from "@/core/crud/engine";
import { MODULES } from "./modules";

export const crud = createCrud({
  modules: MODULES,
  filterMode: "simple",
  guardMissingDelegate: true,
  batchDelete: false,
});
