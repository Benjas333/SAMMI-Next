import fs from 'node:fs'
import path from "node:path";
import { BuildEnvironmentOptions } from "./build";
import { PackageCache } from "./packages";

const environmentPathRE = /^environments\.[^.]+$/;

export function isObject(value: unknown): value is Record<string, unknown> {
    return Object.prototype.toString.call(value) === '[object Object]';
}

export function arraify<T>(target: T | T[]): T[] {
    return Array.isArray(target) ? target : [target];
}

function mergeConfigRecursively(
    defaults: Record<string, unknown>,
    overrides: Record<string, unknown>,
    rootPath: string,
) {
    const merged: Record<string, unknown> = { ...defaults };

    for (const key in overrides) {
        if (!Object.hasOwn(overrides, key)) continue;

        const value = overrides[key];
        if (value == null) continue;

        const existing = merged[key];
        if (existing == null) {
            merged[key] = value
            continue;
        }

        if (Array.isArray(existing) || Array.isArray(value)) {
            merged[key] = [...arraify(existing), ...arraify(value)]
            continue;
        }
        if (isObject(existing) && isObject(value)) {
            merged[key] = mergeConfigRecursively(
                existing,
                value,
                rootPath && !environmentPathRE.test(rootPath)
                    ? `${rootPath}.${key}`
                    : key,
            )
            continue;
        }

        merged[key] = value;
    }

    return merged;
}

export function mergeConfig<
    D extends Record<string, any>,
    O extends Record<string, any>,
>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    defaults: D extends Function ? never : D,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    overrides: O extends Function ? never : O,
    isRoot = true,
): Record<string, any> {
    if (
        typeof defaults === 'function' ||
        typeof overrides === 'function'
    )
        throw new Error('Cannot merge config in form of callback');

    return mergeConfigRecursively(defaults, overrides, isRoot ? '' : '.');
}

type DeepWritable<T> =
    T extends ReadonlyArray<unknown>
        ? { -readonly [P in keyof T]: DeepWritable<T[P]> }
        : T extends RegExp
            ? RegExp
            : T[keyof T] extends Function
                ? T
                : { -readonly [P in keyof T]: DeepWritable<T[P]> }

type Equal<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? true : false;

type MaybeFallback<D, V> = undefined extends V ? Exclude<V, undefined> | D : V;

type MergeWithDefaultsResult<D, V> =
    Equal<D, undefined> extends true
        ? V
        : D extends Function | Array<any>
            ? MaybeFallback<D ,V>
            : V extends Function | Array<any>
                ? MaybeFallback<D, V>
                : D extends Record<string, any>
                    ? V extends Record<string, any>
                        ? {
                            [K in keyof D | keyof V]: K extends keyof D
                                ? K extends keyof V
                                    ? MergeWithDefaultsResult<D[K], V[K]>
                                    : D[K]
                                : K extends keyof V
                                    ? V[K]
                                    : never
                        }
                        : MaybeFallback<D, V>
                    : MaybeFallback<D, V>;

export function deepClone<T>(value: T): DeepWritable<T> {
    if (Array.isArray(value))
        return value.map((v) => deepClone(v)) as DeepWritable<T>;

    if (isObject(value)) {
        const cloned: Record<string, any> = {};
        for (const key in value) {
            if (!Object.hasOwn(value, key)) continue;

            cloned[key] = deepClone(value[key]);
        }
        return cloned as DeepWritable<T>;
    }

    if (typeof value === 'function')
        return value as DeepWritable<T>;

    if (value instanceof RegExp)
        return new RegExp(value) as DeepWritable<T>;

    if (typeof value === 'object' && value != null)
        throw new Error('Cannot deep clone non-plain object');

    return value as DeepWritable<T>;
}

function mergeWithDefaultsRecursively<
    D extends Record<string, any>,
    V extends Record<string, any>,
>(defaults: D, values: V): MergeWithDefaultsResult<D, V> {
    const merged: Record<string, any> = defaults;
    for (const key in values) {
        if (!Object.hasOwn(values, key)) continue;

        const value = values[key];
        if (value === undefined) continue;

        const existing = merged[key];
        if (existing === undefined) {
            merged[key] = value;
            continue;
        }

        if (isObject(existing) && isObject(value)) {
            merged[key] = mergeWithDefaultsRecursively(existing, value);
            continue;
        }

        merged[key] = value;
    }
    return merged as MergeWithDefaultsResult<D, V>;
}

export function mergeWithDefaults<
    D extends Record<string, any>,
    V extends Record<string, any>,
>(defaults: D, values: V): MergeWithDefaultsResult<DeepWritable<D>, V> {
    const clonedDefaults = deepClone(defaults);
    return mergeWithDefaultsRecursively(clonedDefaults, values);
}

export function displayTime(time: number): string {
    if (time < 1_000)
        return `${time}ms`;

    time = time / 1_000;

    if (time < 60)
        return `${time.toFixed(2)}s`

    const mins = Math.floor(time / 60);
    const seconds = Math.round(time % 60);

    if (seconds === 60)
        return `${mins + 1}m`

    return `${mins}m${seconds < 1 ? '' : ` ${seconds}s`}`;
}

export const isWindows: boolean =
    typeof process !== 'undefined' && process.platform === 'win32';

const windowsSlashRE = /\\/g
export function slash(p: string): string {
    return p.replace(windowsSlashRE, '/');
}

export function normalizePath(id: string): string {
    return path.posix.normalize(isWindows ? slash(id) : id);
}

export function isFilePathESM(
    filePath: string,
    packageCache?: PackageCache,
): boolean {
    if (/\.m[jt]s$/.test(filePath)) return true;

    if (/\.c[jt]s$/.test(filePath)) return false;

    try {
        const pkg = findNearestPackageData(path.dirname(filePath), packageCache);
        return pkg?.data.type === 'module';
    } catch {
        return false;
    }
}

export function tryStatSync(file: string): fs.Stats | undefined {
    try {
        return fs.statSync(file, { throwIfNoEntry: false });
    } catch { /* empty */ }
}
