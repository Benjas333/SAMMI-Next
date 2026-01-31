import SAMMIWebSocket from 'sammi-websocket-types';
import type { SAMMICommands as UnpatchedCommands } from './SAMMICommands';
import { CommandBoxesUnion } from './commandBoxes';

// export type commandBoxes = Record<string, [boxName: string, boxType: number, defaultValue: (string | number), sizeModifier: (number | undefined), selectOptions: any[] | undefined]>
export type CommandBoxesObj = Record<string, CommandBoxesUnion>;


declare class SAMMICommands extends UnpatchedCommands {
    /**
    * send extension command to SAMMI
    * @param name - name of the extension command
    * @param color - box color, accepts hex/dec colors (include # for hex), default 3355443
    * @param height - height of the box in pixels, 52 for regular or 80 for resizable box, default 52
    * @param boxes
    * - one object per box, key = boxVariable, value = array of box params
    * - boxVariable = variable to save the box value under
    * - boxName = name of the box shown in the user interface
    * - boxType = type of the box, 0 = resizable, 2 = checkbox (true/false), 14 = regular box, 15 = variable box, 18 = select box, see extension guide for more
    * - defaultValue = default value of the variable
    * - (optional) sizeModifier = horizontal box size, 1 is normal
    * - (optional) [] selectOptions = array of options for the user to select (when using Select box type)
    * @param boxes.boxVariable
    * */
    extCommand(
        name?: string,
        color?: string | number,
        height?: string | number,
        boxes?: CommandBoxesObj,
        triggerButton?: boolean,
        hidden?: boolean
    ): Promise<unknown>;
}

export type * as CommandBoxTypes from "./commandBoxes";
export type { SAMMICommands, SAMMIWebSocket };
