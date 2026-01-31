export type ResizableTextBox = [
    boxName: string,
    boxType: 0,
    defaultValue: string,
    sizeModifier?: number,
    options?: undefined,
];
export type CheckBox = [
    boxName: string,
    boxType: 2,
    defaultValue: boolean,
    sizeModifier?: number,
    options?: undefined,
];
export type ObsScenesBox = [
    boxName: string,
    boxType: 4,
    defaultValue?: unknown,
    sizeModifier?: number,
    options?: undefined,
];
export type ObsSourcesBox = [
    boxName: string,
    boxType: 5,
    defaultValue?: unknown,
    sizeModifier?: number,
    options?: undefined,
];
export type ObsFiltersBox = [
    boxName: string,
    boxType: 6,
    defaultValue?: unknown,
    sizeModifier?: number,
    options?: undefined,
];
export type KeyboardButtonBox = [
    boxName: string,
    boxType: 7,
    defaultValue: 0,
    sizeModifier?: number,
    options?: undefined,
];
export type CompareBox = [
    boxName: string,
    boxType: 8,
    defaultValue: "==",
    sizeModifier?: number,
    options?: undefined,
];
export type MathBox = [
    boxName: string,
    boxType: 9,
    defaultValue: "=",
    sizeModifier?: number,
    options?: undefined,
];
export type SoundPathBox = [
    boxName: string,
    boxType: 10,
    defaultValue: "",
    sizeModifier?: number,
    options?: undefined,
];
export type SliderBox = [
    boxName: string,
    boxType: 11,
    defaultValue: number,
    sizeModifier?: number,
    options?: undefined,
];
export type WhiteBox = [
    boxName: string,
    boxType: 14,
    defaultValue: NonNullable<unknown>,
    sizeModifier?: number,
    options?: undefined,
];
export type VariableBox = [
    boxName: string,
    boxType: 15,
    defaultValue: string,
    sizeModifier?: number,
    options?: undefined,
];
export type ColorBox = [
    boxName: string,
    boxType: 17,
    defaultValue: number,
    sizeModifier?: number,
    options?: undefined,
];
export type SelectBoxValue = [
    boxName: string,
    boxType: 18,
    defaultValue: 0,
    sizeModifier: number | undefined,
    options: string[],
];
export type SelectBoxString = [
    boxName: string,
    boxType: 19,
    defaultValue: string,
    sizeModifier: number | undefined,
    options: string[],
];
export type SelectBoxTypeable = [
    boxName: string,
    boxType: 20,
    defaultValue: string,
    sizeModifier: number | undefined,
    options: string[],
];
export type FilePathBox = [
    boxName: string,
    boxType: 22,
    defaultValue: string,
    sizeModifier?: number,
    options?: undefined,
];
export type ImagePathBox = [
    boxName: string,
    boxType: 23,
    defaultValue: string,
    sizeModifier?: number,
    options?: undefined,
];
export type TwitchRewardID = [
    boxName: string,
    boxType: 24,
    defaultValue: number,
    sizeModifier?: number,
    options?: undefined,
];
export type OptionBox = [
    boxName: string,
    boxType: 25,
    defaultValue: string,
    sizeModifier: number | undefined,
    options: string[],
];
export type LabelBox = [
    boxName: string,
    boxType: 30,
    defaultValue?: unknown,
    sizeModifier?: number,
    options?: undefined,
];
export type ObsPullBox = [
    boxName: string,
    boxType: 32,
    defaultValue?: unknown,
    sizeModifier?: number,
    options?: undefined,
];
export type SelectDeckBox = [
    boxName: string,
    boxType: 33,
    defaultValue: number,
    sizeModifier?: number,
    options?: undefined,
];
export type PasswordBox = [
    boxName: WhiteBox['0'],
    boxType: 34,
    defaultValue: WhiteBox['2'],
    sizeModifier?: WhiteBox['3'],
    options?: WhiteBox['4'],
];
export type TwitchAccountBox = [
    boxName: string,
    boxType: 35,
    defaultValue?: unknown,
    sizeModifier?: number,
    options?: undefined,
];
export type SaveVariableBox = [
    boxName: string,
    boxType: 37,
    defaultValue: NonNullable<unknown>,
    sizeModifier?: number,
    options?: {
        timeoutAfter?: number
    },
];

export type CommandBoxesUnion =
    | ResizableTextBox
    | CheckBox
    | ObsScenesBox
    | ObsSourcesBox
    | ObsFiltersBox
    | KeyboardButtonBox
    | CompareBox
    | MathBox
    | SoundPathBox
    | SliderBox
    | WhiteBox
    | VariableBox
    | ColorBox
    | SelectBoxValue
    | SelectBoxString
    | SelectBoxTypeable
    | FilePathBox
    | ImagePathBox
    | TwitchRewardID
    | OptionBox
    | LabelBox
    | ObsPullBox
    | SelectDeckBox
    | PasswordBox
    | TwitchAccountBox
    | SaveVariableBox
