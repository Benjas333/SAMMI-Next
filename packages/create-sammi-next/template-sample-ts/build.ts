import fs from 'fs';
import minimist from 'minimist';
import path from "path";
import { build } from 'tsdown';
import chokidar from 'chokidar';
import { FullExtensionConfig } from 'sammi-next';

const argv = minimist(process.argv.slice(2)) as {
    _: never,
    watch?: any,
    dev?: any,
};

const lib_prefix = '[sammi-next]';
const isWatch = !!argv.watch;
const isDev = !!argv.dev;
const configPath = path.join(process.cwd(), 'sammi.config.json');
let config: FullExtensionConfig = {
    name: 'Extension Sample',
    id: 'extension-sample',
    version: '0.0.1',
    entry: 'src/script.ts',
    out: {
        dir: 'dist',
        js: 'extension.js',
        sef: 'extension.sef'
    }
}
try {
    const user_config = require(configPath);
    config = { ...config, ...user_config };
} catch (e) {}

class ExtensionBuilder {
    name: string
    id: string
    info: string
    version: string

    entry: string
    externalPath: string
    overPath: string

    outDir: string
    outJS: string
    outSEF: string

    required_fields: Array<{
        header: string,
        content: string,
    }>

    external: string | null
    command: boolean | null
    commandRegex: RegExp
    script: string | null
    over: string

    constructor(config: FullExtensionConfig) {
        this.name = config.name || 'Extension Sample';
        this.id = config.id || this.name.toLowerCase().replace(/\s/g, '-');
        this.info = config.info || '';
        this.version = config.version || '';

        this.entry = config.entry || 'src/main.ts';
        this.externalPath = config.external || 'src/external.html';
        this.overPath = config.over || 'over.json';

        this.outDir = config.out.dir || 'dist';
        this.outJS = config.out.js || 'extension.js';
        this.outSEF = config.out.sef || 'extension.sef';

        this.required_fields = [
            {
                header: "extension_name",
                content: this.name,
            },
            {
                header: "extension_info",
                content: this.info,
            },
            {
                header: "extension_version",
                content: this.version,
            },
        ]

        this.external = null;
        this.command = null;
        this.commandRegex = /\w+\(\w+,\s*{\s*default:/gm;
        this.script = null;
        this.over = '{}';
    }

    get globalName() {
        // return `SAMMIExtensions["${this.id}"]`;
        return `SAMMIExtensions.${this.id}`;
    }

    updateExternal() {
        if (!fs.existsSync(this.externalPath)) return;

        const content = fs.readFileSync(this.externalPath, 'utf-8');
        this.external = `<div id="${this.id}-external">
${content}
</div>`;
    }

    updateScript() {
        const scriptPath = path.join(this.outDir, this.outJS);
        if (!fs.existsSync(scriptPath)) return;

        this.script = fs.readFileSync(scriptPath, 'utf-8');
    }

    updateOver() {
        if (!fs.existsSync(this.overPath)) return;

        this.over = fs.readFileSync(this.overPath, 'utf-8');
    }

    buildSEF() {
        const content = [];
        for (const field of this.required_fields) {
            content.push(`[${field.header}]`, field.content, '');
        }

        this.updateExternal();
        content.push('[insert_external]', this.external || '', '');

        this.updateScript();
        if (this.script) {
            this.command = this.commandRegex.test(this.script);
        }
        content.push('[insert_command]', this.command ? `${this.globalName}.default();` : '', '');
        content.push('[insert_hook]', '', '');
        content.push('[insert_script]', this.script || '', '');
        this.updateOver();
        content.push('[insert_over]', this.over && this.over != '{}' ? this.over : '', '');
        return content.join('\n');
    }

    buildPreview() {
        this.updateExternal();
        this.updateScript();
        return fs.readFileSync('.sammi/preview.blueprint.html', 'utf-8')
        .replace(/{{EXTERNAL}}/, this.external || '')
        .replace(/{{SCRIPT}}/, this.script || '');
    }
}

const extension = new ExtensionBuilder(config);

if (!fs.existsSync(extension.outDir))
    fs.mkdirSync(extension.outDir, { recursive: true });

async function buildOnce() {
    try {
        await build({
            entry: [extension.entry],
            outDir: extension.outDir,
            platform: 'browser',
            format: 'iife',
            target: ['es2020'],
            sourcemap: false,
            minify: !isDev,
            noExternal: ['**'],
            outputOptions: {
                entryFileNames: extension.outJS,
                extend: true,
                name: `SAMMIExtensions.${extension.id}`,
                exports: 'named',
            },
        });

        console.log(`✔ ${lib_prefix} built ${extension.outJS}`);
        fs.writeFileSync(path.join(extension.outDir, extension.outSEF), extension.buildSEF(), 'utf-8');
        console.log(`✔ ${lib_prefix} built ${extension.outSEF}`);
        fs.writeFileSync(path.join(extension.outDir, 'preview.html'), extension.buildPreview(), 'utf-8');
        console.log(`✔ ${lib_prefix} built preview.html`);
    } catch (error) {
        console.error(lib_prefix, 'build error:', error);
    }
}

if (!isWatch) {
    buildOnce();
} else {
    const watcher = chokidar.watch(path.join(extension.entry, '..'), { ignoreInitial: true });
    let timer: NodeJS.Timeout | null = null;
    watcher.on('all', (event, p) => {
        console.log(`${lib_prefix} ${event}: ${p}`);
        if (timer)
            clearTimeout(timer);

        timer = setTimeout(() => buildOnce().catch(e => console.error(e)), 100);
    });
    (async () => {
        await buildOnce();
        console.log(lib_prefix, 'watching for changes...');
    })();
}
