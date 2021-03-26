import type { ParserResult } from "./types";
import type { StoreValue, CharacterEntryGraph, CallRecord, EntryGraph } from "./exec-graph.types";

const LS_KEY = "actus-exec-graph";

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
            throw new Error("Empty storage");
        }
        return value;
    } catch (e) {
        console.log("Couldn't load execution graph from local storage:", e);
        return { entrygraph: { next: {} } };
    }
}

export function getHistoricCallsForInput(parsedInput: ParserResult): CallRecord[] {
    const currentGraph = load(LS_KEY);
    const graphEndpoint = traverseToInput(parsedInput, currentGraph);
    return graphEndpoint.commands || [];
}

export function persistExec(parsedInput: ParserResult, commandId: string): void {
    const currentGraph = load(LS_KEY);
    const graphEndpoint = traverseToInput(parsedInput, currentGraph);
    graphEndpoint["commands"] = setOrUpdateCallRecord(graphEndpoint["commands"], commandId);
    store(LS_KEY, currentGraph);
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

function setOrUpdateCallRecord(callRecords: CallRecord[], id: string): CallRecord[] {
    const exists = callRecords.findIndex((r) => r.id === id);
    if (exists > -1) {
        callRecords[exists].calls++;
        return callRecords;
    }
    return callRecords.concat({ id, calls: 1 });
}

function createPropIfNotExists(obj: any, prop: string, defaultVal: any) {
    if (typeof obj[prop] === "undefined") {
        obj[prop] = defaultVal;
    }
    return obj;
}
