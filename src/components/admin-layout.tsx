"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
  Users,
  Lock,
  Server,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MODULES } from "@/lib/modules";

/** 菜单由模块注册表生成：新增模块无需改布局代码 */
const ALL_MENU_ITEMS = [
  { name: "首页", href: "/", icon: LayoutDashboard, permission: null },
  {
    name: "系统管理",
    icon: Shield,
    permission: null,
    children: [
      { name: "用户管理", href: "/admin/users", icon: Users, permission: null },
      { name: "角色管理", href: "/admin/roles", icon: Shield, permission: null },
      { name: "权限管理", href: "/admin/permissions", icon: Lock, permission: null },
      { name: "个人中心", href: "/admin/profile", icon: UserIcon, permission: null },
    ],
  },
  {
    name: "注册模块",
    icon: Database,
    permission: null,
    children: MODULES.map((m) => ({
      name: m.label,
      href: `/admin/${m.resource}`,
      icon: Server,
      permission: null,
    })),
  },
];

interface UserInfo {
  userId: number;
  userName: string;
  nickName: string;
  avatar: string;
  roles: string[];
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["系统管理"]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/auth/info");
        if (response.ok) {
          const data = await response.json();
          if (data.code === 200) {
            setUser(data.user);
            setPermissions(data.permissions || []);
          }
        }
      } catch {
        // Silently fail: the layout still renders with public menus.
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const owner = ALL_MENU_ITEMS.find((item) =>
      "children" in item &&
      item.children?.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"))
    );
    if (owner) {
      setExpandedMenus((prev) =>
        prev.includes(owner.name) ? prev : [...prev, owner.name]
      );
    }
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isParentActive = (children: { href: string }[]) =>
    children.some((child) =>
      child.href === "/" ? pathname === "/" : pathname === child.href || pathname.startsWith(child.href + "/")
    );

  const hasPerm = (perm: string | null) => {
    if (!perm) return true;
    if (permissions.includes("*:*:*")) return true;
    return permissions.some((p) => {
      if (p === perm) return true;
      const a = p.split(":");
      const b = perm.split(":");
      return a.length === b.length && a.every((part, i) => part === "*" || part === b[i]);
    });
  };

  const filteredMenus = ALL_MENU_ITEMS.map((item) => {
    if ("children" in item && item.children) {
      const children = item.children.filter((c) => hasPerm(c.permission));
      return children.length === 0 ? null : { ...item, children };
    }
    return hasPerm(item.permission) ? item : null;
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/" className="text-xl font-bold">RuoYi Next</Link>
          {user && <span className="text-sm">{user.nickName}</span>}
        </div>
      </header>

      <div className="flex">
        <aside
          className={`fixed md:sticky top-0 left-0 z-40 flex h-dvh w-64 flex-col border-r bg-background transition-transform md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="hidden md:flex h-14 items-center justify-between border-b px-4">
            <Link href="/" className="text-xl font-bold">RuoYi Next</Link>
            <ThemeSwitcher />
          </div>

          {user && (
            <div className="hidden md:flex items-center gap-3 border-b px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user.nickName}</div>
                <div className="text-xs text-muted-foreground">{user.roles.join(", ")}</div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleLogout} title="退出登录">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}

          <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-4">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
            ) : (
              <ul className="space-y-1">
                {filteredMenus.map((item: any) => (
                  <li key={item.name}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        {item.name}
                      </Link>
                    ) : (
                      <div>
                        <button
                          onClick={() =>
                            setExpandedMenus((prev) =>
                              prev.includes(item.name)
                                ? prev.filter((n) => n !== item.name)
                                : [...prev, item.name]
                            )
                          }
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            isParentActive(item.children || []) ? "bg-muted font-medium" : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.icon && <item.icon className="h-4 w-4" />}
                            {item.name}
                          </div>
                          {expandedMenus.includes(item.name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {expandedMenus.includes(item.name) && item.children && (
                          <ul className="mt-1 ml-4 space-y-1 border-l pl-4">
                            {item.children.map((child: any) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                    pathname === child.href || pathname.startsWith(child.href + "/")
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted"
                                  }`}
                                >
                                  {child.icon && <child.icon className="h-4 w-4" />}
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="min-h-screen flex-1">
          <div className="container mx-auto px-4 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
