import type { EventObject, Interpreter } from "xstate";
import type { ExecEvent, StepEvent, CloseEvent, OpenEvent, MachineContextState } from "./types";

export function setupInteractionListener(el: HTMLElement, service: Interpreter<MachineContextState, any, EventObject>) {
    const closeListenerFn = (e: KeyboardEvent) => {
        const { key } = e;
        if (key === "Escape") {
            service.send({ type: "CLOSE" } as CloseEvent);
            return;
        }
    };
    const interactionListenerFn = (e: KeyboardEvent) => {
        const { key } = e;
        if (key === "Enter") {
            service.send({ type: "EXEC" } as ExecEvent);
            return;
        }
        if (key === "ArrowDown") {
            e.preventDefault();
            service.send({ type: "STEP", direction: "DOWN" } as StepEvent);
            return;
        }
        if (key === "ArrowUp") {
            e.preventDefault();
            service.send({ type: "STEP", direction: "UP" } as StepEvent);
            return;
        }
    };
    el.addEventListener("keydown", interactionListenerFn);
    document.addEventListener("keydown", closeListenerFn);
    return () => {
        el.removeEventListener("keydown", interactionListenerFn);
        document.removeEventListener("keydown", closeListenerFn);
    };
}

export function setupOpenListener(service: Interpreter<MachineContextState, any, EventObject>) {
    const toggleFn = (e: KeyboardEvent) => {
        const { key } = e;
        // @ts-ignore
        if (e.target.tagName === "INPUT") {
            return;
        }
        if (key === service.machine.context.toggleKey) {
            e.preventDefault();
            service.send({ type: "OPEN" } as OpenEvent);
        }
    };
    document.addEventListener("keyup", toggleFn);
    return () => document.removeEventListener("keyup", toggleFn);
}
