/**
 * 通用 CRUD 引擎（技术核心，不含任何业务表名 / 业务规则）
 *
 * 设计：所有差异通过 CrudOptions 注入，框架本身只认识 ModuleDef。
 * - filterMode: 简单等值过滤 vs 高级过滤（驼峰转下划线 / 日期区间 / LIKE 启发式）
 * - derive:      创建/更新前的派生字段钩子（业务侧实现，核心不引用）
 * - resolveFilter: 列表过滤的自定义解析钩子（业务侧实现，核心不引用）
 * - batchDelete: 逗号分隔批量删除 vs 单条删除
 * - 审计字段  :  ModuleDef.timestamps 开启时自动注入 create_time/create_by 等
 *
 * 一个业务域 = 一份 ModuleDef[] + 一个 CrudOptions，即可获得完整的 CRUD API。
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonSafe } from "@/lib/json-safe";
import type { FieldDef, ModuleDef } from "./registry";
import { findModuleByResource } from "./registry";

export interface FilterContext {
  module: ModuleDef;
  rawKey: string;
  /** camelCase 已转 snake_case 的字段名 */
  key: string;
  value: string;
  where: Record<string, unknown>;
  allowed: Set<string>;
}

export interface CrudOptions {
  modules: readonly ModuleDef[];
  /** simple=只按配置字段等值匹配；advanced=支持区间/模糊/驼峰映射 */
  filterMode?: "simple" | "advanced";
  /** 未提供 _sort/_order 时是否使用 ModuleDef.defaultSort */
  useDefaultSort?: boolean;
  /** Prisma 委托不存在时返回空列表而非抛错 */
  guardMissingDelegate?: boolean;
  /** 支持 "1,2,3" 批量删除 */
  batchDelete?: boolean;
  /** 创建/更新前的派生字段钩子 */
  derive?: (
    model: string,
    data: Record<string, unknown>,
    isCreate: boolean
  ) => void | Promise<void>;
  /** 列表过滤自定义解析；返回 true 表示该参数已被处理 */
  resolveFilter?: (ctx: FilterContext) => boolean | Promise<boolean>;
}

export interface Crud {
  getModule: (resource: string) => ModuleDef | undefined;
  crudList: (module: ModuleDef, request: NextRequest) => Promise<NextResponse>;
  crudCreate: (module: ModuleDef, request: NextRequest) => Promise<NextResponse>;
  crudGet: (module: ModuleDef, id: string) => Promise<NextResponse>;
  crudUpdate: (module: ModuleDef, id: string, request: NextRequest) => Promise<NextResponse>;
  crudDelete: (module: ModuleDef, id: string) => Promise<NextResponse>;
}

function toId(module: ModuleDef, raw: string): unknown {
  if (module.idType === "bigint") return BigInt(raw);
  if (module.idType === "number") return Number(raw);
  return raw;
}

function coerce(field: FieldDef, value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === "") return null;
  if (field.type === "number") {
    if (value === null) return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }
  return value;
}

function toSnake(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function parseRangeKey(rawKey: string): { field: string; op: "gte" | "lte" } | null {
  const m = /^(begin|end)[_A-Z]/.exec(rawKey);
  if (!m) return null;
  const prefix = m[1];
  const rest = rawKey.slice(prefix.length).replace(/^_/, "");
  if (!rest) return null;
  return { field: toSnake(rest), op: prefix === "begin" ? "gte" : "lte" };
}

/** 日期区间值转换：仅日期时，止时间补到当天 23:59:59.999 */
function toRangeDate(value: string, op: "gte" | "lte"): Date | string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const iso = dateOnly ? `${value}T${op === "lte" ? "23:59:59.999" : "00:00:00.000"}` : value;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? value : d;
}

const EXTRA_FILTERABLE = ["create_time", "modify_time", "created_time", "updated_time", "update_time", "deleted"];

function allowedFields(module: ModuleDef): Set<string> {
  const s = new Set<string>([module.idField, ...EXTRA_FILTERABLE]);
  module.listColumns.forEach((c) => s.add(c.name));
  module.formFields.forEach((f) => s.add(f.name));
  return s;
}

/** 过滤值校正：主键按 idType，number 转数字，*_name/*_title 走 LIKE */
function coerceFilterValue(module: ModuleDef, key: string, value: string): unknown {
  if (key === module.idField) return toId(module, value);
  const ff = module.formFields.find((f) => f.name === key);
  if (ff && ff.type === "number") return Number(value);
  if (ff && ff.filter === "contains") return { contains: value };
  if (ff && ff.filter === "equals") return value;
  if (ff && (ff.type === "text" || ff.type === "textarea")) return { contains: value };
  if (key.endsWith("_id") || key === "clean_flag" || key === "retry_count") {
    const n = Number(value);
    return isNaN(n) ? value : n;
  }
  if (key.endsWith("_name") || key.endsWith("_title")) return { contains: value };
  return value;
}

/** 从请求 cookie 解析当前用户（RBAC 审计），失败时回退 system */
async function currentUser(request: NextRequest): Promise<string> {
  try {
    // 动态导入：避免纯逻辑测试因 jose(ESM) 未转译而失败
    const { verifyToken, AUTH_COOKIE_NAME } = await import("@/lib/auth/jwt");
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;
    return (payload?.userName as string) || "system";
  } catch {
    return "system";
  }
}

export function createCrud(options: CrudOptions): Crud {
  const {
    modules,
    filterMode = "simple",
    useDefaultSort = false,
    guardMissingDelegate = false,
    batchDelete = false,
    derive,
    resolveFilter,
  } = options;

  const getModule = (resource: string) => findModuleByResource(modules, resource);

  async function crudList(module: ModuleDef, request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const _start = searchParams.get("_start");
    const _end = searchParams.get("_end");
    const _sort = searchParams.get("_sort");
    const _order = searchParams.get("_order");

    const where: Record<string, unknown> = {};
    if (module.softDelete) where.deleted = false;
    if (module.delFlagField) where[module.delFlagField] = "0";

    const allowed = filterMode === "advanced"
      ? allowedFields(module)
      : new Set([...module.listColumns.map((c) => c.name), ...module.formFields.map((f) => f.name)]);

    for (const [rawKey, value] of searchParams.entries()) {
      if (value === "") continue;

      if (filterMode === "simple") {
        if (rawKey.startsWith("_") || !allowed.has(rawKey)) continue;
        where[rawKey] = value;
        continue;
      }

      // advanced
      if (["_start", "_end", "_sort", "_order"].includes(rawKey)) continue;

      const range = parseRangeKey(rawKey);
      if (range) {
        if (!allowed.has(range.field)) continue;
        const prev = (where[range.field] as Record<string, unknown>) || {};
        where[range.field] = { ...prev, [range.op]: toRangeDate(value, range.op) };
        continue;
      }

      const key = toSnake(rawKey);
      if (resolveFilter) {
        const handled = await resolveFilter({ module, rawKey, key, value, where, allowed });
        if (handled) continue;
      }
      if (!allowed.has(key)) continue;
      where[key] = coerceFilterValue(module, key, value);
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    if (_sort && _order) {
      orderBy[_sort] = _order === "desc" ? "desc" : "asc";
    } else if (useDefaultSort && module.defaultSort) {
      orderBy[module.defaultSort.field] = module.defaultSort.order;
    } else {
      orderBy[module.idField] = "desc";
    }

    const skip = _start ? parseInt(_start, 10) : 0;
    const take = _end ? Math.min(Math.max(parseInt(_end, 10) - skip, 1), 100) : 50;

    const delegate = (prisma as unknown as Record<string, any>)[module.model];
    if (!delegate) {
      if (guardMissingDelegate) {
        return NextResponse.json([], { headers: { "x-total-count": "0" } });
      }
      throw new Error(`Unknown prisma delegate: ${module.model}`);
    }

    const [rows, total] = await Promise.all([
      delegate.findMany({ where, orderBy, skip, take }),
      delegate.count({ where }),
    ]);

    return NextResponse.json(jsonSafe(rows), {
      headers: { "x-total-count": String(total) },
    });
  }

  async function crudCreate(module: ModuleDef, request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const data: Record<string, unknown> = { ...(module.createDefaults || {}) };
    for (const f of module.formFields) {
      const v = coerce(f, body[f.name]);
      if (v !== undefined) data[f.name] = v;
    }
    if (derive) await derive(module.model, data, true);
    if (module.timestamps) {
      data.create_time = new Date();
      data.create_by = await currentUser(request);
    }
    const delegate = (prisma as unknown as Record<string, any>)[module.model];
    const row = await delegate.create({ data });
    return NextResponse.json(jsonSafe(row));
  }

  async function crudGet(module: ModuleDef, id: string): Promise<NextResponse> {
    const delegate = (prisma as unknown as Record<string, any>)[module.model];
    const row = await delegate.findUnique({ where: { [module.idField]: toId(module, id) } });
    if (!row) return NextResponse.json({ error: "未找到记录" }, { status: 404 });
    return NextResponse.json(jsonSafe(row));
  }

  async function crudUpdate(module: ModuleDef, id: string, request: NextRequest): Promise<NextResponse> {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    for (const f of module.formFields) {
      const v = coerce(f, body[f.name]);
      if (v !== undefined) data[f.name] = v;
    }
    if (derive) await derive(module.model, data, false);
    if (module.timestamps) {
      data.update_time = new Date();
      data.update_by = await currentUser(request);
    }
    const delegate = (prisma as unknown as Record<string, any>)[module.model];
    const row = await delegate.update({
      where: { [module.idField]: toId(module, id) },
      data,
    });
    return NextResponse.json(jsonSafe(row));
  }

  async function crudDelete(module: ModuleDef, id: string): Promise<NextResponse> {
    const delegate = (prisma as unknown as Record<string, any>)[module.model];

    if (batchDelete) {
      // 逗号分隔批量（对齐 RuoYi DELETE /{ids} 数组路径）
      const ids = id.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ error: "主键不能为空" }, { status: 400 });
      }
      const keys = ids.map((i) => toId(module, i));
      if (module.softDelete) {
        await delegate.updateMany({
          where: { [module.idField]: { in: keys } },
          data: { deleted: true },
        });
      } else {
        await delegate.deleteMany({ where: { [module.idField]: { in: keys } } });
      }
      return NextResponse.json({ success: true, deleted: ids.length });
    }

    // 单条删除：逻辑删除优先，其次软删，最后物理删
    if (module.delFlagField) {
      await delegate.update({
        where: { [module.idField]: toId(module, id) },
        data: { [module.delFlagField]: "2" },
      });
    } else if (module.softDelete) {
      await delegate.update({
        where: { [module.idField]: toId(module, id) },
        data: { deleted: true },
      });
    } else {
      await delegate.delete({ where: { [module.idField]: toId(module, id) } });
    }
    return NextResponse.json({ success: true });
  }

  return { getModule, crudList, crudCreate, crudGet, crudUpdate, crudDelete };
}

export { jsonSafe };
