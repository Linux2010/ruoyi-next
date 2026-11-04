"use client";

/**
 * 通用数据表单（技术核心）
 *
 * 由 ModuleDef.formFields 驱动渲染；字典选项通过 useDict 拉取。
 * 不含任何业务表名，任何注册模块都可复用。
 */

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldDef, ModuleDef } from "@/core/crud/registry";
import { useDict } from "@/lib/use-dict";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function defaultFor(field: FieldDef, initial?: Record<string, unknown>): string {
  if (field.type === "password") return "";
  const v = initial?.[field.name];
  if (v === null || v === undefined) return "";
  if (field.type === "date" && typeof v === "string") return v.slice(0, 10);
  return String(v);
}

export function DataForm({
  module,
  initial,
  onSubmit,
  submitting,
}: {
  module: ModuleDef;
  initial?: Record<string, unknown>;
  onSubmit: (body: Record<string, unknown>) => void;
  submitting: boolean;
}) {
  const router = useRouter();
  // 收集本模块所有字典字段，统一拉取（hooks 顶层调用）
  const dictTypes = [...new Set(module.formFields.filter((f) => f.dict).map((f) => f.dict!))];
  const dictMap: Record<string, { options: { value: string; label: string }[] }> = {};
  for (const dt of dictTypes) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    dictMap[dt] = useDict(dt);
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const f of module.formFields) {
      const raw = fd.get(f.name);
      if (f.type === "number") {
        body[f.name] = raw === "" || raw === null ? null : Number(raw);
      } else {
        body[f.name] = raw === "" ? null : raw;
      }
    }
    onSubmit(body);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {module.formFields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name}>
            {f.label}
            {f.required && <span className="text-destructive"> *</span>}
          </Label>
          {f.type === "textarea" ? (
            <textarea
              id={f.name}
              name={f.name}
              defaultValue={defaultFor(f, initial)}
              rows={3}
              className={inputClass + " h-auto py-2"}
            />
          ) : f.type === "select" ? (
            <select
              id={f.name}
              name={f.name}
              defaultValue={defaultFor(f, initial)}
              className={inputClass}
            >
              <option value="">请选择</option>
              {(f.dict ? dictMap[f.dict]?.options : f.options)?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={f.name}
              name={f.name}
              type={
                f.type === "password"
                  ? "password"
                  : f.type === "number"
                  ? "number"
                  : f.type === "date"
                  ? "date"
                  : "text"
              }
              defaultValue={defaultFor(f, initial)}
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : "保存"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
