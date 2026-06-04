import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Webhook, CheckCircle, XCircle, Loader2, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";

const ALL_EVENTS = [
  "order.created", "order.completed", "order.refunded", "order.cancelled",
  "subscription.created", "subscription.cancelled", "subscription.renewed",
  "ticket.created", "ticket.replied",
];

export default function WebhookSettings() {
  const utils = trpc.useUtils();
  const { data: webhooks, isLoading } = trpc.webhook.list.useQuery();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ url: "", secret: "", events: [] as string[] });
  const [showSecret, setShowSecret] = useState<Record<number, boolean>>({});

  const create = trpc.webhook.create.useMutation({
    onSuccess: () => { toast.success("Webhook erstellt"); utils.webhook.list.invalidate(); setOpen(false); setForm({ url: "", secret: "", events: [] }); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.webhook.delete.useMutation({
    onSuccess: () => { toast.success("Webhook gelöscht"); utils.webhook.list.invalidate(); },
  });
  const toggle = trpc.webhook.toggle.useMutation({
    onSuccess: () => utils.webhook.list.invalidate(),
  });
  const test = trpc.webhook.test.useMutation({
    onSuccess: () => toast.success("Test-Event gesendet!"),
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const toggleEvent = (event: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Webhook className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Webhooks</h1>
              <p className="text-slate-400 text-sm">Empfange Echtzeit-Benachrichtigungen für Events</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Webhook hinzufügen</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
              <DialogHeader><DialogTitle>Neuer Webhook</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Endpoint-URL</Label>
                  <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://example.com/webhook" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Secret (optional)</Label>
                  <Input value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                    placeholder="Signatur-Secret" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Events</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_EVENTS.map(event => (
                      <label key={event} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.events.includes(event)} onChange={() => toggleEvent(event)}
                          className="rounded border-slate-600" />
                        <span className="text-sm text-slate-300 font-mono">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setForm(f => ({ ...f, events: ALL_EVENTS }))} variant="outline" size="sm"
                    className="border-slate-700 text-slate-300">Alle auswählen</Button>
                  <Button onClick={() => setForm(f => ({ ...f, events: [] }))} variant="outline" size="sm"
                    className="border-slate-700 text-slate-300">Alle abwählen</Button>
                </div>
                <Button onClick={() => create.mutate(form)} disabled={!form.url || !form.events.length || create.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Erstellen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : !webhooks?.length ? (
          <Card className="bg-slate-900 border-slate-800 text-center">
            <CardContent className="pt-12 pb-12">
              <Webhook className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Noch keine Webhooks konfiguriert.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map(wh => (
              <Card key={wh.id} className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {wh.isActive ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        <p className="text-white font-mono text-sm truncate">{wh.url}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {wh.events.map(ev => (
                          <Badge key={ev} className="bg-slate-800 text-slate-300 text-xs font-mono">{ev}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      <Switch checked={wh.isActive} onCheckedChange={() => toggle.mutate({ id: wh.id })} />
                      <Button size="sm" variant="ghost" onClick={() => test.mutate({ id: wh.id })}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">Test</Button>
                      <Button size="sm" variant="ghost" onClick={() => del.mutate({ id: wh.id })}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Erstellt: {wh.createdAt ? new Date(wh.createdAt).toLocaleDateString("de") : "–"}
                    {wh.lastTriggeredAt && ` · Zuletzt ausgelöst: ${new Date(wh.lastTriggeredAt).toLocaleString("de")}`}
                    {wh.failureCount > 0 && <span className="text-red-400 ml-2">· {wh.failureCount} Fehler</span>}
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
