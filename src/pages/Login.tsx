import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShoppingBag, Loader2, Shield, Store, ArrowLeft } from "lucide-react";

function getOAuthUrl() {
  try {
    const authUrl = new URL(import.meta.env.VITE_KIMI_AUTH_URL || "https://account.kimi.ai");
    authUrl.searchParams.set("client_id", import.meta.env.VITE_APP_ID || "");
    authUrl.searchParams.set("redirect_uri", `${window.location.origin}/api/oauth/callback`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "profile");
    authUrl.searchParams.set("state", btoa(window.location.pathname));
    return authUrl.toString();
  } catch { return "#"; }
}

export default function Login() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", twoFactorCode: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"oauth" | "email">("email");

  useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "seller") navigate("/seller");
      else navigate("/dashboard");
    }
  }, [user, navigate]);

  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: (data: any) => {
      if (data.requiresTwoFactor) { setRequires2FA(true); setError(""); return; }
      if (data.refreshToken) localStorage.setItem("ds_refresh_token", data.refreshToken);
      // Cache leeren und dann rollenbasiert weiterleiten
      utils.auth.me.reset();
      if (data.role === "admin") navigate("/admin");
      else if (data.role === "seller") navigate("/seller");
      else navigate("/dashboard");
    },
    onError: (e: any) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate({ email: form.email, password: form.password, twoFactorCode: requires2FA ? form.twoFactorCode : undefined });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-[#0A0E1A]" />
        <div className="relative text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/25">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">DigiSell</h1>
          <p className="text-lg text-slate-400 max-w-sm mx-auto leading-relaxed">
            Die All-in-One Plattform für den Verkauf digitaler Produkte.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            {[["500+", "Verkäufer"], ["50K+", "Produkte"], ["€2M+", "Umsatz"]].map(([val, label], i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-indigo-400">{val}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />Zurück zur Startseite
          </Link>

          <Card className="bg-[#111827] border-[#2D3748]">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl">
                {requires2FA ? "Zwei-Faktor-Authentifizierung" : "Willkommen zurück"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {requires2FA ? "Gib deinen 6-stelligen Code ein" : "Melde dich an, um fortzufahren"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              {!requires2FA && (
                <>
                  {/* OAuth Button */}
                  {import.meta.env.VITE_APP_ID && (
                    <>
                      <a href={getOAuthUrl()} className="block w-full">
                        <Button variant="outline" className="w-full border-[#2D3748] text-white hover:bg-[#1A2235]">
                          Mit Kimi anmelden
                        </Button>
                      </a>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2D3748]" /></div>
                        <div className="relative flex justify-center text-xs"><span className="px-3 bg-[#111827] text-slate-500">oder mit E-Mail</span></div>
                      </div>
                    </>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">E-Mail</Label>
                      <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="max@example.com" required className="bg-slate-800 border-slate-700 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300">Passwort</Label>
                        <Link to="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">Vergessen?</Link>
                      </div>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          placeholder="Dein Passwort" required className="bg-slate-800 border-slate-700 text-white pr-10" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={login.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                      {login.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Anmeldung...</> : "Anmelden"}
                    </Button>
                  </form>
                </>
              )}

              {requires2FA && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    <p className="text-sm text-slate-300">Öffne deine Authenticator-App und gib den Code ein.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Authenticator-Code</Label>
                    <Input value={form.twoFactorCode} onChange={e => setForm(f => ({ ...f, twoFactorCode: e.target.value }))}
                      placeholder="000000" maxLength={10} required
                      className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest" />
                  </div>
                  <Button type="submit" disabled={login.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {login.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Prüfe...</> : "Code bestätigen"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setRequires2FA(false); setForm(f => ({ ...f, twoFactorCode: "" })); }}
                    className="w-full text-slate-400">Zurück</Button>
                </form>
              )}

              {!requires2FA && (
                <p className="text-center text-sm text-slate-400">
                  Noch kein Konto?{" "}
                  <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Registrieren</Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
