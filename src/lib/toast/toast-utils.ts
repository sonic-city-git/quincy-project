import { ToastState, ToastAction } from "./types";
import { TOAST_REMOVE_DELAY } from "./toast-reducer";

let count = 0;
export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

export const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const listeners: Array<(state: ToastState) => void> = [];
export let memoryState: ToastState = { toasts: [] };

export function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}