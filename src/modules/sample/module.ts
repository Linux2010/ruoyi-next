/**
 * 示例业务模块：演示「注册即出 API + 管理页」的最小接入方式
 *
 * 1. 在 prisma/schema.prisma 中定义 demo_item 表（已随模板提供）
 * 2. 执行 npx prisma generate
 * 3. 把本模块加入 MODULES（src/lib/modules.ts 已默认加入）
 * 4. 无需写任何 route.ts —— /api/system/items 与 /admin/[model] 立即可用
 */

import type { ModuleDef } from "@/core/crud/registry";

export const SAMPLE_MODULE: ModuleDef = {
  model: "demo_item",
  resource: "items",
  label: "示例数据",
  idField: "id",
  idType: "number",
  timestamps: true,
  listColumns: [
    { name: "id", label: "ID" },
    { name: "name", label: "名称" },
    { name: "status", label: "状态" },
    { name: "create_time", label: "创建时间" },
  ],
  formFields: [
    { name: "name", label: "名称", type: "text", required: true },
    {
      name: "status",
      label: "状态",
      type: "select",
      options: [
        { value: "active", label: "启用" },
        { value: "inactive", label: "停用" },
      ],
    },
  ],
};
