# Changelog

本文件记录 ruoyi-next 的版本变化。版本号遵循 SemVer。

## [0.1.2] - 2026-11-09

修复一个会导致 **HTTP 部署无法登录** 的会话 Cookie 问题。无破坏性 API 变更，可直接从 0.1.1 升级。

### 修复

- 🔴 **Secure Cookie 被浏览器丢弃**：`getCookieOptions()` 原先把 `secure` 绑定为
  `NODE_ENV === "production"`，导致以 `npm run build && npm start`（或任何 HTTP 直连）
  部署时，登录接口虽然返回成功并签发了会话，浏览器却会按规范丢弃带 `Secure` 标志的
  Cookie，用户被立刻重定向回登录页，表现为「账号密码正确却登不进去」。
  现改为**默认不设置 Secure**，仅在显式设置 `COOKIE_SECURE=true` 时开启（HTTPS 部署）。
- `.env.example` 增加 `COOKIE_SECURE` 可选注释，说明何时才应开启。

### 新增

- `src/__tests__/cookie-options.test.ts`：5 个用例锁住 Cookie 契约（含「生产模式下也不得
  默认 secure」的回归断言），全仓测试由 19 增至 24。

### 升级注意

- 通过 **HTTPS** 提供服务的部署，请在 `.env` 中显式设置 `COOKIE_SECURE="true"`；
  HTTP / 局域网 IP 直连保持默认即可。
- 升级后重新构建并重启服务即可，无需数据迁移或依赖更新。

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
