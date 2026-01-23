# create-sammi-next

## Scaffolding Your First SAMMI Next Project

With NPM:

```bash
npm create sammi-next@latest
```

With Yarn:

```bash
yan create vite
```

With PNPM:

```bash
pnpm create sammi-next
```

With Bun:

```bash
bun create sammi-next
```

With Deno:

```bash
deno init --npm sammi-next
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold the TypeScript sample extension template, run:
```bash
# npm
npm create sammi-next@latest my-sammi-extension -- --template sample-ts

# yarn
yarn create sammi-next my-sammi-extension --template sample-ts

# pnpm
pnpm create sammi-next my-sammi-extension --template sample-ts

# Bun
bun create sammi-next my-sammi-extension --template sample-ts

# Deno
deno init --npm sammi-next my-sammi-extension --template sample-ts
```

Currently supported template presets include:
- `vanilla-ts`
- `vanilla-js`
- `sample-ts`
- `sample-js`
- `minimal-ts`
- `minimal-js`

You can use `.` for the project name to scaffold in the current directory.

## TODO
- `react-ts`
- `react-js`
- `react-swc-ts`
- `react-swc-js`
- `svelte-ts`
- `svelte-js`
