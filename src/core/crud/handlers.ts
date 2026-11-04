/**
 * 动态路由处理器工厂（技术核心）
 *
 * 让「注册即出 API」成为可能：给一份 ModuleDef[] + 一个 Crud 实例，
 * 即可生成 /api/[domain]/[model] 与 /api/[domain]/[model]/[id] 的全部处理器。
 */

import { NextRequest, NextResponse } from "next/server";
import type { Crud } from "./engine";

type RouteContext<P> = { params: Promise<P> };

function fail(log: string, error: unknown, message: string) {
  console.error(log, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function createCollectionHandlers(crud: Crud, domain: string) {
  return {
    async GET(request: NextRequest, { params }: RouteContext<{ model: string }>) {
      const { model } = await params;
      const mod = crud.getModule(model);
      if (!mod) return NextResponse.json({ error: "未知资源" }, { status: 404 });
      try {
        return await crud.crudList(mod, request);
      } catch (error) {
        return fail(`GET /api/${domain}/${model} error:`, error, "查询失败");
      }
    },
    async POST(request: NextRequest, { params }: RouteContext<{ model: string }>) {
      const { model } = await params;
      const mod = crud.getModule(model);
      if (!mod || mod.readOnly) {
        return NextResponse.json({ error: "未知资源或只读" }, { status: 404 });
      }
      try {
        return await crud.crudCreate(mod, request);
      } catch (error) {
        return fail(`POST /api/${domain}/${model} error:`, error, "创建失败");
      }
    },
  };
}

export function createItemHandlers(crud: Crud, domain: string) {
  return {
    async GET(_request: NextRequest, { params }: RouteContext<{ model: string; id: string }>) {
      const { model, id } = await params;
      const mod = crud.getModule(model);
      if (!mod) return NextResponse.json({ error: "未知资源" }, { status: 404 });
      try {
        return await crud.crudGet(mod, id);
      } catch (error) {
        return fail(`GET /api/${domain}/${model}/${id} error:`, error, "查询失败");
      }
    },
    async PUT(request: NextRequest, { params }: RouteContext<{ model: string; id: string }>) {
      const { model, id } = await params;
      const mod = crud.getModule(model);
      if (!mod || mod.readOnly) {
        return NextResponse.json({ error: "未知资源或只读" }, { status: 404 });
      }
      try {
        return await crud.crudUpdate(mod, id, request);
      } catch (error) {
        return fail(`PUT /api/${domain}/${model}/${id} error:`, error, "更新失败");
      }
    },
    async DELETE(_request: NextRequest, { params }: RouteContext<{ model: string; id: string }>) {
      const { model, id } = await params;
      const mod = crud.getModule(model);
      if (!mod || mod.readOnly) {
        return NextResponse.json({ error: "未知资源或只读" }, { status: 404 });
      }
      try {
        return await crud.crudDelete(mod, id);
      } catch (error) {
        return fail(`DELETE /api/${domain}/${model}/${id} error:`, error, "删除失败");
      }
    },
  };
}
