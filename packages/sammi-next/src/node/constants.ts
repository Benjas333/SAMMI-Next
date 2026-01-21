import path from 'node:path';
import { fileURLToPath } from 'node:url';
import colors from 'picocolors'

export { version as VERSION } from '../../package.json';

export const DEFAULT_CONFIG_EXTENSIONS: string[] = [
    '.mjs',
    '.js',
    '.mts',
    '.ts',
]

export const GLOBAL_NAME = "SAMMIExtensions";

export const BUILD_PREFIX = colors.blue("[sammi-next]");
export const GREEN_CHECK = colors.green('✔');
export const RED_X = colors.red('✗');

function findPackageDir() {
    let initPath = fileURLToPath(import.meta.url);
    while (!initPath.endsWith('sammi-next')) {
        initPath = path.resolve(initPath, '..');
    }
    return initPath;
}
export const SAMMI_NEXT_PACKAGE_DIR = findPackageDir();
