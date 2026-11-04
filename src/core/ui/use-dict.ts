"use client";

import { useQuery } from "@tanstack/react-query";

export interface DictOption {
  value: string;
  label: string;
}

export interface DictHookResult {
  options: DictOption[];
  loading: boolean;
}

/**
 * 通用字典 Hook 工厂（技术核心）
 *
 * 对齐 RuoYi GET /system/dict/data/type/{dictType} 语义：
 * 由应用注入端点前缀，返回 useDict(dictType) 供表单 select 使用。
 */
export function createDictHook(
  basePath: string,
  queryKeyPrefix = "dict"
): (dictType: string | null | undefined) => DictHookResult {
  return function useDict(dictType: string | null | undefined): DictHookResult {
    const q = useQuery({
      queryKey: [queryKeyPrefix, dictType],
      enabled: !!dictType,
      queryFn: async () => {
        const res = await fetch(`${basePath}/${dictType}`);
        if (!res.ok) throw new Error("字典查询失败");
        const rows: { dictLabel?: string; dictValue?: string }[] = await res.json();
        return (rows || []).map((r) => ({
          value: String(r.dictValue ?? ""),
          label: r.dictLabel ?? r.dictValue ?? "",
        }));
      },
      staleTime: 5 * 60 * 1000,
    });
    return { options: q.data || [], loading: q.isLoading };
  };
}
