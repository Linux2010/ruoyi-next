import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/permissions?roleId=<id>
 * Returns all menus and which ones are assigned to the role.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    // Get all menus (type M=directory, C=menu)
    const allMenus = await prisma.sys_menu.findMany({
      where: {
        menu_type: { in: ["M", "C"] },
        status: "0",
      },
      orderBy: [{ parent_id: "asc" }, { order_num: "asc" }],
      select: {
        menu_id: true,
        menu_name: true,
        parent_id: true,
        path: true,
        component: true,
        perms: true,
        icon: true,
        order_num: true,
        menu_type: true,
      },
    });

    let assignedMenuIds: bigint[] = [];

    if (roleId) {
      // Get assigned menu ids for this role
      const assigned = await prisma.$queryRaw<Array<{ menu_id: bigint }>>`
        SELECT menu_id FROM sys_role_menu WHERE role_id = ${BigInt(roleId)}
      `;
      assignedMenuIds = assigned.map((r) => r.menu_id);
    }

    // Build response with assignment status
    const menus = allMenus.map((m) => ({
      menuId: Number(m.menu_id),
      menuName: m.menu_name,
      parentId: Number(m.parent_id),
      path: m.path,
      component: m.component,
      perms: m.perms || "",
      icon: m.icon,
      orderNum: m.order_num,
      menuType: m.menu_type,
      assigned: assignedMenuIds.includes(m.menu_id),
    }));

    return NextResponse.json({ menus, totalAssigned: assignedMenuIds.length });
  } catch (error) {
    console.error("GET permissions error:", error);
    return NextResponse.json({ error: "获取权限失败" }, { status: 500 });
  }
}

/**
 * POST /api/auth/permissions
 * Body: { roleId: number, menuIds: number[] }
 *
 * Save role-menu bindings. Replaces all existing bindings for the role.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, menuIds } = body;

    if (!roleId) {
      return NextResponse.json({ error: "缺少角色ID" }, { status: 400 });
    }

    if (!Array.isArray(menuIds)) {
      return NextResponse.json({ error: "menuIds 必须为数组" }, { status: 400 });
    }

    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete existing bindings
      await tx.$executeRaw`
        DELETE FROM sys_role_menu WHERE role_id = ${BigInt(roleId)}
      `;

      // Create new bindings
      for (const menuId of menuIds) {
        await tx.$executeRaw`
          INSERT INTO sys_role_menu (role_id, menu_id) VALUES (${BigInt(roleId)}, ${BigInt(menuId)})
        `;
      }
    });

    return NextResponse.json({
      success: true,
      assignedCount: menuIds.length,
    });
  } catch (error) {
    console.error("POST permissions error:", error);
    return NextResponse.json({ error: "保存权限失败" }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/permissions?roleId=<id>
 * Remove all menu bindings for a role.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json({ error: "缺少角色ID" }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM sys_role_menu WHERE role_id = ${BigInt(roleId)}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE permissions error:", error);
    return NextResponse.json({ error: "删除权限失败" }, { status: 500 });
  }
}
