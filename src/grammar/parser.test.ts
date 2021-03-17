import nearley from "nearley";
import type { ParserResult } from "../types";
import grammar from "./input-parser";

const newParser = () => new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

test("should parse commands only correctly", () => {
    let input = "t";
    let parser = newParser();
    parser.feed(input);
    let parserResult: ParserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["t"]);

    input = "t ";
    parser = newParser();
    parser.feed(input);
    parserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["t"]);

    input = "ttt";
    parser = newParser();
    parser.feed(input);
    parserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["ttt"]);

    input = "ttt ttt";
    parser = newParser();
    parser.feed(input);
    parserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["ttt ttt"]);

    input = "ttt ttt   ttt";
    parser = newParser();
    parser.feed(input);
    parserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["ttt ttt   ttt"]);
});

test("should parse commands with params correctly", () => {
    const input = "tt -r -h -p 8080";
    const parser = newParser();
    parser.feed(input);
    const parserResult: ParserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["tt", { r: null, h: null, p: "8080" }]);
});

test("should parse commands with empty params correctly", () => {
    let input = "tt -r -h -p 8080 -";
    let parser = newParser();
    parser.feed(input);
    let parserResult: ParserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["tt", { r: null, h: null, p: "8080" }]);

    input = "tt -";
    parser = newParser();
    parser.feed(input);
    parserResult = parser.results[0] as ParserResult;
    expect(parserResult).toEqual(["tt", {}]);
});
