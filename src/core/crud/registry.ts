/**
 * 通用模块注册表类型（技术核心，不含任何业务定义）
 *
 * 一个 ModuleDef 描述「一张表 → 一组 API + 一组管理页面」的全部元数据。
 * 框架只认这个结构，不认识具体业务表；业务仓通过提供自己的 ModuleDef[] 接入。
 *
 * 本文件是开源核心与业务仓共享的唯一类型契约。
 */

export type FieldType = "text" | "textarea" | "number" | "password" | "date" | "select";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** 列表过滤语义：contains=LIKE，equals=精确。缺省按启发式规则推导 */
  filter?: "contains" | "equals";
  /** 业务字典类型；select 渲染时从字典端点拉取选项 */
  dict?: string;
}

export interface ColumnDef {
  name: string;
  label: string;
}

export interface ModuleDef {
  /** Prisma 委托名（snake_case） */
  model: string;
  /** API 资源 slug，页面路由也用此值 */
  resource: string;
  /** 菜单/标题名 */
  label: string;
  /** 主键字段名 */
  idField: string;
  idType: "bigint" | "number" | "string";
  /** 软删除：列表过滤 deleted=false，删除置 true */
  softDelete?: boolean;
  /** 逻辑删除字段（RuoYi '0' 存在 / '2' 删除），优先于 softDelete */
  delFlagField?: string;
  /** 自动维护 create_time / create_by / update_time / update_by */
  timestamps?: boolean;
  /** 只读模块：前后端均禁写 */
  readOnly?: boolean;
  /** UI 只读：隐藏新增/编辑/删除入口，但 API 保留写契约 */
  uiReadOnly?: boolean;
  /** 创建时的默认值 */
  createDefaults?: Record<string, unknown>;
  /** 默认排序（缺省按主键 desc） */
  defaultSort?: { field: string; order: "asc" | "desc" };
  listColumns: ColumnDef[];
  formFields: FieldDef[];
}

/** 按资源 slug 查找模块定义 */
export function findModuleByResource(
  modules: readonly ModuleDef[],
  resource: string
): ModuleDef | undefined {
  return modules.find((m) => m.resource === resource);
}

/** 列出所有可写模块（供自描述端点/文档生成使用） */
export function writableModules(modules: readonly ModuleDef[]): ModuleDef[] {
  return modules.filter((m) => !m.readOnly);
}
