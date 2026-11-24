// The audience window as a browser window: opened by the host's page with `window.open`, talking
// over `postMessage` (channel.ts). Both the exported page and the creator use these two helpers and
// differ only in the address they open.
import { type Transport, peerOrigin, windowTransport } from "./channel.ts";
import type { AudienceLink } from "./player.ts";

/** The name of the audience window: asking again reuses the one that is open. */
const WINDOW_NAME = "quizzard-audience";

/**
 * Opens the audience window.
 * @param url - the page it shows: this player again, in its audience role
 * @returns the link to it, or `null` when the browser blocked the window
 */
export function openAudienceWindow(url: string): AudienceLink | null {
  const opened = window.open(url, WINDOW_NAME, "popup,width=1280,height=720");
  if (opened === null) return null;
  return {
    transport: windowTransport(window, () => opened, peerOrigin(location)),
    isClosed: () => opened.closed,
    close: () => { opened.close(); },
  };
}

/**
 * The way from an audience window to the window that opened it.
 * @returns the transport, or `null` when this window was not opened by a player
 */
export function openerTransport(): Transport | null {
  const opener = window.opener as Window | null;
  if (opener === null) return null;
  return windowTransport(window, () => opener, peerOrigin(location));
}
