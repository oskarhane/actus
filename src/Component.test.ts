import { render, fireEvent, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import Component from "./Component.svelte";
import type { Command } from "./types";

const flush = () => new Promise((resolve) => setTimeout(resolve));
// @ts-ignore
test("should work", async () => {
    // @ts-ignore
    const exec = jest.fn();
    const commands: Command[] = [{ id: "1", title: "Title 1", description: "Description 1", exec }];
    const { debug, getByPlaceholderText, getByText } = render(Component, {
        props: { commands, placeholder: "Type for the test", toggleKey: "o" },
    });
    userEvent.keyboard("o");
    await flush();

    // @ts-ignore
    expect(() => getByPlaceholderText(/type for the/i)).not.toThrow();

    // Close it
    userEvent.keyboard("{Escape}");
    await flush();
    // @ts-ignore
    expect(() => getByPlaceholderText(/type for the/i)).toThrow();

    // Open again
    userEvent.keyboard("o");
    await flush();

    userEvent.keyboard("ti");
    const input: HTMLInputElement = getByPlaceholderText(/type for the/i) as HTMLInputElement;
    await flush();

    // @ts-ignore
    expect(() => getByText(/title 1/i)).not.toThrow();
    // @ts-ignore
    expect(() => getByText(/description 1/i)).not.toThrow();
    debug();
});
