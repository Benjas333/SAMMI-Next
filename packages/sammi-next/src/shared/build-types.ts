export enum BuildMode {
    dev,
    production,
}
export const BuildModes = Object.keys(BuildMode).filter(key => isNaN(Number(key)));
export type BuildModeKey = keyof typeof BuildMode;
