import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShoppingBag, Loader2 } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const register = trpc.auth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (form.password.length < 8) { setError("Passwort muss mindestens 8 Zeichen lang sein."); return; }
    register.mutate({ name: form.name, email: form.email, password: form.password });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Registrierung erfolgreich!</h2>
            <p className="text-slate-400 mb-4">Bitte überprüfe deine E-Mails und bestätige deine E-Mail-Adresse.</p>
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Link to="/login">Zum Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShoppingBag className="w-8 h-8 text-indigo-500" />
            <span className="text-2xl font-bold text-white">DigiSell</span>
          </div>
          <CardTitle className="text-white">Konto erstellen</CardTitle>
          <CardDescription className="text-slate-400">Registriere dich kostenlos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Max Mustermann" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">E-Mail</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="max@example.com" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Passwort</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mindestens 8 Zeichen" required className="bg-slate-800 border-slate-700 text-white pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-slate-300">Passwort bestätigen</Label>
              <Input id="confirm" type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Passwort wiederholen" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <Button type="submit" disabled={register.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {register.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrierung läuft...</> : "Konto erstellen"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-400">
            Bereits ein Konto?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Anmelden</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
