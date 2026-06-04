import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, XCircle, CheckCircle, Calendar, Package } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  expired: "bg-slate-700 text-slate-400",
  past_due: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  trialing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv", cancelled: "Gekündigt", expired: "Abgelaufen", past_due: "Überfällig", trialing: "Testphase",
};

export default function UserSubscriptions() {
  const utils = trpc.useUtils();
  const { data: subs, isLoading } = trpc.subscription.myList.useQuery();
  const cancel = trpc.subscription.cancel.useMutation({
    onSuccess: () => { toast.success("Abonnement gekündigt"); utils.subscription.myList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const reactivate = trpc.subscription.reactivate.useMutation({
    onSuccess: () => { toast.success("Abonnement reaktiviert"); utils.subscription.myList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Meine Abonnements</h1>

        {!subs?.length ? (
          <Card className="bg-slate-900 border-slate-800 text-center">
            <CardContent className="pt-12 pb-12">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Du hast noch keine aktiven Abonnements.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subs.map(sub => (
              <Card key={sub.id} className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium">{sub.product?.name ?? "Produkt"}</h3>
                        <Badge className={statusColors[sub.status] ?? ""}>{statusLabels[sub.status] ?? sub.status}</Badge>
                        {sub.cancelAtPeriodEnd && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Endet am Periodenende</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Nächste Zahlung: {new Date(sub.currentPeriodEnd).toLocaleDateString("de")}
                        </span>
                        <span className="capitalize">{sub.interval === "monthly" ? "Monatlich" : sub.interval === "yearly" ? "Jährlich" : "Benutzerdefiniert"}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {sub.status === "active" && !sub.cancelAtPeriodEnd && (
                        <Button size="sm" variant="outline" onClick={() => cancel.mutate({ id: sub.id })}
                          disabled={cancel.isPending}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                          <XCircle className="w-4 h-4 mr-1" />Kündigen
                        </Button>
                      )}
                      {(sub.status === "cancelled" || sub.cancelAtPeriodEnd) && sub.status !== "expired" && (
                        <Button size="sm" onClick={() => reactivate.mutate({ id: sub.id })}
                          disabled={reactivate.isPending}
                          className="bg-indigo-600 hover:bg-indigo-700">
                          <RefreshCw className="w-4 h-4 mr-1" />Reaktivieren
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
