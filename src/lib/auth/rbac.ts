import { prisma } from "@/lib/prisma";

export interface UserInfo {
  userId: number;
  userName: string;
  nickName: string;
  avatar: string;
  roles: string[];
  permissions: string[];
  menus: MenuTreeItem[];
}

export interface MenuTreeItem {
  menuId: number;
  menuName: string;
  parentId: number;
  path: string;
  component: string;
  perms: string;
  icon: string;
  orderNum: number;
  visible: boolean;
  menuType: string; // M=目录 C=菜单 F=按钮
  children?: MenuTreeItem[];
}

/**
 * Get user by username, return null if not found or deleted/disabled
 */
export async function getUserByUsername(username: string) {
  return prisma.sys_user.findFirst({
    where: {
      user_name: username,
      del_flag: "0",
      status: "0", // 0=正常 1=停用
    },
  });
}

/**
 * Get user roles by user ID
 */
export async function getUserRoles(userId: number): Promise<string[]> {
  // Check for admin user directly
  const user = await prisma.sys_user.findFirst({
    where: { user_id: BigInt(userId) },
  });

  if (user?.user_name === "admin") {
    return ["admin"];
  }

  // Get role_ids for this user
  const userRoles = await prisma.$queryRaw<Array<{ role_key: string }>>`
    SELECT r.role_key
    FROM sys_role r
    INNER JOIN sys_user_role ur ON r.role_id = ur.role_id
    WHERE ur.user_id = ${BigInt(userId)}
      AND r.del_flag = '0'
      AND r.status = '0'
  `;

  return userRoles.map((r) => r.role_key).filter(Boolean);
}

/**
 * Get user permissions from roles -> menus -> perms
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  // Check for super admin
  const roles = await getUserRoles(userId);
  if (roles.includes("admin")) {
    return ["*:*:*"];
  }

  const perms = await prisma.$queryRaw<Array<{ perms: string }>>`
    SELECT DISTINCT m.perms
    FROM sys_menu m
    INNER JOIN sys_role_menu rm ON m.menu_id = rm.menu_id
    INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
    WHERE ur.user_id = ${BigInt(userId)}
      AND m.perms IS NOT NULL
      AND m.perms != ''
      AND m.status = '0'
  `;

  return perms.map((r) => r.perms).filter(Boolean);
}

/**
 * Get user menus (visible, enabled, type M or C)
 */
export async function getUserMenus(userId: number): Promise<MenuTreeItem[]> {
  // Super admin gets all menus
  const roles = await getUserRoles(userId);
  const isAdmin = roles.includes("admin");

  let query: string;
  let params: any[];

  if (isAdmin) {
    query = `
      SELECT m.menu_id, m.menu_name, m.parent_id, m.path,
             m.component, m.perms, m.icon, m.order_num, m.menu_type
      FROM sys_menu m
      WHERE m.menu_type IN ('M', 'C')
        AND m.visible = '0'
        AND m.status = '0'
      ORDER BY m.parent_id, m.order_num
    `;
    params = [];
  } else {
    query = `
      SELECT DISTINCT m.menu_id, m.menu_name, m.parent_id, m.path,
             m.component, m.perms, m.icon, m.order_num, m.menu_type
      FROM sys_menu m
      INNER JOIN sys_role_menu rm ON m.menu_id = rm.menu_id
      INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id
      WHERE ur.user_id = ?
        AND m.menu_type IN ('M', 'C')
        AND m.visible = '0'
        AND m.status = '0'
      ORDER BY m.parent_id, m.order_num
    `;
    params = [BigInt(userId)];
  }

  const menus = await prisma.$queryRawUnsafe<Array<{
    menu_id: bigint;
    menu_name: string;
    parent_id: bigint;
    path: string;
    component: string;
    perms: string | null;
    icon: string;
    order_num: number;
    menu_type: string;
  }>>(query, ...params);

  const flatMenus: MenuTreeItem[] = menus.map((m) => ({
    menuId: Number(m.menu_id),
    menuName: m.menu_name,
    parentId: Number(m.parent_id),
    path: m.path,
    component: m.component,
    perms: m.perms || "",
    icon: m.icon,
    orderNum: m.order_num,
    visible: true,
    menuType: m.menu_type,
  }));

  // Build tree
  return buildMenuTree(flatMenus);
}

function buildMenuTree(menus: MenuTreeItem[], parentId = 0): MenuTreeItem[] {
  const children = menus
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.orderNum - b.orderNum);

  return children.map((child) => ({
    ...child,
    children: buildMenuTree(menus, child.menuId),
  }));
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  permissions: string[],
  requiredPerm: string
): boolean {
  if (permissions.includes("*:*:*")) return true;

  return permissions.some((perm) => {
    if (perm === requiredPerm) return true;
    // Support wildcards like "system:*" or "system:user:*"
    const permParts = perm.split(":");
    const reqParts = requiredPerm.split(":");

    if (permParts.length !== reqParts.length) return false;

    return permParts.every(
      (part, i) => part === "*" || part === reqParts[i]
    );
  });
}

/**
 * Get full user info with roles, permissions, and menus
 */
export async function getFullUserInfo(userId: number): Promise<UserInfo> {
  const user = await prisma.sys_user.findUnique({
    where: { user_id: BigInt(userId) },
  });

  if (!user) {
    throw new Error("用户不存在");
  }

  const roles = await getUserRoles(userId);
  const permissions = await getUserPermissions(userId);
  const menus = await getUserMenus(userId);

  return {
    userId: Number(user.user_id),
    userName: user.user_name || "",
    nickName: user.nick_name || "",
    avatar: user.avatar || "",
    roles,
    permissions,
    menus,
  };
}
