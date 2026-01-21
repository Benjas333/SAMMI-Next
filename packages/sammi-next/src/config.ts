
// import Ajv, { JSONSchemaType } from "ajv";
// import { FullExtensionConfig } from "./types";

// const ajv = new Ajv();
// const schema: JSONSchemaType<FullExtensionConfig> = {
//     type: "object",
//     properties: {
//         name: {
//             type: "string",
//             pattern: "^[a-zA-Z0-9 -_]+$"
//         },
//         id: {
//             type: "string",
//             pattern: "^[a-zA-Z0-9-_]+$"
//         },
//         info: {
//             type: "string",
//             nullable: true
//         },
//         version: {
//             type: "string",
//             pattern: "^(?:\\d+\\.?)+"
//         },
//         entry: {
//             type: "string",
//         },
//         external: {
//             type: "string",
//             nullable: true
//         },
//         over: {
//             type: "string",
//             nullable: true
//         },
//         out: {
//             type: "object",
//             properties: {
//                 dir: {
//                     type: "string",
//                 },
//                 js: {
//                     type: "string",
//                     pattern: "^[\\w,\\s-]+\\.js$"
//                 },
//                 sef: {
//                     type: "string",
//                     pattern: "^[\\w,\\s-]+\\.sef$"
//                 }
//             },
//             required: ["dir", "js", "sef"]
//         }
//     },
//     required: ["name", "id", "version", "entry", "out"],
//     additionalProperties: false
// };

// export const configValidator = ajv.compile(schema);

// /**
//  * Validates and cleans a raw extension config object and parses it into an ExtensionConfig.
//  * Requires the sammi-next-core extension.
//  * @param config Unparsed config object.
//  * @returns Parsed config without sensible data.
//  */
// export function validateConfig(config: {[key: string]: any}): ExtensionConfig {
//     if (!('sammi-next-core' in SAMMIExtensions))
//         throw new Error('sammi-next-core is not installed (this is a SAMMI Bridge Extension, not a package)');

//     if (!SAMMIExtensions['sammi-next-core'].configValidator(config))
//         throw Error('Invalid extension config');

//     return initConfig(config);
// }
// TODO: Make sammi-next-core
