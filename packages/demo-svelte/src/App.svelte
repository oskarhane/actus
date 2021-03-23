<script lang="ts">
    import Commander from "@actus/svelte";
    export let name: string;
</script>

<main>
    <h1>Hello {name}!</h1>
    <p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
    <div class="commanders">
        <div class="commander">
            <Commander commands={[{ id: "1", title: "yyy", description: "zzz", exec: () => {} }]} />
        </div>
        <div class="commander">
            <Commander commands={[{ id: "1", title: "xxx", description: "zzz", exec: () => {} }]} toggleKey="o" />
        </div>
    </div>
</main>

<style>
    .commanders {
        display: flex;
    }
    .commander {
        text-align: left;
        width: 50%;
    }
    main {
        text-align: center;
        padding: 1em;
        max-width: 240px;
        margin: 0 auto;
    }

    h1 {
        color: #ff3e00;
        text-transform: uppercase;
        font-size: 4em;
        font-weight: 100;
    }

    @media (min-width: 640px) {
        main {
            max-width: none;
        }
    }
</style>
