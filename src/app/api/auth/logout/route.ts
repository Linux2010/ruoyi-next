import { NextRequest, NextResponse } from "next/server";
import { getCookieOptions, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    code: 200,
    msg: "退出成功",
  });

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });

  return response;
}
