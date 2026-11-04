import { jwtVerify, SignJWT } from "jose";

// In production ALWAYS set JWT_SECRET. The fallback exists only for local development
// and pure-logic tests; shipping it to production would be insecure.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-only-insecure-secret-change-me"
);

const JWT_EXPIRES_IN = "24h";

export interface JWTPayload {
  userId: number;
  userName: string;
  roles: string[];
  permissions: string[];
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    userName: payload.userName,
    roles: payload.roles,
    permissions: payload.permissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as number,
      userName: payload.userName as string,
      roles: (payload.roles as string[]) || [],
      permissions: (payload.permissions as string[]) || [],
    };
  } catch {
    return null;
  }
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 24 * 60 * 60,
  };
}

export const AUTH_COOKIE_NAME = "ruoyi-next-token";
