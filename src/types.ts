import type { EventObject } from "xstate";

export type Command = {
    id: string;
    title: string;
    description: CommandDescription;
    exec: ExecutionFunction;
};
export type ExecutionFunction = (command: Command, input: ParserResult) => void;
export type CommandDescription = string | CommandDescriptionFn;
export type CommandDescriptionFn = () => string;
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

export type Theme = {
    "--background-color"?: string;
    "--color"?: string;
    "--result-description-color"?: string;
    "--active-result-background-color"?: string;
    "--active-result-title-color"?: string;
    "--active-result-description-color"?: string;
    "--scale"?: string;
};

export type SortFunction = (commands: Command[], input: string) => Command[] | null;

export type ParserResult = [string] | [string, ParserParams];
type ParserParams = {
    [key: string]: string;
};

export type MachineContextState = {
    resultIds: string[];
    selectedId: string;
    toggleKey: string;
    commands: Command[];
    input: string;
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
