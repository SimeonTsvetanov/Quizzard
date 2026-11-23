// The launch splash's ending and the wordmark's entrance (styles: components/splash.css, wordmark.css).
// The splash hands its pieces to the page: the wizard flies into the header's logo and the wordmark to the
// wordmark on the page, while the cover behind them clears. Everything is finite and skipped for reduced motion.

/** When the splash starts to leave, counted from the start of the page load. */
const HOLD_MS = 1350;
/** The flight of the wizard and the wordmark to their places. */
const FLY_MS = 620;
/** Past this the stylesheet's own fade is about to run: the script leaves the splash to it. */
const TOO_LATE_MS = 1900;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/**
 * Plays the wordmark's entrance on the page (the one that is displayed: under the tiles or in the footer).
 * Called each time Home comes on screen.
 */
export function playWordmark(): void {
  for (const mark of document.querySelectorAll<HTMLElement>("[data-wordmark]")) {
    mark.removeAttribute("data-play");
    mark.getBoundingClientRect(); // a reflow between the two, so the animation starts again
    mark.setAttribute("data-play", "");
  }
}

/** Stops the wordmark's animations where they are (before the screen changes: nothing runs under the morph). */
export function restWordmark(): void {
  for (const mark of document.querySelectorAll<HTMLElement>("[data-wordmark]")) mark.removeAttribute("data-play");
}

/** The transform that moves and scales `from` onto `to` (both in viewport coordinates). */
function onto(from: DOMRect, to: DOMRect): string {
  const scale = to.width / from.width;
  const x = to.left + to.width / 2 - (from.left + from.width / 2);
  const y = to.top + to.height / 2 - (from.top + from.height / 2);
  return `translate(${String(x)}px, ${String(y)}px) scale(${String(scale)})`;
}

/** The wordmark on the page that is displayed and on screen, if any. */
function visibleWordmark(): HTMLElement | null {
  for (const mark of document.querySelectorAll<HTMLElement>("[data-wordmark]")) {
    const box = mark.getBoundingClientRect();
    if (box.width > 0 && box.top < window.innerHeight && box.bottom > 0) return mark;
  }
  return null;
}

/** Flies one piece of the splash onto its place on the page; without a place it sinks and fades. */
function fly(piece: HTMLElement, place: HTMLElement | null, restOpacity: number): Animation {
  const to =
    place === null
      ? { transform: `translateY(${String(window.innerHeight / 3)}px) scale(0.6)`, opacity: 0 }
      : {
          transform: onto(piece.getBoundingClientRect(), place.getBoundingClientRect()),
          opacity: restOpacity,
        };
  return piece.animate([{ transform: "none", opacity: 1 }, to], {
    duration: FLY_MS,
    easing: EASE,
    fill: "forwards",
  });
}

/** Ends the splash by flying its pieces into the page. */
function leave(splash: HTMLElement, end: () => void): void {
  const logo = splash.querySelector<HTMLElement>("img");
  const word = splash.querySelector<HTMLElement>("[data-splash-word]");
  const tagline = splash.querySelector<HTMLElement>(".splash-tagline");
  const headerLogo = document.querySelector<HTMLElement>(".brand img");
  const mark = visibleWordmark();
  splash.style.animation = "none"; // the stylesheet's fade would take the pieces with it
  // The places stay empty until the pieces land, so nothing is seen twice.
  const places = [headerLogo, mark].filter((place) => place !== null);
  for (const place of places) place.style.visibility = "hidden";
  const land = (): void => {
    for (const place of places) place.style.visibility = "";
    end();
  };
  const cover = splash.animate(
    [
      { backgroundColor: getComputedStyle(splash).backgroundColor },
      { backgroundColor: "transparent" },
    ],
    { duration: FLY_MS, easing: "ease-out", fill: "forwards" },
  );
  tagline?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLY_MS / 3, fill: "forwards" });
  if (logo) fly(logo, headerLogo, 1);
  if (word) fly(word, mark, mark === null ? 0 : Number(getComputedStyle(mark).opacity));
  cover.finished.then(land, land);
}

/**
 * Runs the end of the launch splash, then leaves the wordmark at rest. Without a splash (a later visit in the
 * session, a deep link) the wordmark simply plays its entrance.
 */
export function startSplash(): void {
  const root = document.documentElement;
  const splash = document.querySelector<HTMLElement>(".splash");
  if (!splash || !root.hasAttribute("data-splash")) {
    playWordmark();
    return;
  }
  let hasEnded = false;
  const end = (): void => {
    if (hasEnded) return;
    hasEnded = true;
    root.removeAttribute("data-splash");
  };
  // The stylesheet's own fade (no flight: reduced motion, or the script came late) also ends it.
  splash.addEventListener("animationend", (event) => {
    if (event.animationName === "splash-out") end();
  });
  setTimeout(end, 3500); // belt and braces
  const canFly =
    !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    performance.now() < TOO_LATE_MS &&
    document.visibilityState === "visible";
  if (canFly)
    {setTimeout(
      () => {
        if (!hasEnded) leave(splash, end);
      },
      Math.max(0, HOLD_MS - performance.now()),
    );}
}
