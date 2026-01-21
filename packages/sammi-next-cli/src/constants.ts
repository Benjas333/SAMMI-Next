import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export { version as VERSION } from '../package.json';

export const DEFAULT_EXTENSIONS: string[] = [
    '.mjs',
    '.js',
    '.mts',
    '.ts',
    '.jsx',
    '.tsx',
    '.json',
]

export const DEFAULT_CONFIG_FILES: string[] = [
    'sammi.config.js',
    'sammi.config.mjs',
    'sammi.config.cjs',
    'sammi.config.ts',
    'sammi.config.mts',
    'sammi.config.cts',
    'sammi.config.json',
]

export const JS_TYPES_RE = /\.(?:j|t)sx?$|\.mjs$/

export const OPTIMIZABLE_ENTRY_RE = /\.[cm]?[jt]s$/

export const SNEXT_PACKAGE_DIR = resolve(
    fileURLToPath(import.meta.url),
    '../../..',
);
