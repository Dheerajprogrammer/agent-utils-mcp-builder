import { MCPError } from "../errors/index.js";
import type { Middleware } from "../core/types.js";

export const authorize = (options: { require: string[] }): Middleware => async (ctx, next) => {
  const permissions = ctx.auth?.permissions ?? [];
  const missing = options.require.filter((permission) => !permissions.includes(permission));
  if (missing.length) throw new MCPError({ code: "FORBIDDEN", message: "Insufficient permissions", details: { missing }, status: 403 });
  await next();
};

export const rateLimit = (options: { requests: number; window: string | number }): Middleware => {
  const duration = typeof options.window === "number" ? options.window : Number.parseInt(options.window) * (options.window.endsWith("m") ? 60_000 : options.window.endsWith("s") ? 1_000 : 1);
  const requests = new Map<string, number[]>();
  return async (ctx, next) => {
    const key = ctx.auth?.subject ?? "anonymous";
    const now = Date.now();
    const active = (requests.get(key) ?? []).filter((time) => now - time < duration);
    if (active.length >= options.requests) throw new MCPError({ code: "RATE_LIMITED", message: "Rate limit exceeded", status: 429 });
    active.push(now); requests.set(key, active); await next();
  };
};
