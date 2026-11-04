"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Save, Loader2, FolderOpen, FileText, MousePointer } from "lucide-react";

interface Role {
  id: number; roleName: string; roleKey: string; roleSort: number;
  status: string; remark: string;
}

interface MenuItem {
  menuId: number;
  menuName: string;
  parentId: number;
  perms: string;
  icon: string;
  orderNum: number;
  menuType: string; // M=目录, C=菜单, F=按钮
  assigned: boolean;
}

function getMenuTypeIcon(type: string) {
  switch (type) {
    case "M": return <FolderOpen className="h-3.5 w-3.5" />;
    case "C": return <FileText className="h-3.5 w-3.5" />;
    case "F": return <MousePointer className="h-3.5 w-3.5" />;
    default: return null;
  }
}

function getMenuTypeLabel(type: string) {
  switch (type) {
    case "M": return "目录";
    case "C": return "菜单";
    case "F": return "按钮";
    default: return type;
  }
}

// Recursive menu tree node component
function MenuTreeNode({
  menu,
  allMenus,
  checkedMenuIds,
  onToggle,
  depth = 0,
}: {
  menu: MenuItem;
  allMenus: MenuItem[];
  checkedMenuIds: Set<number>;
  onToggle: (menuId: number) => void;
  depth: number;
}) {
  const children = allMenus.filter((m) => m.parentId === menu.menuId && m.menuType !== "F");
  const buttonChildren = allMenus.filter((m) => m.parentId === menu.menuId && m.menuType === "F");
  const allChildren = [...children, ...buttonChildren];
  const isFolder = menu.menuType === "M";

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 ${isFolder ? "font-medium" : ""}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <input
          type="checkbox"
          checked={checkedMenuIds.has(menu.menuId)}
          onChange={() => onToggle(menu.menuId)}
          id={`menu-${menu.menuId}`}
          className="rounded w-4 h-4"
        />
        <label htmlFor={`menu-${menu.menuId}`} className="flex items-center gap-1.5 flex-1 cursor-pointer text-sm">
          <span className="text-muted-foreground">{getMenuTypeIcon(menu.menuType)}</span>
          <span>{menu.menuName}</span>
          {menu.perms && (
            <code className="text-xs px-1 py-0.5 rounded bg-muted text-muted-foreground ml-1">{menu.perms}</code>
          )}
          {!isFolder && (
            <span className="text-xs text-muted-foreground ml-auto">{getMenuTypeLabel(menu.menuType)}</span>
          )}
        </label>
      </div>
      {allChildren.length > 0 && (
        <div>
          {/* Separate: folder children (directories + menus) and button children */}
          {children.map((child) => (
            <MenuTreeNode
              key={child.menuId}
              menu={child}
              allMenus={allMenus}
              checkedMenuIds={checkedMenuIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
          {buttonChildren.map((btn) => (
            <div
              key={btn.menuId}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50"
              style={{ paddingLeft: `${(depth + 1) * 20 + 8}px` }}
            >
              <input
                type="checkbox"
                checked={checkedMenuIds.has(btn.menuId)}
                onChange={() => onToggle(btn.menuId)}
                id={`menu-${btn.menuId}`}
                className="rounded w-4 h-4"
              />
              <label htmlFor={`menu-${btn.menuId}`} className="flex items-center gap-1.5 flex-1 cursor-pointer text-xs text-muted-foreground">
                <span>{getMenuTypeIcon("F")}</span>
                <span>{btn.menuName}</span>
                {btn.perms && <code className="text-xs px-1 py-0.5 rounded bg-muted">{btn.perms}</code>}
                <span className="ml-auto">{getMenuTypeLabel("F")}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [checkedMenuIds, setCheckedMenuIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => fetch("/api/auth/roles").then((r) => r.json()),
  });

  // Fetch menus with assignment status
  const { data: menusData, isLoading: menusLoading } = useQuery<{
    menus: MenuItem[];
    totalAssigned: number;
  }>({
    queryKey: ["permissions", selectedRole?.id],
    queryFn: async () => {
      if (!selectedRole) return { menus: [], totalAssigned: 0 };
      const res = await fetch(`/api/auth/permissions?roleId=${selectedRole.id}`);
      return res.json();
    },
    enabled: !!selectedRole,
  });

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setCheckedMenuIds(new Set());
  };

  // Sync checked IDs when menu data loads for the selected role
  const menus = menusData?.menus || [];

  useEffect(() => {
    if (menus.length > 0 && selectedRole) {
      const assigned = menus.filter((m) => m.assigned).map((m) => m.menuId);
      setCheckedMenuIds(new Set(assigned));
    }
  // 依赖仅取角色 id 与查询结果对象，避免 menus 每次渲染生成新数组导致循环
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole?.id, menusData]);

  const handleToggleMenu = (menuId: number) => {
    setCheckedMenuIds((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!menus.length) return;
    const allIds = menus.map((m) => m.menuId);
    setCheckedMenuIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setCheckedMenuIds(new Set());
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: selectedRole.id,
          menuIds: Array.from(checkedMenuIds),
        }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`已为「${selectedRole.roleName}」保存 ${d.assignedCount} 个权限`);
        queryClient.invalidateQueries({ queryKey: ["permissions"] });
      } else {
        toast.error(d.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // Build menu tree: top-level items (parentId === 0)
  const topLevelMenus = menus.filter((m) => m.parentId === 0);

  const activeRoleCount = roles?.filter((r) => r.status === "0").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          权限管理
        </h1>
        <p className="text-muted-foreground mt-1">
          配置角色可访问的菜单和按钮权限
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Role list */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">角色列表</CardTitle>
              <p className="text-xs text-muted-foreground">{activeRoleCount} 个活跃角色</p>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-1">
                  {roles?.map((role) => (
                    <div
                      key={role.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        selectedRole?.id === role.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted"
                      } ${role.status === "1" ? "opacity-50" : ""}`}
                      onClick={() => handleSelectRole(role)}
                    >
                      <div>
                        <div className="text-sm">{role.roleName}</div>
                        <div className="text-xs text-muted-foreground">{role.roleKey}</div>
                      </div>
                      {role.status === "1" && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">停用</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Menu tree */}
        <div className="col-span-9">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedRole ? `「${selectedRole.roleName}」的菜单权限` : "请选择角色"}
                </CardTitle>
                {selectedRole && (
                  <p className="text-xs text-muted-foreground mt-1">
                    已选中 {checkedMenuIds.size} 个权限
                  </p>
                )}
              </div>
              {selectedRole && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    全选
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    清空
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    保存
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedRole ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>请从左侧选择一个角色来配置其菜单权限</p>
                </div>
              ) : menusLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : menus.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  暂无菜单数据
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
                  {topLevelMenus.map((menu) => (
                    <MenuTreeNode
                      key={menu.menuId}
                      menu={menu}
                      allMenus={menus}
                      checkedMenuIds={checkedMenuIds}
                      onToggle={handleToggleMenu}
                      depth={0}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
