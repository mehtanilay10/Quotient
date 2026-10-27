import { classifyError } from "./errorHandler";

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    jitter: boolean;
  }
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, jitter } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const appError = classifyError(error);
      if (appError.statusCode === 401) {
        break;
      }

      const baseDelay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      const delay = jitter ? baseDelay + Math.random() * baseDelay : baseDelay;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw classifyError(lastError);
}
