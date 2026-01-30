import path from 'node:path';
import { fileURLToPath } from 'node:url';

export { version as VERSION } from '../../package.json';

export const DEFAULT_CONFIG_EXTENSIONS: string[] = [
    '.mts',
    '.ts',
    '.cts',
    '.mjs',
    '.js',
    '.cjs',
    '.json',
]

export const GLOBAL_NAME = "SAMMIExtensions";

export const LOGGER_PREFIX = '[sammi-next]';
export const INFO_PREFIX = 'ℹ';
export const SUCCESS_PREFIX = '✔';
export const WARN_PREFIX = '⚠';
export const ERROR_PREFIX = '✗';

function findPackageDir() {
    let initPath = fileURLToPath(import.meta.url);
    while (!initPath.endsWith('sammi-next')) {
        initPath = path.resolve(initPath, '..');
    }
    return initPath;
}
export const SAMMI_NEXT_PACKAGE_DIR = findPackageDir();
