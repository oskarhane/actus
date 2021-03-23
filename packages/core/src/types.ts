import type { EventObject, State } from "xstate";
import type { StateListener } from "xstate/lib/interpreter";

export type Command = {
    id: string;
    title: CommandTitle;
    description: CommandDescription;
    exec: ExecutionFn;
    getMatchString?: GenerateMatchStringFn;
    requiredArgs?: string[];
};
export type ExecutionFn = (command: Command, input: ParserResult) => void;
export type CommandDescription = string | CommandDescriptionFn;
export type CommandDescriptionFn = (input: ParserResult) => string;
export type CommandTitle = string | CommandTitleFn;
export type CommandTitleFn = (input: ParserResult) => string;
export type GenerateMatchStringFn = (input: ParserResult) => string;
export interface RankCommand extends Command {
    rank: number;
}

export type Resolvers = {
    [key: string]: () => void;
};
export type ExecPayload = {
    detail: ExecDetail;
};
export type ExecDetail = {
    id: string;
    input: ParserResult;
};

export type ParserResult = [string] | [string, ParserParams] | null;
type ParserParams = {
    [key: string]: string;
};

export type MachineContextState = {
    resultIds: string[];
    selectedId: string;
    toggleKey: string;
    commands: Command[];
    input: string;
    parsedInput: ParserResult;
    sortFn: SortFunction;
};
export interface ExecDoneEvent extends EventObject {
    type: "EXEC_DONE";
    id: string;
    input: ParserResult;
}

export interface InputEvent extends EventObject {
    type: "INPUT";
    input: string;
}

export interface SelectEvent extends EventObject {
    type: "SELECT";
    id: string;
}
export interface ExecEvent extends EventObject {
    type: "EXEC";
    id?: string;
}
export interface SetCommandsEvent extends EventObject {
    type: "NEW_COMMANDS";
    commands: Command[];
}
export interface StepEvent extends EventObject {
    type: "STEP";
    direction: "UP" | "DOWN";
}
export interface CloseEvent extends EventObject {
    type: "CLOSE";
}
export interface OpenEvent extends EventObject {
    type: "OPEN";
}

export type MachineEvents =
    | OpenEvent
    | CloseEvent
    | ExecEvent
    | ExecDoneEvent
    | SelectEvent
    | ExecDoneEvent
    | StepEvent
    | SetCommandsEvent
    | InputEvent;

export type SortFunction = (commands: Command[], input: string) => Command[] | null;

export type TransistionListener = StateListener<
    MachineContextState,
    EventObject,
    any,
    { value: any; context: MachineContextState }
>;
export type MachineState = State<MachineContextState, MachineEvents>;
