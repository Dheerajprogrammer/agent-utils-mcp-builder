export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

const redact = (fields?: Record<string, unknown>) => fields && Object.fromEntries(Object.entries(fields).map(([key, value]) =>
  /token|secret|password|authorization|api.?key/i.test(key) ? [key, "[REDACTED]"] : [key, value]
));

export const createLogger = (enabled: boolean | Logger = true): Logger => {
  if (typeof enabled === "object") return enabled;
  const noop = () => undefined;
  if (!enabled) return { debug: noop, info: noop, warn: noop, error: noop };
  const write = (level: string, message: string, fields?: Record<string, unknown>) =>
    console.error(JSON.stringify({ time: new Date().toISOString(), level, message, ...redact(fields) }));
  return { debug: (m, f) => write("debug", m, f), info: (m, f) => write("info", m, f), warn: (m, f) => write("warn", m, f), error: (m, f) => write("error", m, f) };
};
