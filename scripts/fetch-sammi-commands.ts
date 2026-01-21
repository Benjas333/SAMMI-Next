import fs from 'fs';
import path from 'path';

const URL = "https://raw.githubusercontent.com/SAMMISolutions/SAMMI-Bridge/refs/heads/main/_includes/functions/functions.js";
const OUT_DIR = path.join(__dirname, '..', 'packages', 'sammi-bridge-types', 'temp');
const REGEX = /^function SAMMICommands/m;

async function run() {
    const res = await fetch(URL, { headers: { 'User-Agent': 'sammi-types-fetcher' } });
    if (!res.ok)
        throw new Error(`GitHub responded ${res.status}: ${await res.text()}`);

    if (!fs.existsSync(OUT_DIR))
        fs.mkdirSync(OUT_DIR, { recursive: true });

    const text = await res.text();
    fs.writeFileSync(path.join(OUT_DIR, 'SAMMICommands.js'), text.replace(REGEX, 'export $&'), 'utf-8');
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
