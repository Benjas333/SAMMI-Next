# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].

## [Unreleased]

- /

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
