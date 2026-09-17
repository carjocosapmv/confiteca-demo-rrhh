/**
 * Radix modal layers (DropdownMenu, Dialog) set `pointer-events: none` on
 * <body> while open and only release it once the exit animation finishes. The
 * driver.js overlay is appended to <body>, so a tour started in the same tick
 * as the close would render un-clickable until the next user interaction.
 *
 * Comfortably longer than the 200ms exit animation shadcn ships with.
 */
export const OVERLAY_RELEASE_MS = 250;

/** Runs `start` after the closing Radix layer has released the document body. */
export function startAfterOverlay(start: () => void): void {
  window.setTimeout(start, OVERLAY_RELEASE_MS);
}
