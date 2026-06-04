import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Shield, Key, Bell, Copy, Trash2, Plus, Loader2, CheckCircle, Eye, EyeOff, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function UserSettings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Profile
  const profileQuery = trpc.profile.get.useQuery();
  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", bio: "", website: "", phone: "", country: "", timezone: "Europe/Berlin" });
  const updateProfile = trpc.profile.update.useMutation({ onSuccess: () => { toast.success("Profil gespeichert"); utils.profile.get.invalidate(); } });

  // Password
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const changePassword = trpc.profile.changePassword.useMutation({ onSuccess: () => { toast.success("Passwort geändert"); setPwForm({ currentPassword: "", newPassword: "", confirm: "" }); } });

  // 2FA
  const [qrCode, setQrCode] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const setup2FA = trpc.auth.setup2FA.useMutation({ onSuccess: (d) => setQrCode(d.qrCode) });
  const enable2FA = trpc.auth.enable2FA.useMutation({ onSuccess: (d) => { setBackupCodes(d.backupCodes); toast.success("2FA aktiviert!"); } });
  const disable2FA = trpc.auth.disable2FA.useMutation({ onSuccess: () => { toast.success("2FA deaktiviert"); utils.profile.get.invalidate(); } });

  // API Keys
  const apiKeysQuery = trpc.profile.listApiKeys.useQuery();
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState("");
  const createKey = trpc.profile.createApiKey.useMutation({
    onSuccess: (d) => { setCreatedKey(d.key); setNewKeyName(""); utils.profile.listApiKeys.invalidate(); toast.success("API-Key erstellt"); }
  });
  const revokeKey = trpc.profile.revokeApiKey.useMutation({ onSuccess: () => { utils.profile.listApiKeys.invalidate(); toast.success("Key widerrufen"); } });
  const deleteKey = trpc.profile.deleteApiKey.useMutation({ onSuccess: () => { utils.profile.listApiKeys.invalidate(); toast.success("Key gelöscht"); } });

  // Notifications
  const [notifs, setNotifs] = useState({ notifyEmail: true, notifyOrderEmail: true, notifyTicketEmail: true, notifyNewsletterEmail: false });
  const updateNotifs = trpc.profile.updateNotifications.useMutation({ onSuccess: () => toast.success("Benachrichtigungen gespeichert") });

  const profile = profileQuery.data;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Einstellungen</h1>

        <Tabs defaultValue="profile">
          <TabsList className="bg-slate-900 border-slate-800 mb-6">
            <TabsTrigger value="profile" className="data-[state=active]:bg-indigo-600"><User className="w-4 h-4 mr-2" />Profil</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-indigo-600"><Lock className="w-4 h-4 mr-2" />Sicherheit</TabsTrigger>
            <TabsTrigger value="2fa" className="data-[state=active]:bg-indigo-600"><Shield className="w-4 h-4 mr-2" />2FA</TabsTrigger>
            <TabsTrigger value="apikeys" className="data-[state=active]:bg-indigo-600"><Key className="w-4 h-4 mr-2" />API-Keys</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-indigo-600"><Bell className="w-4 h-4 mr-2" />Benachrichtigungen</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white">Profil bearbeiten</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => { e.preventDefault(); updateProfile.mutate(profileForm); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Name</Label>
                      <Input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Telefon</Label>
                      <Input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Website</Label>
                    <Input value={profileForm.website} onChange={e => setProfileForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://example.com" className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Bio</Label>
                    <textarea value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3} placeholder="Kurze Beschreibung..."
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <Button type="submit" disabled={updateProfile.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SECURITY */}
          <TabsContent value="security">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white">Passwort ändern</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={e => {
                  e.preventDefault();
                  if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwörter stimmen nicht überein"); return; }
                  changePassword.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Aktuelles Passwort</Label>
                    <div className="relative">
                      <Input type={showPw ? "text" : "password"} value={pwForm.currentPassword}
                        onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                        className="bg-slate-800 border-slate-700 text-white pr-10" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Neues Passwort</Label>
                    <Input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      minLength={8} className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Passwort bestätigen</Label>
                    <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" />
                  </div>
                  <Button type="submit" disabled={changePassword.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Passwort ändern"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2FA */}
          <TabsContent value="2fa">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Zwei-Faktor-Authentifizierung</CardTitle>
                <CardDescription className="text-slate-400">Schütze dein Konto mit einem zusätzlichen Sicherheitsfaktor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {backupCodes.length > 0 && (
                  <Alert className="bg-green-500/10 border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      <p className="font-medium mb-2">2FA aktiviert! Speichere diese Backup-Codes sicher:</p>
                      <div className="grid grid-cols-2 gap-1 font-mono text-sm">
                        {backupCodes.map((c, i) => <span key={i} className="bg-slate-800 px-2 py-1 rounded">{c}</span>)}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {!qrCode && !backupCodes.length && (
                  <Button onClick={() => setup2FA.mutate()} disabled={setup2FA.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    <QrCode className="w-4 h-4 mr-2" />2FA einrichten
                  </Button>
                )}

                {qrCode && !backupCodes.length && (
                  <div className="space-y-4">
                    <p className="text-slate-300 text-sm">Scanne diesen QR-Code mit deiner Authenticator-App:</p>
                    <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-lg" />
                    <div className="space-y-2">
                      <Label className="text-slate-300">Code aus der App eingeben</Label>
                      <div className="flex gap-2">
                        <Input value={twoFACode} onChange={e => setTwoFACode(e.target.value)} placeholder="000000" maxLength={6}
                          className="bg-slate-800 border-slate-700 text-white w-40" />
                        <Button onClick={() => enable2FA.mutate({ code: twoFACode })} disabled={enable2FA.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                          {enable2FA.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aktivieren"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* API KEYS */}
          <TabsContent value="apikeys">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">API-Schlüssel</CardTitle>
                <CardDescription className="text-slate-400">Erstelle API-Keys für externe Integrationen.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {createdKey && (
                  <Alert className="bg-yellow-500/10 border-yellow-500/30">
                    <AlertDescription className="text-yellow-300">
                      <p className="font-medium mb-1">Neuer API-Key (nur einmal sichtbar!):</p>
                      <div className="flex items-center gap-2 font-mono text-sm bg-slate-800 p-2 rounded">
                        <span className="flex-1 break-all">{createdKey}</span>
                        <button onClick={() => { navigator.clipboard.writeText(createdKey); toast.success("Kopiert!"); }}>
                          <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key-Name (z.B. 'Mein Shop')"
                    className="bg-slate-800 border-slate-700 text-white" />
                  <Button onClick={() => createKey.mutate({ name: newKeyName })} disabled={!newKeyName || createKey.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-1" />Erstellen
                  </Button>
                </div>

                <div className="space-y-2">
                  {apiKeysQuery.data?.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <div>
                        <p className="text-white font-medium text-sm">{key.name}</p>
                        <p className="text-slate-400 text-xs font-mono">{key.keyPrefix}••••••••</p>
                        <p className="text-slate-500 text-xs">{key.lastUsedAt ? `Zuletzt: ${new Date(key.lastUsedAt).toLocaleDateString("de")}` : "Noch nie verwendet"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.isActive ? "default" : "secondary"} className={key.isActive ? "bg-green-500/20 text-green-400" : ""}>
                          {key.isActive ? "Aktiv" : "Widerrufen"}
                        </Badge>
                        {key.isActive && (
                          <Button size="sm" variant="ghost" onClick={() => revokeKey.mutate({ id: key.id })} className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10">
                            Widerrufen
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteKey.mutate({ id: key.id })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!apiKeysQuery.data?.length && <p className="text-slate-500 text-sm text-center py-4">Noch keine API-Keys erstellt.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader><CardTitle className="text-white">Benachrichtigungen</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "notifyEmail", label: "E-Mail-Benachrichtigungen", desc: "Alle E-Mail-Benachrichtigungen aktivieren" },
                  { key: "notifyOrderEmail", label: "Bestellbestätigungen", desc: "E-Mail bei neuen Bestellungen" },
                  { key: "notifyTicketEmail", label: "Support-Tickets", desc: "E-Mail bei neuen Ticket-Antworten" },
                  { key: "notifyNewsletterEmail", label: "Newsletter", desc: "Produkt-Updates und Neuigkeiten" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-slate-400 text-xs">{item.desc}</p>
                    </div>
                    <Switch checked={notifs[item.key as keyof typeof notifs]}
                      onCheckedChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
                  </div>
                ))}
                <Button onClick={() => updateNotifs.mutate(notifs)} disabled={updateNotifs.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                  {updateNotifs.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
