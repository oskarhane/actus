import { createMachine, assign } from "xstate";
import type { Command, SortFunction } from "./types";
type Context = {
    resultIds: string[];
    selectedId: string;
    toggleKey: string;
    commands: Command[];
    input: string;
    sortFn: SortFunction;
};

export const selectionMachine = createMachine<Context>(
    {
        id: "result-selection",
        initial: "closed",
        context: {
            input: "",
            commands: [],
            resultIds: [],
            selectedId: "",
            toggleKey: "p",
            sortFn: (c) => c,
        },
        states: {
            closed: {
                invoke: { src: "setupOpenListener" },
                on: {
                    OPEN: "open",
                },
            },
            open: {
                invoke: { src: "setupInteractionListener" },
                on: {
                    CLOSE: "closed",
                    EXEC: {
                        target: ".executing",
                        cond: "nonEmpty",
                    },
                    SELECT: {
                        actions: "select",
                        target: ".selected",
                    },
                },
                initial: "autoSelected",
                states: {
                    executing: {
                        invoke: {
                            src: "exec",
                        },
                        on: {
                            EXEC_DONE: {
                                target: "#result-selection.closed",
                                actions: "clearInputAndResults",
                            },
                        },
                    },
                    autoSelected: {
                        entry: "selectFirst",
                        on: {
                            STEP: { target: "selected", actions: "step" },
                            NEW_COMMANDS: {
                                actions: "setCommandsAndResults",
                                target: "autoSelected",
                            },
                            INPUT: {
                                actions: "saveInputAndResults",
                                target: "autoSelected",
                            },
                        },
                    },
                    selected: {
                        on: {
                            STEP: { actions: "step" },
                            NEW_COMMANDS: {
                                actions: "setCommandsAndResults",
                                target: "selectionValidation",
                            },
                            INPUT: {
                                actions: "saveInputAndResults",
                                target: "selectionValidation",
                            },
                        },
                    },
                    selectionValidation: {
                        always: [
                            {
                                target: "selected",
                                cond: "selectedExists",
                            },
                            { target: "autoSelected" },
                        ],
                    },
                },
            },
        },
    },
    {
        services: {
            setupOpenListener: (context) => (callback) => {
                const toggleFn = (e: KeyboardEvent) => {
                    const { key } = e;
                    // @ts-ignore
                    if (e.target.tagName === "INPUT") {
                        return;
                    }
                    if (key === context.toggleKey) {
                        e.preventDefault();
                        callback("OPEN");
                    }
                };

                document.addEventListener("keydown", toggleFn);
                return () => document.removeEventListener("keydown", toggleFn);
            },
            setupInteractionListener: () => (callback) => {
                const toggleFn = (e: KeyboardEvent) => {
                    const { key } = e;
                    if (key === "Escape") {
                        callback("CLOSE");
                        return;
                    }
                    if (key === "Enter") {
                        callback("EXEC");
                        return;
                    }
                    if (key === "ArrowDown") {
                        e.preventDefault();
                        callback({ type: "STEP", direction: "DOWN" });
                        return;
                    }
                    if (key === "ArrowUp") {
                        e.preventDefault();
                        callback({ type: "STEP", direction: "UP" });
                        return;
                    }
                };
                document.addEventListener("keydown", toggleFn);
                return () => document.removeEventListener("keydown", toggleFn);
            },
            exec: (context, event) => (callback) => {
                const id: string = event.id || context.selectedId;
                const executedCommand = context.commands.filter((c) => c.id === id);
                if (executedCommand && executedCommand.length) {
                    executedCommand[0].exec(executedCommand[0]);
                }
                callback({ type: "EXEC_DONE", id, input: context.input });
            },
        },
        actions: {
            saveInputAndResults: assign({
                input: (_, event) => event.input,
                resultIds: (context, event) => {
                    return event.input.length ? context.sortFn(context.commands, event.input).map((r) => r.id) : [];
                },
            }),
            clearInputAndResults: assign({ input: () => "", resultIds: () => [] }),
            select: assign({ selectedId: (_, event) => event.id }),
            selectFirst: assign({
                selectedId: (context) => context.resultIds[0] || "",
            }),
            setCommandsAndResults: assign({
                commands: (_, event) => {
                    return event.commands;
                },
                resultIds: (context, event) => {
                    return context.input.length ? context.sortFn(event.commands, context.input).map((r) => r.id) : [];
                },
            }),
            step: assign({
                selectedId: (context, event) => {
                    if (!context.resultIds.length) {
                        return "";
                    }
                    const currentIndex = context.resultIds.indexOf(context.selectedId);
                    if (event.direction === "DOWN") {
                        if (currentIndex === context.resultIds.length - 1) {
                            return context.resultIds[0];
                        }
                        return context.resultIds[currentIndex + 1];
                    }
                    if (event.direction === "UP") {
                        if (currentIndex === 0) {
                            return context.resultIds[context.resultIds.length - 1];
                        }
                        return context.resultIds[currentIndex - 1];
                    }
                },
            }),
        },
        guards: {
            selectedExists: (context) => context.resultIds.includes(context.selectedId),
            nonEmpty: (context) => context.input.length > 0 && context.resultIds.length > 0,
        },
    }
);
