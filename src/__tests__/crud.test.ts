import { crud } from "@/lib/crud";
import { MODULES } from "@/lib/modules";

describe("schema-driven CRUD instance", () => {
  it("exposes RuoYi system modules", () => {
    expect(crud.getModule("menus")?.model).toBe("sys_menu");
    expect(crud.getModule("dicts")?.model).toBe("sys_dict_type");
  });

  it("exposes the sample module without any hand-written route", () => {
    expect(crud.getModule("items")?.model).toBe("demo_item");
  });

  it("rejects unknown resources", () => {
    expect(crud.getModule("does-not-exist")).toBeUndefined();
  });

  it("keeps every resource slug unique", () => {
    const slugs = MODULES.map((m) => m.resource);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
