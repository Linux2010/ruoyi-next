import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET - List users with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const keyword = searchParams.get("keyword") || "";

    const where: Record<string, unknown> = { del_flag: "0" };
    if (keyword) {
      where.OR = [
        { user_name: { contains: keyword } },
        { nick_name: { contains: keyword } },
        { phonenumber: { contains: keyword } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.sys_user.findMany({
        where,
        select: {
          user_id: true,
          user_name: true,
          nick_name: true,
          email: true,
          phonenumber: true,
          sex: true,
          status: true,
          create_time: true,
          remark: true,
        },
        orderBy: { create_time: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sys_user.count({ where }),
    ]);

    // Load roles for each user
    const userIds = users.map(u => u.user_id);
    const userRoles = userIds.length > 0 ? await prisma.$queryRawUnsafe<Array<{ user_id: bigint; role_key: string }>>(
      `SELECT u.user_id, r.role_key
       FROM sys_user u
       LEFT JOIN sys_user_role ur ON u.user_id = ur.user_id
       LEFT JOIN sys_role r ON ur.role_id = r.role_id AND r.del_flag = '0'
       WHERE u.user_id IN (${userIds.map(() => '?').join(',')})`,
      ...userIds.map(id => id)
    ) : [];

    const roleMap: Record<string, string[]> = {};
    for (const row of userRoles) {
      const uid = String(row.user_id);
      if (!roleMap[uid]) roleMap[uid] = [];
      if (row.role_key) roleMap[uid].push(row.role_key);
    }

    const list = users.map((u) => ({
      id: Number(u.user_id),
      userName: u.user_name,
      nickName: u.nick_name,
      email: u.email,
      phone: u.phonenumber,
      sex: u.sex,
      status: u.status,
      roles: roleMap[String(u.user_id)] || [],
      createTime: u.create_time,
      remark: u.remark,
    }));

    return NextResponse.json({ list, total, page, pageSize });
  } catch (error) {
    console.error("GET auth/users error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

// POST - Create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, nickName, password, email, phone, status, roles } = body;

    if (!userName || !password) {
      return NextResponse.json({ error: "用户名和密码必填" }, { status: 400 });
    }

    // Check unique
    const exists = await prisma.sys_user.findFirst({ where: { user_name: userName } });
    if (exists) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const user = await prisma.sys_user.create({
      data: {
        user_name: userName,
        nick_name: nickName || userName,
        password: hashedPwd,
        email: email || "",
        phonenumber: phone || "",
        status: status || "0",
        del_flag: "0",
        create_time: new Date(),
        pwd_update_date: new Date(),
      },
    });

    // Assign roles
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const roleRecords = await prisma.sys_role.findMany({
        where: { role_key: { in: roles }, del_flag: "0" },
      });
      for (const r of roleRecords) {
        await prisma.sys_user_role.create({
          data: { user_id: user.user_id, role_id: r.role_id },
        });
      }
    }

    return NextResponse.json({ success: true, id: Number(user.user_id) });
  } catch (error) {
    console.error("POST auth/users error:", error);
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
  }
}
