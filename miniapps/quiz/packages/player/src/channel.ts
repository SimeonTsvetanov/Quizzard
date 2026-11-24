// How the host's window and the audience's window talk (presenter mode). The game and the views
// know nothing of it: the player publishes the game through a `Channel` and a channel sends plain
// messages through a `Transport`. Today the one transport is `postMessage` between a window and the
// window it opened — it works for a page opened from a file, where two windows share no storage and
// no origin. A Presentation API or cast transport later is one more `Transport`; nothing else changes.
import type { QuizFile } from "@simeonts/quizzard-quiz-core/play";
import type { GameAction, GameState } from "./game/state.ts";

/** Carries messages to one peer and back. */
export interface Transport {
  /** Sends a message; a peer that is gone is not an error. */
  post(message: unknown): void;
  /** Calls `listener` for every message of the peer; returns how to stop. */
  subscribe(listener: (message: unknown) => void): () => void;
}

/** What the two windows say to each other. */
export type ChannelMessage =
  /** Audience → host: "I am open, send me the game". */
  | { readonly kind: "hello" }
  /** Host → audience: the quiz and the game, in answer to `hello`. */
  | { readonly kind: "init"; readonly file: QuizFile; readonly state: GameState }
  /** Host → audience: the game after a move. */
  | { readonly kind: "state"; readonly state: GameState }
  /** Audience → host: a key pressed in the audience window. */
  | { readonly kind: "action"; readonly action: GameAction }
  /** Either way: this window is closing. */
  | { readonly kind: "bye" };

/**
 * The quiz as the audience's window gets it: without the host's notes, which never leave the host's window.
 * @param file - the quiz
 */
export function forAudience(file: QuizFile): QuizFile {
  const rounds = file.quiz.rounds.map((round) => ({ ...round, questions: round.questions.map((question) => Object.fromEntries(Object.entries(question).filter(([name]) => name !== "note")) as typeof question) }));
  return { ...file, quiz: { ...file.quiz, rounds } };
}

/** The mark every message carries, so other `postMessage` traffic is ignored. */
export const CHANNEL_MARK = "quizzard-play";
/** The protocol version; a peer with another version is ignored. */
export const CHANNEL_VERSION = 1;

/** Typed messages over a transport. */
export interface Channel {
  send(message: ChannelMessage): void;
  /** Calls `listener` for every message that is one of ours; returns how to stop. */
  on(listener: (message: ChannelMessage) => void): () => void;
  /** Says goodbye and stops listening. */
  close(): void;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const hasGame = (value: Readonly<Record<string, unknown>>): boolean => isRecord(value["state"]) && Array.isArray(value["state"]["screens"]) && typeof value["state"]["index"] === "number";

/** What each kind of message must carry to be passed on. */
const SHAPES: Readonly<Record<ChannelMessage["kind"], (body: Readonly<Record<string, unknown>>) => boolean>> = {
  hello: () => true,
  bye: () => true,
  init: (body) => isRecord(body["file"]) && hasGame(body),
  state: hasGame,
  action: (body) => isRecord(body["action"]) && typeof body["action"]["type"] === "string",
};

/**
 * Reads a message off the wire.
 * @param raw - whatever arrived
 * @returns the message, or `null` for anything that is not one of this protocol version
 */
export function readMessage(raw: unknown): ChannelMessage | null {
  if (!isRecord(raw) || raw["mark"] !== CHANNEL_MARK || raw["v"] !== CHANNEL_VERSION || !isRecord(raw["body"])) return null;
  const body = raw["body"];
  const kind = body["kind"];
  if (typeof kind !== "string" || !Object.hasOwn(SHAPES, kind)) return null;
  // Safe: the kind is one of SHAPES' keys and its check has passed; the peer runs this same code.
  return SHAPES[kind as ChannelMessage["kind"]](body) ? (body as unknown as ChannelMessage) : null;
}

/**
 * A channel over a transport.
 * @param transport - carries the messages
 */
export function createChannel(transport: Transport): Channel {
  const stops = new Set<() => void>();
  let isOpen = true;
  const send = (message: ChannelMessage): void => {
    if (isOpen) transport.post({ mark: CHANNEL_MARK, v: CHANNEL_VERSION, body: message });
  };
  return {
    send,
    on(listener) {
      const stop = transport.subscribe((raw) => {
        const message = readMessage(raw);
        if (message !== null && isOpen) listener(message);
      });
      stops.add(stop);
      return () => {
        stops.delete(stop);
        stop();
      };
    },
    close() {
      if (!isOpen) return;
      send({ kind: "bye" });
      isOpen = false;
      for (const stop of stops) stop();
      stops.clear();
    },
  };
}

/**
 * The origin to address and to expect for a page: its own, or — for a page opened from a file,
 * whose origin is opaque — none (`"*"` when sending, the window's identity alone when receiving).
 * @param location - the page's location
 */
export function peerOrigin(location: Pick<Location, "origin" | "protocol">): string {
  return location.protocol === "file:" || location.origin === "null" ? "*" : location.origin;
}

/**
 * The `postMessage` transport between this window and one other window (the one it opened, or its opener).
 * @param self - this window
 * @param peer - gives the other window; `null` once it is gone
 * @param origin - {@link peerOrigin}: the only origin written to and listened to, or `"*"`
 */
export function windowTransport(self: Window, peer: () => Window | null, origin: string): Transport {
  return {
    post(message) {
      const target = peer();
      if (target !== null && !target.closed) target.postMessage(message, origin);
    },
    subscribe(listener) {
      const onMessage = (event: MessageEvent): void => {
        if (event.source !== peer() || (origin !== "*" && event.origin !== origin)) return;
        listener(event.data);
      };
      self.addEventListener("message", onMessage);
      return () => { self.removeEventListener("message", onMessage); };
    },
  };
}
