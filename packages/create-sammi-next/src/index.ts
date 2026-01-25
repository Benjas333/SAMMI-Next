import fs from 'node:fs';
import path from 'node:path'
import mri from 'mri';
import * as prompts from '@clack/prompts';
import colors from 'picocolors';
import { fileURLToPath } from 'node:url';
import { version as VERSION } from '../package.json';

const {
    blue,
    gray,
    green,
    magenta,
    yellow,
} = colors;

const argv = mri<{
    template?: string
    name?: string
    help?: boolean
    overwrite?: boolean
    interactive?: boolean
}>(process.argv.slice(2), {
    boolean: ['help', 'overwrite', 'interactive'],
    alias: { h: 'help', t: 'template', i: 'interactive', n: 'name' },
    string: ['template'],
});
const cwd = process.cwd();

const helpMessage = `\
create-sammi-next/${VERSION}

Usage create-sammi-next [OPTION]... [EXTENSION_ID]

Create a new SAMMI Next extension project in TypeScript or JavaScript.
When running in TTY, the CLI will start in interactive mode.

Options:
    -t, --template NAME                 use a specific template
    -n, --name EXTENSION_NAME           define the extension name
    --interactive, --no-interactive     force interactive / non-interactive mode

Available templates:
${green     ('vanilla-ts        vanilla-js')}
${magenta   ('sample-ts         sample-js')}
${gray      ('blank-ts          blank-js')}`;
// TODO: Add react and svelte templates

type ColorFunc = (str: string | number) => string;
interface TemplateVariant {
    name: string
    display: string
    color: ColorFunc
    customCommand?: string
}
interface Template {
    name: string
    display: string
    color: ColorFunc
    variants: TemplateVariant[]
}

const TEMPLATES_OPTIONS: Template[] = [
    {
        name: 'vanilla',
        display: 'Vanilla',
        color: magenta,
        variants: [
            {
                name: 'vanilla-ts',
                display: 'TypeScript',
                color: blue,
            },
            {
                name: 'vanilla-js',
                display: 'JavaScript',
                color: yellow,
            },
            {
                name: 'sample-ts',
                display: 'TypeScript (sample + comments)',
                color: blue,
            },
            {
                name: 'sample-js',
                display: 'JavaScript (sample + comments)',
                color: yellow,
            },
        ],
    },
    {
        name: "minimal",
        display: "Minimal (barebone)",
        color: gray,
        variants: [
            {
                name: 'minimal-ts',
                display: 'TypeScript',
                color: blue,
            },
            {
                name: 'minimal-js',
                display: 'JavaScript',
                color: yellow,
            },
        ],
    },
    // {
    //     name: 'react',
    //     display: 'React',
    //     color: cyan,
    //     variants: [
    //         {
    //             name: 'react-ts',
    //             display: 'TypeScript',
    //             color: blue,
    //         },
    //         {
    //             name: 'react-swc-ts',
    //             display: 'TypeScript + SWC',
    //             color: blue,
    //         },
    //         {
    //             name: 'react-js',
    //             display: 'JavaScript',
    //             color: yellow,
    //         },
    //         {
    //             name: 'react-swc-js',
    //             display: 'JavaScript + SWC',
    //             color: yellow,
    //         },
    //     ]
    // },
    // {
    //     name: 'svelte',
    //     display: 'Svelte',
    //     color: red,
    //     variants: [
    //         {
    //             name: 'svelte-ts',
    //             display: 'TypeScript',
    //             color: blue,
    //         },
    //         {
    //             name: 'svelte-js',
    //             display: 'JavaScript',
    //             color: yellow,
    //         },
    //         {
    //             name: 'custom-svelte-kit',
    //             display: 'SvelteKit ↗',
    //             color: red,
    //             customCommand: 'npm exec sv create TARGET_DIR',
    //         },
    //     ]
    // },
];

const TEMPLATES = TEMPLATES_OPTIONS.map(f => f.variants.map(v => v.name)).reduce(
    (a, b) => a.concat(b),
    [],
);

const renameFiles: Record<string, string> = {
    _gitignore: '.gitignore',
};

const defaultExtensionName = 'My Extension';

async function init() {
    if (argv.help) {
        console.log(helpMessage);
        return;
    }

    const argExtensionID = argv._[0]
        ? formatTargetDir(String(argv._[0]))
        : undefined;

    const argTemplate = argv.template;
    const argName = argv.name;
    const argOverwrite = argv.overwrite;
    const argInteractive = argv.interactive;

    const interactive = argInteractive ?? process.stdin.isTTY;

    const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
    const cancel = () => prompts.cancel('Operation cancelled');

    // 1. Get extension name
    let extensionName = argName;
    if (!extensionName) {
        if (!interactive) {
            extensionName = defaultExtensionName;
        } else {
            const projectName = await prompts.text({
                message: 'Extension name:',
                defaultValue: defaultExtensionName,
                placeholder: defaultExtensionName,
                validate: (value) => { if (!isValidExtensionName(value.trim())) return 'Invalid extension name' }
            });
            if (prompts.isCancel(projectName)) return cancel();

            extensionName = projectName.trim();
        }
    }
    const defaultExtensionID = toValidExtensionID(extensionName);

    // 2. Get extension ID and target dir
    let extensionID = argExtensionID;
    if (!extensionID) {
        if (!interactive) {
            extensionID = defaultExtensionID;
        } else {
            const projectID = await prompts.text({
                message: 'Extension ID:',
                defaultValue: defaultExtensionID,
                placeholder: defaultExtensionID,
                validate: (value) => { if (!isValidExtensionID(value) && value.length) return 'Invalid extension ID'}
            })
            if (prompts.isCancel(projectID)) return cancel();

            extensionID = toValidExtensionID(projectID) || defaultExtensionID;
        }
    }
    const targetDir = `./${extensionID}`;

    // 3. Handle directory if exist and not empty
    if (fs.existsSync(targetDir) && !isEmpty(targetDir)) {
        let overwrite: 'yes' | 'no' | 'ignore' | undefined = argOverwrite ? 'yes' : undefined;
        if (!overwrite) {
            if (!interactive) {
                overwrite = 'no';
            } else {
                const res = await prompts.select({
                    message: `Target directory "${targetDir}" is not empty. Please choose to proceed:`,
                    options: [
                        {
                            label: 'Cancel operation',
                            value: 'no',
                        },
                        {
                            label: 'Remove existing files and continue',
                            value: 'yes',
                        },
                        {
                            label: 'Ignore files and continue',
                            value: 'ignore',
                        },
                    ],
                });
                if (prompts.isCancel(res)) return cancel();

                overwrite = res;
            }
        }

        switch (overwrite) {
            case 'yes':
                emptyDir(targetDir);
                break;
            case 'no':
                cancel();
                return;
        }
    }

    // 4. Choose a template and variation
    let template = argTemplate;
    let hasInvalidArgTemplate = false;
    if (argTemplate && !TEMPLATES.includes(argTemplate)) {
        template = undefined
        hasInvalidArgTemplate = true
    }
    if (!template) {
        if (!interactive) {
            template = 'vanilla-ts';
        } else {
            const res = await prompts.select({
                message: hasInvalidArgTemplate
                    ? `"${argTemplate}" is not a valid template. Please choose from below: `
                    : 'Select a template:',
                options: TEMPLATES_OPTIONS.map(template => {
                    const templateColor = template.color;
                    return {
                        label: templateColor(template.display || template.name),
                        value: template,
                    }
                }),
            });
            if (prompts.isCancel(res)) return cancel();

            const variant = await prompts.select({
                message: 'Select a variant:',
                options: res.variants.map(variant => {
                    const variantColor = variant.color;
                    const command = variant.customCommand; // TODO: Fix when added
                    return {
                        label: variantColor(variant.display || variant.name),
                        value: variant.name,
                        hint: command,
                    };
                }),
            });
            if (prompts.isCancel(variant)) return cancel();

            template = variant;
        }
    }

    const pkgManager = (pkgInfo ?? { name: 'npm' }).name;

    const root = path.join(cwd, targetDir);

    fs.mkdirSync(root, { recursive: true });
    prompts.log.step(`Scaffolding project in ${root}...`);

    const templateDir = path.resolve(
        fileURLToPath(import.meta.url),
        '../..',
        `template-${template}`,
    );

    const write = (file: string, content?: string, rootDir = templateDir) => {
        const fullPath = path.join(rootDir, file);
        const stats = fs.statSync(fullPath);
        const targetPath = rootDir === templateDir
            ? path.join(root, renameFiles[file] ?? file)
            : path.join(root, rootDir.substring(templateDir.length), renameFiles[file] ?? file);
        if (stats.isDirectory()) {
            fs.mkdirSync(targetPath, { recursive: true });
            const files = fs.readdirSync(fullPath);
            for (const file of files) {
                write(file, undefined, fullPath);
            }
            return;
        }
        if (content) {
            fs.writeFileSync(targetPath, content);
            return;
        }

        if (file === 'external.html' || file === 'README.md' || file.startsWith('sammi.config.')) {
            const templatePath = fullPath;
            const templateContent = fs.readFileSync(templatePath, 'utf-8');
            const updatedContent = templateContent
                .replace(/{{EXTENSION_ID}}/g, extensionID)
                .replace(/{{EXTENSION_NAME}}/g, extensionName)
                .replace(/{{CREATE_VERSION}}/g, VERSION);
            fs.writeFileSync(targetPath, updatedContent);
            return;
        }

        copy(fullPath, targetPath);
    }

    const files = fs.readdirSync(templateDir);
    for (const file of files.filter(f => f !== 'package.json')) {
        write(file)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pkg = JSON.parse(fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    pkg.name = extensionID;

    write('package.json', JSON.stringify(pkg, null, 4) + '\n');

    let doneMessage = '';
    const cdProjectName = path.relative(cwd, root);
    doneMessage += 'Done. Now run:\n';
    if (root !== cwd) {
        doneMessage += `\n  cd ${cdProjectName.includes(' ') ? `"${cdProjectName}"` : cdProjectName}`;
    }
    doneMessage += `\n  ${getInstallCommand(pkgManager).join(' ')}`
    doneMessage += `\n  ${getRunCommand(pkgManager, 'dev').join(' ')}`
    prompts.outro(doneMessage);
}

function formatTargetDir(targetDir: string) {
    return targetDir.trim().replace(/\/+$/g, '');
}

function copy(src: string, dest: string) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        copyDir(src, dest);
        return;
    }

    fs.copyFileSync(src, dest);
}

function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
        const srcFile = path.resolve(srcDir, file);
        const destFile = path.resolve(destDir, file);
        copy(srcFile, destFile);
    }
}

function isEmpty(path: string) {
    const files = fs.readdirSync(path);
    return !files.length || (files.length === 1 && files[0] === '.git');
}

function emptyDir(dir: string) {
    if (!fs.existsSync(dir)) return;

    for (const file of fs.readdirSync(dir)) {
        if (file === '.git') continue;

        fs.rmSync(path.resolve(dir, file), { recursive: true, force: true });
    }
}

function isValidExtensionName(projectName: string) {
    return /^[a-zA-Z0-9 -_]*$/.test(projectName);
}

function isValidExtensionID(projectName: string) {
    return /^[a-z0-9-_]+$/.test(projectName);
}

function toValidExtensionID(projectName: string) {
    return projectName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        // .replace(/^[._]/, '')
        .replace(/[^a-z\d-]+/g, '-');
}

interface PkgInfo {
    name: string
    version: string
}

function pkgFromUserAgent(userAgent: string | undefined): PkgInfo | undefined {
    if (!userAgent) return;

    const pkgSpec = userAgent.split(' ')[0];
    const pkgSpecArr = pkgSpec.split('/');
    return {
        name: pkgSpecArr[0],
        version: pkgSpecArr[1],
    }
}

function getInstallCommand(agent: string) {
    if (agent === 'yarn') return [agent];

    return [agent, 'install'];
}

function getRunCommand(agent: string, script: string) {
    switch (agent) {
        case 'yarn':
        case 'pnpm':
        case 'bun':
            return [agent, script];
        case 'deno':
            return [agent, 'task', script];
        default:
            return [agent, 'run', script];
    }
}

init().catch(e => console.error(e));
