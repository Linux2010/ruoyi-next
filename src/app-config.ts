/**
 * 运行时配置（公开模板默认值）
 *
 * 业务仓 fork 后，把机器接口前缀、内部自动化端点等注入到这里。
 * 核心的 middleware 只实现算法，不认识任何具体资源名。
 */

export const AUTH_CONFIG = {
  publicPaths: ["/login", "/api/auth/login", "/api/health"],
  serviceTokenPaths: [] as string[],
  internalAutomationPaths: [] as string[],
  serviceTokenEnvVar: "SERVICE_TOKEN",
  serviceTokenHeader: "x-service-token",
  serviceTokenQueryParam: "token",
};
