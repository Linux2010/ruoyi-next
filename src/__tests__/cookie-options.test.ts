/**
 * Cookie contract tests for the auth session cookie.
 *
 * Regression guard: `secure` used to be tied to NODE_ENV === "production",
 * which silently broke login on plain-HTTP deployments — browsers drop
 * Secure cookies over http://, so users were bounced back to the login page
 * right after a successful authentication.
 */
jest.mock("jose", () => ({
  jwtVerify: jest.fn(),
  SignJWT: jest.fn(),
}));

import { AUTH_COOKIE_NAME, getCookieOptions } from "@/lib/auth/jwt";

const env = process.env as Record<string, string | undefined>;

afterEach(() => {
  delete env.COOKIE_SECURE;
});

describe("getCookieOptions", () => {
  it("does not set secure by default (HTTP deployments must be able to log in)", () => {
    delete env.COOKIE_SECURE;
    expect(getCookieOptions().secure).toBe(false);
  });

  it("does not set secure even in production unless explicitly opted in", () => {
    const prev = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      expect(getCookieOptions().secure).toBe(false);
    } finally {
      if (prev === undefined) delete env.NODE_ENV;
      else env.NODE_ENV = prev;
    }
  });

  it("sets secure only when COOKIE_SECURE=true (HTTPS deployments)", () => {
    env.COOKIE_SECURE = "true";
    expect(getCookieOptions().secure).toBe(true);
    env.COOKIE_SECURE = "1";
    expect(getCookieOptions().secure).toBe(false);
  });

  it("keeps the session cookie httpOnly, lax and 24h", () => {
    const opts = getCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(24 * 60 * 60);
  });

  it("keeps the cookie name stable (middleware reads the same name)", () => {
    expect(AUTH_COOKIE_NAME).toBe("ruoyi-next-token");
  });
});
