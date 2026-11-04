"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { MODULES as SYSTEM_MODULES, formatCell } from "@/lib/modules";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function SystemListPage() {
  const params = useParams();
  const model = params.model as string;
  const mod = SYSTEM_MODULES.find((m) => m.resource === model);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["system", model, page, pageSize],
    queryFn: async () => {
      const _start = (page - 1) * pageSize;
      const _end = page * pageSize;
      const r = await fetch(`/api/system/${model}?_start=${_start}&_end=${_end}`);
      if (!r.ok) throw new Error("加载失败");
      const rows = await r.json();
      const total = Number(r.headers.get("x-total-count") || "0");
      return { rows, total };
    },
    enabled: !!mod,
  });

  if (!mod) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            未知模块：{model}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async (id: unknown) => {
    if (!confirm(`确定删除该${mod.label}记录吗？`)) return;
    try {
      const r = await fetch(`/api/system/${model}/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success("已删除");
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else refetch();
    } catch {
      toast.error("删除失败");
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const total = data?.total ?? 0;
  const rows = (data?.rows as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{mod.label}管理</CardTitle>
          {!mod.readOnly && (
            <Link href={`/admin/${model}/create`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新增
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">加载中...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {mod.listColumns.map((c) => (
                      <TableHead key={c.name}>{c.label}</TableHead>
                    ))}
                    {!mod.readOnly && <TableHead className="text-right">操作</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={String(row[mod.idField])}>
                      {mod.listColumns.map((c) => (
                        <TableCell key={c.name}>{formatCell(row[c.name])}</TableCell>
                      ))}
                      {!mod.readOnly && (
                        <TableCell className="text-right">
                          <Link href={`/admin/${model}/edit/${row[mod.idField]}`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(row[mod.idField])}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={mod.listColumns.length + (mod.readOnly ? 0 : 1)}
                        className="py-6 text-center text-muted-foreground"
                      >
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
