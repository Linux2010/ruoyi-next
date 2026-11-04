import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/auth/rbac";
import { verifyPassword } from "@/lib/auth/password";
import { generateToken, getCookieOptions, JWTPayload, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { code: 400, msg: "用户名和密码不能为空" },
        { status: 400 }
      );
    }

    // Find user
    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { code: 401, msg: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password || "");
    if (!passwordValid) {
      return NextResponse.json(
        { code: 401, msg: "用户名或密码错误" },
        { status: 401 }
      );
    }

    // Get user roles and permissions
    const { getUserRoles, getUserPermissions } = await import("@/lib/auth/rbac");
    const roles = await getUserRoles(Number(user.user_id));
    const permissions = await getUserPermissions(Number(user.user_id));

    // Generate JWT
    const payload: JWTPayload = {
      userId: Number(user.user_id),
      userName: user.user_name || "",
      roles,
      permissions,
    };
    const token = await generateToken(payload);

    // Update login info
    const clientIp = request.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.sys_user.update({
      where: { user_id: user.user_id },
      data: {
        login_date: new Date(),
        login_ip: clientIp,
      },
    });

    // Record login log
    try {
      await prisma.sys_logininfor.create({
        data: {
          user_name: user.user_name || "",
          ipaddr: clientIp,
          login_location: "本地",
          browser: "",
          os: "",
          status: "0",
          msg: "登录成功",
          login_time: new Date(),
        },
      });
    } catch {
      // Ignore logging errors
    }

    // Set cookie and return
    const response = NextResponse.json({
      code: 200,
      msg: "登录成功",
      token,
      user: {
        userId: Number(user.user_id),
        userName: user.user_name,
        nickName: user.nick_name,
        avatar: user.avatar,
        roles,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions());

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { code: 500, msg: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
