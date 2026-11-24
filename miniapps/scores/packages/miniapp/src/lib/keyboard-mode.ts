// Which on-screen keyboard a field for a signed whole number asks for.
// Android's number pad has a minus key, so `numeric` is right there. The iPhone's number pad is the
// digits 0–9 alone: a score could not be lowered ("-8", Moni 2026-11-24). Without an `inputmode`,
// a `type="number"` field on iOS opens the keyboard on its numbers-and-punctuation page, where the
// minus is — so there the hint is left out. Every other device keeps the number pad.

/** What a user agent says about itself: the parts this decision reads. */
export interface AgentInfo {
  readonly userAgent: string;
  readonly platform: string;
  readonly maxTouchPoints: number;
}

/**
 * Whether the device is an iPhone or an iPad (an iPad says "MacIntel" and has a touch screen).
 * @param agent - the browser's own description; the page's `navigator` when left out
 */
export function isAppleTouch(agent: AgentInfo = navigator): boolean {
  return /iPhone|iPad|iPod/u.test(agent.userAgent) || (agent.platform === "MacIntel" && agent.maxTouchPoints > 1);
}

/**
 * The `inputmode` of a field for a number that may be negative.
 * @param agent - the browser's own description; the page's `navigator` when left out
 * @returns `"numeric"`, or `undefined` on an iPhone or iPad (no hint: the keyboard with the minus)
 */
export function signedNumberMode(agent: AgentInfo = navigator): "numeric" | undefined {
  return isAppleTouch(agent) ? undefined : "numeric";
}
