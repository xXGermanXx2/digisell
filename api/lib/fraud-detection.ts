export type VpnProxyProvider = "none" | "ipapi" | "ipqualityscore" | "abstractapi";

export interface VpnProxyConfig {
  enabled?: boolean | null;
  provider?: VpnProxyProvider | null;
  apiKey?: string | null;
  threshold?: number | null;
}

export interface VpnProxyResult {
  enabled: boolean;
  provider: VpnProxyProvider;
  score: number;
  isVpn: boolean;
  isProxy: boolean;
  blocked: boolean;
  reason?: string;
  raw?: unknown;
}

export function createBrowserFingerprint(input: {
  userAgent?: string | null;
  acceptLanguage?: string | null;
  platform?: string | null;
  timezone?: string | null;
  screen?: string | null;
  salt?: string | null;
}): string {
  const payload = [
    input.userAgent ?? "",
    input.acceptLanguage ?? "",
    input.platform ?? "",
    input.timezone ?? "",
    input.screen ?? "",
    input.salt ?? "digisell",
  ].join("|");

  let hash = 5381;
  for (let i = 0; i < payload.length; i += 1) {
    hash = ((hash << 5) + hash) + payload.charCodeAt(i);
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

export async function checkVpnProxy(ip: string | undefined, config: VpnProxyConfig): Promise<VpnProxyResult> {
  const provider = config.provider ?? "none";
  const threshold = config.threshold ?? 80;

  if (!ip || !config.enabled || provider === "none") {
    return { enabled: Boolean(config.enabled), provider, score: 0, isVpn: false, isProxy: false, blocked: false, reason: "disabled-or-missing-ip" };
  }

  try {
    if (provider === "ipqualityscore") {
      if (!config.apiKey) return { enabled: true, provider, score: 0, isVpn: false, isProxy: false, blocked: false, reason: "missing-api-key" };
      const url = `https://ipqualityscore.com/api/json/ip/${encodeURIComponent(config.apiKey)}/${encodeURIComponent(ip)}?strictness=1&allow_public_access_points=true`;
      const data = await (await fetch(url)).json() as any;
      const score = Number(data.fraud_score ?? 0);
      const isProxy = Boolean(data.proxy || data.active_vpn || data.tor);
      const isVpn = Boolean(data.vpn || data.active_vpn);
      return { enabled: true, provider, score, isVpn, isProxy, blocked: score >= threshold || isProxy || isVpn, raw: data };
    }

    if (provider === "abstractapi") {
      if (!config.apiKey) return { enabled: true, provider, score: 0, isVpn: false, isProxy: false, blocked: false, reason: "missing-api-key" };
      const url = `https://ipgeolocation.abstractapi.com/v1/?api_key=${encodeURIComponent(config.apiKey)}&ip_address=${encodeURIComponent(ip)}`;
      const data = await (await fetch(url)).json() as any;
      const security = data.security ?? {};
      const isVpn = Boolean(security.is_vpn);
      const isProxy = Boolean(security.is_proxy || security.is_tor);
      const score = isVpn || isProxy ? 100 : 0;
      return { enabled: true, provider, score, isVpn, isProxy, blocked: score >= threshold, raw: data };
    }

    if (provider === "ipapi") {
      const url = `https://ipapi.co/${encodeURIComponent(ip)}/json/`;
      const data = await (await fetch(url, { headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined })).json() as any;
      const flags = [data.security?.vpn, data.security?.proxy, data.security?.tor].filter(Boolean).length;
      const score = flags > 0 ? 100 : 0;
      return { enabled: true, provider, score, isVpn: Boolean(data.security?.vpn), isProxy: Boolean(data.security?.proxy || data.security?.tor), blocked: score >= threshold, raw: data };
    }

    return { enabled: true, provider, score: 0, isVpn: false, isProxy: false, blocked: false, reason: "unsupported-provider" };
  } catch (error: any) {
    return { enabled: true, provider, score: 0, isVpn: false, isProxy: false, blocked: false, reason: error?.message ?? "lookup-failed" };
  }
}
