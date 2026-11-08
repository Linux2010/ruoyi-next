# Changelog

本文件记录 ruoyi-next 的版本变化。版本号遵循 SemVer。

## [0.1.1] - 2026-11-08

首个维护版本，聚焦**安全加固**。无破坏性 API 变更，可直接从 0.1.0 升级。

### 修复

- 🔴 **JWT 默认密钥风险**：`NODE_ENV=production` 下缺少 `JWT_SECRET` 或长度不足 32 字符时
  直接抛错，不再静默回落到仓库内公开的弱密钥（此前任何人都可据此伪造管理员 token）。
  配置错误也不会被 `verifyToken` 的 `catch` 吞掉而伪装成「token 无效」。
  开发 / 测试环境仍保留回退值，纯逻辑测试不受影响。
- 🔴 **依赖漏洞 9 项清零**（1 critical / 7 high / 1 moderate）：
  `next` 升至 `^15.5.29`（修复 App Router Server Actions DoS / SSRF / 缓存投毒、
  Image Optimization RCE 等），`postcss` 升至 `^8.5.32`；通过 `overrides` 锁定
  `nanoid` / `qs` / `sharp` / `source-map-js` / `deepmerge-ts` 的安全版本。
  `npm audit --omit=dev` 现为 **0 漏洞**，Prisma 6 未跨大版本升级，`prisma validate` 通过。

### 新增

- `src/lib/auth/secret.ts`：独立的密钥解析与 fail-fast 逻辑。
- `src/__tests__/jwt-secret.test.ts`：9 个用例覆盖密钥分支与错误传播（全仓共 19 个测试）。
- `npm run audit:prod`；CI 增加 `prisma validate` 与生产依赖审计门禁，防止漏洞回归。

### 升级注意

- 生产部署**必须**设置长度 ≥32 字符的强随机 `JWT_SECRET`，否则请求会直接报错
  （这是有意为之的 fail-fast，不是回归）。
- 升级后执行一次 `npm install` 应用 `overrides`，并确认 `npm run audit:prod` 通过。

## [0.1.0] - 2026-11-04

首个公开版本：从内部管理端项目中抽取并重新初始化的技术内核。

- 声明式 `ModuleDef` 注册表 + 参数化通用 CRUD 引擎
- 动态路由 `/api/system/[model]` 与通用管理页 `/admin/[model]`
- RuoYi `sys_*` / `qrtz_*` 表模型（28 个）+ 一个示例模块
- JWT / bcryptjs / RBAC 菜单与权限树
- 可配置 service token 机器接口通道（默认关闭）
- 免鉴权 `/api/health` 与自描述 `/api/endpoints`
- 全新文档、MIT 许可与 CI 流水线

本仓库为全新初始化，不继承任何历史提交，也不包含任何业务代码或真实凭据。
