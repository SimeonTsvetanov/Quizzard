// The routing probe: a tiny mini-app for tests/e2e/routing.spec.ts (e2e build only). It renders a
// heading and a button, adds one `document` listener and one timer, and counts everything on
// `window.quizzardProbe` so the e2e can prove that unmount leaves no node, listener or timer.
// Launch parameters: `?fail=mount` throws in mount, `?mountDelay=<ms>` mounts asynchronously,
// `?n=<text>` is shown in the output (tells instances apart in race tests).
import type { MiniAppContext, MiniAppModule, Unmount } from "@simeonts/quizzard-core";

/** What the e2e reads from `window.quizzardProbe`. */
export interface ProbeCounters {
  mounts: number;
  unmounts: number;
  /** `probe:ping` events seen on `document` (only a mounted instance listens). */
  pings: number;
  /** Timer ticks (only a mounted instance ticks). */
  ticks: number;
}

/** Name of the custom `document` event the probe listens to. */
export const PROBE_PING_EVENT = "probe:ping";
/** Timer period of a mounted probe. */
const TICK_MS = 50;
/** Longest accepted `?mountDelay`, so a typo cannot stall a test run. */
const MAX_MOUNT_DELAY_MS = 5000;

const counters: ProbeCounters = { mounts: 0, unmounts: 0, pings: 0, ticks: 0 };
Object.assign(window, { quizzardProbe: counters });

/** The probe's contract module. */
export const probeMiniApp: MiniAppModule = {
  mount(element: HTMLElement, context: MiniAppContext): Unmount | Promise<Unmount> {
    if (context.query.get("fail") === "mount") throw new Error("Probe mount failed on purpose (?fail=mount)");
    const delay = Math.min(Number(context.query.get("mountDelay") ?? "0"), MAX_MOUNT_DELAY_MS);
    if (!Number.isFinite(delay) || delay <= 0) return render(element, context);
    return new Promise((resolve) => {
      setTimeout(() => { resolve(render(element, context)); }, delay);
    });
  },
};

function render(element: HTMLElement, context: MiniAppContext): Unmount {
  counters.mounts += 1;
  const heading = document.createElement("h1");
  heading.textContent = "Probe";
  const output = document.createElement("p");
  output.dataset["probeOutput"] = "";
  output.textContent = context.query.get("n") ?? "";
  let clicks = 0;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Rename";
  button.addEventListener("click", () => {
    clicks += 1;
    context.shell.setTitle(`Probe step ${String(clicks)}`);
  });
  const root = document.createElement("section");
  root.dataset["probe"] = "";
  root.append(heading, output, button);
  element.append(root);
  const onPing = (): void => { counters.pings += 1; };
  document.addEventListener(PROBE_PING_EVENT, onPing);
  const timer = setInterval(() => { counters.ticks += 1; }, TICK_MS);
  return () => {
    document.removeEventListener(PROBE_PING_EVENT, onPing);
    clearInterval(timer);
    root.remove();
    counters.unmounts += 1;
  };
}
