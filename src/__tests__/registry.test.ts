import { findModuleByResource, writableModules, type ModuleDef } from "@/core/crud/registry";

const modules: ModuleDef[] = [
  {
    model: "demo_item",
    resource: "items",
    label: "示例",
    idField: "id",
    idType: "number",
    listColumns: [{ name: "id", label: "ID" }],
    formFields: [],
  },
  {
    model: "sys_logininfor",
    resource: "login-logs",
    label: "登录日志",
    idField: "info_id",
    idType: "bigint",
    readOnly: true,
    listColumns: [{ name: "info_id", label: "ID" }],
    formFields: [],
  },
];

describe("module registry", () => {
  it("finds a module by its resource slug", () => {
    expect(findModuleByResource(modules, "items")?.model).toBe("demo_item");
    expect(findModuleByResource(modules, "missing")).toBeUndefined();
  });

  it("excludes read-only modules from writableModules", () => {
    expect(writableModules(modules).map((m) => m.resource)).toEqual(["items"]);
  });
});
