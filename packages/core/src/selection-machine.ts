import { createMachine, assign, Sender } from "xstate";
import { parseInput, rank } from "./rank";
import type {
    ExecDoneEvent,
    InputEvent,
    SelectEvent,
    SetCommandsEvent,
    StepEvent,
    ExecEvent,
    MachineEvents,
    MachineContextState,
} from "./types";

export const selectionMachine = createMachine<MachineContextState, MachineEvents>(
    {
        id: "result-selection",
        initial: "closed",
        context: {
            input: "",
            parsedInput: null,
            commands: [],
            resultIds: [],
            selectedId: "",
            toggleKey: "p",
        },
        states: {
            closed: {
                on: {
                    OPEN: "open",
                },
            },
            open: {
                on: {
                    CLOSE: "closed",
                    EXEC: {
                        target: ".executing",
                        cond: "isExecutable",
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
            exec: (context, event: ExecEvent) => (callback: Sender<ExecDoneEvent>) => {
                const id: string = event.id || context.selectedId;
                const parsedInput = parseInput(context.input);
                const executedCommand = context.commands.filter((c) => c.id === id);
                if (executedCommand && executedCommand.length) {
                    executedCommand[0].exec(executedCommand[0], parsedInput);
                }
                const sendEvent: ExecDoneEvent = { type: "EXEC_DONE", id, input: parsedInput };
                callback(sendEvent);
            },
        },
        actions: {
            saveInputAndResults: assign<MachineContextState, MachineEvents>({
                input: (_, event: InputEvent) => event.input,
                parsedInput: (_, event: InputEvent) => parseInput(event.input),
                resultIds: (context, event: InputEvent) => {
                    if (event.input.length) {
                        const results = rank(context.commands, event.input);
                        if (results !== null) {
                            return results.map((r) => r.id);
                        }
                        return context.resultIds;
                    }
                    return [];
                },
            }),
            clearInputAndResults: assign<MachineContextState>({ input: () => "", resultIds: () => [] }),
            select: assign<MachineContextState, MachineEvents>({ selectedId: (_, event: SelectEvent) => event.id }),
            selectFirst: assign<MachineContextState>({
                selectedId: (context) => context.resultIds[0] || "",
            }),
            setCommandsAndResults: assign<MachineContextState, MachineEvents>({
                commands: (_, event: SetCommandsEvent) => event.commands,
                resultIds: (context, event: SetCommandsEvent) => {
                    if (context.input.length) {
                        const results = rank(event.commands, context.input);
                        if (results !== null) {
                            return results.map((r) => r.id);
                        }
                        return context.resultIds;
                    }
                    return [];
                },
            }),
            step: assign<MachineContextState, MachineEvents>({
                selectedId: (context, event: StepEvent) => {
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
            isExecutable: (context) => {
                // No input or no results
                if (context.input.length < 1 || context.resultIds.length < 1) {
                    return false;
                }
                // Couldn't parse input or only spaces
                if (context.parsedInput === null || context.parsedInput[0].length < 1) {
                    return false;
                }
                const commandMatch = context.commands.filter((c) => c.id === context.selectedId);
                // Executed command not found
                if (!commandMatch.length) {
                    return false;
                }
                const command = commandMatch[0];
                if (command.requiredArgs) {
                    // No args specified
                    if (context.parsedInput.length < 1) {
                        return false;
                    }
                    const inputArgs = context.parsedInput[1] || {};
                    const nonMetRequiredArgs = command.requiredArgs
                        .map((arg) => inputArgs[arg])
                        // Deliberate == in the filter to mathc null and undefined
                        .filter((argVal) => argVal == null);
                    if (nonMetRequiredArgs.length) {
                        return false;
                    }
                }
                return true;
            },
        },
    }
);
