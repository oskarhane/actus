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

export type SortFunction = (commands: Command[], input: string) => Command[];

export type ParserResult = [string] | [string, ParserParams];
type ParserParams = {
    [key: string]: string;
};
