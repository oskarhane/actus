## svelte-commander

## Component Usage

Install it in your Svelte project with:

```bash
npm install svelte-commander
```

and import it

```svelte
import Commander from 'svelte-commander'
```

As mentioned, it should be trivial to implement this in any UI framework, have a look in [src/Component.svelte](src/Component.svelte) to see how it's made using Svelte.

All props except `commands` are optional.

```jsx
<Commander
    {commands}
    toggleKey="p"
    placeholder="Type your best commands"
    theme={{
        "--color": "rgba(212, 208, 199, 1.00)",
        "--result-description-color": "rgba(212, 208, 199, 1.00)",
        "--background-color": "rgba(36, 36, 36, 1.00)",
        "--active-result-background-color": "rgba(64, 64, 64, 1.00)",
        "--active-result-description-color": "rgba(255, 255, 255, 1.00)",
        "--active-result-title-color": "rgba(255, 255, 255, 1.00)",
        "--scale": "1.3",
    }}
/>
```

## Demo

Here's a demo: [https://ti99l.csb.app](https://ti99l.csb.app)
