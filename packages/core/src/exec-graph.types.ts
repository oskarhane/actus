export type CallRecord = {
    id: string;
    calls: number;
};

export type CharacterEntryGraph = {
    next?: CharactersEntryGraph;
    commands?: CallRecord[];
};
export type CharactersEntryGraph = {
    [key: string]: CharacterEntryGraph;
};
export type EntryGraph = {
    next: CharactersEntryGraph;
};

export type StoreValue = {
    entrygraph: EntryGraph;
};
