const isProduction = process.env.NODE_ENV === "production";

export class Logger {
  private getTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const ms = now.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

  debug(module: string, ...args: unknown[]): void {
    if (isProduction) return;
    console.debug(`[${this.getTimestamp()}] [${module}]`, ...args);
  }

  info(module: string, ...args: unknown[]): void {
    if (isProduction) return;
    console.info(`[${this.getTimestamp()}] [${module}]`, ...args);
  }

  warn(module: string, ...args: unknown[]): void {
    if (isProduction) return;
    console.warn(`[${this.getTimestamp()}] [${module}]`, ...args);
  }

  error(module: string, ...args: unknown[]): void {
    if (isProduction) return;
    console.error(`[${this.getTimestamp()}] [${module}]`, ...args);
  }
}

export const logger = new Logger();
