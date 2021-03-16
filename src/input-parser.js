// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
function id(x) {
    return x[0];
}
var grammar = {
    Lexer: undefined,
    ParserRules: [
        { name: "main", symbols: ["cmd", "params", "_"], postprocess: (d) => [d[0], d[1]] },
        { name: "main", symbols: ["cmd", "_"], postprocess: (d) => [d[0]] },
        { name: "cmd", symbols: ["cmdToken"], postprocess: (d) => d.join("").trim() },
        { name: "params$ebnf$1", symbols: ["param"] },
        {
            name: "params$ebnf$1",
            symbols: ["params$ebnf$1", "param"],
            postprocess: function arrpush(d) {
                return d[0].concat([d[1]]);
            },
        },
        {
            name: "params",
            symbols: ["params$ebnf$1"],
            postprocess: (d) => ({ ...d[0].reduce((all, dd) => ({ ...all, ...dd }), {}) }),
        },
        { name: "param", symbols: ["paramName"], postprocess: (d) => ({ [d[0]]: null }) },
        { name: "param", symbols: ["paramName", "__", "paramVal"], postprocess: (d) => ({ [d[0]]: d[2] }) },
        { name: "paramName$ebnf$1", symbols: [/[^- ]/] },
        {
            name: "paramName$ebnf$1",
            symbols: ["paramName$ebnf$1", /[^- ]/],
            postprocess: function arrpush(d) {
                return d[0].concat([d[1]]);
            },
        },
        {
            name: "paramName",
            symbols: ["__", "FLAG_START", "paramName$ebnf$1"],
            postprocess: (d) => d[2].join("").trim(),
        },
        { name: "paramVal", symbols: ["paramValToken"], postprocess: id },
        { name: "FLAG_START", symbols: ["_", { literal: "-" }], postprocess: null },
        { name: "cmdToken$ebnf$1", symbols: [/[^-]/] },
        {
            name: "cmdToken$ebnf$1",
            symbols: ["cmdToken$ebnf$1", /[^-]/],
            postprocess: function arrpush(d) {
                return d[0].concat([d[1]]);
            },
        },
        {
            name: "cmdToken",
            symbols: [/[^- ]/, "cmdToken$ebnf$1", /[^- ]/],
            postprocess: (d) => [d[0], d[1].join(""), d[2]].join(""),
        },
        { name: "paramValToken$ebnf$1", symbols: [/[^- ]/] },
        {
            name: "paramValToken$ebnf$1",
            symbols: ["paramValToken$ebnf$1", /[^- ]/],
            postprocess: function arrpush(d) {
                return d[0].concat([d[1]]);
            },
        },
        { name: "paramValToken", symbols: ["paramValToken$ebnf$1"], postprocess: (d) => d[0].join("") },
        { name: "_$ebnf$1", symbols: [] },
        {
            name: "_$ebnf$1",
            symbols: ["_$ebnf$1", /[ ]/],
            postprocess: function arrpush(d) {
                return d[0].concat([d[1]]);
            },
        },
        { name: "_", symbols: ["_$ebnf$1"], postprocess: () => null },
        { name: "__", symbols: [/[ ]/], postprocess: () => null },
    ],
    ParserStart: "main",
};
export default grammar;
