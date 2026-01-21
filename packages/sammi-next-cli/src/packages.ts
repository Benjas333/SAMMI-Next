import fs from 'node:fs';
import path from "node:path";
import { InternalResolveOptions } from "./resolve";
import { normalizePath, tryStatSync } from "./utils";

export interface PackageData {
    dir: string,
    hasSideEffects: (id: string) => boolean | 'no-treeshake' | null;
    setResolvedCache: (
        key: string,
        entry: string,
        options: InternalResolveOptions
    ) => void
    getResolvedCache: (
        key: string,
        options: InternalResolveOptions,
    ) => string | undefined
    data: {
        [field: string]: any
        name: string
        type: string
        version: string
        main: string
        module: string
        browser: string | Record<string, string | false>
        exports: string | Record<string, any> | string[]
        imports: Record<string, any>
        dependencies: Record<string, string>
    }
}

export type PackageCache = Map<string, PackageData>;

function getFnpdCacheKey(basedir: string) {
    return `fnpd_${basedir}`;
}

function traverseBetweenDirs(
    longerDir: string,
    shorterDir: string,
    cb: (dir: string) => void,
) {
    while (longerDir !== shorterDir) {
        cb(longerDir);
        longerDir = path.dirname(longerDir);
    }
}

function getFnpdCache(
    packageCache: PackageCache,
    basedir: string,
    originalBasedir: string,
) {
    const cacheKey = getFnpdCacheKey(basedir);
    const pkgData = packageCache.get(cacheKey);
    if (pkgData) {
        traverseBetweenDirs(originalBasedir, basedir, (dir) => {
            packageCache.set(getFnpdCacheKey(dir), pkgData)
        });
        return pkgData;
    }
}

function setFnpdCache(
    packageCache: PackageCache,
    pkgData: PackageData,
    basedir: string,
    originalBasedir: string,
) {
    packageCache.set(getFnpdCacheKey(basedir), pkgData);
    traverseBetweenDirs(originalBasedir, basedir, (dir) => {
        packageCache.set(getFnpdCacheKey(dir), pkgData);
    });
}

function getResolveCacheKey(key: string, options: InternalResolveOptions) {
    return [
        key,
        options.isRequire
    ]
}

export function loadPackageData(pkgPath: string): PackageData {
    const data = JSON.parse(stripBomTag(fs.readFileSync(pkgPath, 'utf-8')));
    const pkgDir = normalizePath(path.dirname(pkgPath));
    const { sideEffects } = data;
    let hasSideEffects: (id: string) => boolean | null;
    if (typeof sideEffects === 'boolean') {
        hasSideEffects = () => sideEffects;
    } else if (Array.isArray(sideEffects)) {
        if (sideEffects.length <= 0) {
            hasSideEffects = () => false;
        } else {
            const finalPackageSideEffects = sideEffects.map(sideEffect => {
                if (sideEffect.includes('/'))
                    return sideEffect;

                return `**/${sideEffect}`;
            })

            hasSideEffects = createFilter(finalPackageSideEffects, null, {
                resolve: pkgDir,
            });
        }
    } else {
        hasSideEffects = () => null;
    }

    const resolvedCache: Record<string, string | undefined> = {};
    const pkg: PackageData = {
        dir: pkgDir,
        data,
        hasSideEffects,
        setResolvedCache(key, entry, options) {
            resolvedCache[getResolveCacheKey(key, options)] = entry;
        },
        getResolvedCache(key, options) {
            return resolvedCache[getResolveCacheKey(key, options)];
        },
    }

    return pkg;
}

export function findNearestPackageData(
    basedir: string,
    packageCache?: PackageCache,
): PackageData | null {
    const originalBasedir = basedir;
    while (basedir) {
        if (packageCache) {
            const cached = getFnpdCache(packageCache, basedir, originalBasedir);
            if (cached) return cached;
        }

        const pkgPath = path.join(basedir, 'package.json');
        if (tryStatSync(pkgPath)?.isFile()) {
            try {
                const pkgData = loadPackageData(pkgPath);

                if (packageCache) {
                    setFnpdCache(packageCache, pkgData, basedir, originalBasedir);
                }

                return pkgData;
            } catch { /* empty */ }
        }

        const nextBasedir = path.dirname(basedir);
        if (nextBasedir === basedir) break;
        basedir = nextBasedir;
    }

    return null;
}
