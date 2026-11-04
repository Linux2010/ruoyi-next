# 快速开始

## 1. 准备数据库

本模板复用 RuoYi 的 `sys_*` / `qrtz_*` 表结构，无需数据迁移。
如果你已有 RuoYi 数据库，直接把连接串填进 `.env` 即可。

示例模块需要一张演示表（可选）：

```sql
CREATE TABLE demo_item (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100),
  status      VARCHAR(20),
  create_time DATETIME
);
```

## 2. 配置

```bash
cp .env.example .env
```

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | 是 | MySQL 连接串 |
| `JWT_SECRET` | 生产必填 | 长随机字符串；开发态有不安全的回退值 |
| `SERVICE_TOKEN` | 否 | 留空即关闭机器接口通道 |

## 3. 安装与启动

```bash
npm install          # postinstall 自动执行 prisma generate
npm run dev          # http://localhost:3000
npm test             # 纯逻辑测试，不需要真实数据库
npm run typecheck
npm run build
```

## 4. 验证

| 检查 | 期望 |
|---|---|
| `GET /api/health` | 200，返回 `{ok:true,service:"ruoyi-next",time:...}`，无需登录 |
| `GET /api/system/users` | 未登录返回 401 |
| `GET /api/endpoints` | 登录后返回由注册表生成的端点清单 |
| `/admin/[model]` | 登录后显示对应模块列表页 |

## 5. 接入自己的模块

见 [module-guide.md](module-guide.md)。核心原则：**新增模块 = 新增一条 `ModuleDef`**，
不新增 `route.ts`，不改鉴权代码。

## 常见问题

- **`prisma generate` 报连接错误**：生成只需要 schema，不需要数据库可达；检查 `DATABASE_URL` 格式即可。
- **构建时提示缺少环境变量**：`.env` 仅本地生效，CI 中通过环境变量注入。
- **登录失败**：确认 `sys_user` 表里密码是 bcrypt 哈希，且 `JWT_SECRET` 已配置。
