import { getHistoricCallsForInput, persistExec } from "./exec-graph";
import type { PersistGraphFn, StoreValue } from "./exec-graph.types";
import { parseInput } from "./rank";
import type { ParserResult } from "./types";

test("can traverse to input", () => {
    const graph: StoreValue = {
        entrygraph: {
            next: {
                c: {
                    next: {
                        o: {
                            next: {
                                m: {
                                    commands: [
                                        { id: "command1", calls: 1 },
                                        { id: "command2", calls: 2 },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    const loadGraphFn = () => graph;
    const input: ParserResult = parseInput("com");

    const leaf = getHistoricCallsForInput(input, loadGraphFn);
    expect(leaf).toBe(graph.entrygraph.next.c.next.o.next.m.commands);

    const inputNoCalls: ParserResult = parseInput("co");
    const leafNoCalls = getHistoricCallsForInput(inputNoCalls, loadGraphFn);
    expect(leafNoCalls).toEqual([]);

    const inputNoGraph: ParserResult = parseInput("xx");
    const leafNoGraph = getHistoricCallsForInput(inputNoGraph, loadGraphFn);
    expect(leafNoGraph).toEqual([]);
});

test("can persist graph and update graph when executed command", () => {
    const graph: StoreValue = {
        entrygraph: {
            next: {
                c: {
                    next: {
                        o: {
                            next: {
                                m: {
                                    commands: [
                                        { id: "command1", calls: 1 },
                                        { id: "command2", calls: 2 },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
    };
    const loadGraphFn = () => graph;
    const persistGraphFn: PersistGraphFn = jest.fn();

    // Existing path
    const inputExisting: ParserResult = parseInput("com");
    const expectedGraphExistingCommand = JSON.parse(JSON.stringify(graph));
    persistExec(inputExisting, "command1", loadGraphFn, persistGraphFn);

    expectedGraphExistingCommand.entrygraph.next.c.next.o.next.m.commands[0] = { id: "command1", calls: 2 };
    expect(persistGraphFn).toHaveBeenCalledTimes(1);
    expect(persistGraphFn).toHaveBeenCalledWith(expect.any(String), expectedGraphExistingCommand);

    // Non existing path
    // @ts-ignore
    persistGraphFn.mockReset();
    const inputNonExisting: ParserResult = parseInput("x");
    persistExec(inputNonExisting, "command1", loadGraphFn, persistGraphFn);

    const expectedGraphNonExistingCommand = JSON.parse(JSON.stringify(graph));
    expectedGraphNonExistingCommand.entrygraph.next.x = { commands: [{ id: "command1", calls: 1 }] };
    expect(persistGraphFn).toHaveBeenCalledTimes(1);
    expect(persistGraphFn).toHaveBeenCalledWith(expect.any(String), expectedGraphNonExistingCommand);
});

test("drops and normalizes calls when cap is reached, to follow trends", () => {
    const graph: StoreValue = {
        entrygraph: {
            next: {
                z: {
                    commands: [{ id: "command", calls: 1 }],
                },
                x: {
                    commands: [{ id: "command0", calls: 30 }],
                },
                c: {
                    commands: [
                        { id: "command1", calls: 99 },
                        { id: "command2", calls: 70 },
                    ],
                },
            },
        },
    };
    const loadGraphFn = () => graph;
    const persistGraphFn: PersistGraphFn = jest.fn();

    // 99 + 1 = 100 -> limit reached -> should reduce all calls in graph
    const expectedGraph = JSON.parse(JSON.stringify(graph));

    const input: ParserResult = parseInput("c");
    persistExec(input, "command1", loadGraphFn, persistGraphFn);

    expectedGraph.entrygraph.next.c.commands[0] = {
        ...expectedGraph.entrygraph.next.c.commands[0],
        calls: Math.floor((expectedGraph.entrygraph.next.c.commands[0].calls + 1) * 0.7),
    };
    expectedGraph.entrygraph.next.c.commands[1] = {
        ...expectedGraph.entrygraph.next.c.commands[1],
        calls: Math.floor(expectedGraph.entrygraph.next.c.commands[1].calls * 0.7),
    };
    expectedGraph.entrygraph.next.x.commands[0] = {
        ...expectedGraph.entrygraph.next.x.commands[0],
        calls: Math.floor(expectedGraph.entrygraph.next.x.commands[0].calls * 0.7),
    };

    // Delete empty commands from graph
    expectedGraph.entrygraph.next.z.commands = [];

    expect(persistGraphFn).toHaveBeenCalledTimes(1);
    expect(persistGraphFn).toHaveBeenCalledWith(expect.any(String), expectedGraph);
});
