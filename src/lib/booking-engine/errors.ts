/** Error API Cloudbeds (BK-003) — dipetakan ke AvailabilityResponse.engineError. */
export class CloudbedsApiError extends Error {
  constructor(
    public code: string | number,
    message: string,
  ) {
    super(message);
    this.name = "CloudbedsApiError";
  }
}

/** Env booking engine belum dikonfigurasi. */
export class EngineConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineConfigError";
  }
}
