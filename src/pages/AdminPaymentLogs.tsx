import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  CreditCard, Search, Filter, RefreshCw, CheckCircle,
  XCircle, Clock, AlertCircle, TrendingUp, DollarSign
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  refunded: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-3.5 h-3.5" />,
  success: <CheckCircle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
  failed: <XCircle className="w-3.5 h-3.5" />,
  refunded: <AlertCircle className="w-3.5 h-3.5" />,
};

export default function AdminPaymentLogs() {
  const [page, setPage] = useState(1);
  const [provider, setProvider] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, refetch } = trpc.invoice.paymentLogs.useQuery({
    page,
    limit: 25,
    provider: provider !== "all" ? provider as any : undefined,
    status: status !== "all" ? status as any : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: stats } = trpc.invoice.paymentStats.useQuery();

  const formatDate = (d: Date | string | null) =>
    d ? new Date(d).toLocaleString("de-DE") : "–";

  const totalPages = data ? Math.ceil(data.total / 25) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-indigo-400" />
            Zahlungsprotokolle
          </h1>
          <p className="text-white/50 text-sm mt-1">Vollständige Zahlungshistorie aller Transaktionen</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Gesamt", value: stats.total, icon: <TrendingUp className="w-4 h-4" />, color: "text-white" },
            { label: "Volumen", value: `€ ${parseFloat(stats.totalVolume).toFixed(2)}`, icon: <DollarSign className="w-4 h-4" />, color: "text-emerald-400" },
            { label: "Erfolgreich", value: stats.succeeded, icon: <CheckCircle className="w-4 h-4" />, color: "text-emerald-400" },
            { label: "Ausstehend", value: stats.pending, icon: <Clock className="w-4 h-4" />, color: "text-yellow-400" },
            { label: "Fehlgeschlagen", value: stats.failed, icon: <XCircle className="w-4 h-4" />, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className={`flex items-center gap-2 ${s.color} mb-1`}>
                {s.icon}
                <span className="text-xs font-medium">{s.label}</span>
              </div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
        <select
          value={provider}
          onChange={e => { setProvider(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Alle Anbieter</option>
          <option value="stripe">Stripe</option>
          <option value="paypal">PayPal</option>
          <option value="crypto">Krypto</option>
          <option value="system">System</option>
        </select>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Alle Status</option>
          <option value="completed">Erfolgreich</option>
          <option value="pending">Ausstehend</option>
          <option value="failed">Fehlgeschlagen</option>
          <option value="refunded">Erstattet</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Von"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          className="bg-white/10 border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Bis"
        />
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left p-4 text-white/50 font-medium">ID</th>
              <th className="text-left p-4 text-white/50 font-medium">Bestellung</th>
              <th className="text-left p-4 text-white/50 font-medium">Anbieter</th>
              <th className="text-left p-4 text-white/50 font-medium">Status</th>
              <th className="text-right p-4 text-white/50 font-medium">Betrag</th>
              <th className="text-left p-4 text-white/50 font-medium">Datum</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-white/40">Lade...</td></tr>
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-white/40">Keine Einträge gefunden.</td></tr>
            ) : data?.items.map(log => (
              <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-white/40 font-mono text-xs">#{log.id}</td>
                <td className="p-4">
                  {log.order ? (
                    <span className="text-indigo-400 font-mono text-xs">{log.order.orderNumber}</span>
                  ) : (
                    <span className="text-white/30">–</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="capitalize text-white/70">{log.provider}</span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[log.status] ?? "bg-white/10 text-white/60 border-white/10"}`}>
                    {STATUS_ICONS[log.status]}
                    {log.status}
                  </span>
                </td>
                <td className="p-4 text-right font-medium text-white">
                  {log.amount ? `${log.currency ?? "EUR"} ${parseFloat(log.amount).toFixed(2)}` : "–"}
                </td>
                <td className="p-4 text-white/50 text-xs">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            Seite {page} von {totalPages} · {data?.total ?? 0} Einträge
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Zurück
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Weiter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
