export interface WaitForElementOptions {
  /** How long to wait before giving up. Defaults to 3s. */
  timeoutMs?: number;
  /** Subtree to observe. Defaults to the whole document. */
  root?: Document | Element;
}

/**
 * Resolves with the first element matching `selector`, waiting for it to appear
 * if it is not in the DOM yet. Resolves `null` on timeout instead of rejecting,
 * so callers can degrade gracefully (skip a step) rather than crash a tour.
 *
 * The MutationObserver is always disconnected and the timer always cleared,
 * on both the success and the timeout path.
 */
export function waitForElement(
  selector: string,
  { timeoutMs = 3000, root = document }: WaitForElementOptions = {},
): Promise<HTMLElement | null> {
  const existing = root.querySelector<HTMLElement>(selector);
  if (existing) return Promise.resolve(existing);

  return new Promise<HTMLElement | null>((resolve) => {
    let settled = false;

    const observer = new MutationObserver(() => {
      const found = root.querySelector<HTMLElement>(selector);
      if (found) finish(found);
    });

    const timeoutId = setTimeout(() => finish(null), timeoutMs);

    // Declared as a hoisted function so `observer` and `timeoutId` can stay
    // const despite the mutual reference.
    function finish(element: HTMLElement | null) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      observer.disconnect();
      resolve(element);
    }

    // Observing `document` directly is legal but `documentElement` is cheaper
    // and avoids doctype-level noise.
    const observed = root instanceof Document ? root.documentElement ?? root.body : root;
    if (!observed) {
      finish(null);
      return;
    }

    observer.observe(observed, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  });
}
