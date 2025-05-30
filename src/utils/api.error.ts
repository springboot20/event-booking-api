class ApiError extends Error {
  /**
   *
   * @param {number} statusCode
   * @param {string} message
   * @param {any[]} errors
   * @param {string} stack
   * @param {boolean} success
   */

  public statusCode: number;
  public message: string;
  public errors?: any[];
  public success?: boolean;
  public stack?: string | undefined;
  private data?: null;

  constructor(statusCode: number, message: string, errors?: any[], stack?: string) {
    super(message);
    this.statusCode = statusCode;
    this.stack = stack;
    this.data = null;
    this.errors = errors;
    this.message = message;
    this.success = false

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
