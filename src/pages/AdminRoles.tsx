import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Plus, Trash2, Edit, UserCheck } from "lucide-react";
import { toast } from "sonner";

const ALL_PERMISSIONS = [
  "users.view", "users.edit", "users.delete", "users.ban",
  "products.view", "products.edit", "products.delete",
  "orders.view", "orders.edit", "orders.refund",
  "tickets.view", "tickets.edit", "tickets.close",
  "analytics.view", "reports.view",
  "settings.view", "settings.edit",
  "affiliates.view", "affiliates.manage",
  "subscriptions.view", "subscriptions.manage",
  "system.logs", "system.backup",
];

export default function AdminRoles() {
  const utils = trpc.useUtils();
  const { data, refetch } = trpc.admin.listAdminRoles.useQuery();
  const { data: users } = trpc.admin.listUsers.useQuery({ page: 1, limit: 100 });

  const [showCreate, setShowCreate] = useState(false);
  const [editRole, setEditRole] = useState<any>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleValue, setAssignRoleValue] = useState<"admin" | "seller" | "customer">("seller");

  const create = trpc.admin.createAdminRole.useMutation({
    onSuccess: () => { refetch(); setShowCreate(false); setName(""); setDescription(""); setPermissions([]); toast.success("Rolle erstellt"); }
  });
  const update = trpc.admin.updateAdminRole.useMutation({
    onSuccess: () => { refetch(); setEditRole(null); toast.success("Rolle aktualisiert"); }
  });
  const deleteRole = trpc.admin.deleteAdminRole.useMutation({
    onSuccess: () => { refetch(); toast.success("Rolle gelöscht"); }
  });
  const assignRole = trpc.admin.assignRole.useMutation({
    onSuccess: () => { setShowAssign(false); toast.success("Rolle zugewiesen"); }
  });

  const togglePerm = (p: string) => setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const openEdit = (role: any) => {
    setEditRole(role);
    setName(role.name);
    setDescription(role.description ?? "");
    setPermissions(JSON.parse(role.permissions ?? "[]"));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-400" /> Admin-Rollen
            </h1>
            <p className="text-gray-400 text-sm mt-1">Rollen und Berechtigungen verwalten</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAssign(true)} variant="outline" className="border-gray-700 text-gray-300">
              <UserCheck className="w-4 h-4 mr-2" /> Rolle zuweisen
            </Button>
            <Button onClick={() => { setShowCreate(true); setName(""); setDescription(""); setPermissions([]); }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Neue Rolle
            </Button>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Rolle</TableHead>
                  <TableHead className="text-gray-400">Beschreibung</TableHead>
                  <TableHead className="text-gray-400">Berechtigungen</TableHead>
                  <TableHead className="text-gray-400">Erstellt</TableHead>
                  <TableHead className="text-gray-400 text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map(role => (
                  <TableRow key={role.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="text-white font-medium">{role.name}</TableCell>
                    <TableCell className="text-gray-400 text-sm">{role.description ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(JSON.parse(role.permissions ?? "[]") as string[]).slice(0, 3).map(p => (
                          <span key={p} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">{p}</span>
                        ))}
                        {(JSON.parse(role.permissions ?? "[]") as string[]).length > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">
                            +{(JSON.parse(role.permissions ?? "[]") as string[]).length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {new Date(role.createdAt!).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300" onClick={() => openEdit(role)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300"
                          onClick={() => { if (confirm("Rolle löschen?")) deleteRole.mutate({ id: role.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data || data.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Keine Rollen gefunden</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Erstellen Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="w-[calc(100vw-1rem)] sm:w-full bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader><DialogTitle>Neue Admin-Rolle erstellen</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Rollenname" value={name} onChange={e => setName(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
              <Input placeholder="Beschreibung (optional)" value={description} onChange={e => setDescription(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
              <div>
                <p className="text-gray-400 text-sm mb-2">Berechtigungen auswählen:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePerm(p)} className="rounded border-gray-600" />
                      <span className="text-gray-300 text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="border-gray-700 text-gray-300">Abbrechen</Button>
                <Button onClick={() => create.mutate({ name, description, permissions })} disabled={!name || create.isPending} className="bg-purple-600 hover:bg-purple-700">Erstellen</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bearbeiten Dialog */}
        <Dialog open={editRole !== null} onOpenChange={() => setEditRole(null)}>
          <DialogContent className="w-[calc(100vw-1rem)] sm:w-full bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader><DialogTitle>Rolle bearbeiten</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Rollenname" value={name} onChange={e => setName(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
              <Input placeholder="Beschreibung (optional)" value={description} onChange={e => setDescription(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
              <div>
                <p className="text-gray-400 text-sm mb-2">Berechtigungen:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePerm(p)} className="rounded border-gray-600" />
                      <span className="text-gray-300 text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditRole(null)} className="border-gray-700 text-gray-300">Abbrechen</Button>
                <Button onClick={() => update.mutate({ id: editRole.id, name, description, permissions })} disabled={!name || update.isPending} className="bg-blue-600 hover:bg-blue-700">Speichern</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rolle zuweisen Dialog */}
        <Dialog open={showAssign} onOpenChange={setShowAssign}>
          <DialogContent className="w-[calc(100vw-1rem)] sm:w-full bg-gray-900 border-gray-800 text-white">
            <DialogHeader><DialogTitle>Rolle einem Nutzer zuweisen</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wider">Nutzer</Label>
                <Select value={assignUserId} onValueChange={setAssignUserId}>
                  <SelectTrigger className="mt-1.5 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Nutzer auswählen..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {(users?.items ?? []).map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)} className="text-white">{u.name ?? u.email} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wider">Neue Rolle</Label>
                <Select value={assignRoleValue} onValueChange={(v) => setAssignRoleValue(v as any)}>
                  <SelectTrigger className="mt-1.5 bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="admin" className="text-white">Admin</SelectItem>
                    <SelectItem value="seller" className="text-white">Verkäufer</SelectItem>
                    <SelectItem value="customer" className="text-white">Kunde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAssign(false)} className="border-gray-700 text-gray-300">Abbrechen</Button>
                <Button onClick={() => assignRole.mutate({ id: parseInt(assignUserId), role: assignRoleValue })}
                  disabled={!assignUserId || assignRole.isPending} className="bg-purple-600 hover:bg-purple-700">
                  <UserCheck className="w-4 h-4 mr-2" /> Zuweisen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
