# 贡献指南

欢迎提交 issue 与 PR。

## 开发约定

- `src/core/` 是技术核心：**不得出现任何业务表名、业务路径、内部主机名或品牌字样**。
  业务差异一律通过 `CrudOptions` / `ModuleDef` / `src/app-config.ts` 注入。
- 新增模块参考 `docs/module-guide.md`，不要为每个模块写 `route.ts`。
- 提交前确保：

```bash
npm run typecheck
npm test
npm run build
```

- 测试放在 `src/__tests__/`，纯逻辑测试不得依赖真实数据库。

## 提交信息

使用 Conventional Commits：`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`。

## 安全

不要在 PR 中包含真实凭据、内部 IP、生产数据或客户信息。
漏洞报告请走 `SECURITY.md` 中的私密渠道。
