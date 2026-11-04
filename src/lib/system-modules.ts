// 系统管理模块统一配置（对标 RuoYi-Vue 的 ruoyi-admin / system）
// 复用核心 ModuleDef 结构，prisma 委托名即 snake_case 表名。
// 本文件属于「nextjs-admin 基础层」，供 (app)/admin/[model] 通用页面驱动。

// 类型定义统一来自开源核心 @/core/crud/registry（本文件只保留系统模块数据）
import type {
  FieldType as CoreFieldType,
  FieldDef as CoreFieldDef,
  ColumnDef as CoreColumnDef,
  ModuleDef as CoreModuleDef,
} from "@/core/crud/registry";

export type FieldType = CoreFieldType;
export interface FieldDef extends CoreFieldDef {}
export interface ColumnDef extends CoreColumnDef {}
export interface ModuleDef extends CoreModuleDef {}

const NORMAL_DISABLED = [
  { value: "0", label: "正常" },
  { value: "1", label: "停用" },
];

const VISIBLE_HIDDEN = [
  { value: "0", label: "显示" },
  { value: "1", label: "隐藏" },
];

export const SYSTEM_MODULES: ModuleDef[] = [
  {
    model: "sys_menu",
    resource: "menus",
    label: "菜单管理",
    idField: "menu_id",
    idType: "bigint",
    timestamps: true,
    createDefaults: { create_by: "admin" },
    listColumns: [
      { name: "menu_id", label: "ID" },
      { name: "menu_name", label: "菜单名称" },
      { name: "parent_id", label: "父ID" },
      { name: "order_num", label: "排序" },
      { name: "path", label: "路由" },
      { name: "menu_type", label: "类型" },
      { name: "perms", label: "权限标识" },
      { name: "visible", label: "显示" },
      { name: "status", label: "状态" },
    ],
    formFields: [
      { name: "menu_name", label: "菜单名称", type: "text", required: true },
      { name: "parent_id", label: "父菜单ID", type: "number" },
      { name: "order_num", label: "显示排序", type: "number" },
      { name: "path", label: "路由地址", type: "text" },
      { name: "component", label: "组件路径", type: "text" },
      {
        name: "menu_type",
        label: "菜单类型",
        type: "select",
        options: [
          { value: "M", label: "目录" },
          { value: "C", label: "菜单" },
          { value: "F", label: "按钮" },
        ],
      },
      { name: "perms", label: "权限标识", type: "text" },
      { name: "icon", label: "图标", type: "text" },
      { name: "query", label: "路由参数", type: "text" },
      {
        name: "visible",
        label: "显示状态",
        type: "select",
        options: VISIBLE_HIDDEN,
      },
      {
        name: "status",
        label: "菜单状态",
        type: "select",
        options: NORMAL_DISABLED,
      },
      { name: "remark", label: "备注", type: "textarea" },
    ],
  },
  {
    model: "sys_dept",
    resource: "depts",
    label: "部门管理",
    idField: "dept_id",
    idType: "bigint",
    delFlagField: "del_flag",
    timestamps: true,
    createDefaults: { create_by: "admin" },
    listColumns: [
      { name: "dept_id", label: "ID" },
      { name: "dept_name", label: "部门名称" },
      { name: "parent_id", label: "父ID" },
      { name: "order_num", label: "排序" },
      { name: "leader", label: "负责人" },
      { name: "phone", label: "联系电话" },
      { name: "status", label: "状态" },
    ],
    formFields: [
      { name: "dept_name", label: "部门名称", type: "text", required: true },
      { name: "parent_id", label: "父部门ID", type: "number" },
      { name: "order_num", label: "显示排序", type: "number" },
      { name: "leader", label: "负责人", type: "text" },
      { name: "phone", label: "联系电话", type: "text" },
      { name: "email", label: "邮箱", type: "text" },
      {
        name: "status",
        label: "状态",
        type: "select",
        options: NORMAL_DISABLED,
      },
      { name: "remark", label: "备注", type: "textarea" },
    ],
  },
  {
    model: "sys_post",
    resource: "posts",
    label: "岗位管理",
    idField: "post_id",
    idType: "bigint",
    timestamps: true,
    createDefaults: { create_by: "admin" },
    listColumns: [
      { name: "post_id", label: "岗位ID" },
      { name: "post_code", label: "岗位编码" },
      { name: "post_name", label: "岗位名称" },
      { name: "post_sort", label: "排序" },
      { name: "status", label: "状态" },
    ],
    formFields: [
      { name: "post_code", label: "岗位编码", type: "text", required: true },
      { name: "post_name", label: "岗位名称", type: "text", required: true },
      { name: "post_sort", label: "显示顺序", type: "number", required: true },
      {
        name: "status",
        label: "状态",
        type: "select",
        options: NORMAL_DISABLED,
        required: true,
      },
      { name: "remark", label: "备注", type: "textarea" },
    ],
  },
  {
    model: "sys_dict_type",
    resource: "dicts",
    label: "字典管理",
    idField: "dict_id",
    idType: "bigint",
    timestamps: true,
    createDefaults: { create_by: "admin" },
    listColumns: [
      { name: "dict_id", label: "ID" },
      { name: "dict_name", label: "字典名称" },
      { name: "dict_type", label: "字典类型" },
      { name: "status", label: "状态" },
      { name: "remark", label: "备注" },
    ],
    formFields: [
      { name: "dict_name", label: "字典名称", type: "text", required: true },
      { name: "dict_type", label: "字典类型", type: "text", required: true },
      {
        name: "status",
        label: "状态",
        type: "select",
        options: NORMAL_DISABLED,
      },
      { name: "remark", label: "备注", type: "textarea" },
    ],
  },
  {
    model: "sys_dict_data",
    resource: "dict-data",
    label: "字典数据",
    idField: "dict_code",
    idType: "bigint",
    timestamps: true,
    createDefaults: { create_by: "admin" },
    listColumns: [
      { name: "dict_code", label: "ID" },
      { name: "dict_sort", label: "排序" },
      { name: "dict_label", label: "字典标签" },
      { name: "dict_value", label: "字典键值" },
      { name: "dict_type", label: "字典类型" },
      { name: "is_default", label: "默认" },
      { name: "status", label: "状态" },
      { name: "create_time", label: "创建时间" },
    ],
    formFields: [
      { name: "dict_type", label: "字典类型", type: "text", required: true },
      { name: "dict_label", label: "字典标签", type: "text", required: true },
      { name: "dict_value", label: "字典键值", type: "text", required: true },
      { name: "dict_sort", label: "显示排序", type: "number" },
      { name: "css_class", label: "样式属性", type: "text" },
      { name: "list_class", label: "回显样式", type: "text" },
      {
        name: "is_default",
        label: "是否默认",
        type: "select",
        options: [
          { value: "Y", label: "是" },
          { value: "N", label: "否" },
        ],
      },
      {
        name: "status",
        label: "状态",
        type: "select",
        options: NORMAL_DISABLED,
      },
      { name: "remark", label: "备注", type: "textarea" },
    ],
  },
  {
    model: "sys_config",
    resource: "configs",
    label: "参数管理",
    idField: "config_id",
    idType: "number",
    timestamps: true,
    createDefaults: { create_by: "admin" },
    listColumns: [
      { name: "config_id", label: "ID" },
      { name: "config_name", label: "参数名称" },
      { name: "config_key", label: "参数键名" },
      { name: "config_value", label: "参数值" },
      { name: "config_type", label: "系统内置" },
      { name: "remark", label: "备注" },
    ],
    formFields: [
      { name: "config_name", label: "参数名称", type: "text", required: true },
      { name: "config_key", label: "参数键名", type: "text", required: true },
      { name: "config_value", label: "参数值", type: "textarea" },
      {
        name: "config_type",
        label: "系统内置",
        type: "select",
        options: [
          { value: "Y", label: "是" },
          { value: "N", label: "否" },
        ],
      },
      { name: "remark", label: "备注", type: "textarea" },
    ],
  },
  {
    model: "sys_notice",
    resource: "notices",
    label: "通知公告",
    idField: "notice_id",
    idType: "number",
    readOnly: true,
    listColumns: [
      { name: "notice_id", label: "ID" },
      { name: "notice_title", label: "公告标题" },
      { name: "notice_type", label: "类型" },
      { name: "status", label: "状态" },
      { name: "create_time", label: "创建时间" },
    ],
    formFields: [],
  },
  {
    model: "sys_logininfor",
    resource: "login-logs",
    label: "登录日志",
    idField: "info_id",
    idType: "bigint",
    readOnly: true,
    listColumns: [
      { name: "info_id", label: "ID" },
      { name: "user_name", label: "用户账号" },
      { name: "ipaddr", label: "IP" },
      { name: "login_location", label: "登录地点" },
      { name: "browser", label: "浏览器" },
      { name: "os", label: "操作系统" },
      { name: "status", label: "状态" },
      { name: "login_time", label: "登录时间" },
    ],
    formFields: [],
  },
  {
    model: "sys_oper_log",
    resource: "oper-logs",
    label: "操作日志",
    idField: "oper_id",
    idType: "bigint",
    readOnly: true,
    listColumns: [
      { name: "oper_id", label: "ID" },
      { name: "title", label: "模块标题" },
      { name: "business_type", label: "业务类型" },
      { name: "oper_name", label: "操作人员" },
      { name: "oper_url", label: "请求URL" },
      { name: "oper_ip", label: "IP" },
      { name: "status", label: "状态" },
      { name: "oper_time", label: "操作时间" },
    ],
    formFields: [],
  },
  {
    model: "sys_job",
    resource: "jobs",
    label: "定时任务",
    idField: "job_id",
    idType: "bigint",
    listColumns: [
      { name: "job_id", label: "ID" },
      { name: "job_name", label: "任务名" },
      { name: "job_group", label: "分组" },
      { name: "invoke_target", label: "调用目标" },
      { name: "cron_expression", label: "Cron" },
      { name: "status", label: "状态" },
      { name: "update_time", label: "更新时间" },
    ],
    formFields: [
      { name: "job_name", label: "任务名", type: "text", required: true },
      { name: "job_group", label: "分组", type: "text" },
      { name: "invoke_target", label: "调用目标", type: "textarea", required: true },
      { name: "cron_expression", label: "Cron 表达式", type: "text" },
      { name: "misfire_policy", label: "错失策略", type: "text" },
      {
        name: "concurrent",
        label: "是否并发",
        type: "select",
        options: [
          { value: "1", label: "允许" },
          { value: "0", label: "禁止" },
        ],
      },
      {
        name: "status",
        label: "状态",
        type: "select",
        options: [
          { value: "0", label: "正常" },
          { value: "1", label: "暂停" },
        ],
      },
      { name: "remark", label: "备注", type: "textarea" },
    ],
  },
  {
    model: "sys_job_log",
    resource: "job-logs",
    label: "调度日志",
    idField: "job_log_id",
    idType: "bigint",
    readOnly: true,
    listColumns: [
      { name: "job_log_id", label: "ID" },
      { name: "job_name", label: "任务名" },
      { name: "job_group", label: "分组" },
      { name: "invoke_target", label: "调用目标" },
      { name: "job_message", label: "消息" },
      { name: "status", label: "状态" },
      { name: "create_time", label: "时间" },
    ],
    formFields: [],
  },
];

export function getSystemModuleByResource(resource: string): ModuleDef | undefined {
  return SYSTEM_MODULES.find((m) => m.resource === resource);
}

/** 列表/表单单元格展示格式化 */
export function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (value instanceof Date) return value.toLocaleString("zh-CN");
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString("zh-CN");
  }
  return String(value);
}
