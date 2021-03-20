import { render } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import Component from "./Component.svelte";
import { parseInput } from "./rank";
import type { Command, GenerateMatchStringFn, ParserResult } from "./types";

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

test("should not break on non parseable input", async () => {
    const exec = jest.fn();
    const command1 = { id: "1", title: "xxx", description: "x", exec };
    const commands: Command[] = [command1];
    const { getByText } = render(Component, {
        props: { commands, placeholder: "Type for the test", toggleKey: "o" },
    });
    userEvent.keyboard("o");
    await flush();

    userEvent.keyboard(`x`);
    await flush();

    expect(() => getByText(/xxx/)).not.toThrow();

    userEvent.keyboard(` -e "`); // input is now: x -e "
    await flush();

    expect(() => getByText(/xxx/)).not.toThrow();

    userEvent.keyboard(`{enter}`);
    await flush();

    expect(exec).not.toHaveBeenCalled();
    expect(() => getByText(/xxx/)).not.toThrow();

    userEvent.keyboard(`{backspace}`);
    await flush();

    userEvent.keyboard(`{enter}`);
    await flush();

    expect(exec).toHaveBeenCalledWith(command1, ["x", { e: null }]);
    expect(() => getByText(/xxx/)).toThrow();
});
test("should keep open on inside clicks and close on outer", async () => {
    const exec = jest.fn();
    const command1 = { id: "1", title: "isopen", description: "x", exec };
    const commands: Command[] = [command1];
    const { getByPlaceholderText, getByText } = render(Component, {
        props: { commands, placeholder: "Type for the test", toggleKey: "o" },
    });
    userEvent.keyboard("o");
    await flush();
    userEvent.keyboard(`iso`);
    await flush();

    // Click input
    userEvent.click(getByPlaceholderText(/type for/i));
    await flush();

    expect(() => getByPlaceholderText(/type for/i)).not.toThrow();

    // Click body
    userEvent.click(document.body);
    await flush();

    expect(() => getByPlaceholderText(/type for/i)).toThrow();

    // open again
    userEvent.keyboard("o");
    await flush();

    // Check so the last value is around
    // @ts-ignore
    expect(getByPlaceholderText(/type for/i).value).toBe("iso");

    // Click result
    userEvent.click(getByText(/isopen/));
    await flush();

    expect(exec).toHaveBeenCalledTimes(1);
    expect(() => getByPlaceholderText(/type for/i)).toThrow();
});
test("should support dynamic matching commands", async () => {
    const exec = jest.fn();
    const getMatchString = jest.fn((input: ParserResult | null) => input[0]);
    const title = (input: ParserResult) => `Title for ${input[0]}`;
    const description = (input: ParserResult) => `Description for ${input[0]}`;
    const input = "665544";
    const parsedInput = parseInput(input);
    // @ts-ignore
    const command1: Command = { id: "1", title, description, exec, getMatchString };
    const commands: Command[] = [command1];
    const { getByText } = render(Component, {
        props: { commands, placeholder: "Type for the test", toggleKey: "o" },
    });
    userEvent.keyboard("o");
    await flush();

    userEvent.keyboard(input);
    await flush();

    expect(() => getByText(title(parsedInput))).not.toThrow();
    expect(() => getByText(description(parsedInput))).not.toThrow();

    userEvent.keyboard("{enter}");
    await flush();

    expect(exec).toHaveBeenCalledWith(command1, ["665544"]);
});
