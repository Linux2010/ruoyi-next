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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface User {
  id: number; userName: string; nickName: string; email: string; phone: string;
  sex: string; status: string; roles: string[]; createTime: string; remark: string;
}

interface Role {
  id: number; roleName: string; roleKey: string; roleSort: number;
  status: string; remark: string;
}

const STATUS_LABELS: Record<string, string> = { "0": "正常", "1": "停用" };
const SEX_LABELS: Record<string, string> = { "0": "男", "1": "女", "2": "未知" };

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ userName: "", nickName: "", password: "", email: "", phone: "", status: "0", roles: [] as string[] });

  const { data: roles } = useQuery<Role[]>({ queryKey: ["roles"], queryFn: async () => {
    const d = await fetch("/api/auth/roles").then(r => r.json());
    return Array.isArray(d) ? d : d.list;
  } });

  const { data, isLoading } = useQuery<{ list: User[]; total: number; page: number }>({
    queryKey: ["users", page, keyword],
    queryFn: () => fetch(`/api/auth/users?page=${page}&pageSize=15&keyword=${keyword}`).then(r => r.json()),
  });

  const handleOpenNew = () => {
    setEditUser(null);
    setForm({ userName: "", nickName: "", password: "", email: "", phone: "", status: "0", roles: [] });
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditUser(user);
    setForm({ userName: user.userName, nickName: user.nickName, password: "", email: user.email || "", phone: user.phone || "", status: user.status, roles: user.roles });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.userName) { toast.warning("请输入用户名"); return; }
    if (!editUser && !form.password) { toast.warning("请输入密码"); return; }

    const url = editUser ? `/api/auth/users/${editUser.id}` : "/api/auth/users";
    const response = await fetch(url, {
      method: editUser ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUser
        ? { nickName: form.nickName, email: form.email, phone: form.phone, status: form.status, roles: form.roles, password: form.password || undefined }
        : { userName: form.userName, nickName: form.nickName, password: form.password, email: form.email, phone: form.phone, status: form.status, roles: form.roles }),
    });
    const d = await response.json();
    if (d.success) {
      toast.success(editUser ? "用户已更新" : "用户已创建");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } else {
      toast.warning(d.error || "操作失败");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除用户「${name}」吗？`)) return;
    await fetch(`/api/auth/users/${id}`, { method: "DELETE" });
    toast.success("用户已删除");
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const totalPages = Math.ceil((data?.total || 0) / 15);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用户管理</h1>
          <p className="text-muted-foreground mt-1">管理系统用户及角色分配</p>
        </div>
        <Button onClick={handleOpenNew}><Plus className="mr-2 h-4 w-4" />新增用户</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索用户名/昵称/手机号..." value={keyword} onChange={e => { setKeyword(e.target.value); setPage(1); }} className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>昵称</TableHead>
                    <TableHead>手机号</TableHead>
                    <TableHead>性别</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="w-24">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.list.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.userName}</TableCell>
                      <TableCell>{u.nickName}</TableCell>
                      <TableCell>{u.phone || "-"}</TableCell>
                      <TableCell>{SEX_LABELS[u.sex] || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.map(r => <span key={r} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{r}</span>)}
                          {u.roles.length === 0 && <span className="text-xs text-muted-foreground">无角色</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs ${u.status === "0" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {STATUS_LABELS[u.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{u.createTime ? new Date(u.createTime).toLocaleDateString("zh-CN") : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(u)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(u.id, u.userName)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.list || data.list.length === 0) && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无用户数据</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">共 {data?.total || 0} 条</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm leading-8">{page} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editUser ? "编辑用户" : "新增用户"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>用户名</Label><Input value={form.userName} onChange={e => setForm({ ...form, userName: e.target.value })} disabled={!!editUser} placeholder="登录用户名" /></div>
            <div><Label>密码 {editUser && <span className="text-xs text-muted-foreground">(留空不修改)</span>}</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editUser ? "留空则不修改密码" : "必填"} /></div>
            <div><Label>昵称</Label><Input value={form.nickName} onChange={e => setForm({ ...form, nickName: e.target.value })} placeholder="显示名称" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>邮箱</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email" /></div>
              <div><Label>手机号</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="手机号" /></div>
            </div>
            <div><Label>状态</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="0">正常</SelectItem><SelectItem value="1">停用</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>角色</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {roles?.map(r => (
                  <label key={r.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border ${form.roles.includes(r.roleKey) ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}>
                    <input type="checkbox" className="sr-only" checked={form.roles.includes(r.roleKey)}
                      onChange={e => setForm({ ...form, roles: e.target.checked ? [...form.roles, r.roleKey] : form.roles.filter(k => k !== r.roleKey) })} />
                    {r.roleName}
                  </label>
                ))}
                {(!roles || roles.length === 0) && <span className="text-xs text-muted-foreground">暂无可用角色</span>}
              </div>
            </div>
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
