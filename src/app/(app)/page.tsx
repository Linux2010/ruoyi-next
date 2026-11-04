import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/lib/modules";

/**
 * 首页：直接展示注册表内容，说明「新增模块 = 新增一条 ModuleDef」。
 * 纯静态渲染，不访问数据库。
 */
export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RuoYi Next</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          基于 Next.js 15 + Prisma 6 的 RuoYi 管理端重实现。所有 CRUD 接口与管理页面由模块注册表驱动。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>已注册模块（{MODULES.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <li key={m.resource}>
                <Link
                  href={`/admin/${m.resource}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
                >
                  <span>{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.model}</span>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>接入自己的模块</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. 在 prisma/schema.prisma 中定义数据表，执行 npx prisma generate。</p>
          <p>2. 参考 src/modules/sample/module.ts 写一个 ModuleDef。</p>
          <p>3. 加入 src/lib/modules.ts 的 MODULES 数组。</p>
          <p>无需新增 route.ts，/api/system/{"{resource}"} 与 /admin/{"{resource}"} 立即生效。</p>
        </CardContent>
      </Card>
    </div>
  );
}
