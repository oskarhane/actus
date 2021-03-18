import nearley from "nearley";
import grammar from "./grammar/input-parser";
import type { Command, ParserResult, RankCommand } from "./types";

const FULL = 10;
const FIRST_IN_WORDS = 7;
const STARTS = 5;
const HAS = 4;

export function parseInput(input: string): ParserResult | null {
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
    return [input.trim()];
}

export function ranks(commands: Command[], input: string): Command[] | null {
    const parsedInput = parseInput(input);
    if (parsedInput === null) {
        return null;
    }
    const inputCmd = parsedInput[0].toLowerCase();
    const r: Command[] = commands
        .map(
            (c: Command): RankCommand => {
                const rank =
                    full(c, inputCmd) || firstInWords(c, inputCmd) || starts(c, inputCmd) || has(c, inputCmd) || 0;
                return { ...c, rank };
            }
        )
        .filter((c) => c.rank > 0)
        .sort((a, b) => b.rank - a.rank)
        .map((c): Command => c);
    return r;
}

const full = ({ title }, input) => (title.toLowerCase() === input ? FULL : 0);
const firstInWords = ({ title }, input) =>
    title
        .split(" ")
        .map((w) => w.substring(0, 1))
        .join("")
        .toLowerCase()
        .indexOf(input) === 0
        ? FIRST_IN_WORDS
        : 0;
const starts = ({ title }, input) => (title.toLowerCase().indexOf(input) === 0 ? STARTS : 0);
const has = ({ title }, input) => (title.toLowerCase().includes(input) ? HAS : 0);
