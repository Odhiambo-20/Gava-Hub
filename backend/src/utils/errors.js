/**
 * Application error that maps to the frontend ApiErrorBody shape:
 * { status?, message?, violations? }
 */
export class AppError extends Error {
  constructor(message, status = 400, violations = undefined) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.violations = violations;
  }
}

export function assert(condition, message, status = 400, violations) {
  if (!condition) throw new AppError(message, status, violations);
}
