export enum LogLevel {
    info,
    success,
    warn,
    error,
    silent,
}
export const LogLevels = Object.keys(LogLevel).filter(key => isNaN(Number(key)));
export type LogLevelKey = keyof typeof LogLevel
export type LogType = keyof Omit<typeof LogLevel, "silent" | "success">;


export interface Logger {
    info(msg: string, options?: LogOptions): void
    success(msg: string, options?: LogOptions): void
    warn(msg: string, options?: LogOptions): void
    warnOnce(msg: string, options?: LogOptions): void
    error(msg: string, options?: LogErrorOptions): void
    clearScreen(level: LogLevel): void
    hasErrorLogged(error: Error): boolean,
    hasWarned: boolean
}

export interface LogOptions {
    clear?: boolean
    timestamp?: boolean
}

export interface LogErrorOptions extends LogOptions {
    error?: Error | null;
}
