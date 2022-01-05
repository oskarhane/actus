<script lang="ts">
    import { createEventDispatcher, onMount, tick } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { interpret, selectionMachine, setupInteractionListener, setupOpenListener } from "@actus/core";
    import type { Theme } from "./types";
    import type {
        Command,
        CloseEvent,
        CommandDescription,
        CommandTitle,
        ExecDetail,
        ExecDoneEvent,
        ExecEvent,
        InputEvent,
        ParserResult,
        SelectEvent,
        SetCommandsEvent,
        MachineEvents,
        MachineState,
    } from "@actus/core/dist/types";

    // Local vars
    let results: Command[] = [];
    let outerElement: HTMLDivElement;
    let teardownInputListener = () => {};
    let tearDownOpenListener = () => {};
    const dispatch = createEventDispatcher();

    // Exports / API
    export let theme: Theme = {
        "--active-result-background-color": "",
        "--background-color": "",
        "--result-description-color": "",
        "--active-result-description-color": "",
        "--active-result-title-color": "",
        "--color": "",
        "--scale": "",
    };
    export let commands: Command[] = [];
    export let toggleKey: string = "p";
    export let ctrlKey: boolean = false;
    export let placeholder: string = "Type something";

    // Start machine
    const selectionService = interpret(
        selectionMachine.withContext({
            ...selectionMachine.context,
            commands,
            toggleKey,
            ctrlKey,
        })
    ).start();

    // Expose toggle funtion so the outside can toggle visibility
    // eslint-disable-next-line
    export const toggle = () => {
        if ($selectionService.matches("open")) {
            selectionService.send({ type: "CLOSE" } as CloseEvent);
            return;
        }
        selectionService.send("OPEN");
    };

    // Machine listeners
    function handleMachineTransitions(state: MachineState, event: MachineEvents) {
        Object.keys(machineStatesListeners).forEach((stateString) => {
            if (state.matches(stateString)) {
                machineStatesListeners[stateString](state, event);
            }
        });
        if (machineEventListeners[event.type]) {
            machineEventListeners[event.type](state, event);
        }
    }
    const machineStatesListeners = {
        closed: (state: MachineState) => {
            teardownOutsideClickListener();
            teardownInputListener();
            dispatch("close");
            setupOpeningListener();
            results = state.context.resultIds.map((id) => reslutIdToCommand(state.context.commands, id));
        },
    };
    const machineEventListeners = {
        INPUT: (state: MachineState) => {
            results = state.context.resultIds.map((id) => reslutIdToCommand(state.context.commands, id));
        },
        NEW_COMMANDS: (state: MachineState) => {
            results = state.context.resultIds.map((id) => reslutIdToCommand(state.context.commands, id));
        },
        OPEN: () => {
            setupInputListener();
            setupOutsideClickListener();
            tearDownOpenListener();
            dispatch("open");
        },
        EXEC_DONE: (_, event: ExecDoneEvent) => resultExec(event.id, event.input),
        STEP: async () => {
            await tick();
            const activeEls = document.getElementsByClassName("active");
            if (!activeEls || !activeEls.length) {
                return;
            }
            const elem = activeEls[0] as HTMLDivElement;
            // @ts-ignore
            if (elem && elem.scrollIntoViewIfNeeded) {
                // @ts-ignore
                elem.scrollIntoViewIfNeeded();
            }
        },
    };
    onMount(() => {
        selectionService.onTransition(handleMachineTransitions);
    });

    // Machine interactions
    $: if (commands.length) {
        selectionService.send({ type: "NEW_COMMANDS", commands } as SetCommandsEvent);
    }
    function changed(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        selectionService.send({ type: "INPUT", input: e.currentTarget.value } as InputEvent);
    }

    // HTML Events for outer component to listen on
    function resultExec(id: string, input: ParserResult) {
        const payload: ExecDetail = { id, input };
        dispatch("execute", payload);
    }

    // Helper functions
    async function setupOpeningListener() {
        if (selectionService === null) {
            setTimeout(setupOpeningListener, 50);
            return;
        }
        tearDownOpenListener = setupOpenListener(selectionService);
    }
    async function setupInputListener() {
        await tick();
        if (!outerElement || selectionService === null) {
            setTimeout(setupInputListener, 50);
            return;
        }
        if (teardownInputListener) {
            teardownInputListener();
        }
        teardownInputListener = setupInteractionListener(outerElement, selectionService);
    }
    function clickListener(e: MouseEvent) {
        const { target } = e;
        if (outerElement && target !== outerElement && !outerElement.contains(target as Node)) {
            selectionService.send({ type: "CLOSE" } as CloseEvent);
        }
    }
    function setupOutsideClickListener() {
        document.body.addEventListener("click", clickListener);
    }
    function teardownOutsideClickListener() {
        document.body.removeEventListener("click", clickListener);
    }
    function focus(e: HTMLInputElement) {
        e.focus();
    }
    function renderDescription(descr: CommandDescription) {
        if (typeof descr === "string") {
            return descr;
        }
        return descr($selectionService.context.parsedInput);
    }
    function renderTitle(title: CommandTitle) {
        if (typeof title === "string") {
            return title;
        }
        return title($selectionService.context.parsedInput);
    }
    function reslutIdToCommand(commands: Command[], resultId: string): Command {
        const cmd = commands.filter((c) => c.id === resultId);
        return cmd[0];
    }
    function selectEvent(id: string): SelectEvent {
        return { type: "SELECT", id };
    }
    function execEvent(id: string): ExecEvent {
        return { type: "EXEC", id };
    }
</script>

{#if $selectionService.matches("open")}
    <div
        transition:fade={{ duration: 150 }}
        bind:this={outerElement}
        class="wrapper"
        style={Object.entries(theme)
            .map((e) => e.join(":"))
            .join(";")}
    >
        <div class="command-section">
            <input
                use:focus
                value={$selectionService.context.input}
                on:input|preventDefault={changed}
                type="text"
                {placeholder}
            />
        </div>
        {#if results.length}
            <div class="results" transition:slide={{ duration: 150 }}>
                {#each results as result, resultIndex}
                    <div
                        data-testid={`test-id-${resultIndex}`}
                        class:active={$selectionService.context.selectedId === result.id}
                        on:mousedown={() => selectionService.send(execEvent(result.id))}
                        on:mouseover={() => selectionService.send(selectEvent(result.id))}
                        on:focus={() => selectionService.send(selectEvent(result.id))}
                        class="result"
                    >
                        {renderTitle(result.title)}
                        <span class="result-description">{renderDescription(result.description)}</span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .wrapper {
        background-color: var(--background-color, rgba(36, 36, 36, 1));
        color: var(--color, rgba(212, 208, 199, 1));
        display: flex;
        flex-direction: column;
        position: relative;
        box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.4);
        border-radius: 4px;
        transform-origin: top center;
        transform: scale(var(--scale, 1));
        width: 400px;
    }
    .command-section {
        margin: 0;
    }
    .result {
        cursor: pointer;
        padding: 0.6rem;
        background-color: var(--background-color, rgba(36, 36, 36, 1));
        font-size: 0.9rem;
    }
    .result.active {
        background-color: var(--active-result-background-color, rgba(64, 64, 64, 1));
        color: var(--active-result-title-color, rgba(255, 255, 255, 1));
    }
    .result-description {
        display: block;
        font-size: 0.7rem;
        font-style: italic;
        color: var(--result-description-color, rgba(212, 208, 199, 1));
    }
    .result.active .result-description {
        color: var(--active-result-description-color, rgba(255, 255, 255, 1));
    }
    .results {
        width: 400px;
        margin: 0;
        max-height: 350px;
        overflow-y: auto;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        padding-top: 0.1rem;
        background-color: var(--background-color, rgba(36, 36, 36, 1));
        scrollbar-width: thin;
        scrollbar-color: var(--color, rgba(212, 208, 199, 1)) var(--background-color, rgba(36, 36, 36, 1));
    }
    .results::-webkit-scrollbar {
        width: 6px;
    }
    .results::-webkit-scrollbar-thumb {
        background-color: var(--color, rgba(212, 208, 199, 1));
        border-radius: 6px;
    }
    .results::-webkit-scrollbar-track {
        background: var(--background-color, rgba(36, 36, 36, 1));
    }
    [type="text"] {
        font-size: 1rem;
        padding: 0.5rem;
        border: 0;
        width: calc(400px - 1rem);
        margin: 4px 0;
        color: var(--color, rgba(212, 208, 199, 1));
        background-color: var(--background-color, rgba(36, 36, 36, 1));
    }
    [type="text"]:focus {
        outline: none;
    }
</style>
