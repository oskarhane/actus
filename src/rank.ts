import type { Command, RankCommand } from "./types";

const FULL = 10;
const FIRST_IN_WORDS = 7;
const STARTS = 5;
const HAS = 4;

export function ranks(commands: Command[], input: string): Command[] {
    input = input.toLowerCase();
    const r: Command[] = commands
        .map(
            (c: Command): RankCommand => {
                const rank = full(c, input) || firstInWords(c, input) || starts(c, input) || has(c, input) || 0;
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
