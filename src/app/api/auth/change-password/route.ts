import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";

// POST /api/auth/change-password —— 修改当前登录用户密码（个人中心）
// Body: { oldPassword, newPassword }
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyToken(token) : null;
    if (!payload) return NextResponse.json({ code: 401, msg: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const oldPassword = (body.oldPassword as string) || "";
    const newPassword = (body.newPassword as string) || "";
    if (newPassword.length < 6) {
      return NextResponse.json({ code: 400, msg: "新密码至少 6 位" }, { status: 400 });
    }

    const row = await prisma.sys_user.findUnique({ where: { user_id: BigInt(payload.userId) } });
    if (!row) return NextResponse.json({ code: 404, msg: "用户不存在" }, { status: 404 });

    const ok = await bcrypt.compare(oldPassword, row.password || "");
    if (!ok) return NextResponse.json({ code: 400, msg: "原密码错误" }, { status: 400 });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.sys_user.update({
      where: { user_id: BigInt(payload.userId) },
      data: { password: hashed, pwd_update_date: new Date(), update_time: new Date() },
    });
    return NextResponse.json({ code: 200, msg: "密码修改成功" });
  } catch (e) {
    console.error("change-password error:", e);
    return NextResponse.json({ code: 500, msg: "修改失败" }, { status: 500 });
  }
}
