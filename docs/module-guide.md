# 模块开发指南

## 核心概念

框架只认识 `src/core/crud/registry.ts` 里的 `ModuleDef`：

```ts
interface ModuleDef {
  model: string;          // Prisma 委托名
  resource: string;       // URL slug，同时也是 /admin/[model] 的路径
  label: string;          // 菜单与页面标题
  idField: string;        // 主键字段名
  idType: "bigint" | "number" | "string";
  softDelete?: boolean;       // 列表过滤 deleted=false
  delFlagField?: string;      // RuoYi 逻辑删除字段（'0'/'2'）
  timestamps?: boolean;       // 自动维护 create_time/create_by 等
  readOnly?: boolean;         // 前后端均禁写
  uiReadOnly?: boolean;       // 只隐藏 UI 入口，API 仍可写
  createDefaults?: Record<string, unknown>;
  defaultSort?: { field: string; order: "asc" | "desc" };
  listColumns: ColumnDef[];
  formFields: FieldDef[];
}
```

## 三步接入

**1. 定义表**（`prisma/schema.prisma`）

```prisma
model demo_item {
  id          Int       @id @default(autoincrement())
  name        String?   @db.VarChar(100)
  status      String?   @db.VarChar(20)
  create_time DateTime? @db.DateTime(0)
}
```

执行 `npx prisma generate`。

**2. 定义模块**（参考 `src/modules/sample/module.ts`）

```ts
export const MY_MODULE: ModuleDef = {
  model: "demo_item",
  resource: "items",
  label: "示例数据",
  idField: "id",
  idType: "number",
  listColumns: [{ name: "id", label: "ID" }, { name: "name", label: "名称" }],
  formFields: [{ name: "name", label: "名称", type: "text", required: true }],
};
```

**3. 注册**（`src/lib/modules.ts`）

```ts
export const MODULES = [...SYSTEM_MODULES, SAMPLE_MODULE, MY_MODULE];
```

完成。以下能力自动生效，无需写代码：

- `GET|POST /api/system/items`
- `GET|PUT|DELETE /api/system/items/{id}`
- `/admin/items`、`/admin/items/create`、`/admin/items/edit/{id}`
- 侧边栏菜单项
- `/api/endpoints` 自描述清单

## 定制差异行为

`createCrud(options)` 支持以下注入点（见 `src/core/crud/engine.ts`）：

| 选项 | 用途 |
|---|---|
| `filterMode: "advanced"` | 驼峰→下划线、日期区间、LIKE 启发式过滤 |
| `derive` | 创建/更新前的派生字段钩子 |
| `resolveFilter` | 自定义列表过滤解析（如跨表外键查询） |
| `batchDelete` | 支持 `DELETE /{id1,id2}` 批量删除 |
| `guardMissingDelegate` | 委托缺失时返回空列表而非抛错 |

把这些选项写在**业务仓**的 `src/lib/crud.ts`，核心保持无业务知识。

## 过滤安全

引擎只接受注册表里声明过的列作为过滤字段，未知参数一律忽略；
排序字段同样受配置约束。不要在业务钩子里直接拼接原始 SQL。

## 字典驱动的下拉框

`FieldDef.dict` 指向 `sys_dict_type` 的类型值，前端通过 `useDict()`
从 `/api/dict/type/{dictType}` 拉取 `status='0'` 的启用项。
端点前缀由 `src/core/config.ts` 注入，业务仓可覆写。
