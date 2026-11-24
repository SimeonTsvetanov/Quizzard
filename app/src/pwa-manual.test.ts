// Unit tests for pwa-manual.ts: what "Check for updates" finds, with small stubs for the worker.
import { describe, expect, it, vi } from "vitest";
import { type InstallingWorker, type ManualRegistration, findUpdate, whenInstalled } from "./pwa-manual.ts";

/** A worker whose state the test moves; `to` tells its listeners. */
function worker(state: ServiceWorkerState): InstallingWorker & { to(next: ServiceWorkerState): void } {
  const listeners: (() => void)[] = [];
  const stub = {
    state,
    addEventListener: (_name: string, listener: () => void) => { listeners.push(listener); },
    to(next: ServiceWorkerState) {
      stub.state = next;
      for (const listener of listeners) listener();
    },
  };
  // because only the state and its change event matter here, not a real ServiceWorker
  return stub as unknown as InstallingWorker & { to(next: ServiceWorkerState): void };
}

interface Parts { waiting?: boolean; installing?: ReturnType<typeof worker>; afterUpdate?: (registration: { waiting: unknown; installing: unknown }) => void }

function setup({ waiting = false, installing, afterUpdate }: Parts = {}, isOnline = true, status = 200) {
  const registration: { waiting: unknown; installing: unknown; update: () => Promise<void> } = {
    waiting: waiting ? {} : null,
    installing: installing ?? null,
    update: vi.fn(() => { afterUpdate?.(registration); return Promise.resolve(); }),
  };
  const fetchScript = vi.fn(() => Promise.resolve({ status }));
  const run = () => findUpdate({ swUrl: "sw.js", registration: registration as unknown as ManualRegistration, isOnline: () => isOnline, fetchScript });
  return { registration, fetchScript, run };
}

describe("whenInstalled", () => {
  it("is true once the worker is installed and false when the install fails", async () => {
    const good = worker("installing");
    const first = whenInstalled(good);
    good.to("installed");
    await expect(first).resolves.toBe(true);
    const bad = worker("installing");
    const second = whenInstalled(bad);
    bad.to("redundant");
    await expect(second).resolves.toBe(false);
    await expect(whenInstalled(worker("activated"))).resolves.toBe(true);
  });
});

describe("findUpdate", () => {
  it("finds a version that already waits without asking the server", async () => {
    const { run, fetchScript } = setup({ waiting: true });
    await expect(run()).resolves.toBe("found");
    expect(fetchScript).not.toHaveBeenCalled();
  });

  it("says latest when the server has nothing new", async () => {
    const { run, registration } = setup();
    await expect(run()).resolves.toBe("latest");
    expect(registration.update).toHaveBeenCalledOnce();
  });

  it("finds the version the check brings, once it has finished installing", async () => {
    const incoming = worker("installing");
    const { run, registration } = setup({ afterUpdate: (found) => { found.installing = incoming; } });
    const result = run();
    await vi.waitFor(() => { expect(registration.update).toHaveBeenCalledOnce(); });
    registration.waiting = {};
    incoming.to("installed");
    await expect(result).resolves.toBe("found");
  });

  it("says latest when the new version fails to install", async () => {
    const incoming = worker("installing");
    const { run, registration } = setup({ afterUpdate: (found) => { found.installing = incoming; } });
    const result = run();
    await vi.waitFor(() => { expect(registration.update).toHaveBeenCalledOnce(); });
    incoming.to("redundant");
    await expect(result).resolves.toBe("latest");
  });

  it("says offline when the device is offline or the server does not answer 200", async () => {
    await expect(setup({}, false).run()).resolves.toBe("offline");
    await expect(setup({}, true, 503).run()).resolves.toBe("offline");
  });
});
