import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, TrendingUp, DollarSign, MousePointer, Users, Loader2, Link2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateDashboard() {
  const affiliateQuery = trpc.affiliate.myInfo.useQuery();
  const statsQuery = trpc.affiliate.myStats.useQuery();
  const commissionsQuery = trpc.affiliate.myCommissions.useQuery({ page: 1, limit: 20 });
  const registerMutation = trpc.affiliate.register.useMutation({
    onSuccess: () => { toast.success("Affiliate-Konto erstellt!"); affiliateQuery.refetch(); statsQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const stats = statsQuery.data;
  const affiliate = affiliateQuery.data;
  const referralUrl = affiliate ? `${window.location.origin}?ref=${affiliate.referralCode}` : "";

  if (affiliateQuery.isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (!affiliate) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-center">
        <CardContent className="pt-8 pb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Affiliate-Programm</h2>
          <p className="text-slate-400 mb-2">Verdiene <span className="text-indigo-400 font-semibold">10% Provision</span> für jede Bestellung, die über deinen Link kommt.</p>
          <p className="text-slate-500 text-sm mb-6">Keine Mindestanforderungen. Auszahlung ab 10 €.</p>
          <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Jetzt als Affiliate registrieren
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Affiliate-Dashboard</h1>
            <p className="text-slate-400 text-sm">Verfolge deine Provisionen und Klicks</p>
          </div>
          <Badge className={affiliate.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400"}>
            {affiliate.status === "active" ? "Aktiv" : "Ausstehend"}
          </Badge>
        </div>

        {/* Referral Link */}
        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-slate-400 text-xs mb-1">Dein Referral-Link</p>
                <p className="text-white font-mono text-sm bg-slate-800 px-3 py-2 rounded truncate">{referralUrl}</p>
              </div>
              <Button onClick={() => { navigator.clipboard.writeText(referralUrl); toast.success("Link kopiert!"); }}
                className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0">
                <Copy className="w-4 h-4 mr-2" />Kopieren
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Gesamtverdienst", value: `€${parseFloat(stats?.totalEarned ?? "0").toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
            { label: "Ausstehend", value: `€${parseFloat(stats?.pendingPayout ?? "0").toFixed(2)}`, icon: TrendingUp, color: "text-yellow-400" },
            { label: "Klicks", value: stats?.totalClicks ?? 0, icon: MousePointer, color: "text-blue-400" },
            { label: "Conversions", value: `${stats?.totalConversions ?? 0} (${stats?.conversionRate ?? 0}%)`, icon: Users, color: "text-indigo-400" },
          ].map((s, i) => (
            <Card key={i} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-xs">{s.label}</p>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="commissions">
          <TabsList className="bg-slate-900 border-slate-800 mb-4">
            <TabsTrigger value="commissions">Provisionen</TabsTrigger>
            <TabsTrigger value="payouts">Auszahlungen</TabsTrigger>
          </TabsList>

          <TabsContent value="commissions">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white text-base">Provisionshistorie</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {commissionsQuery.data?.items.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-white text-sm">Bestellung #{c.orderId}</p>
                        <p className="text-slate-400 text-xs">{new Date(c.createdAt!).toLocaleDateString("de")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">€{parseFloat(c.amount).toFixed(2)}</p>
                        <Badge className={c.status === "paid" ? "bg-green-500/20 text-green-400" : c.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700 text-slate-400"}>
                          {c.status === "paid" ? "Ausgezahlt" : c.status === "pending" ? "Ausstehend" : c.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {!commissionsQuery.data?.items.length && <p className="text-slate-500 text-sm text-center py-8">Noch keine Provisionen.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Auszahlungen</CardTitle>
                <CardDescription className="text-slate-400">
                  Verfügbares Guthaben: <span className="text-green-400 font-medium">€{parseFloat(stats?.pendingPayout ?? "0").toFixed(2)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parseFloat(stats?.pendingPayout ?? "0") >= 10 && (
                  <Button className="mb-4 bg-indigo-600 hover:bg-indigo-700">
                    <ArrowUpRight className="w-4 h-4 mr-2" />Auszahlung beantragen
                  </Button>
                )}
                {parseFloat(stats?.pendingPayout ?? "0") < 10 && (
                  <p className="text-slate-500 text-sm">Mindestbetrag für Auszahlung: 10 €. Noch €{(10 - parseFloat(stats?.pendingPayout ?? "0")).toFixed(2)} fehlend.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
