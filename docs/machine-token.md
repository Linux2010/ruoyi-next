# 机器接口 token 通道

## 默认行为

**默认关闭。** `src/app-config.ts` 中 `serviceTokenPaths` 为空数组，
且 `SERVICE_TOKEN` 未设置时，校验函数直接返回 false。所有 API 都需要浏览器 JWT。

## 启用

1. 生成强随机值并写入环境变量：

```bash
openssl rand -hex 32
```

2. 在 `src/app-config.ts` 中登记允许的前缀（**按资源前缀，不是子路径**）：

```ts
export const AUTH_CONFIG = {
  publicPaths: ["/login", "/api/auth/login", "/api/health"],
  serviceTokenPaths: ["/api/system/items/"],   // 尾斜杠可避免误放行相邻资源
  serviceTokenEnvVar: "SERVICE_TOKEN",
  serviceTokenHeader: "x-service-token",
  serviceTokenQueryParam: "token",
  internalAutomationPaths: [],
};
```

3. 调用方：

```bash
curl -H "X-Service-Token: $SERVICE_TOKEN" \
  https://your-host/api/system/items
```

也支持 `?token=...` 兜底，但优先使用请求头（避免 token 进入访问日志）。

## 实现要点

- 常量时间比较，防时序攻击。
- 头名、环境变量名、query 参数名均可配置，方便兼容已有调用方。
- 白名单用 `startsWith` 匹配前缀；登记时务必注意相邻资源名（如 `items` 与 `items_log`）。
- 公开路径（`PUBLIC_PATHS`）与机器路径是两套独立机制，不要把数据接口放进 `publicPaths`。

## 检查清单

- [ ] `SERVICE_TOKEN` 只存在于服务器环境变量，不进仓库
- [ ] 白名单覆盖全部调用点，且不含多余前缀
- [ ] 对「无 token / 错 token / 对 token」三种情况各测一次
- [ ] 相邻资源名不会被误放行
