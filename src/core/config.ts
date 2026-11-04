/**
 * 应用级配置注入点
 *
 * 开源核心代码只读取这里的键，不硬编码业务路径 / 品牌名。
 * 业务仓 fork 本模板后覆写此文件即可接入自己的字典端点。
 */

export const CORE_CONFIG = {
  /** 字典数据端点前缀，useDict 会拼接 /{dictType} */
  dictBasePath: "/api/dict/type",
  /** 健康检查等服务标识 */
  serviceName: "ruoyi-next",
};
