/** middleware 依赖 jose（ESM）；本测试只校验路径契约，故打桩 jwt 模块。 */
jest.mock("@/lib/auth/jwt", () => ({
  AUTH_COOKIE_NAME: "ruoyi-next-token",
  verifyToken: jest.fn(async () => null),
}));

import { PUBLIC_PATHS, SERVICE_TOKEN_PATHS } from "../middleware";

describe("public paths", () => {
  it("keeps health check unauthenticated (container HEALTHCHECK depends on it)", () => {
    expect(PUBLIC_PATHS).toContain("/api/health");
  });

  it("keeps login pages unauthenticated", () => {
    expect(PUBLIC_PATHS).toContain("/login");
    expect(PUBLIC_PATHS).toContain("/api/auth/login");
  });

  it("does not expose data APIs by default", () => {
    expect(PUBLIC_PATHS).not.toContain("/api/system/users");
    expect(PUBLIC_PATHS).not.toContain("/api/auth/users");
  });
});

describe("service token channel", () => {
  it("is disabled by default and enabled only by explicit config", () => {
    expect(SERVICE_TOKEN_PATHS).toEqual([]);
  });
});
