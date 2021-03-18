<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { interpret } from "xstate";
    import { ranks } from "./rank";
    import { selectionMachine } from "./selection-machine";
    import type { Command, CommandDescription, ExecDetail, ParserResult, SortFunction, Theme } from "./types";

    // Local vars
    let results: Command[] = [];
    let outerElement: HTMLDivElement;
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
    export let sortFn: SortFunction = ranks;
    export let commands: Command[] = [];
    export let toggleKey: string = "p";
    export let placeholder: string = "Type something";

    // Start machine
    let selectionService = interpret(
        selectionMachine.withContext({
            ...selectionMachine.context,
            commands,
            toggleKey,
            sortFn,
        })
    ).start();

    // Expose toggle funtion so the outside can toggle visibility
    // eslint-disable-next-line
    export const toggle = () => {
        if ($selectionService.matches("open")) {
            selectionService.send("CLOSE");
            return;
        }
        selectionService.send("OPEN");
    };

    // Machine interactions
    $: if (commands.length) {
        selectionService.send("NEW_COMMANDS", { commands });
    }
    function changed(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
        selectionService.send("INPUT", { input: e.currentTarget.value });
    }

    // Machine listeners
    $: results = $selectionService.context.resultIds.map((id) =>
        reslutIdToCommand($selectionService.context.commands, id)
    );
    selectionService.onEvent((event: { type: string; id?: string; input?: ParserResult }) => {
        if (event.type === "EXEC_DONE") {
            resultExec(event.id, event.input);
        }
    });

    // HTML Events for outer component to listen on
    function resultExec(id: string, input: ParserResult) {
        const payload: ExecDetail = { id, input };
        dispatch("execute", payload);
    }
    $: if ($selectionService.matches("open")) {
        setupOutsideClickListener();
        dispatch("open");
    } else {
        teardownOutsideClickListener();
        dispatch("close");
    }

    // Helper functions
    function clickListener(e: MouseEvent) {
        const { target } = e;
        if (target !== outerElement && !outerElement.contains(target as Node)) {
            selectionService.send("CLOSE");
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
        return descr();
    }
    function reslutIdToCommand(commands: Command[], resultId: string): Command {
        const cmd = commands.filter((c) => c.id === resultId);
        return cmd[0];
    }
</script>

{#if $selectionService.matches("open")}
    <div
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
            <div class="results">
                {#each results as result, resultIndex}
                    <div
                        data-testid={`test-id-${resultIndex}`}
                        class:active={$selectionService.context.selectedId === result.id}
                        on:mousedown={() => selectionService.send("EXEC", { id: result.id })}
                        on:mouseover={() => selectionService.send("SELECT", { id: result.id })}
                        class="result"
                    >
                        {result.title}
                        <span class="result-description">{renderDescription(result.description)}</span>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .wrapper {
        background-color: var(--background-color, rgba(255, 255, 255, 1));
        color: var(--color, #000);
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
        background-color: var(--background-color, rgba(255, 255, 255, 1));
        font-size: 0.9rem;
    }
    .result.active {
        background-color: var(--active-result-background-color, rgba(110, 206, 17, 1));
        color: var(--active-result-title-color, #000);
    }
    .result-description {
        display: block;
        font-size: 0.7rem;
        font-style: italic;
        color: var(--result-description-color, #aaa);
    }
    .result.active .result-description {
        color: var(--active-result-description-color, #fff);
    }
    .results {
        width: 400px;
        margin: 0;
        max-height: 350px;
        overflow-y: auto;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
        padding-top: 0.1rem;
        background-color: var(--background-color, rgba(255, 255, 255, 1));
        scrollbar-width: thin;
        scrollbar-color: var(--color) var(--background-color);
    }
    .results::-webkit-scrollbar {
        width: 6px;
    }
    .results::-webkit-scrollbar-thumb {
        background-color: var(--color);
        border-radius: 6px;
    }
    .results::-webkit-scrollbar-track {
        background: var(--background-color);
    }
    [type="text"] {
        font-size: 1rem;
        padding: 0.5rem;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        border: 0;
        width: calc(400px - 1rem);
        margin: 0;
        color: var(--color, #000);
        background-color: var(--background-color, rgba(255, 255, 255, 1));
    }
    [type="text"]:focus {
        outline: none;
    }
</style>
