"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const windowSize = 5;
  let start = Math.max(1, safePage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <div className="text-sm text-muted-foreground">
        共 {total} 条
        {onPageSizeChange && (
          <span className="ml-3 inline-flex items-center gap-1">
            每页
            <select
              className="border rounded px-1.5 py-1 text-sm bg-background"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            条
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {start > 1 && (
          <>
            <Button variant={1 === safePage ? "default" : "outline"} size="sm" className="w-8 p-0" onClick={() => onPageChange(1)}>1</Button>
            {start > 2 && <span className="px-1 text-muted-foreground">…</span>}
          </>
        )}
        {pages.map((p) => (
          <Button key={p} variant={p === safePage ? "default" : "outline"} size="sm" className="w-8 p-0" onClick={() => onPageChange(p)}>
            {p}
          </Button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
            <Button variant={totalPages === safePage ? "default" : "outline"} size="sm" className="w-8 p-0" onClick={() => onPageChange(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => onPageChange(safePage + 1)} disabled={safePage >= totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
