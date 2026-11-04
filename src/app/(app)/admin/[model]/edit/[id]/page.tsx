"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataForm } from "@/components/crud/data-form";
import { MODULES as SYSTEM_MODULES } from "@/lib/modules";
import { toast } from "sonner";

export default function SystemEditPage() {
  const params = useParams();
  const model = params.model as string;
  const id = params.id as string;
  const mod = SYSTEM_MODULES.find((m) => m.resource === model);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { data: initial, isLoading } = useQuery({
    queryKey: ["system", model, id],
    queryFn: async () => {
      const r = await fetch(`/api/system/${model}/${id}`);
      if (!r.ok) throw new Error("加载失败");
      return r.json();
    },
    enabled: !!mod && !!id,
  });

  if (!mod || mod.readOnly) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            该模块不允许编辑
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">加载中...</CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (body: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const r = await fetch(`/api/system/${model}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}) as Record<string, string>);
        throw new Error(d.error || "更新失败");
      }
      toast.success("更新成功");
      router.push(`/admin/${model}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>编辑{mod.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataForm
            module={mod}
            initial={initial as Record<string, unknown> | undefined}
            onSubmit={onSubmit}
            submitting={submitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
