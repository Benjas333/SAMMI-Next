/**
 * [insert_script]
 * In this section, you’re encouraged to write your own TypeScript code.
*
 * ### Original documentation from https://sammi.solutions/extensions/build
 * We recommend having one main function that runs as soon as SAMMI connects to Bridge, and which you call from [insert_command] section.
 * Inside this function, you can set up listeners for extension commands coming from SAMMI, e.g. when a user actually runs a button containing your extension command you defined in [insert_command] section.
 *
 * Learn more about Listening to Extension Commands in the SAMMI Bridge documentation.
 *
 * SAMMI Bridge provides premade helper functions for you to use, such as retrieving variables, setting variables, triggering buttons and more. You can find all the helper functions in the SAMMI Bridge documentation
 */
import { multiply } from "./utils/utils";
import { getExternalSection, initExtension, insertCommandSection } from "sammi-next";
// import "sammi-bridge-types";
// sammi-bridge-types is automatically imported when importing anything from sammi-next library.
import extension_config from '../sammi.config.json';

const CONFIG = initExtension(extension_config);

// Use getExternalSection() to retrieve your [insert_external] section.
const EXTERNAL = getExternalSection(CONFIG.id);

const title = EXTERNAL.querySelector('#title') as HTMLTitleElement;
title.innerText = `${CONFIG.name} - v${CONFIG.version}`;

const inputA = EXTERNAL.querySelector("#number-a") as HTMLInputElement;
const inputB = EXTERNAL.querySelector("#number-b") as HTMLInputElement;
const resultEl = EXTERNAL.querySelector('#result') as HTMLSpanElement;

// The default export is your [insert_command] section. It must be a function.
export default insertCommandSection(() => {
    /**
     * [insert_command]
     *
     * ### Original documentation from https://sammi.solutions/extensions/build
     * In this section, you can define Extension Commands.
     * These commands will be available to users in SAMMI Core when they install your extension.
     * You can define multiple commands in this section. Refer to the SAMMI Bridge documentation for Extension Command details.
     * In this section, you can also automatically call your main extension function that should run as soon as SAMMI connects to Bridge.
     */
    welcome();

    SAMMI.extCommand("Extension Sample Command", 3355443, 52).catch(e => console.error(e));
    sammiclient.on("Extension Sample Command", () => {
        const handler = async () => {
            await SAMMI.notification('Command Sample');
        };
        handler().catch((e) => console.error(e));
    });
});

const message = `Hello world from ${CONFIG.name}!`;

// Export the functions you want to access from your [insert_external] section.
export function welcome() {
    console.log(message);
}

export function multiplyButton() {
    const result = multiply(parseInt(inputA.value), parseInt(inputB.value));
    resultEl.innerText = result.toString();
}
