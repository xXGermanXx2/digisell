import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, CheckCircle, Lock } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message),
  });

  if (!token) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardContent className="pt-6 text-center">
          <p className="text-red-400">Ungültiger oder fehlender Token.</p>
          <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700"><Link to="/auth/forgot-password">Neuen Link anfordern</Link></Button>
        </CardContent>
      </Card>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Passwort geändert!</h2>
          <p className="text-slate-400 mb-6">Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700"><Link to="/login">Zum Login</Link></Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <CardTitle className="text-white">Neues Passwort</CardTitle>
          <CardDescription className="text-slate-400">Wähle ein sicheres neues Passwort.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => {
            e.preventDefault(); setError("");
            if (form.password !== form.confirm) { setError("Passwörter stimmen nicht überein."); return; }
            reset.mutate({ token, password: form.password });
          }} className="space-y-4">
            {error && <Alert className="bg-red-500/10 border-red-500/30"><AlertDescription className="text-red-400">{error}</AlertDescription></Alert>}
            <div className="space-y-2">
              <Label className="text-slate-300">Neues Passwort</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mindestens 8 Zeichen" required minLength={8} className="bg-slate-800 border-slate-700 text-white pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Passwort bestätigen</Label>
              <Input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Passwort wiederholen" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <Button type="submit" disabled={reset.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {reset.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Speichere...</> : "Passwort ändern"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
