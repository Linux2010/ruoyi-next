import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { getFullUserInfo } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { code: 401, msg: "未登录" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { code: 401, msg: "登录已过期" },
        { status: 401 }
      );
    }

    const userInfo = await getFullUserInfo(payload.userId);

    return NextResponse.json({
      code: 200,
      user: {
        userId: userInfo.userId,
        userName: userInfo.userName,
        nickName: userInfo.nickName,
        avatar: userInfo.avatar,
        roles: userInfo.roles,
      },
      permissions: userInfo.permissions,
      menus: userInfo.menus,
    });
  } catch (error) {
    console.error("Auth info error:", error);
    return NextResponse.json(
      { code: 500, msg: "获取用户信息失败" },
      { status: 500 }
    );
  }
}
