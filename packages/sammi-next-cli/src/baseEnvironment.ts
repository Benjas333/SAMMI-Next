import { ResolvedConfig, ResolvedEnvironmentOptions } from "./config";
import colors from 'picocolors';
import { Logger } from "./logger";

const environmentColors = [
    colors.blue,
    colors.magenta,
    colors.green,
    colors.gray,
];

export class PartialEnvironment {
    getTopLevelConfig(): ResolvedConfig {
        return this._topLevelConfig
    }

    config: ResolvedConfig & ResolvedEnvironmentOptions

    logger: Logger

    /** @internal */
    _options: ResolvedEnvironmentOptions
    /** @internal */
    _topLevelConfig: ResolvedConfig

    constructor(
        public name: string,
        topLevelConfig: ResolvedConfig,
        options: ResolvedEnvironmentOptions = topLevelConfig.environments[name],
    ) {
        if (!/^[\w$]+$/.test(name))
            throw new Error(`Invalid environment name "${name}". Environment names must only contain alphanumeric characters and "$", "_".`);

        this._topLevelConfig = topLevelConfig
        this._options = options
        this.config = new Proxy(
            options as ResolvedConfig & ResolvedEnvironmentOptions,
            {
                get: (target, prop: keyof ResolvedConfig) => {
                    if (prop in target) {
                        return this._options[prop as keyof ResolvedEnvironmentOptions]
                    }
                    return this._topLevelConfig[prop]
                },
            },
        )
        const environment = colors.dim(`(${this.name})`);
        const colorIndex =
            [...this.name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % environmentColors.length;
        const infoColor = environmentColors[colorIndex || 0];
        this.logger = {
            get hasWarned() {
                return topLevelConfig.logger.hasWarned;
            },
            info(msg, options) {
                return topLevelConfig.logger.info(msg, {
                    ...options,
                    environment: infoColor(environment),
                });
            },
            warn(msg, options) {
                return topLevelConfig.logger.warn(msg, {
                    ...options,
                    environment: colors.yellow(environment),
                });
            },
            warnOnce(msg, options) {
                return topLevelConfig.logger.warnOnce(msg, {
                    ...options,
                    environment: colors.yellow(environment),
                });
            },
            error(msg, options) {
                return topLevelConfig.logger.error(msg, {
                    ...options,
                    environment: colors.red(environment),
                });
            },
            clearScreen(type) {
                return topLevelConfig.logger.clearScreen(type);
            },
            hasErrorLogged(error) {
                return topLevelConfig.logger.hasErrorLogged(error);
            },
        }
    }
}

export class BaseEnvironment extends PartialEnvironment {
    /** @internal */
    _initiated = false

    constructor(
        name: string,
        config: ResolvedConfig,
        options: ResolvedEnvironmentOptions = config.environments[name],
    ) {
        super(name, config, options)
    }
}
