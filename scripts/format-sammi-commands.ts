import fs from "fs";
import path from "path";

const DIR = path.join(__dirname, '..', 'packages', 'sammi-bridge-types');
const INPUT_FILE = path.join(DIR, 'temp', 'SAMMICommands.d.ts');
const OUT_FILE = path.join(DIR, 'src', 'SAMMICommands.d.ts');
const REGEX = /function (SAMMICommands)\(\):/;

function run() {
    if (!fs.existsSync(INPUT_FILE))
        throw new Error('SAMMICommands.d.ts does not exists. Run `bun run --filter sammi-bridge-types gen:types`')

    const file = fs.readFileSync(INPUT_FILE, { encoding: 'utf-8' });
    fs.writeFileSync(OUT_FILE, file.replace(REGEX, 'class $1'), 'utf-8');
}

try {
    run();
} catch (e) {
    console.error(e);
    process.exit(1);
}
