// Unified API error codes - docs/api/api-spec.md §1.3 (ADR-008)

export const ErrorCodes = {
  OK: 0,
  BAD_PARAM: 4000,
  NOT_FOUND: 4040,
  UNAUTHORIZED: 4010,
  RATE_LIMITED: 4290,
  INTERNAL: 5000,
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly data: unknown;

  constructor(code: ErrorCode, httpStatus: number, message: string, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.data = data;
  }

  static badParam(message: string, field?: string): ApiError {
    return new ApiError(ErrorCodes.BAD_PARAM, 400, message, field ? { field } : null);
  }

  static notFound(message: string): ApiError {
    return new ApiError(ErrorCodes.NOT_FOUND, 404, message);
  }

  static unauthorized(message: string): ApiError {
    return new ApiError(ErrorCodes.UNAUTHORIZED, 401, message);
  }

  static rateLimited(message: string): ApiError {
    return new ApiError(ErrorCodes.RATE_LIMITED, 429, message);
  }

  static internal(message: string): ApiError {
    return new ApiError(ErrorCodes.INTERNAL, 500, message);
  }
}
