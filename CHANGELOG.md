# Changelog

本文件记录 ruoyi-next 的版本变化。版本号遵循 SemVer。

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
