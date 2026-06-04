import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Plus, Trash2, Edit } from "lucide-react";

const ALL_PERMISSIONS = [
  "users.view", "users.edit", "users.delete", "users.ban",
  "shops.view", "shops.edit", "shops.delete", "shops.suspend",
  "orders.view", "orders.refund", "orders.cancel",
  "products.view", "products.edit", "products.delete",
  "tickets.view", "tickets.reply", "tickets.close",
  "reports.view", "reports.resolve",
  "analytics.view", "system.view", "system.edit",
];

export default function AdminRoles() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const { data, refetch } = trpc.admin.listAdminRoles.useQuery();
  const create = trpc.admin.createAdminRole.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); setName(""); setPermissions([]); } });
  const deleteRole = trpc.admin.deleteAdminRole.useMutation({ onSuccess: () => refetch() });

  const togglePerm = (p: string) => setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" /> Admin-Rollen
          </h1>
          <p className="text-gray-400 text-sm mt-1">Rollen und Berechtigungen verwalten</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Neue Rolle
        </Button>
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
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300"
                      onClick={() => { if (confirm("Rolle löschen?")) deleteRole.mutate({ id: role.id }); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle>Neue Admin-Rolle erstellen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Rollenname" value={name} onChange={e => setName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white" />
            <Input placeholder="Beschreibung (optional)" value={description} onChange={e => setDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white" />
            <div>
              <p className="text-gray-400 text-sm mb-2">Berechtigungen auswählen:</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {ALL_PERMISSIONS.map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePerm(p)}
                      className="rounded border-gray-600" />
                    <span className="text-gray-300 text-sm">{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="border-gray-700 text-gray-300">Abbrechen</Button>
              <Button onClick={() => create.mutate({ name, description, permissions })} disabled={!name || create.isPending}
                className="bg-purple-600 hover:bg-purple-700">Erstellen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
