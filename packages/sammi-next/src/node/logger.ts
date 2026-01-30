import readline from 'node:readline';
import colors from 'picocolors';
import { ERROR_PREFIX, INFO_PREFIX, LOGGER_PREFIX, SUCCESS_PREFIX, WARN_PREFIX } from './constants';
import { LogErrorOptions, Logger, LogLevel, LogType } from '@shared/logger-types';

let lastType: LogLevel | undefined;
let lastMsg: string | undefined;
let sameCount = 0;

let timeFormatter: Intl.DateTimeFormat
function getTimeFormatter() {
    timeFormatter ??= new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    });
    return timeFormatter;
}

function clearScreen() {
    const repeatCount = process.stdout.rows - 2;
    const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : '';
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
}

interface LoggerOptions {
    prefix?: string
    allowClearScreen?: boolean

    customLogger?: Logger
    console?: Console
}

export function createLogger(
    level: LogLevel = LogLevel.info,
    options: LoggerOptions = {},
): Logger {
    if (options.customLogger)
        return options.customLogger;

    const loggedErrors = new WeakSet<Error>();
    const {
        prefix = LOGGER_PREFIX,
        allowClearScreen = true,
        console = globalThis.console,
    } = options;
    const thresh = level - 1;
    const canClearScreen = allowClearScreen && process.stdout.isTTY && !process.env.CI;
    const clear = canClearScreen ? clearScreen : () => { /* empty */ };

    function format(type: LogLevel, msg: string, options: LogErrorOptions = {}) {
        let tag = '';
        switch (type) {
            case LogLevel.info:
                tag = colors.cyan(`${INFO_PREFIX} ${prefix}`);
                break;
            case LogLevel.success:
                tag = colors.green(`${SUCCESS_PREFIX} ${prefix}`);
                break;
            case LogLevel.warn:
                tag = colors.yellow(`${WARN_PREFIX} ${prefix}`);
                break;
            case LogLevel.error:
                tag = colors.red(`${ERROR_PREFIX} ${prefix}`);
                break;
        }
        if (!options.timestamp)
            return `${tag} ${msg}`;

        return `${colors.dim(getTimeFormatter().format(new Date()))} ${tag} ${msg}`;
    }

    function output(type: LogLevel, msg: string, options: LogErrorOptions = {}) {
        if (type.valueOf() <= thresh) return;

        const level = type === LogLevel.success ? 'info' : LogLevel[type] as LogType;
        const method = console[level];
        const formatted = () => {
            return format(type, msg, options);
        };
        const log = (isRepeated = false) => {
            if (!isRepeated) {
                method(formatted());
                return;
            }

            sameCount++;
            clear();
            method(
                formatted(),
                colors.yellow(`(x${sameCount + 1})`),
            );
        };

        if (options.error) {
            loggedErrors.add(options.error);
        }
        if (!canClearScreen) {
            log();
            return;
        }

        if (type === lastType && msg === lastMsg) {
            log(true);
            return;
        }

        sameCount = 0;
        lastMsg = msg;
        lastType = type;
        if (options.clear) {
            clear();
        }
        log();
    }

    const warnedMessages = new Set<string>();

    const logger: Logger = {
        hasWarned: false,
        info(msg, options) {
            output(LogLevel.info, msg, options);
        },
        success(msg, options) {
            output(LogLevel.success, msg, options);
        },
        warn(msg, options) {
            this.hasWarned = true;
            output(LogLevel.warn, msg, options);
        },
        warnOnce(msg, options) {
            if (warnedMessages.has(msg)) return;

            logger.hasWarned = true;
            output(LogLevel.warn, msg, options);
            warnedMessages.add(msg);
        },
        error(msg, options) {
            this.hasWarned = true;
            output(LogLevel.error, msg, options);
        },
        clearScreen(level) {
            if (thresh >= level.valueOf()) {
                clear();
            }
        },
        hasErrorLogged(error) {
            return loggedErrors.has(error);
        },
    }

    return logger;
}
export { LogLevel };

