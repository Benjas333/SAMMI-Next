import readline from 'node:readline';
import colors from 'picocolors';

export interface LogOptions {
    clear?: boolean
    timestamp?: boolean
    environment?: string
}

export interface LogErrorOptions extends LogOptions {
    error?: Error | null
}

export type LogType = 'error' | 'warn' | 'info';
export type LogLevel = LogType | 'silent';

export interface Logger {
    info(msg: string, options?: LogOptions): void
    warn(msg: string, options?: LogOptions): void
    warnOnce(msg: string, options?: LogOptions): void
    error(msg: string, options?: LogErrorOptions): void
    clearScreen(type: LogTypes): void
    hasErrorLogged(error: Error): boolean
    hasWarned: boolean
}

export enum LogTypes {
    error = 1,
    warn,
    info,
}

export enum LogLevels {
    silent,
    error,
    warn,
    info,
}

let lastType: LogTypes | undefined
let lastMsg: string | undefined
let sameCount = 0

export interface LoggerOptions {
    prefix?: string
    allowClearScreen?: boolean
    customLogger?: Logger
    console?: Console
}

function clearScreen() {
    const repeatCount = process.stdout.rows - 2;
    const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : '';
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
}

let timeFormatter: Intl.DateTimeFormat
function getTimeFormatter() {
    timeFormatter ??= new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    });
    return timeFormatter;
}

export function createLogger(
    level: LogTypes = LogTypes.info,
    options: LoggerOptions = {},
): Logger {
    if (options.customLogger)
        return options.customLogger

    const loggedErrors = new WeakSet<Error>();
    const {
        prefix = '[sammi-next]',
        allowClearScreen = true,
        console = globalThis.console,
    } = options;
    const thresh = level;
    const canClearScreen =
        allowClearScreen && process.stdout.isTTY && !process.env.CI;
    const clear = canClearScreen ? clearScreen : () => { /* empty */ };

    function format(type: LogTypes, msg: string, options: LogErrorOptions = {}) {
        if (!options.timestamp) return msg;

        let tag = colors.bold(prefix);
        switch (type) {
            case LogTypes.info:
                tag = colors.cyan(tag);
                break;
            case LogTypes.warn:
                tag = colors.yellow(tag);
                break;
            case LogTypes.error:
                tag = colors.red(tag);
                break;
        }

        const environment = options.environment ? options.environment + ' ' : '';
        return `${colors.dim(getTimeFormatter().format(new Date()))} ${tag} ${environment}${msg}`;
    }

    function output(type: LogTypes, msg: string, options: LogErrorOptions = {}) {
        if (thresh < type) return;

        const method = type === LogTypes.info ? 'log' : LogTypes[type] as "log" | "error" | "warn";

        if (options.error) {
            loggedErrors.add(options.error);
        }
        if (!canClearScreen) {
            console[method](format(type, msg, options));
            return;
        }

        if (type === lastType && msg === lastMsg) {
            sameCount++;
            clear();
            console[method](
                format(type, msg, options),
                colors.yellow(`(x${sameCount + 1}`),
            )
            return;
        }

        sameCount = 0;
        lastMsg = msg;
        lastType = type;
        if (options.clear) clear()
        console[method](format(type, msg, options));
    }

    const warnedMessages = new Set<string>();

    const logger: Logger = {
        hasWarned: false,
        info(msg, options) {
            output(LogTypes.info, msg, options);
        },
        warn(msg, options) {
            logger.hasWarned = true;
            output(LogTypes.warn, msg, options);
        },
        warnOnce(msg, options) {
            if (warnedMessages.has(msg)) return;

            logger.hasWarned = true;
            output(LogTypes.warn, msg, options);
            warnedMessages.add(msg);
        },
        error(msg, options) {
            logger.hasWarned = true;
            output(LogTypes.error, msg, options);
        },
        clearScreen(type) {
            if (thresh < type) return;

            clear();
        },
        hasErrorLogged(error) {
            return loggedErrors.has(error);
        },
    }

    return logger;
}
