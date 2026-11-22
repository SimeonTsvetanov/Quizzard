// Signals and subscription scopes for mini-app contexts (PLAN §1.2): a signal reads a shell value
// and tells subscribers about real changes; a scope releases every subscription of one mount.
import type { Signal, Unsubscribe } from "@simeonts/quizzard-core";

/** The subscriptions of one mount; {@link SubscriptionScope.release} ends all of them at unmount. */
export interface SubscriptionScope {
  /** Tracks `stop`; returns an idempotent unsubscribe that also forgets it. */
  add(stop: Unsubscribe): Unsubscribe;
  /** Stops every tracked subscription; anything added later is stopped at once. */
  release(): void;
}

/** Returns an empty scope. */
export function createScope(): SubscriptionScope {
  const active = new Set<Unsubscribe>();
  let isReleased = false;
  return {
    add(stop) {
      if (isReleased) {
        stop();
        return () => undefined;
      }
      const unsubscribe = (): void => {
        if (!active.delete(unsubscribe)) return;
        stop();
      };
      active.add(unsubscribe);
      return unsubscribe;
    },
    release() {
      isReleased = true;
      for (const unsubscribe of [...active]) unsubscribe();
    },
  };
}

/** Inputs of {@link watchedSignal}. */
export interface WatchedSignalOptions<T> {
  /** Reads the current value. */
  readonly read: () => T;
  /** Calls `onEvent` whenever the value may have changed; returns how to stop. */
  readonly watch: (onEvent: () => void) => Unsubscribe;
  /** Owns every subscription, so the shell can release them when the mini-app unmounts. */
  readonly scope: SubscriptionScope;
}

/**
 * Returns a {@link Signal} over a shell value.
 * @remarks A listener fires only when the value differs from the last one that subscriber saw, so
 * an event that changes nothing (the same language picked again) stays silent.
 */
export function watchedSignal<T>({ read, watch, scope }: WatchedSignalOptions<T>): Signal<T> {
  return {
    get: read,
    subscribe(listener) {
      let last = read();
      return scope.add(watch(() => {
        const value = read();
        if (Object.is(value, last)) return;
        last = value;
        listener(value);
      }));
    },
  };
}

/**
 * Returns a watch over a DOM event: `subscribe` → `addEventListener`, stop → `removeEventListener`.
 * @param target - e.g. `document` or a `MediaQueryList`
 */
export function eventWatch(target: EventTarget, type: string): (onEvent: () => void) => Unsubscribe {
  return (onEvent) => {
    const handler = (): void => { onEvent(); };
    target.addEventListener(type, handler);
    return () => { target.removeEventListener(type, handler); };
  };
}

/** Returns one watch over several: subscribing subscribes to all, stopping stops all. */
export function anyWatch(...watches: readonly ((onEvent: () => void) => Unsubscribe)[]): (onEvent: () => void) => Unsubscribe {
  return (onEvent) => {
    const stops = watches.map((watch) => watch(onEvent));
    return () => { for (const stop of stops) stop(); };
  };
}
