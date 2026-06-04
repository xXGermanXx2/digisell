import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { authenticateLocalRequest } from "./lib/local-auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    // Try Kimi OAuth first
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Fallback: try local JWT auth (E-Mail/Passwort)
    try {
      ctx.user = await authenticateLocalRequest(opts.req.headers);
    } catch {
      // Authentication is optional
    }
  }
  return ctx;
}
