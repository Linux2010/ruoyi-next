"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Shield } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface Role {
  id: number; roleName: string; roleKey: string; roleSort: number;
  status: string; remark: string; createTime: string;
}

const STATUS_LABELS: Record<string, string> = { "0": "正常", "1": "停用" };

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ roleName: "", roleKey: "", roleSort: "0", status: "0", remark: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading } = useQuery<{ list: Role[]; total: number }>({
    queryKey: ["roles", page, pageSize],
    queryFn: () => fetch(`/api/auth/roles?page=${page}&pageSize=${pageSize}`).then(r => r.json()),
  });

  const roles = data?.list ?? [];
  const total = data?.total ?? 0;

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const handleOpenNew = () => {
    setEditRole(null);
    setForm({ roleName: "", roleKey: "", roleSort: "0", status: "0", remark: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditRole(role);
    setForm({ roleName: role.roleName, roleKey: role.roleKey, roleSort: String(role.roleSort), status: role.status, remark: role.remark || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.roleName || !form.roleKey) { toast.warning("请填写角色名称和权限字符"); return; }

    const url = editRole ? `/api/auth/roles?id=${editRole.id}` : "/api/auth/roles";
    const response = await fetch(url, {
      method: editRole ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, roleSort: parseInt(form.roleSort) || 0 }),
    });
    const d = await response.json();
    if (d.success) {
      toast.success(editRole ? "角色已更新" : "角色已创建");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    } else {
      toast.warning(d.error || "操作失败");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除角色「${name}」吗？`)) return;
    await fetch(`/api/auth/roles?id=${id}`, { method: "DELETE" });
    toast.success("角色已删除");
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">角色管理</h1>
          <p className="text-muted-foreground mt-1">管理角色及权限标识</p>
        </div>
        <Button onClick={handleOpenNew}><Plus className="mr-2 h-4 w-4" />新增角色</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>角色名称</TableHead>
                  <TableHead>权限字符</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />{r.roleName}
                    </TableCell>
                    <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.roleKey}</code></TableCell>
                    <TableCell>{r.roleSort}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs ${r.status === "0" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.remark || "-"}</TableCell>
                    <TableCell className="text-xs">{r.createTime ? new Date(r.createTime).toLocaleDateString("zh-CN") : "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(r.id, r.roleName)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!roles || roles.length === 0) && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无角色数据</TableCell></TableRow>
                )}
              </TableBody>
              </Table>
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
              />
            </>
            )}
          </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRole ? "编辑角色" : "新增角色"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>角色名称</Label><Input value={form.roleName} onChange={e => setForm({ ...form, roleName: e.target.value })} placeholder="如：普通用户" /></div>
            <div><Label>权限字符</Label><Input value={form.roleKey} onChange={e => setForm({ ...form, roleKey: e.target.value })} disabled={!!editRole} placeholder="如：common" />
              <p className="text-xs text-muted-foreground mt-1">系统内部标识，创建后不可修改。admin 为超级管理员</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>排序</Label><Input type="number" value={form.roleSort} onChange={e => setForm({ ...form, roleSort: e.target.value })} /></div>
              <div><Label>状态</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="0">正常</SelectItem><SelectItem value="1">停用</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>备注</Label><Input value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} placeholder="可选" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
