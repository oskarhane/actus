import type { ParserResult } from "./types";
import type {
    StoreValue,
    CharacterEntryGraph,
    CallRecord,
    LoadGraphFn,
    PersistGraphFn,
    CharactersEntryGraph,
} from "./exec-graph.types";

const LS_KEY = "actus-exec-graph";
const CALL_LIMIT = 100;
const CALL_NORMALIZE_BY = 0.7;

function store(key: string, value: StoreValue): void {
    if (typeof localStorage === "undefined") {
        console.log(`Can't store execution graph, local storage not found`);
        return;
    }
    localStorage.setItem(key, JSON.stringify(value));
}

function load(key: string): StoreValue {
    if (typeof localStorage === "undefined") {
        console.log(`Can't load execution graph, local storage not found`);
        return;
    }
    try {
        const jsonStore = localStorage.getItem(key);
        const value = JSON.parse(jsonStore) as StoreValue;
        if (value == null) {
            return { entrygraph: { next: {} } };
        }
        return value;
    } catch (e) {
        console.log("Couldn't load execution graph from local storage:", e);
        return { entrygraph: { next: {} } };
    }
}

export function getHistoricCallsForInput(parsedInput: ParserResult, loadGraph?: LoadGraphFn): CallRecord[] {
    const currentGraph = loadGraph != null ? loadGraph() : load(LS_KEY);
    const graphEndpoint = traverseToInput(parsedInput, currentGraph);
    return graphEndpoint.commands || [];
}

export function persistExec(
    parsedInput: ParserResult,
    commandId: string,
    loadGraph?: LoadGraphFn,
    persistGraph?: PersistGraphFn
): void {
    let currentGraph = loadGraph != null ? loadGraph() : load(LS_KEY);
    currentGraph = updateCallStats(parsedInput, commandId, currentGraph);
    persistGraph != null ? persistGraph(LS_KEY, currentGraph) : store(LS_KEY, currentGraph);
}

function traverseToInput(parsedInput: ParserResult, graph: StoreValue): CharacterEntryGraph {
    let tree: string[] = parsedInput[0].split("").reduce((full, curr) => full.concat("next", curr), []);

    let currentPlace = graph.entrygraph;
    while (tree.length) {
        const step = tree.shift();
        currentPlace = createPropIfNotExists(currentPlace, step, {});
        currentPlace = currentPlace[step];
    }
    let graphEndpoint: CharacterEntryGraph = currentPlace as CharacterEntryGraph;
    graphEndpoint = createPropIfNotExists(graphEndpoint, "commands", []);
    return graphEndpoint;
}

function updateCallStats(input: ParserResult, id: string, graph: StoreValue): StoreValue {
    const graphEndpoint = traverseToInput(input, graph);
    const callRecords: CallRecord[] = graphEndpoint["commands"];

    const exists = callRecords.findIndex((r) => r.id === id);
    if (exists > -1) {
        callRecords[exists].calls++;
        if (callRecords[exists].calls >= CALL_LIMIT) {
            normalizeAllCalls(graph.entrygraph.next);
        }
        return graph;
    }
    callRecords.push({ id, calls: 1 });
    return graph;
}

function createPropIfNotExists(obj: any, prop: string, defaultVal: any) {
    if (typeof obj[prop] === "undefined") {
        obj[prop] = defaultVal;
    }
    return obj;
}

function normalizeAllCalls(charsGraph: CharactersEntryGraph): void {
    const keys = Object.keys(charsGraph);
    keys.forEach((key) => {
        if (charsGraph[key].commands.length) {
            for (let i = charsGraph[key].commands.length - 1; i >= 0; i--) {
                charsGraph[key].commands[i].calls = Math.floor(charsGraph[key].commands[i].calls * CALL_NORMALIZE_BY);
                // Cleanup commands with 0 calls
                if (charsGraph[key].commands[i].calls < 1) {
                    charsGraph[key].commands.splice(i, 1);
                }
            }
        }
        if (charsGraph[key].next) {
            normalizeAllCalls(charsGraph[key].next);
        }
    });
}
