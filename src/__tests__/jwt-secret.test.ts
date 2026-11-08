/**
 * jose is ESM-only, so it is stubbed here. These tests target secret resolution
 * and the fail-fast contract, not the cryptographic round-trip.
 */
jest.mock("jose", () => ({
  SignJWT: jest.fn(),
  jwtVerify: jest.fn(),
}));

import { jwtVerify } from "jose";
import { JWT_SECRET_MIN_LENGTH, resolveJwtSecret } from "@/lib/auth/secret";
import { generateToken, verifyToken, type JWTPayload } from "@/lib/auth/jwt";

// Next.js types pin NODE_ENV to a literal union, so go through a plain record.
const env = process.env as Record<string, string | undefined>;
function setEnv(key: string, value: string | undefined) {
  if (value === undefined) delete env[key];
  else env[key] = value;
}

const payload: JWTPayload = {
  userId: 7,
  userName: "admin",
  roles: ["admin"],
  permissions: ["system:user:list"],
};

const originalNodeEnv = env.NODE_ENV;
const originalSecret = env.JWT_SECRET;

afterEach(() => {
  setEnv("NODE_ENV", originalNodeEnv);
  setEnv("JWT_SECRET", originalSecret);
  jest.clearAllMocks();
});

describe("resolveJwtSecret", () => {
  it("uses the configured secret outside production", () => {
    setEnv("NODE_ENV", "test");
    setEnv("JWT_SECRET", "a-local-development-secret");
    expect(new TextDecoder().decode(resolveJwtSecret())).toBe(
      "a-local-development-secret"
    );
  });

  it("falls back to the dev-only secret outside production", () => {
    setEnv("NODE_ENV", "test");
    setEnv("JWT_SECRET", undefined);
    expect(resolveJwtSecret().length).toBeGreaterThan(0);
  });

  it("throws in production when JWT_SECRET is missing", () => {
    setEnv("NODE_ENV", "production");
    setEnv("JWT_SECRET", undefined);
    expect(() => resolveJwtSecret()).toThrow(/JWT_SECRET must be set/);
  });

  it("throws in production when JWT_SECRET is too short", () => {
    setEnv("NODE_ENV", "production");
    setEnv("JWT_SECRET", "x".repeat(JWT_SECRET_MIN_LENGTH - 1));
    expect(() => resolveJwtSecret()).toThrow(
      /at least 32 characters in production/
    );
  });

  it("accepts a strong secret in production", () => {
    setEnv("NODE_ENV", "production");
    const strong = "s".repeat(JWT_SECRET_MIN_LENGTH);
    setEnv("JWT_SECRET", strong);
    expect(new TextDecoder().decode(resolveJwtSecret())).toBe(strong);
  });
});

describe("fail-fast propagation", () => {
  it("generateToken refuses to sign without a production secret", async () => {
    setEnv("NODE_ENV", "production");
    setEnv("JWT_SECRET", undefined);
    await expect(generateToken(payload)).rejects.toThrow(/JWT_SECRET/);
  });

  it("verifyToken surfaces misconfiguration instead of swallowing it", async () => {
    setEnv("NODE_ENV", "production");
    setEnv("JWT_SECRET", undefined);
    await expect(verifyToken("any-token")).rejects.toThrow(/JWT_SECRET/);
  });

  it("verifyToken returns null for an invalid token", async () => {
    setEnv("NODE_ENV", "test");
    setEnv("JWT_SECRET", "a-local-development-secret");
    (jwtVerify as jest.Mock).mockRejectedValueOnce(new Error("bad signature"));
    await expect(verifyToken("tampered")).resolves.toBeNull();
  });

  it("verifyToken maps a valid token to JWTPayload", async () => {
    setEnv("NODE_ENV", "test");
    setEnv("JWT_SECRET", "a-local-development-secret");
    (jwtVerify as jest.Mock).mockResolvedValueOnce({ payload });
    await expect(verifyToken("valid")).resolves.toMatchObject(payload);
  });
});
