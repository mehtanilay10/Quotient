export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NetworkError extends AppError {
  constructor(
    message = "A network error occurred. Please check your internet connection and try again.",
    cause?: unknown
  ) {
    super("NETWORK_ERROR", message, 503, cause);
    this.name = "NetworkError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "The request was invalid. Please check your input and try again.",
    cause?: unknown
  ) {
    super("VALIDATION_ERROR", message, 400, cause);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "You are not authorized. Please sign in again.", cause?: unknown) {
    super("AUTH_ERROR", message, 401, cause);
    this.name = "AuthError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred. Please try again later.", cause?: unknown) {
    super("DATABASE_ERROR", message, 500, cause);
    this.name = "DatabaseError";
  }
}

export function classifyError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof TypeError) {
    if (error.message.includes("fetch") || error.message.includes("Network")) {
      return new NetworkError(undefined, error);
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("unauthorized") ||
      msg.includes("authentication") ||
      msg.includes("jwt") ||
      msg.includes("401")
    ) {
      return new AuthError(error.message, error);
    }
    if (
      msg.includes("validation") ||
      msg.includes("invalid") ||
      msg.includes("payload") ||
      msg.includes("400")
    ) {
      return new ValidationError(error.message, error);
    }
    if (
      msg.includes("database") ||
      msg.includes("prisma") ||
      msg.includes("connection") ||
      msg.includes("500")
    ) {
      return new DatabaseError(error.message, error);
    }
    if (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("timeout") ||
      msg.includes("503")
    ) {
      return new NetworkError(error.message, error);
    }
    return new AppError(
      "UNKNOWN_ERROR",
      error.message || "An unexpected error occurred.",
      500,
      error
    );
  }

  return new AppError("UNKNOWN_ERROR", "An unexpected error occurred.", 500, error);
}

export function toUserMessage(error: unknown): string {
  const appError = classifyError(error);
  return appError.message;
}

export function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const appError = classifyError(error);
  console.error(`[${context}] ${appError.code}: ${appError.message}`, {
    statusCode: appError.statusCode,
    cause: appError.cause,
    ...extra,
  });
}
