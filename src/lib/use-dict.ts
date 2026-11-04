"use client";

/**
 * 字典 Hook（薄壳）
 * 通用实现在 @/core/ui/use-dict，端点由 @/core/config 注入。
 */

export { createDictHook } from "@/core/ui/use-dict";
import { createDictHook } from "@/core/ui/use-dict";
import { CORE_CONFIG } from "@/core/config";

export const useDict = createDictHook(CORE_CONFIG.dictBasePath);
