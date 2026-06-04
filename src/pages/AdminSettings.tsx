import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Store, CreditCard } from "lucide-react";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate();
      toast.success("Einstellungen gespeichert");
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    shopName: "",
    shopDescription: "",
    currency: "EUR",
    timezone: "Europe/Berlin",
    feePercentage: "5.00",
    maintenanceMode: false,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        shopName: settings.shopName,
        shopDescription: settings.shopDescription ?? "",
        currency: settings.currency,
        timezone: settings.timezone,
        feePercentage: settings.feePercentage,
        maintenanceMode: settings.maintenanceMode,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(form);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Einstellungen</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Konfiguriere deinen Shop</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="bg-[#111827] border border-[#2D3748] p-1 mb-6">
                <TabsTrigger
                  value="general"
                  className="text-xs data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]"
                >
                  <Store className="w-3.5 h-3.5 mr-1.5" />
                  Allgemein
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="text-xs data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Zahlungen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-0">
                <div className="bg-[#111827] rounded-xl card-shadow p-6 space-y-5">
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Shop-Name</Label>
                    <Input
                      value={form.shopName}
                      onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                      className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Beschreibung</Label>
                    <Input
                      value={form.shopDescription}
                      onChange={(e) => setForm({ ...form, shopDescription: e.target.value })}
                      className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">W\u00e4hrung</Label>
                      <Input
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]"
                        maxLength={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Zeitzone</Label>
                      <Input
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Geb\u00fchren-Prozentsatz (%)</Label>
                    <Input
                      value={form.feePercentage}
                      onChange={(e) => setForm({ ...form, feePercentage: e.target.value })}
                      className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Wartungsmodus</Label>
                      <p className="text-xs text-[#64748B] mt-0.5">Shop f\u00fcr Kunden unsichtbar schalten</p>
                    </div>
                    <Switch
                      checked={form.maintenanceMode}
                      onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })}
                      className="data-[state=checked]:bg-[#6366F1]"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <div className="bg-[#111827] rounded-xl card-shadow p-6 space-y-5">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1A2235] border border-[#2D3748]">
                    <CreditCard className="w-5 h-5 text-[#6366F1]" />
                    <div>
                      <p className="text-sm font-medium text-[#F1F5F9]">Stripe</p>
                      <p className="text-xs text-[#64748B]">Kreditkartenzahlungen (konfiguriert)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1A2235] border border-[#2D3748]">
                    <CreditCard className="w-5 h-5 text-[#8B5CF6]" />
                    <div>
                      <p className="text-sm font-medium text-[#F1F5F9]">PayPal</p>
                      <p className="text-xs text-[#64748B]">PayPal-Zahlungen (konfiguriert)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1A2235] border border-[#2D3748]">
                    <div className="w-5 h-5 rounded-full bg-[#F7931A] flex items-center justify-center text-white text-[8px] font-bold">B</div>
                    <div>
                      <p className="text-sm font-medium text-[#F1F5F9]">Krypto</p>
                      <p className="text-xs text-[#64748B]">Bitcoin, Ethereum, Solana (konfiguriert)</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Zahlungsanbieter werden \u00fcber Umgebungsvariablen konfiguriert. Kontaktiere deinen Administrator f\u00fcr \u00c4nderungen.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                disabled={updateSettings.isPending}
                className="gradient-bg text-white hover:opacity-90"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Speichern
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
