import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - User detail
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await prisma.sys_user.findUnique({
      where: { user_id: BigInt(id) },
      select: {
        user_id: true, user_name: true, nick_name: true, email: true,
        phonenumber: true, sex: true, status: true, remark: true, create_time: true,
      },
    });
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const roleRows = await prisma.$queryRaw<Array<{ role_key: string; role_name: string }>>`
      SELECT r.role_key, r.role_name FROM sys_role r
      INNER JOIN sys_user_role ur ON r.role_id = ur.role_id
      WHERE ur.user_id = ${BigInt(id)} AND r.del_flag = '0'
    `;

    return NextResponse.json({
      id: Number(user.user_id), userName: user.user_name, nickName: user.nick_name,
      email: user.email, phone: user.phonenumber, sex: user.sex,
      status: user.status, remark: user.remark, createTime: user.create_time,
      roles: roleRows.map((r) => r.role_key),
    });
  } catch (error) {
    console.error("GET auth/users/[id] error:", error);
    return NextResponse.json({ error: "获取用户失败" }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nickName, email, phone, status, password, roles, remark } = body;

    const data: Record<string, unknown> = { update_time: new Date() };
    if (nickName !== undefined) data.nick_name = nickName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phonenumber = phone;
    if (status !== undefined) data.status = status;
    if (remark !== undefined) data.remark = remark;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
      data.pwd_update_date = new Date();
    }

    await prisma.sys_user.update({ where: { user_id: BigInt(id) }, data });

    // Update roles
    if (roles && Array.isArray(roles)) {
      await prisma.sys_user_role.deleteMany({ where: { user_id: BigInt(id) } });
      const roleRecords = await prisma.sys_role.findMany({
        where: { role_key: { in: roles }, del_flag: "0" },
      });
      for (const r of roleRecords) {
        await prisma.sys_user_role.create({
          data: { user_id: BigInt(id), role_id: r.role_id },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT auth/users/[id] error:", error);
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 });
  }
}

// DELETE - Soft delete user
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.sys_user.update({
      where: { user_id: BigInt(id) },
      data: { del_flag: "1", update_time: new Date() },
    });
    await prisma.sys_user_role.deleteMany({ where: { user_id: BigInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE auth/users/[id] error:", error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
