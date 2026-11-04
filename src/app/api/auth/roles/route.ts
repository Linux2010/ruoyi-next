import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List roles (paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20));

    const where = { del_flag: "0" };
    const [roles, total] = await Promise.all([
      prisma.sys_role.findMany({
        where,
        select: {
          role_id: true, role_name: true, role_key: true,
          role_sort: true, status: true, remark: true, create_time: true,
        },
        orderBy: { role_sort: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sys_role.count({ where }),
    ]);

    const list = roles.map((r) => ({
      id: Number(r.role_id),
      roleName: r.role_name,
      roleKey: r.role_key,
      roleSort: r.role_sort,
      status: r.status,
      remark: r.remark,
      createTime: r.create_time,
    }));

    return NextResponse.json({ list, total, page, pageSize });
  } catch (error) {
    console.error("GET auth/roles error:", error);
    return NextResponse.json({ error: "获取角色列表失败" }, { status: 500 });
  }
}

// POST - Create role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleName, roleKey, roleSort, status, remark } = body;
    if (!roleName || !roleKey) {
      return NextResponse.json({ error: "角色名称和权限字符必填" }, { status: 400 });
    }

    const exists = await prisma.sys_role.findFirst({ where: { role_key: roleKey } });
    if (exists) {
      return NextResponse.json({ error: "权限字符已存在" }, { status: 409 });
    }

    const role = await prisma.sys_role.create({
      data: {
        role_name: roleName, role_key: roleKey,
        role_sort: roleSort || 0, status: status || "0", del_flag: "0", remark: remark || "",
        create_time: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: Number(role.role_id) });
  } catch (error) {
    console.error("POST auth/roles error:", error);
    return NextResponse.json({ error: "创建角色失败" }, { status: 500 });
  }
}

// PUT - Update role
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少角色ID" }, { status: 400 });

    const body = await request.json();
    const { roleName, roleKey, roleSort, status, remark } = body;

    const data: Record<string, unknown> = { update_time: new Date() };
    if (roleName !== undefined) data.role_name = roleName;
    if (roleKey !== undefined) data.role_key = roleKey;
    if (roleSort !== undefined) data.role_sort = roleSort;
    if (status !== undefined) data.status = status;
    if (remark !== undefined) data.remark = remark;

    await prisma.sys_role.update({ where: { role_id: BigInt(id) }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT auth/roles error:", error);
    return NextResponse.json({ error: "更新角色失败" }, { status: 500 });
  }
}

// DELETE - Soft delete role
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少角色ID" }, { status: 400 });

    await prisma.sys_role.update({
      where: { role_id: BigInt(id) },
      data: { del_flag: "1", update_time: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE auth/roles error:", error);
    return NextResponse.json({ error: "删除角色失败" }, { status: 500 });
  }
}
