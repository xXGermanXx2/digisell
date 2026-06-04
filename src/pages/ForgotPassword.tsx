import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const forgot = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => setError(e.message),
  });

  if (sent) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">E-Mail gesendet</h2>
          <p className="text-slate-400 mb-6">Falls ein Konto mit dieser E-Mail existiert, erhältst du in Kürze einen Reset-Link.</p>
          <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Link to="/login">Zurück zum Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 mb-6">
          <ArrowLeft className="w-4 h-4" />Zurück zum Login
        </Link>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-indigo-400" />
            </div>
            <CardTitle className="text-white">Passwort vergessen?</CardTitle>
            <CardDescription className="text-slate-400">Wir senden dir einen Link zum Zurücksetzen.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={e => { e.preventDefault(); setError(""); forgot.mutate({ email }); }} className="space-y-4">
              {error && <Alert className="bg-red-500/10 border-red-500/30"><AlertDescription className="text-red-400">{error}</AlertDescription></Alert>}
              <div className="space-y-2">
                <Label className="text-slate-300">E-Mail-Adresse</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="max@example.com" required className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <Button type="submit" disabled={forgot.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {forgot.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sende...</> : "Reset-Link senden"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
