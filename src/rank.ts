import nearley from "nearley";
import grammar from "./grammar/input-parser";
import type { Command, ParserResult, RankCommand } from "./types";

const FULL = 10;
const FIRST_IN_WORDS = 7;
const STARTS = 5;
const HAS = 4;

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

export function ranks(commands: Command[], input: string): Command[] | null {
    const parsedInput = parseInput(input);
    if (parsedInput === null) {
        return null;
    }
    const r: Command[] = commands
        .map(
            (c: Command): RankCommand => {
                const rank =
                    full(c, parsedInput) ||
                    firstInWords(c, parsedInput) ||
                    starts(c, parsedInput) ||
                    has(c, parsedInput) ||
                    0;
                return { ...c, rank };
            }
        )
        .filter((c) => c.rank > 0)
        .sort((a, b) => b.rank - a.rank)
        .map((c): Command => c);
    return r;
}

const full = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input).toLowerCase() === input[0] ? FULL : 0;
const firstInWords = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input)
        .split(" ")
        .map((w: string) => w.substring(0, 1))
        .join("")
        .toLowerCase()
        .indexOf(input[0]) === 0
        ? FIRST_IN_WORDS
        : 0;
const starts = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input).toLowerCase().indexOf(input[0]) === 0 ? STARTS : 0;
const has = (command: Command, input: ParserResult) =>
    getStringToMatch(command, input).toLowerCase().includes(input[0]) ? HAS : 0;

const getStringToMatch = (c: Command, input: ParserResult): string =>
    c.getMatchString ? c.getMatchString(input) : typeof c.title === "function" ? c.title(input) : c.title;
