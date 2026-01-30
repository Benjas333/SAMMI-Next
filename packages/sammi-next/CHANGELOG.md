# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [Unreleased]

- /

## [1.7.0] - 2026-01-30

### Added

- --config, --logLevel, and --clearScreen cli global params (node).
- --watch cli build param (node).
- `build` alias for sammi-next (node).
- validation for modes and logLevels strings (node).
- `.cts`, `.cjs`, and `.json` extensions for sammi.config.* (node).
- more icons for logs (node).
- Logger class and interface (node).
- `nextConfig.mode`, `nextConfig.logLevel`, `nextConfig.customLogger`, `nextConfig.clearScreen`, and `nextConfig.watch` options for sammi.config.* (browser).

### Changed

- changed directory runtime/ to browser/ (browser).
- moved some interfaces into shared/*-types.ts (both).
- improved the regex to determine if extension entry has a default export (to know whether to insert \[insert_command\] section) (node).
- slightly improved readability (both).
- improved logs because of the Logger class (node).
- improved --help texts (node).
- highly improved config merging and handling (node).

### Fixed

- \[insert_command\] section was not being inserted when building (node).

## [1.6.1] - 2026-01-25

### Fixed

- Ajv crash on cli (node).

## [1.6.0] - 2026-01-24

### Added

- `author` param in defineConfig and ExtensionConfig (both).

### Changed

- When using `initExtension()`, `info` will not be possibly undefined and will default to an empty string in the returned parsed config (browser).

## [1.5.4] - 2026-01-22

### Fixed

- inlineOnly warning for sammi-next/browser (node).

## [1.5.3] - 2026-01-22

### Added

- tsdownConfig for sammi.config.* (both).

## [1.5.2] - 2026-01-22

### Added

- node polyfills on building (neutral).
- SAMMI and sammiclient globals from sammi-bridge-types (browser).
- SAMMIExtensions JSDoc (browser).

### Removed

- Banner `/// <reference types="sammi-bridge-types" />` on build (neutral).
- `/// <reference types="sammi-bridge-types" />` on index.ts (browser).

## [1.5.1] - 2026-01-22

### Fixed

- Types in function parameters (browser).

## [1.5.0] - 2026-01-22

### Changed

- Code rewrite in general.

### Deprecated

- All previous releases.

### Fixed

- EventEmitter being compiled without being used.

## [1.0.0] - 2026-01-21

- Initial release.

<!-- Links -->
[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html
