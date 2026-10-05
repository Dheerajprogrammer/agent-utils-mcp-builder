export class MCPError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly status?: number;

  constructor(options: { code: string; message: string; details?: unknown; status?: number }) {
    super(options.message);
    this.name = "MCPError";
    this.code = options.code;
    this.details = options.details;
    this.status = options.status;
  }
}

export const toSafeError = (error: unknown, production = process.env.NODE_ENV === "production") => {
  if (error instanceof MCPError) return { code: error.code, message: error.message, details: error.details };
  if (!production && error instanceof Error) return { code: "INTERNAL_ERROR", message: error.message };
  return { code: "INTERNAL_ERROR", message: "An internal error occurred" };
};
