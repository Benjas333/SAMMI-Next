# create-sammi-next

## Scaffolding Your First SAMMI Next Project

With NPM:
`npm create sammi-next@latest`

With Yarn:
`yan create vite`

With PNPM:
`pnpm create sammi-next`

With Bun:
`bun create sammi-next`

With Deno:
`deno init --npm sammi-next`

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold the TypeScript sample extension template, run:
```bash
npm create sammi-next@latest my-sammi-extension -- --template sample-ts

yarn create sammi-next my-sammi-extension -- --template sample-ts

pnpm create sammi-next my-sammi-extension -- --template sample-ts

bun create sammi-next my-sammi-extension -- --template sample-ts

deno init --npm sammi-next my-sammi-extension -- --template sample-ts
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
