import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save, Store, CreditCard, Mail, Shield } from "lucide-react";

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => { utils.settings.get.invalidate(); toast.success("Einstellungen gespeichert"); },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState({
    shopName: "", shopDescription: "", currency: "EUR", timezone: "Europe/Berlin",
    feePercentage: "5.00", maintenanceMode: false, taxRate: "0.00", taxIncluded: false,
    smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", smtpFrom: "",
    stripePublicKey: "", stripeSecretKey: "", stripeWebhookSecret: "",
    paypalClientId: "", paypalSecret: "", paypalMode: "sandbox" as "sandbox" | "live",
    cryptoBtcAddress: "", cryptoEthAddress: "", cryptoSolAddress: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        shopName: settings.shopName ?? "", shopDescription: settings.shopDescription ?? "",
        currency: settings.currency ?? "EUR", timezone: settings.timezone ?? "Europe/Berlin",
        feePercentage: settings.feePercentage ?? "5.00", maintenanceMode: settings.maintenanceMode ?? false,
        taxRate: settings.taxRate ?? "0.00", taxIncluded: settings.taxIncluded ?? false,
        smtpHost: settings.smtpHost ?? "", smtpPort: String(settings.smtpPort ?? 587),
        smtpUser: settings.smtpUser ?? "", smtpPass: settings.smtpPass ?? "", smtpFrom: settings.smtpFrom ?? "",
        stripePublicKey: settings.stripePublicKey ?? "", stripeSecretKey: settings.stripeSecretKey ?? "",
        stripeWebhookSecret: settings.stripeWebhookSecret ?? "",
        paypalClientId: settings.paypalClientId ?? "", paypalSecret: settings.paypalSecret ?? "",
        paypalMode: (settings.paypalMode as "sandbox" | "live") ?? "sandbox",
        cryptoBtcAddress: settings.cryptoBtcAddress ?? "", cryptoEthAddress: settings.cryptoEthAddress ?? "",
        cryptoSolAddress: settings.cryptoSolAddress ?? "",
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({
      shopName: form.shopName, shopDescription: form.shopDescription, currency: form.currency,
      timezone: form.timezone, feePercentage: form.feePercentage, maintenanceMode: form.maintenanceMode,
      smtpHost: form.smtpHost || undefined, smtpPort: form.smtpPort ? parseInt(form.smtpPort) : undefined,
      smtpUser: form.smtpUser || undefined, smtpPass: form.smtpPass || undefined, smtpFrom: form.smtpFrom || undefined,
      stripePublicKey: form.stripePublicKey || undefined, stripeSecretKey: form.stripeSecretKey || undefined,
      stripeWebhookSecret: form.stripeWebhookSecret || undefined,
      paypalClientId: form.paypalClientId || undefined, paypalSecret: form.paypalSecret || undefined,
      paypalMode: form.paypalMode, cryptoBtcAddress: form.cryptoBtcAddress || undefined,
      cryptoEthAddress: form.cryptoEthAddress || undefined, cryptoSolAddress: form.cryptoSolAddress || undefined,
    } as any);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Einstellungen</h1>
            <p className="text-sm text-[#64748B]">Plattform-Konfiguration verwalten</p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" /></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="shop">
              <TabsList className="bg-[#111827] border border-[#1E293B] flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="shop" className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]">
                  <Store className="w-3.5 h-3.5 mr-1.5" /> Shop
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]">
                  <Mail className="w-3.5 h-3.5 mr-1.5" /> E-Mail
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]">
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Zahlungen
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]">
                  <Shield className="w-3.5 h-3.5 mr-1.5" /> Sicherheit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="shop" className="mt-4">
                <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-5">
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Shop-Name</Label>
                    <Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Beschreibung</Label>
                    <Input value={form.shopDescription} onChange={(e) => setForm({ ...form, shopDescription: e.target.value })} className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Währung</Label>
                      <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" maxLength={3} />
                    </div>
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Zeitzone</Label>
                      <Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Gebühren (%)</Label>
                      <Input value={form.feePercentage} onChange={(e) => setForm({ ...form, feePercentage: e.target.value })} className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" type="number" step="0.01" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Steuersatz (%)</Label>
                      <Input value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" type="number" step="0.01" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-1">
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Steuer inklusive</Label>
                      <p className="text-xs text-[#64748B] mt-0.5">Steuer ist im Preis enthalten</p>
                    </div>
                    <Switch checked={form.taxIncluded} onCheckedChange={(v) => setForm({ ...form, taxIncluded: v })} className="data-[state=checked]:bg-[#6366F1]" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-1">
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Wartungsmodus</Label>
                      <p className="text-xs text-[#64748B] mt-0.5">Shop für Kunden unsichtbar schalten</p>
                    </div>
                    <Switch checked={form.maintenanceMode} onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })} className="data-[state=checked]:bg-[#6366F1]" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="mt-4">
                <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-[#6366F1]" />
                    <p className="text-sm font-medium text-[#F1F5F9]">SMTP-Konfiguration</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">SMTP-Host</Label>
                      <Input value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.gmail.com" className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                    </div>
                    <div>
                      <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">SMTP-Port</Label>
                      <Input value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: e.target.value })} placeholder="587" type="number" className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">SMTP-Benutzer</Label>
                    <Input value={form.smtpUser} onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} placeholder="noreply@example.com" className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">SMTP-Passwort</Label>
                    <Input value={form.smtpPass} onChange={(e) => setForm({ ...form, smtpPass: e.target.value })} type="password" placeholder="••••••••" className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Absender-E-Mail</Label>
                    <Input value={form.smtpFrom} onChange={(e) => setForm({ ...form, smtpFrom: e.target.value })} placeholder="DigiSell <noreply@example.com>" className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-4 space-y-4">
                <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#635BFF] flex items-center justify-center text-white text-[10px] font-bold">S</div>
                    <p className="text-sm font-medium text-[#F1F5F9]">Stripe</p>
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Public Key</Label>
                    <Input value={form.stripePublicKey} onChange={(e) => setForm({ ...form, stripePublicKey: e.target.value })} placeholder="pk_live_..." className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Secret Key</Label>
                    <Input value={form.stripeSecretKey} onChange={(e) => setForm({ ...form, stripeSecretKey: e.target.value })} type="password" placeholder="sk_live_..." className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Webhook Secret</Label>
                    <Input value={form.stripeWebhookSecret} onChange={(e) => setForm({ ...form, stripeWebhookSecret: e.target.value })} type="password" placeholder="whsec_..." className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                </div>
                <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#003087] flex items-center justify-center text-white text-[10px] font-bold">P</div>
                    <p className="text-sm font-medium text-[#F1F5F9]">PayPal</p>
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Client ID</Label>
                    <Input value={form.paypalClientId} onChange={(e) => setForm({ ...form, paypalClientId: e.target.value })} placeholder="AaBbCc..." className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Secret</Label>
                    <Input value={form.paypalSecret} onChange={(e) => setForm({ ...form, paypalSecret: e.target.value })} type="password" placeholder="••••••••" className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Live-Modus</Label>
                    <Switch checked={form.paypalMode === "live"} onCheckedChange={(v) => setForm({ ...form, paypalMode: v ? "live" : "sandbox" })} className="data-[state=checked]:bg-[#6366F1]" />
                  </div>
                </div>
                <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#F7931A] flex items-center justify-center text-white text-[10px] font-bold">₿</div>
                    <p className="text-sm font-medium text-[#F1F5F9]">Krypto-Adressen</p>
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Bitcoin (BTC)</Label>
                    <Input value={form.cryptoBtcAddress} onChange={(e) => setForm({ ...form, cryptoBtcAddress: e.target.value })} placeholder="bc1q..." className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Ethereum (ETH)</Label>
                    <Input value={form.cryptoEthAddress} onChange={(e) => setForm({ ...form, cryptoEthAddress: e.target.value })} placeholder="0x..." className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Solana (SOL)</Label>
                    <Input value={form.cryptoSolAddress} onChange={(e) => setForm({ ...form, cryptoSolAddress: e.target.value })} placeholder="..." className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] font-mono text-xs" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="mt-4">
                <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-[#6366F1]" />
                    <p className="text-sm font-medium text-[#F1F5F9]">Sicherheitsrichtlinien</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 rounded-lg bg-[#1A2235] border border-[#2D3748]">
                    <div>
                      <p className="text-sm font-medium text-[#F1F5F9]">Wartungsmodus</p>
                      <p className="text-xs text-[#64748B] mt-0.5">Plattform für alle Nutzer sperren</p>
                    </div>
                    <Switch checked={form.maintenanceMode} onCheckedChange={(v) => setForm({ ...form, maintenanceMode: v })} className="data-[state=checked]:bg-orange-500" />
                  </div>
                  <div className="p-4 rounded-lg bg-[#1A2235] border border-[#2D3748]">
                    <p className="text-sm font-medium text-[#F1F5F9] mb-1">IP/E-Mail/Domain-Sperrlisten</p>
                    <p className="text-xs text-[#64748B]">Verwalte Sperrlisten unter <span className="text-[#6366F1]">Sicherheit → Sperrlisten</span></p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#1A2235] border border-[#2D3748] opacity-60">
                    <p className="text-sm font-medium text-[#F1F5F9] mb-1">🟡 VPN/Proxy-Erkennung</p>
                    <p className="text-xs text-[#64748B]">Externe API erforderlich (z.B. ipapi.co)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#1A2235] border border-[#2D3748] opacity-60">
                    <p className="text-sm font-medium text-[#F1F5F9] mb-1">🟡 CAPTCHA-Konfiguration</p>
                    <p className="text-xs text-[#64748B]">Google reCAPTCHA oder hCaptcha API-Key erforderlich</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={updateSettings.isPending} className="bg-[#6366F1] hover:bg-[#5558E3] text-white">
                {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
