# RuoYi Next

**用 Next.js 15 + Prisma 6 重写的 RuoYi 管理端骨架，核心能力是「注册即出 API + 管理页」。**

这不是一个业务系统：仓库里不含任何具体业务表、业务页面或内部部署信息。它是一份**开源技术内核**，
你可以 fork 它，接入自己的业务模块，而不必把核心代码复制来复制去。

> A schema-driven admin starter for RuoYi-style databases. Define a `ModuleDef`,
> get CRUD API routes, list/create/edit pages and menu entries — no boilerplate.

## 为什么值得用

| 能力 | 说明 |
|---|---|
| 声明式模块注册 | 一份 `ModuleDef` 定义表、字段、列、主键、软删、审计字段 |
| 通用 CRUD 引擎 | 列表分页/排序/过滤、创建、更新、单条/批量删除、BigInt 安全序列化 |
| 动态路由 | `/api/system/[model]` 与 `/admin/[model]` 共用一个引擎，新增模块零路由代码 |
| RuoYi 兼容 | 复用 `sys_user` / `sys_role` / `sys_menu` / `sys_dict_*` 等表，零数据迁移 |
| 认证与权限 | JWT（jose）+ bcryptjs + RBAC 菜单/权限树 |
| 机器接口通道 | 可选 `X-Service-Token` 放行，常量时间比较；默认关闭 |
| 健康检查 | `/api/health` 免鉴权，容器 HEALTHCHECK 直接可用 |

## 快速开始

```bash
git clone <your-fork-url> && cd ruoyi-next
cp .env.example .env        # 填入 DATABASE_URL 与 JWT_SECRET
npm install                 # postinstall 会自动 prisma generate
npm run dev                 # http://localhost:3000
```

完整步骤（含示例表 SQL）见 [docs/quickstart.md](docs/quickstart.md)。

## 架构

```
src/core/          技术核心（不含业务）：CRUD 引擎、注册表类型、路由工厂、鉴权守卫、通用表单
src/lib/           基础设施与装配：prisma、auth、模块总注册表、单实例 crud
src/modules/       示例模块（演示如何扩展）
src/app/           Next.js App Router：动态 API 路由 + 通用管理页
src/app-config.ts  运行时配置注入点（业务路径、品牌、token 头名）
```

核心只认识 `ModuleDef`，不认识任何业务表名。业务差异通过 `CrudOptions`
（过滤模式、派生钩子、批量删除、审计字段）注入。详见 [docs/module-guide.md](docs/module-guide.md)。

## 安全

- `.env` 已 gitignore；`.env.example` 只含占位符。
- 生产环境**必须**设置 `JWT_SECRET`，开发态回退值不可用于生产。
- 机器 token 通道默认关闭；启用方式见 [docs/machine-token.md](docs/machine-token.md)。
- 报告漏洞请走 [SECURITY.md](SECURITY.md)，不要开公开 issue。

## 许可

[MIT](LICENSE)
