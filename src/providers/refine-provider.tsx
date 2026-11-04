"use client";

import { Suspense } from "react";
import { Refine } from "@refinedev/core";
import routerProvider from "@refinedev/nextjs-router";

/**
 * Refine 只提供路由与资源元数据。
 * 业务仓 fork 后在 resources 中登记自己的页面即可，核心不预设任何业务资源。
 */
function RefineContent({ children }: { children: React.ReactNode }) {
  return (
    <Refine
      routerProvider={routerProvider}
      resources={[]}
      options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
    >
      {children}
    </Refine>
  );
}

export function RefineProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">加载中...</div>}>
      <RefineContent>{children}</RefineContent>
    </Suspense>
  );
}
