import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Database, Activity, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminSystem() {
  const utils = trpc.useUtils();
  const { data: health } = trpc.system.health.useQuery();
  const { data: logs } = trpc.admin.getSystemLogs.useQuery({ limit: 20 });
  const clearLogs = trpc.admin.clearLogs.useMutation({ onSuccess: () => { toast.success("Logs geleert"); utils.admin.getSystemLogs.invalidate(); } });
  const createBackup = trpc.admin.createBackup.useMutation({ onSuccess: () => toast.success("Backup erstellt") });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-[#F1F5F9]">Systemverwaltung</h1>
        </div>

        {/* Health Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Status", value: health?.status ?? "—", icon: Activity, color: health?.status === "ok" ? "text-green-400" : "text-red-400" },
            { label: "Datenbank", value: health?.database ?? "—", icon: Database, color: health?.database === "connected" ? "text-green-400" : "text-red-400" },
            { label: "Redis", value: health?.redis ?? "—", icon: Shield, color: health?.redis === "connected" ? "text-green-400" : "text-yellow-400" },
            { label: "Uptime", value: health?.uptime ? `${Math.floor(Number(health.uptime) / 60)}m` : "—", icon: RefreshCw, color: "text-blue-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#111827] rounded-xl border border-[#1E293B] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-[#64748B]">{label}</span>
              </div>
              <p className={`text-lg font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
          <h2 className="text-base font-semibold text-[#F1F5F9] mb-4">Aktionen</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => createBackup.mutate()} disabled={createBackup.isPending}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white">
              <Database className="w-4 h-4 mr-2" /> Backup erstellen
            </Button>
            <Button onClick={() => { if (confirm("Alle Logs löschen?")) clearLogs.mutate(); }}
              variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-2" /> Logs leeren
            </Button>
          </div>
        </div>

        {/* System Logs */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h2 className="text-base font-semibold text-[#F1F5F9]">System-Logs</h2>
            <Badge className="bg-slate-800 text-slate-300">{logs?.items?.length ?? 0} Einträge</Badge>
          </div>
          <div className="divide-y divide-[#1E293B] max-h-96 overflow-y-auto">
            {(logs?.items ?? []).map((log: any) => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                <Badge className={
                  log.level === "error" ? "bg-red-500/20 text-red-400 text-xs" :
                  log.level === "warn" ? "bg-yellow-500/20 text-yellow-400 text-xs" :
                  "bg-blue-500/20 text-blue-400 text-xs"
                }>{log.level}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F1F5F9] truncate">{log.message}</p>
                  {log.meta && <p className="text-xs text-[#64748B] font-mono truncate">{JSON.stringify(log.meta)}</p>}
                </div>
                <span className="text-xs text-[#64748B] flex-shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString("de-DE")}
                </span>
              </div>
            ))}
            {!logs?.items?.length && (
              <div className="text-center py-10 text-[#64748B]">Keine Logs vorhanden</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
