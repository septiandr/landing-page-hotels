/** Error konfigurasi payment (env tidak lengkap / provider dilarang). */
export class PaymentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentConfigError";
  }
}

/** Error dari API payment gateway (HTTP status, message vendor). */
export class PaymentApiError extends Error {
  constructor(
    public status: string | number,
    message: string,
  ) {
    super(message);
    this.name = "PaymentApiError";
  }
}
