<script>
    import Actus from "@actus/svelte";
    let id = 0;

    const random = Math.round(Math.random() * 1000);
    let ip = "";
    async function getIp() {
        try {
            const ipJson = await fetch("https://api.my-ip.io/ip.json", {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const ipData = await ipJson.json();
            ip = ipData.ip;
        } catch (e) {
            console.log("e: ", e);
        }
    }
    getIp();

    function setClipboard(text) {
        navigator.clipboard.writeText(text);
    }

    let commands = [
        {
            id: "hello",
            title: "hello",
            description: "just says hello",
            exec: () => console.log("hello"),
        },
        {
            id: "hello3",
            title: "hello 3",
            description: "just says hello 3",
            exec: () => console.log("hello 3"),
        },
        {
            id: "dyn1",
            title: "User agent",
            description: () => navigator.userAgent,
            exec: () => {},
        },
        {
            id: "rnd",
            title: "Random number",
            description: () => `` + random,
            exec: () => alert(random),
        },
        {
            id: "ip",
            title: "Get my IP address",
            description: () => `Your IP address is ${ip}. Hit enter to copy to clipboard.`,
            exec: () => setClipboard(ip),
        },
        {
            id: "identity",
            title: "Identity command",
            description: `I will log myself to the console`,
            exec: (cmd) => console.log(cmd),
        },
        {
            id: "bg",
            title: "Change background color with a param",
            description: `Use the -c <color> parameter (required)`,
            exec: (cmd, [_, { c } = {}]) => (c ? (document.body.style.background = c) : null),
            requiredArgs: ["c"],
        },
        {
            id: "bg2",
            title: (r) => "Change background color to " + r[0],
            description: `Press enter to change the bg color`,
            exec: (cmd, parsedCmd) => (document.body.style.background = parsedCmd[0]),
            getMatchString: (input) => (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\s*$/.test(input[0]) ? input[0] : ""),
        },
        {
            id: "smile1",
            title: (r) => "😀 :smile:",
            description: `Press enter to add to clipboard`,
            exec: (cmd, parsedCmd) => setClipboard("😀"),
        },
        {
            id: "smile2",
            title: (r) => "💩 :poop:",
            description: `Press enter to add to clipboard`,
            exec: (cmd, parsedCmd) => setClipboard("💩"),
        },
        {
            id: "smile3",
            title: (r) => "🎉 :tada:",
            description: `Press enter to add to clipboard`,
            exec: (cmd, parsedCmd) => setClipboard("🎉"),
        },
    ];

    function didExec({ detail: { id, input } }) {
        console.log("Executed { id, input }: ", { id, input });
    }
    function addCommand(title, description) {
        commands = commands.concat({
            id: `id-${id}`,
            title,
            description,
            exec: () => {},
        });
    }
    setInterval(() => addCommand(`hello ${id++}`, `description`), 5000);
</script>

<div class="wrapper">
    <h1>🎉 @actus/svelte 🎉</h1>
    <div class="info">
        - Press the key <code>p</code> or <code>o</code> to open an actus bar, hit <code>Escape</code>
        to close.
        <br />
        - There are two of them on this page, in different themes but with the same commands.
        <br />
        - Most commands match the letter <code>e</code>.
        <br />
        - Start with <code>:</code> to see a list of emojis 😀
        <br />
        - Check <code>App.svelte</code> for available commands, and to add your own.
        <br />
        - New "hello x" commands are added every 5 seconds to show how that's handled.
        <br />
        - To view a <strong>dynamically matched command</strong>, type a hex color in the <code>#abc</code> or
        <code>#112233</code> format.
        <br />
        <br />
        <em
            >It's also self learning, the more you choose a certain result for a certain input, the higher in the list
            it will be.</em
        >
    </div>
    <div class="palettes">
        <div class="holder">
            <Actus {commands} on:execute={didExec} toggleKey="p" placeholder="Type your best commands" />
        </div>
        <div class="holder">
            <Actus
                {commands}
                on:execute={didExec}
                toggleKey="o"
                placeholder="Type in this themed one"
                theme={{
                    "--color": "#000",
                    "--active-result-title-color": "#000",
                    "--result-description-color": "#aaa",
                    "--active-result-description-color": "#fff",
                    "--background-color": "#fff",
                    "--active-result-background-color": "rgba(110, 206, 17, 1)",
                    "--scale": "1.3",
                }}
            />
        </div>
    </div>
    <div class="link">
        <a href="https://github.com/oskarhane/actus" target="_blank" rel="noreferrer"
            >https://github.com/oskarhane/actus</a
        >
    </div>
</div>

<style>
    h1 {
        padding: 0;
        margin: 2rem 0 1rem 0;
        font-size: 2rem;
    }
    .wrapper {
        height: 100vh;
        overflow: hidden;
        padding: 0 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
    }
    .info {
        border-radius: 2px;
        padding: 1rem;
        background: #fafafa;
        line-height: 1.4rem;
    }
    .palettes {
        position: absolute;
        display: flex;
        width: 100%;
        top: 40px;
        left: 40px;
    }
    .holder {
        width: 40%;
        float: left;
        padding-top: 50px;
        font-family: Arial, Helvetica, sans-serif;
    }
    :global(body) {
        font-family: "Lucida Sans", "Lucida Sans Regular", "Lucida Grande", "Lucida Sans Unicode", Geneva, Verdana,
            sans-serif;
        background: skyblue;
        margin: 0;
        padding: 0;
        font-size: 14px;
    }
    .link {
        position: fixed;
        bottom: 100px;
    }
    code {
        border: 1px solid grey;
        border-radius: 2px;
        background-color: #efefef;
        padding: 1px 2px;
        font-size: 0.9em;
    }
</style>
