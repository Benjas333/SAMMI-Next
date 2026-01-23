import { getExternalSection, initExtension, insertCommandSection } from "sammi-next";
import extensionConfig from '../sammi.config';

const CONFIG = initExtension(extensionConfig);

const EXTERNAL = getExternalSection(CONFIG.id);

export default insertCommandSection(() => {
    welcome();
}, { waitForSammiclient: false });

const message = `Hello world from ${CONFIG.name}!`;

function welcome() {
    console.log(message);
}
