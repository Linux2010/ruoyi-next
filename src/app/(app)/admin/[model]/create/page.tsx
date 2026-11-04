"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataForm } from "@/components/crud/data-form";
import { MODULES as SYSTEM_MODULES } from "@/lib/modules";
import { toast } from "sonner";

export default function SystemCreatePage() {
  const params = useParams();
  const model = params.model as string;
  const mod = SYSTEM_MODULES.find((m) => m.resource === model);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (!mod || mod.readOnly) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            该模块不允许创建
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (body: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const r = await fetch(`/api/system/${model}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}) as Record<string, string>);
        throw new Error(d.error || "创建失败");
      }
      toast.success("创建成功");
      router.push(`/admin/${model}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>新增{mod.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataForm module={mod} onSubmit={onSubmit} submitting={submitting} />
        </CardContent>
      </Card>
    </div>
  );
}
