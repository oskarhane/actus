import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import Component from "./Component.svelte";
import type { Command } from "./types";

const flush = () => new Promise((resolve) => setTimeout(resolve));

test("should show single command and execute", async () => {
    const exec = jest.fn();
    const command1 = { id: "1", title: "Title 1", description: "Description 1", exec };
    const commands: Command[] = [command1];
    const { getByPlaceholderText, getByText } = render(Component, {
        props: { commands, placeholder: "Type for the test", toggleKey: "o" },
    });
    userEvent.keyboard("o");
    await flush();

    expect(() => getByPlaceholderText(/type for the/i)).not.toThrow();

    // Close it
    userEvent.keyboard("{Escape}");
    await flush();

    expect(() => getByPlaceholderText(/type for the/i)).toThrow();

    // Open again
    userEvent.keyboard("o");
    await flush();

    userEvent.keyboard("ti ");
    await flush();

    expect(() => getByText(/title 1/i)).not.toThrow();
    expect(() => getByText(/description 1/i)).not.toThrow();

    userEvent.keyboard("{enter}");
    await flush();
    expect(exec).toHaveBeenCalledWith(command1, ["ti"]);
    expect(() => getByPlaceholderText(/type for the/i)).toThrow();
});

test("stepping should work", async () => {
    const exec = jest.fn();
    const exec2 = jest.fn();
    const command1 = { id: "1", title: "Title 1", description: "Description 1", exec };
    const command2 = { id: "2", title: "Second command", description: "Description 2", exec: exec2 };
    const commands: Command[] = [command1, command2];
    const { getByTestId, getByText } = render(Component, {
        props: { commands, placeholder: "Type for the test", toggleKey: "o" },
    });
    userEvent.keyboard("o");
    await flush();

    userEvent.keyboard("e"); // Should show both
    await flush();

    expect(() => getByText(/title 1/i)).not.toThrow();
    expect(() => getByText(/description 1/i)).not.toThrow();
    expect(() => getByText(/second command/i)).not.toThrow();
    expect(() => getByText(/description 2/i)).not.toThrow();

    const firstResult = getByTestId("test-id-0");
    const secondResult = getByTestId("test-id-1");

    expect(firstResult.classList.contains("active")).toBe(true);
    expect(secondResult.classList.contains("active")).toBe(false);

    // Step down
    userEvent.keyboard("{ArrowDown}");
    await flush();

    expect(firstResult.classList.contains("active")).toBe(false);
    expect(secondResult.classList.contains("active")).toBe(true);

    // Step down again
    userEvent.keyboard("{ArrowDown}");
    await flush();

    expect(firstResult.classList.contains("active")).toBe(true);
    expect(secondResult.classList.contains("active")).toBe(false);

    userEvent.keyboard(" -p 12 -g gParam -force {enter}"); // set parameters
    await flush();

    expect(exec).toHaveBeenCalledWith(command1, ["e", { force: null, g: "gParam", p: "12" }]);
});

test("should strip double quotes", async () => {
    const exec = jest.fn();
    const command1 = { id: "1", title: "x", description: "x", exec };
    const commands: Command[] = [command1];
    render(Component, {
        props: { commands, placeholder: "Type for the test", toggleKey: "o" },
    });
    userEvent.keyboard("o");
    await flush();

    userEvent.keyboard(`x -e "my space" {enter}`);
    await flush();

    expect(exec).toHaveBeenCalledWith(command1, ["x", { e: `my space` }]);
});
