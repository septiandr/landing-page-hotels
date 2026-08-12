/** Error API dengan status HTTP — dikonversi di lib/handle-api.ts. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Error per-field (validasi) — format { field: [pesan, ...] }. */
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
