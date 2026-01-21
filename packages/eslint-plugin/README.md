# eslint-plugin-sammi-next-eslint

An ESLint plugin for projects using SAMMI Next

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-sammi-next-eslint`:

```sh
npm install eslint-plugin-sammi-next-eslint --save-dev
```

## Usage

In your [configuration file](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file), import the plugin `eslint-plugin-sammi-next-eslint` and add `sammi-next-eslint` to the `plugins` key:

```js
import { defineConfig } from "eslint/config";
import sammi-next-eslint from "eslint-plugin-sammi-next-eslint";

export default defineConfig([
    {
        plugins: {
            sammi-next-eslint
        }
    }
]);
```


Then configure the rules you want to use under the `rules` key.

```js
import { defineConfig } from "eslint/config";
import sammi-next-eslint from "eslint-plugin-sammi-next-eslint";

export default defineConfig([
    {
        plugins: {
            sammi-next-eslint
        },
        rules: {
            "sammi-next-eslint/rule-name": "warn"
        }
    }
]);
```



## Configurations

<!-- begin auto-generated configs list -->

|    | Name          |
| :- | :------------ |
| ✅  | `recommended` |

<!-- end auto-generated configs list -->



## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
✅ Set in the `recommended` configuration.

| Name                                                                             | Description                                                 | 💼 |
| :------------------------------------------------------------------------------- | :---------------------------------------------------------- | :- |
| [enforce-default-export-function](docs/rules/enforce-default-export-function.md) | enforce the default export is a function with no parameters | ✅  |

<!-- end auto-generated rules list -->


