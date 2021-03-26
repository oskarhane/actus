import nearley from "nearley";
import { getHistoricCallsForInput } from "./exec-graph";
import grammar from "./grammar/input-parser";
import type { Command, ParserResult, RankCommand } from "./types";
import { MatchScore } from "./types";

const FULL = 10;
const FIRST_IN_WORDS = 2;
const STARTS = 3;
const HAS = 2;

export function parseInput(input: string): ParserResult {
    try {
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        parser.feed(input);
        const parserResult: ParserResult = parser.results[0] as ParserResult;
        if (parserResult.length < 1) {
            throw Error(`Could not parse "${input}"`);
        }
        return parserResult;
    } catch (e) {
        return null;
    }
}

export function rank(commands: Command[], input: string): Command[] | null {
    const parsedInput = parseInput(input);
    if (parsedInput === null) {
        return null;
    }
    const execGraphCalls = getHistoricCallsForInput(parsedInput);

    const r: Command[] = commands
        .map(
            (c: Command): RankCommand => {
                let rank =
                    full(c, parsedInput) ||
                    firstInWords(c, parsedInput) ||
                    starts(c, parsedInput) ||
                    has(c, parsedInput) ||
                    MatchScore.NO;
                const historyCalls = execGraphCalls.find((ec) => c.id === ec.id);
                if (historyCalls) {
                    const historyCallValue = historyCalls.calls * MatchScore.HISTORY;
                    if (historyCallValue > rank) {
                        rank = historyCallValue;
                    }
                }
                return { ...c, rank };
            }
        )
        .filter((c) => c.rank > 0)
        .sort((a, b) => b.rank - a.rank)
        .map((c): Command => c);
    return r;
}

const full = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input).toLowerCase() === input[0] ? MatchScore.EXACT : MatchScore.NO;
const firstInWords = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input)
        .split(" ")
        .map((w: string) => w.substring(0, 1))
        .join("")
        .toLowerCase()
        .indexOf(input[0]) === 0
        ? MatchScore.ACRONYM
        : MatchScore.NO;
const starts = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input).toLowerCase().indexOf(input[0]) === 0 ? MatchScore.STARTS : MatchScore.NO;
const has = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input).toLowerCase().includes(input[0]) ? MatchScore.CONTAINS : MatchScore.NO;

const getStringToMatch = (c: Command, input: ParserResult): string =>
    c.getMatchString ? c.getMatchString(input) : typeof c.title === "function" ? c.title(input) : c.title;
