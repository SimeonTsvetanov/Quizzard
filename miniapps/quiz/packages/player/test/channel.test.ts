// The channel between the host's and the audience's window, over a fake transport: two ends joined
// in memory, as `postMessage` joins two windows.
import { describe, expect, it, vi } from "vitest";
import { CHANNEL_MARK, CHANNEL_VERSION, type ChannelMessage, type Transport, createChannel, peerOrigin, readMessage, windowTransport } from "../src/channel.ts";
import { step } from "../src/game/step.ts";
import { newGame, quizFile } from "./helpers.ts";

/** Two transports joined to each other; `wire` lists everything that crossed, and `inject` puts raw data on the line. */
function pair(): { a: Transport; b: Transport; wire: unknown[]; inject: (toA: unknown) => void } {
  const listeners = { a: new Set<(message: unknown) => void>(), b: new Set<(message: unknown) => void>() };
  const wire: unknown[] = [];
  const end = (mine: "a" | "b", other: "a" | "b"): Transport => ({
    post(message) {
      const copy: unknown = structuredClone(message); // what postMessage does: the peer gets a copy
      wire.push(copy);
      for (const listener of [...listeners[other]]) listener(copy);
    },
    subscribe(listener) {
      listeners[mine].add(listener);
      return () => { listeners[mine].delete(listener); };
    },
  });
  return { a: end("a", "b"), b: end("b", "a"), wire, inject: (raw) => { for (const listener of [...listeners.a]) listener(raw); } };
}

describe("createChannel", () => {
  it("carries the handshake and the game: hello → init with the quiz and the state, then every state", () => {
    const { a, b } = pair();
    const host = createChannel(a);
    const audience = createChannel(b);
    const file = quizFile([1]);
    let state = newGame([1]);
    const seen: ChannelMessage[] = [];
    host.on((message) => { if (message.kind === "hello") host.send({ kind: "init", file, state }); });
    audience.on((message) => seen.push(message));
    audience.send({ kind: "hello" });
    state = step(state, { type: "next" });
    host.send({ kind: "state", state });
    expect(seen.map((message) => message.kind)).toEqual(["init", "state"]);
    expect(seen[0]).toEqual({ kind: "init", file, state: newGame([1]) });
    expect(seen[1]).toEqual({ kind: "state", state });
  });

  it("carries a key pressed in the audience window back as a move for the host", () => {
    const { a, b } = pair();
    const host = createChannel(a);
    const audience = createChannel(b);
    const moves: unknown[] = [];
    host.on((message) => { if (message.kind === "action") moves.push(message.action); });
    audience.send({ kind: "action", action: { type: "next" } });
    audience.send({ kind: "action", action: { type: "setScore", roundId: "r1", teamId: "t1", value: 2 } });
    expect(moves).toEqual([{ type: "next" }, { type: "setScore", roundId: "r1", teamId: "t1", value: 2 }]);
  });

  it("marks what it sends, so other traffic on the same line can be told apart", () => {
    const { a, wire } = pair();
    createChannel(a).send({ kind: "hello" });
    expect(wire).toEqual([{ mark: CHANNEL_MARK, v: CHANNEL_VERSION, body: { kind: "hello" } }]);
  });

  it("ignores everything that is not a message of this protocol", () => {
    const { a, inject } = pair();
    const listener = vi.fn();
    createChannel(a).on(listener);
    const envelope = (body: unknown, v: number = CHANNEL_VERSION): unknown => ({ mark: CHANNEL_MARK, v, body });
    for (const raw of [
      null, "hello", 42, [], {}, { kind: "hello" }, { mark: "other", v: CHANNEL_VERSION, body: { kind: "hello" } }, envelope({ kind: "hello" }, 2), envelope(null), envelope({}), envelope({ kind: "explode" }),
      envelope({ kind: "toString" }), envelope({ kind: "state" }), envelope({ kind: "state", state: { screens: "x", index: 0 } }), envelope({ kind: "state", state: { screens: [] } }),
      envelope({ kind: "init", state: newGame([1]) }), envelope({ kind: "action" }), envelope({ kind: "action", action: { type: 5 } }),
    ]) inject(raw);
    expect(listener).not.toHaveBeenCalled();
    inject(envelope({ kind: "bye" }));
    expect(listener).toHaveBeenCalledExactlyOnceWith({ kind: "bye" });
  });

  it("on() returns how to stop listening", () => {
    const { a, b } = pair();
    const listener = vi.fn();
    const stop = createChannel(a).on(listener);
    const peer = createChannel(b);
    peer.send({ kind: "hello" });
    stop();
    peer.send({ kind: "hello" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("close says goodbye once, then neither sends nor listens", () => {
    const { a, b, wire } = pair();
    const host = createChannel(a);
    const audience = createChannel(b);
    const atHost = vi.fn();
    const atAudience = vi.fn();
    host.on(atHost);
    audience.on(atAudience);
    host.close();
    host.close();
    host.send({ kind: "hello" });
    audience.send({ kind: "hello" });
    expect(atAudience.mock.calls).toEqual([[{ kind: "bye" }]]);
    expect(atHost).not.toHaveBeenCalled();
    expect(wire.filter((raw) => readMessage(raw)?.kind === "bye")).toHaveLength(1);
  });
});

describe("readMessage", () => {
  it("reads each kind of message with what it must carry", () => {
    const state = newGame([1]);
    const wrap = (body: ChannelMessage): unknown => ({ mark: CHANNEL_MARK, v: CHANNEL_VERSION, body });
    for (const message of [{ kind: "hello" }, { kind: "bye" }, { kind: "state", state }, { kind: "init", file: quizFile([1]), state }, { kind: "action", action: { type: "back" } }] satisfies ChannelMessage[]) {
      expect(readMessage(wrap(message))).toEqual(message);
    }
  });
});

describe("the window transport", () => {
  /** A stand-in for a window: `postMessage` records, `emit` delivers a message event. */
  function fakeWindow(): { window: Window; posted: unknown[][]; emit(event: Partial<MessageEvent>): void; listeners: number } {
    const handlers = new Set<(event: MessageEvent) => void>();
    const posted: unknown[][] = [];
    const fake = {
      closed: false,
      postMessage: (...args: unknown[]) => { posted.push(args); },
      addEventListener: (_type: string, handler: (event: MessageEvent) => void) => { handlers.add(handler); },
      removeEventListener: (_type: string, handler: (event: MessageEvent) => void) => { handlers.delete(handler); },
    };
    return { window: fake as unknown as Window, posted, emit: (event) => { for (const handler of [...handlers]) handler(event as MessageEvent); }, get listeners() { return handlers.size; } };
  }

  it("a page from a file addresses any origin and trusts the window alone; a page from a site names its origin", () => {
    expect(peerOrigin({ origin: "null", protocol: "file:" })).toBe("*");
    expect(peerOrigin({ origin: "file://", protocol: "file:" })).toBe("*");
    expect(peerOrigin({ origin: "https://example.org", protocol: "https:" })).toBe("https://example.org");
  });

  it("posts to the peer with the origin, and not at all once the peer is gone or closed", () => {
    const self = fakeWindow();
    const peer = fakeWindow();
    let target: Window | null = peer.window;
    const transport = windowTransport(self.window, () => target, "https://example.org");
    transport.post({ a: 1 });
    expect(peer.posted).toEqual([[{ a: 1 }, "https://example.org"]]);
    Object.assign(peer.window, { closed: true });
    transport.post({ a: 2 });
    target = null;
    transport.post({ a: 3 });
    expect(peer.posted).toHaveLength(1);
  });

  it("hears only its peer, from the expected origin; from a file page the window's identity is enough", () => {
    const self = fakeWindow();
    const peer = fakeWindow();
    const stranger = fakeWindow();
    const heard: unknown[] = [];
    const stop = windowTransport(self.window, () => peer.window, "https://example.org").subscribe((message) => heard.push(message));
    self.emit({ source: peer.window, origin: "https://example.org", data: "ok" });
    self.emit({ source: stranger.window, origin: "https://example.org", data: "stranger" });
    self.emit({ source: peer.window, origin: "https://evil.example", data: "wrong origin" });
    expect(heard).toEqual(["ok"]);
    stop();
    expect(self.listeners).toBe(0);
    const fromFile: unknown[] = [];
    windowTransport(self.window, () => peer.window, "*").subscribe((message) => fromFile.push(message));
    self.emit({ source: peer.window, origin: "null", data: "file" });
    self.emit({ source: stranger.window, origin: "null", data: "stranger" });
    expect(fromFile).toEqual(["file"]);
  });
});
