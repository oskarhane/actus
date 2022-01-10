import nearley from "nearley";
import { getHistoricCallsForInput } from "./exec-graph";
import grammar from "./grammar/input-parser";
import type { Command, ParserResult, RankCommand } from "./types";
import { MatchScore } from "./types";

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
    
    const inputToMatch = normalizeDiactritics(parsedInput[0].toLowerCase());
    const r: Command[] = commands
    .map(
        (c: Command): RankCommand => {
                const commandToMatch = normalizeDiactritics(getStringToMatch(c, parsedInput).toLowerCase());

                let rank =
                    full(commandToMatch, inputToMatch) ||
                    firstInWords(commandToMatch, inputToMatch) ||
                    starts(commandToMatch, inputToMatch) ||
                    has(commandToMatch, inputToMatch) ||
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
        .sort((a, b) => b.rank - a.rank);
    return r;
}

const full = (commandToMatch: string, inputToMatch: string) =>
    commandToMatch === inputToMatch ? MatchScore.EXACT : MatchScore.NO;
const firstInWords = (commandToMatch: string, inputToMatch: string) =>
    commandToMatch
        .split(" ")
        .map((w: string) => w.substring(0, 1))
        .join("")
        .indexOf(inputToMatch) === 0
        ? MatchScore.ACRONYM
        : MatchScore.NO;
const starts = (commandToMatch: string, inputToMatch: string) =>
    commandToMatch.indexOf(inputToMatch) === 0 ? MatchScore.STARTS : MatchScore.NO;
const has = (commandToMatch: string, inputToMatch: string) =>
    commandToMatch.includes(inputToMatch) ? MatchScore.CONTAINS : MatchScore.NO;

const getStringToMatch = (c: Command, input: ParserResult): string =>
    c.getMatchString ? c.getMatchString(input) : typeof c.title === "function" ? c.title(input) : c.title;

const normalizeDiactritics = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "")