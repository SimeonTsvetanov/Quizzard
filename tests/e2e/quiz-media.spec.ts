import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test, type Browser, type BrowserContext, type Locator, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { putInLibrary, storedMediaSizes } from "./support/quiz-db.ts";
import { stored } from "./support/quiz-ux.ts";

// Quiz creator, slices 3–5 (docs/quiz-creator SPEC F7, F10, §3.5, §5; AC4–AC7): pictures, audio and
// video from the device — picked, checked, shown whole in every place a slide is drawn, played by
// the host's moves in the app and in the exported file with the network off — and the quiz file
// that carries a quiz with its media to another browser. Also the host's extras: the host note,
// the black screen, the break, the clicker keys, the grid of screens and "apply to all".
// The pure parts are unit tested (miniapps/quiz/packages/*/test).
//
// The media fixtures in fixtures/quiz-media were made once with ffmpeg 6 (test pattern and sine
// tone): landscape.jpg 640×360, tall.png 240×720, panorama.jpg 1200×200, large.jpg 3000×2000,
// rotated.jpg 600×400 stored with EXIF orientation 6 (shown 400×600; written with sharp),
// clip.mp3 and clip.m4a (AAC) 2 s, clip.mp4 320×180 H.264 baseline + AAC 2 s.
const MEDIA = fileURLToPath(new URL("./fixtures/quiz-media/", import.meta.url));
const QUIZ_FILE_FIXTURE = fileURLToPath(new URL("../../miniapps/quiz/packages/core/test/fixtures/quiz-file/v1/fixture-night.quizzard", import.meta.url));
const file = (name: string): string => join(MEDIA, name);

const root = (page: Page) => page.locator('[data-miniapp="quiz"]');
const stage = (page: Page) => page.locator('.qp-stage[data-stage="live"]');
const view = (page: Page, name: string) => stage(page).locator(`[data-view="${name}"]`);
const panel = (page: Page) => page.locator("[data-panel]");
const prompt = (page: Page) => stage(page).locator(".quiz-slide-prompt");

const NOTE = "Accept concert pitch too — zebra-note-7";

/** A quiz with one question of every media kind; `m-*` are the files of {@link BLOBS}. */
const QUIZ = {
  format: "quizzard-quiz",
  version: 1,
  media: [
    { id: "m-land", type: "image", mime: "image/jpeg", name: "landscape.jpg", bytes: 15624, width: 640, height: 360 },
    { id: "m-tall", type: "image", mime: "image/png", name: "tall.png", bytes: 17202, width: 240, height: 720 },
    { id: "m-pano", type: "image", mime: "image/jpeg", name: "panorama.jpg", bytes: 17346, width: 1200, height: 200 },
    { id: "m-mp3", type: "audio", mime: "audio/mpeg", name: "clip.mp3", bytes: 8482, seconds: 2 },
    { id: "m-mp4", type: "video", mime: "video/mp4", name: "clip.mp4", bytes: 26597, seconds: 2, width: 320, height: 180 },
    { id: "m-m4a", type: "audio", mime: "audio/mp4", name: "clip.m4a", bytes: 9360, seconds: 2 },
  ],
  quiz: {
    id: "media-quiz", name: "Media night", createdAt: "2026-11-24T10:00:00.000Z", updatedAt: "2026-11-24T10:00:00.000Z", language: "en", settings: { teams: 2 },
    rounds: [{
      id: "r1", kind: "standard", name: "Mixed", defaults: { seconds: 30, points: { value: 1 }, questionKind: "picture", answerType: "open" },
      questions: [
        { id: "q1", kind: "picture", prompt: "What is this test card called?", media: { id: "m-land" }, answer: { type: "open", text: "Colour bars" } },
        { id: "q2", kind: "picture", prompt: "Which way is up?", media: { id: "m-tall" }, answer: { type: "choice", options: [{ id: "a", text: "North" }, { id: "b", text: "East" }, { id: "c", text: "South" }, { id: "d", text: "West" }], correct: ["a"] } },
        { id: "q3", kind: "picture", prompt: "A panorama is wider than it is tall.", media: { id: "m-pano" }, answer: { type: "trueFalse", correct: true } },
        { id: "q4", kind: "audio", prompt: "Which note is this?", media: { id: "m-mp3" }, answer: { type: "open", text: "A" }, note: NOTE, seconds: 5 },
        { id: "q5", kind: "video", prompt: "What moves in the clip?", media: { id: "m-mp4" }, answer: { type: "choice", options: [{ id: "a", text: "Bars" }, { id: "b", text: "A train" }, { id: "c", text: "Nothing" }], correct: ["a"] } },
        { id: "q6", kind: "audio", prompt: "And this one, from an M4A?", media: { id: "m-m4a" }, answer: { type: "open", text: "E" } },
      ],
    }],
  },
};
const BLOBS: readonly (readonly [string, string, string])[] = [
  ["m-land", "landscape.jpg", "image/jpeg"], ["m-tall", "tall.png", "image/png"], ["m-pano", "panorama.jpg", "image/jpeg"],
  ["m-mp3", "clip.mp3", "audio/mpeg"], ["m-mp4", "clip.mp4", "video/mp4"], ["m-m4a", "clip.m4a", "audio/mp4"],
];

/** Puts {@link QUIZ} with its media files into the creator's library and opens it. */
async function openMediaQuiz(page: Page): Promise<void> {
  await page.goto("./#/quiz");
  await expect(root(page).getByRole("heading", { name: "Your quizzes" })).toBeVisible();
  const blobs = BLOBS.map(([id, name, mime]) => ({ quizId: QUIZ.quiz.id, id, mime, base64: readFileSync(file(name)).toString("base64") }));
  await putInLibrary(page, [QUIZ], blobs);
  await page.reload();
  await root(page).locator(".quiz-card button").first().click();
  await expect(root(page).locator("[data-play-quiz]")).toBeVisible();
}

/** The media records of the creator's database: `quizId/id` of each. */
function storedMedia(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const request = indexedDB.open("quizzard-quiz");
        request.onsuccess = () => {
          const all = request.result.transaction("media").objectStore("media").getAllKeys();
          all.onsuccess = () => { request.result.close(); resolve(all.result.map((key) => (key as string[]).join("/")).sort()); };
        };
      }),
  );
}

/**
 * AC4: a picture or video is shown whole and undistorted — its drawn box has the file's own shape
 * (within 1 px) and lies inside the slide it stands on.
 */
async function expectWhole(media: Locator): Promise<void> {
  await expect(media).toBeVisible();
  await expect(media).not.toHaveAttribute("data-loading", "");
  // Measured at rest: a screen that is still coming in is drawn scaled.
  await media.evaluate(() => Promise.all(document.getAnimations().filter((one) => one.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));
  const box = await media.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const slide = element.closest(".quiz-slide")?.getBoundingClientRect();
    const natural = element instanceof HTMLVideoElement ? [element.videoWidth, element.videoHeight] : [(element as HTMLImageElement).naturalWidth, (element as HTMLImageElement).naturalHeight];
    return { width: rect.width, height: rect.height, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, natural, slide: slide ? { left: slide.left, top: slide.top, right: slide.right, bottom: slide.bottom } : null };
  });
  const [naturalWidth = 0, naturalHeight = 0] = box.natural;
  expect(naturalWidth).toBeGreaterThan(0);
  expect(box.width).toBeGreaterThan(8);
  // The same shape: the width the height asks for, within a pixel (and the other way round for a panorama).
  expect(Math.min(Math.abs(box.width - box.height * (naturalWidth / naturalHeight)), Math.abs(box.height - box.width * (naturalHeight / naturalWidth)))).toBeLessThanOrEqual(1);
  expect(box.slide).not.toBeNull();
  if (!box.slide) return;
  expect(box.left).toBeGreaterThanOrEqual(box.slide.left - 0.5);
  expect(box.top).toBeGreaterThanOrEqual(box.slide.top - 0.5);
  expect(box.right).toBeLessThanOrEqual(box.slide.right + 0.5);
  expect(box.bottom).toBeLessThanOrEqual(box.slide.bottom + 0.5);
}

/** The clip element of a stage and where it is. */
const clip = (scope: Locator) => scope.locator(".quiz-slide-clip audio, .quiz-slide-clip video");
const clipTime = (scope: Locator) => clip(scope).evaluate((element) => (element as HTMLMediaElement).currentTime);
const isPaused = (scope: Locator) => clip(scope).evaluate((element) => (element as HTMLMediaElement).paused);

/** A new quiz with one round, on the editor of its first question of the given kind. */
async function newQuestion(page: Page, kind: string): Promise<void> {
  await root(page).locator("[data-add-question]").click();
  await expect(root(page).locator('[data-screen="editor"]')).toBeVisible();
  await root(page).locator(".quiz-chip", { hasText: kind }).first().click();
  await expect(root(page).locator("[data-media-picker]")).toBeVisible();
}

async function newQuizWithRound(page: Page): Promise<void> {
  await page.goto("./#/quiz");
  await root(page).locator("[data-new-quiz]").click();
  await root(page).locator("[data-create-quiz]").click();
  await root(page).locator("[data-add-round]").click();
  await page.locator("[data-pick-standard]").click(); // "Add round" asks for the kind first (SPEC §10)
  await expect(root(page).locator("[data-add-question]")).toBeVisible();
}

/** Picks a file in the editor's picker (the system file picker is the input behind the button). */
const pick = (page: Page, input: string | { name: string; mimeType: string; buffer: Buffer }) => root(page).locator("[data-media-input]").setInputFiles(input);

/** A context with the network off that records every request that is not the file itself and every error. */
async function offlineContext(browser: Browser, viewport = { width: 1280, height: 720 }): Promise<{ context: BrowserContext; requests: string[]; errors: string[] }> {
  const context = await browser.newContext({ offline: true, viewport });
  const requests: string[] = [];
  const errors: string[] = [];
  await context.route(/^(?!file:|data:|blob:)/, (route) => { requests.push(route.request().url()); return route.abort(); });
  context.on("request", (request) => { if (!/^(file|data|blob):/.test(request.url())) requests.push(request.url()); });
  context.on("weberror", (error) => errors.push(error.error().message));
  context.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  return { context, requests, errors };
}

async function exportFile(page: Page, testInfo: TestInfo): Promise<string> {
  await openMediaQuiz(page);
  const download = page.waitForEvent("download");
  await root(page).locator("[data-export]").click();
  const saved = await download;
  expect(saved.suggestedFilename()).toMatch(/^Media[ _]night\.html$/); // WebKit writes the space as "_"
  const path = testInfo.outputPath("Media night.html");
  await saved.saveAs(path);
  return path;
}

async function axe(page: Page, name: string): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((one) => one.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => undefined))));
  const result = await new AxeBuilder({ page }).include('[data-miniapp="quiz"]').withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical").map((violation) => `${name}: ${violation.id} ${violation.nodes.map((node) => node.target.join(" ")).join(" | ")}`)).toEqual([]);
}

test("AC4 + AC5: a picture is picked, scaled, stored and shown whole in the editor, the thumbnail and the preview; a wrong or too big file is refused by name and nothing is stored", async ({ page }) => {
  await newQuizWithRound(page);
  await newQuestion(page, "Picture");
  const picker = root(page).locator("[data-media-picker]");
  await expect(picker.locator("[data-media-choose]")).toContainText("Choose a picture");
  await expect(picker).toContainText("JPEG, PNG, WebP or GIF · up to 15 MB");
  await axe(page, "editor, no picture yet");

  // Refused: another format, then files that are no pictures — each named, with what is allowed; nothing is stored.
  await pick(page, { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not a picture") });
  await expect(picker.locator("[data-media-error]")).toHaveText("“notes.txt” is a TXT file. A picture must be JPEG, PNG, WebP or GIF.");
  await pick(page, { name: "huge.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(16 * 1024 * 1024, 1) });
  // A picture over 15 MB is no longer refused for its size: it is opened to be scaled down, and its limit is
  // checked on what is stored (Moni 2026-11-25; the 60 MB ceiling is unit tested). This one is no picture at all.
  await expect(picker.locator("[data-media-error]")).toHaveText("“huge.jpg” cannot be opened in this browser. A picture must be JPEG, PNG, WebP or GIF.");
  await pick(page, { name: "broken.png", mimeType: "image/png", buffer: Buffer.from("this is not a png at all") });
  await expect(picker.locator("[data-media-error]")).toHaveText("“broken.png” cannot be opened in this browser. A picture must be JPEG, PNG, WebP or GIF.");
  expect(await storedMedia(page)).toEqual([]);
  await expect(picker.locator("[data-media-file]")).toHaveCount(0);
  await axe(page, "editor, refused file");

  // A large photo is scaled to 1920 px on its long side and saved again; it is never enlarged.
  await pick(page, file("large.jpg"));
  await expect(picker.locator("[data-media-name]")).toHaveText("large.jpg");
  await expect(picker.locator("[data-media-facts]")).toContainText("1920 × 1280 px");
  await expect(picker.locator("[data-media-error]")).toBeHidden();
  expect(await storedMedia(page)).toHaveLength(1);
  // On a phone the live slide is behind the "Preview" switch.
  const liveSwitch = root(page).locator("[data-live-toggle]");
  if (await liveSwitch.isVisible()) await liveSwitch.click();
  await expectWhole(root(page).locator("[data-live-slide] [data-slide-picture]"));

  // Replace: a photo held sideways (EXIF orientation) comes out upright; a small picture keeps its size.
  await pick(page, file("rotated.jpg"));
  await expect(picker.locator("[data-media-facts]")).toContainText("400 × 600 px");
  await expectWhole(root(page).locator("[data-live-slide] [data-slide-picture]"));
  await pick(page, file("tall.png"));
  await expect(picker.locator("[data-media-facts]")).toContainText("240 × 720 px");
  await root(page).locator("[data-prompt]").fill("Which way is up?");
  await expectWhole(root(page).locator("[data-live-slide] [data-slide-picture]")); // typing keeps the picture where it is
  await axe(page, "editor with a picture");

  // The thumbnail in the round and the preview show it whole too.
  await root(page).locator("[data-done]").click();
  const card = root(page).locator("[data-question]").first();
  await expectWhole(card.locator("[data-slide-picture]"));
  await card.locator("[data-more]").click(); // Preview is in the card's "More" list
  await root(page).locator("[data-sheet] [data-preview]").click();
  await expectWhole(root(page).locator("[data-preview-slide] [data-slide-picture]"));
  // A tap zooms the picture over the slide — still whole — and a second tap takes it back.
  const zoom = root(page).locator("[data-preview-slide] [data-slide-zoom]");
  await zoom.click();
  await expect(zoom).toHaveAttribute("aria-pressed", "true");
  await expectWhole(root(page).locator("[data-preview-slide] [data-slide-picture]"));
  await zoom.click();
  await expect(zoom).toHaveAttribute("aria-pressed", "false");
});

test("reference counting: a duplicated question shares its file; the file goes only when no question uses it, and Undo of a delete still finds it", async ({ page }) => {
  await newQuizWithRound(page);
  await newQuestion(page, "Picture");
  await pick(page, file("landscape.jpg"));
  await expect(root(page).locator("[data-media-file]")).toBeVisible();
  await root(page).locator("[data-done]").click();
  const cards = root(page).locator("[data-question]");
  await cards.first().getByRole("button", { name: "Duplicate question 1" }).click();
  await expect(cards).toHaveCount(2);
  expect(await storedMedia(page)).toHaveLength(1); // one file, two questions

  // The quiz screen says how much media the quiz carries: one file, counted once.
  await expect(root(page).locator("[data-media-size]")).toContainText(/Media: [\d.]+ kB of 250 MB/);

  // Delete one: the other still shows the picture. Delete both and undo the last: the picture is back.
  await cards.first().locator("[data-delete-question]").click();
  await expect(cards).toHaveCount(1);
  await expectWhole(cards.first().locator("[data-slide-picture]"));
  await cards.first().locator("[data-delete-question]").click();
  await expect(cards).toHaveCount(0);
  await expect(root(page).locator("[data-media-size]")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).last().click();
  await expect(cards).toHaveCount(1);
  await expectWhole(cards.first().locator("[data-slide-picture]"));

  // Deleted for good: the file is cleared the next time the quiz is opened.
  await cards.first().locator("[data-delete-question]").click();
  await expect(cards).toHaveCount(0);
  await expect(page.locator(".quiz-saved[data-saved='saved']")).toBeVisible();
  expect(await storedMedia(page)).toHaveLength(1);
  await page.reload();
  await expect(root(page).locator("[data-add-question]")).toBeVisible();
  await expect.poll(() => storedMedia(page)).toEqual([]);
});

test("audio and video are tried on import, kept as they are and play in the preview; a file that cannot be played is refused", async ({ page }) => {
  await newQuizWithRound(page);
  await newQuestion(page, "Audio");
  const picker = root(page).locator("[data-media-picker]");
  await expect(picker).toContainText("MP3 or M4A · up to 15 MB");
  await pick(page, { name: "song.wav", mimeType: "audio/wav", buffer: Buffer.from("RIFF") });
  await expect(picker.locator("[data-media-error]")).toHaveText("“song.wav” is a WAV file. Audio must be MP3 or M4A (AAC).");
  await pick(page, { name: "fake.mp3", mimeType: "audio/mpeg", buffer: Buffer.from("these bytes are no sound") });
  await expect(picker.locator("[data-media-error]")).toHaveText("“fake.mp3” cannot be opened in this browser. Audio must be MP3 or M4A (AAC).", { timeout: 15_000 });
  expect(await storedMedia(page)).toEqual([]);
  await pick(page, file("clip.m4a"));
  await expect(picker.locator("[data-media-facts]")).toContainText("0:02");
  await pick(page, file("clip.mp3"));
  await expect(picker.locator("[data-media-name]")).toHaveText("clip.mp3");
  await expect(picker.locator("[data-media-facts]")).toContainText("0:02");
  await axe(page, "editor with audio");
  await root(page).locator("[data-done]").click();

  await newQuestion(page, "Video");
  await expect(root(page).locator("[data-media-picker]")).toContainText("MP4 (H.264 + AAC) · up to 50 MB");
  await pick(page, { name: "clip.mov", mimeType: "video/quicktime", buffer: Buffer.from("moov") });
  await expect(root(page).locator("[data-media-error]")).toHaveText("“clip.mov” is a MOV file. A video must be MP4 with H.264 picture and AAC sound.");
  await pick(page, { name: "fake.mp4", mimeType: "video/mp4", buffer: Buffer.from("no video in here") });
  await expect(root(page).locator("[data-media-error]")).toHaveText("“fake.mp4” cannot be opened in this browser. A video must be MP4 with H.264 picture and AAC sound.", { timeout: 15_000 });
  await pick(page, file("clip.mp4"));
  await expect(root(page).locator("[data-media-facts]")).toContainText("0:02");
  await expect(root(page).locator(".quiz-file-still")).toBeVisible(); // a frame of the video
  await axe(page, "editor with video");
  await root(page).locator("[data-done]").click();

  // The round: an audio tile and the video's frame as stills — no media element is made for a thumbnail.
  const cards = root(page).locator("[data-question]");
  await expect(cards.nth(0).locator('.quiz-slide-clip[data-clip="audio"][data-still]')).toContainText("0:02");
  await expectWhole(cards.nth(1).locator("[data-slide-poster]"));
  await expect(cards.locator("audio, video")).toHaveCount(0);
  await axe(page, "round with media cards");

  // The preview plays: nothing starts by itself; the slide's own button plays and pauses.
  await cards.nth(1).locator("[data-more]").click();
  await root(page).locator("[data-sheet] [data-preview]").click();
  const slide = root(page).locator("[data-preview-slide]");
  await expectWhole(slide.locator("[data-slide-video]"));
  expect(await isPaused(slide)).toBe(true);
  await slide.locator("[data-clip-toggle]").click();
  await expect.poll(() => clipTime(slide)).toBeGreaterThan(0.2);
  await slide.locator("[data-clip-toggle]").click();
  expect(await isPaused(slide)).toBe(true);
  await axe(page, "preview with video");
  await root(page).locator("[data-previous]").click();
  const audio = root(page).locator("[data-preview-slide]");
  await audio.locator("[data-clip-toggle]").click();
  await expect.poll(() => clipTime(audio)).toBeGreaterThan(0.2);
  await expect(audio.locator("[data-clip-time]")).toContainText("/ 0:02");
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 860 }]) {
  test(`AC4: Play shows portrait, landscape and panorama pictures whole on a ${String(viewport.width)} × ${String(viewport.height)} screen; Z zooms; the clip waits for the host and the timer starts with it`, async ({ page }) => {
    test.slow(); // a clip plays to its end
    await page.setViewportSize(viewport);
    await openMediaQuiz(page);
    await root(page).locator("[data-play-quiz]").click();
    await expect(view(page, "title")).toBeVisible();
    await page.keyboard.press("KeyM");
    await page.locator('[data-dialog="menu"] [data-auto]').uncheck(); // the timers stay out of the pictures' way
    await page.keyboard.press("Escape");
    for (let n = 0; n < 3; n += 1) await page.keyboard.press("PageDown"); // a clicker's "next": teams, rules, question 1
    for (const text of ["What is this test card called?", "Which way is up?", "A panorama is wider than it is tall."]) {
      await expect(prompt(page)).toHaveText(text);
      await expectWhole(stage(page).locator("[data-slide-picture]"));
      await page.keyboard.press("PageDown");
    }
    await page.keyboard.press("PageUp"); // and its "back"
    await expect(prompt(page)).toHaveText("A panorama is wider than it is tall.");
    await page.keyboard.press("KeyZ");
    await expect(stage(page).locator(".quiz-slide-frame[data-zoom]")).toBeVisible();
    await expectWhole(stage(page).locator("[data-slide-picture]"));
    await page.keyboard.press("KeyZ");
    await expect(stage(page).locator(".quiz-slide-frame[data-zoom]")).toHaveCount(0);

    // The audio question: with "run by themselves" on, the timer waits for the clip and starts with it (Moni 2026-11-26).
    await page.keyboard.press("KeyM");
    await page.locator('[data-dialog="menu"] [data-auto]').check();
    await page.keyboard.press("Escape");
    await page.keyboard.press("Space");
    await expect(prompt(page)).toHaveText("Which note is this?");
    await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "idle");
    expect(await isPaused(stage(page))).toBe(true); // nothing plays until the host says so
    await expect(stage(page)).not.toContainText("zebra-note-7"); // the host note is never on the stage
    await page.keyboard.press("KeyP");
    await expect(stage(page).locator(".quiz-slide-clip")).toHaveAttribute("data-status", "playing");
    // The timer runs with the clip; paused here, so the time does not run out and bring the next question by itself.
    await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "running");
    await page.keyboard.press("KeyT");
    await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "paused");
    await expect.poll(() => clipTime(stage(page))).toBeGreaterThan(0.2);
    await expect(stage(page).locator(".quiz-slide-clip")).toHaveAttribute("data-status", "ended", { timeout: 8000 });

    // The video: whole, in its shape; the slide's own button plays it, "from the start" rewinds.
    await page.keyboard.press("Space");
    await expect(prompt(page)).toHaveText("What moves in the clip?");
    await expectWhole(stage(page).locator("[data-slide-video]"));
    await stage(page).locator("[data-clip-toggle]").click();
    await expect.poll(() => clipTime(stage(page))).toBeGreaterThan(0.3);
    await stage(page).locator("[data-clip-toggle]").click();
    expect(await isPaused(stage(page))).toBe(true);
    const at = await clipTime(stage(page));
    await stage(page).locator("[data-clip-restart]").click();
    await expect(stage(page).locator(".quiz-slide-clip")).toHaveAttribute("data-status", "playing");
    await stage(page).locator("[data-clip-toggle]").click();
    expect(await clipTime(stage(page))).toBeLessThan(at + 0.2);
    await axe(page, "stage with a video");
  });
}

// Moni 2026-11-25: "the answer may contain a picture if I want".
test("a picture can be kept with the answer: it shows at the reveal — in the editor's preview and on the stage — and not with the question", async ({ page }) => {
  await newQuizWithRound(page);
  // A text question: it has no picker of its own, only the answer's.
  await root(page).locator("[data-add-question]").click();
  await expect(root(page).locator('[data-screen="editor"]')).toBeVisible();
  await expect(root(page).locator("[data-media-picker]")).toHaveCount(0);
  await root(page).locator("[data-prompt]").fill("Which animal is this about?");
  await root(page).locator("[data-open-answer]").fill("A cow");
  const answerPicker = root(page).locator("[data-answer-picker]");
  await root(page).locator("[data-answer-input]").setInputFiles(file("landscape.jpg"));
  await expect(answerPicker.locator("[data-answer-name]")).toHaveText("landscape.jpg");
  expect((await storedMedia(page)).length).toBe(1);
  // The live slide: no picture with the question, the picture once "Show answer" is on.
  // (A phone keeps the live slide behind "Preview": there the stage below checks it.)
  const live = root(page).locator("[data-live-slide]");
  if (await root(page).locator("[data-reveal-toggle]").isVisible()) {
    await expect(live.locator("[data-slide-picture]")).toHaveCount(0);
    await root(page).locator("[data-reveal-toggle]").click();
    await expect(live.locator("[data-slide-picture]")).toBeVisible();
  }
  await root(page).locator("[data-done]").click();
  // On the stage: the question alone, then the answer with its picture.
  await root(page).locator("[data-question] [data-more]").first().click();
  await root(page).locator("[data-sheet] [data-play-from]").click();
  await expect(prompt(page)).toHaveText("Which animal is this about?");
  await expect(stage(page).locator("[data-slide-picture]")).toHaveCount(0);
  await page.keyboard.press("Space"); // "Answers"
  await page.keyboard.press("Space"); // the answer's slide, with its answer
  await expect(stage(page).locator(".quiz-slide-right")).toHaveText("A cow");
  await expectWhole(stage(page).locator("[data-slide-picture]"));
  // Removing it frees the file.
  await page.keyboard.press("Escape");
});

// Moni 2026-11-25: a clip that is too big or in another format is not refused where the browser can
// re-encode — it is cut on the way in, on one trim bar; a clip that fits can be cut too, by choice.
test("a video in a format a quiz does not carry opens the cut window: the kept part is chosen on the bar and the new MP4 goes on the question; closing it leaves the way on as the accented button", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "the cut needs WebCodecs encoders; where they are missing the file is refused as before (unit tested)");
  test.slow();
  await newQuizWithRound(page);
  await newQuestion(page, "Video");
  const picker = root(page).locator("[data-media-picker]");
  await expect(picker.locator("[data-media-cut-hint]")).toBeVisible();
  // The way on shows only for a file that must be cut (it once stood under every picker, 0.23.0–0.24.0).
  await expect(picker.locator("[data-media-fix]")).toBeHidden();
  await pick(page, file("clip.webm"));
  const cut = root(page).locator("dialog[data-cut]");
  await expect(cut.locator("[data-cut-note]")).toHaveAttribute("data-cut-note", "must");
  await expect(cut.locator('[data-cut-handle="to"]')).toHaveAttribute("aria-valuemax", /^6\.\d$/);
  // Closed without cutting: nothing is stored, the message says why and the button to cut is the accented one.
  await cut.locator("[data-cut-cancel]").click();
  await expect(picker.locator("[data-media-error]")).toContainText("“clip.webm”");
  await expect(picker.locator("[data-media-error]")).toContainText("Cut it to use it");
  expect(await storedMedia(page)).toEqual([]);
  const fix = picker.locator("[data-media-fix]");
  await expect(fix).toHaveClass(/button--primary/);
  await fix.click();
  await expect(cut.locator('[data-cut-handle="to"]')).toHaveAttribute("aria-valuemax", /^6\.\d$/); // the clip's length is read again
  // The end handle moved to the left with the keyboard: 2 s shorter.
  await cut.locator('[data-cut-handle="to"]').focus();
  await page.keyboard.press("Shift+ArrowLeft");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(cut.locator("[data-cut-part]")).toContainText(/0:00\.0 – 0:0[34]\.\d/);
  await axe(page, "cut window");
  await cut.locator("[data-cut-start]").click();
  await expect(cut).toHaveCount(0, { timeout: 60_000 });
  await expect(picker.locator("[data-media-name]")).toHaveText("clip.mp4");
  await expect(picker.locator("[data-media-facts]")).toContainText(/0:0[34]/);
  await expect(picker.locator("[data-media-fix]")).toBeHidden();
  expect((await storedMedia(page)).length).toBe(1);

  // A clip that fits can be cut by choice: the window says it fits, and closing it changes nothing.
  await picker.locator("[data-media-cut]").click();
  await expect(cut.locator("[data-cut-note]")).toHaveAttribute("data-cut-note", "fits");
  await cut.locator("[data-cut-cancel]").click();
  await expect(picker.locator("[data-media-error]")).toBeHidden();
  await expect(picker.locator("[data-media-name]")).toHaveText("clip.mp4");
});

test("the black screen, the break, the grid of screens and the clicker keys", async ({ page }) => {
  await openMediaQuiz(page);
  await root(page).locator("[data-play-quiz]").click();
  await expect(view(page, "title")).toBeVisible();

  // The grid: every screen as a tile, grouped by round; a tile jumps to its screen.
  await page.keyboard.press("KeyM");
  const menu = page.locator('[data-dialog="menu"]');
  const grid = menu.locator("[data-jump-grid]");
  await expect(grid.locator('[data-jump-part="r1"]')).toContainText("Mixed");
  await expect(grid.locator('[data-jump-screen="question"]')).toHaveCount(6);
  await expect(grid.locator('[data-jump-screen="answer"]')).toHaveCount(6);
  await expect(grid.locator('[data-jump="start"]')).toHaveAttribute("aria-current", "true");
  await axe(page, "menu with the grid");
  await grid.getByRole("button", { name: "Question 2" }).click();
  await expect(menu).toHaveCount(0);
  await expect(prompt(page)).toHaveText("Which way is up?");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "idle"); // a jump does not start the timer
  await page.keyboard.press("KeyT");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "running");

  // B: black — the timer rests; Next only brings the quiz back.
  await page.keyboard.press("KeyB");
  const curtain = stage(page).locator("[data-curtain-box]");
  await expect(curtain).toHaveAttribute("data-curtain", "black");
  await expect(stage(page).locator("[data-dial]")).toHaveAttribute("data-status", "paused");
  await expect(page.locator('.qp-bar [data-control="black"]')).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(curtain).toBeHidden();
  await expect(prompt(page)).toHaveText("Which way is up?");

  // A break from the menu counts down on the stage and ends with Next.
  await page.keyboard.press("KeyM");
  await menu.locator('[data-break="5"]').click();
  await expect(curtain).toHaveAttribute("data-curtain", "break");
  await expect(curtain).toContainText("Break");
  await expect(curtain.locator("[data-break-time]")).toHaveText(/^(5:00|4:5\d)$/);
  await expect(curtain.locator("[data-break-time]")).toHaveText(/^4:5[0-8]$/, { timeout: 6000 });
  await axe(page, "break");
  await page.keyboard.press("KeyM");
  await expect(menu.locator('[data-break="end"]')).toBeVisible();
  await menu.locator('[data-break="end"]').click();
  await expect(curtain).toBeHidden();
  await expect(prompt(page)).toHaveText("Which way is up?");
});

test("AC6: the exported file plays pictures, audio and video from disk with the network off — nothing is requested", async ({ page, browser }, testInfo) => {
  test.slow();
  const path = await exportFile(page, testInfo);
  const html = readFileSync(path, "utf8");
  expect([...html.matchAll(/data-qp-media="([^"]+)"/g)].map((match) => match[1])).toEqual(BLOBS.map(([id]) => id));
  for (const viewport of [{ width: 1280, height: 860 }, { width: 390, height: 844 }]) {
    const { context, requests, errors } = await offlineContext(browser, viewport);
    const played = await context.newPage();
    await played.goto(pathToFileURL(path).href);
    await expect(view(played, "title")).toContainText("Media night");
    await played.keyboard.press("KeyM");
    await played.locator('[data-dialog="menu"] [data-auto]').uncheck();
    await played.keyboard.press("Escape");
    for (let n = 0; n < 3; n += 1) await played.keyboard.press("Space");
    for (const text of ["What is this test card called?", "Which way is up?", "A panorama is wider than it is tall."]) {
      await expect(prompt(played)).toHaveText(text);
      await expectWhole(stage(played).locator("[data-slide-picture]"));
      await played.keyboard.press("Space");
    }
    await expect(prompt(played)).toHaveText("Which note is this?");
    expect(await isPaused(stage(played))).toBe(true);
    await played.keyboard.press("KeyP");
    await expect.poll(() => clipTime(stage(played))).toBeGreaterThan(0.2);
    await played.keyboard.press("Space");
    await expectWhole(stage(played).locator("[data-slide-video]"));
    await stage(played).locator("[data-clip-toggle]").click();
    await expect.poll(() => clipTime(stage(played))).toBeGreaterThan(0.2);
    await played.keyboard.press("Space");
    await expect(prompt(played)).toHaveText("And this one, from an M4A?");
    await played.keyboard.press("KeyP");
    await expect.poll(() => clipTime(stage(played))).toBeGreaterThan(0.2);
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  }
});

/** Opens the audience window from the menu of a playing host page. */
async function openAudience(host: Page, context: BrowserContext): Promise<Page> {
  const opened = context.waitForEvent("page");
  await host.keyboard.press("KeyM");
  await host.locator('[data-dialog="menu"] [data-menu="audience"]').click();
  const audience = await opened;
  await expect(view(audience, "title")).toBeVisible();
  return audience;
}

/** Presenter mode with media: the audience's window plays what the host's panel says; the host note stays with the host. */
async function presentMedia(host: Page, audience: Page): Promise<void> {
  const forward = panel(host).locator('[data-control="next"]');
  await panel(host).locator('[data-control="menu"]').click();
  await host.locator('[data-dialog="menu"] [data-jump-grid]').getByRole("button", { name: "Question 4" }).click();
  await expect(prompt(audience)).toHaveText("Which note is this?");
  // The host sees the note; nothing of it is anywhere in the audience's page.
  await expect(panel(host).locator("[data-host-note]")).toContainText(NOTE);
  expect(await audience.content()).not.toContain("zebra-note-7");
  // The panel's previews are stills: only the audience's window has the clip.
  await expect(panel(host).locator("audio, video")).toHaveCount(0);
  const card = panel(host).locator('[data-card="media"]');
  await expect(card).toBeVisible();
  expect(await isPaused(stage(audience))).toBe(true);
  await card.locator('[data-control="clip"]').click();
  // A browser may want a tap in the audience's window before it plays sound: the stage offers it.
  const tap = stage(audience).locator("[data-clip-tap]");
  await expect(stage(audience).locator(".quiz-slide-clip")).toHaveAttribute("data-status", /playing|blocked/);
  if (await tap.isVisible()) await tap.click();
  await expect.poll(() => clipTime(stage(audience))).toBeGreaterThan(0.2);
  await expect(card.locator("[data-host-clip]")).toHaveText(/^0:0\d \/ 0:02$/);
  await card.locator('[data-control="clip"]').click();
  await expect.poll(() => isPaused(stage(audience))).toBe(true);

  // The video follows the panel too, and the panel's black screen covers the audience's stage.
  await forward.click();
  await expect(prompt(audience)).toHaveText("What moves in the clip?");
  await expectWhole(stage(audience).locator("[data-slide-video]"));
  await card.locator('[data-control="clip"]').click();
  if (await tap.isVisible()) await tap.click();
  await expect.poll(() => clipTime(stage(audience))).toBeGreaterThan(0.2);
  // One control bar for the stage and the host panel (owner, 2026-11-24): on a phone its "Black screen" is in the menu, as under the stage.
  const black = panel(host).locator('[data-control="black"]');
  if (await black.isVisible()) await black.click();
  else {
    await panel(host).locator('[data-control="menu"]').click();
    await host.locator('[data-dialog="menu"] [data-menu="black"]').click();
  }
  await expect(stage(audience).locator("[data-curtain-box]")).toHaveAttribute("data-curtain", "black");
  await expect(panel(host).locator("[data-host-cover]")).toHaveText("The room sees a black screen");
  await expect.poll(() => isPaused(stage(audience))).toBe(true);
  await host.keyboard.press("KeyB"); // the same key takes the black screen away
  await expect(stage(audience).locator("[data-curtain-box]")).toBeHidden();

  // A picture: the panel zooms it on the audience's stage.
  await panel(host).locator('[data-control="menu"]').click();
  await host.locator('[data-dialog="menu"] [data-jump-grid]').getByRole("button", { name: "Question 2" }).click();
  await expectWhole(stage(audience).locator("[data-slide-picture]"));
  await card.locator('[data-control="zoom"]').click();
  await expect(stage(audience).locator(".quiz-slide-frame[data-zoom]")).toBeVisible();
  await expectWhole(stage(audience).locator("[data-slide-picture]"));
}

test("presenter mode in the app: the audience window reads the media from this browser and plays what the host's panel says; the host note never reaches it", async ({ page, context }) => {
  await openMediaQuiz(page);
  await root(page).locator("[data-play-quiz]").click();
  await expect(view(page, "title")).toBeVisible();
  const audience = await openAudience(page, context);
  await presentMedia(page, audience);
  await axe(page, "host panel with media");
});

test("presenter mode of the exported file, offline: the audience window plays from its own copy of the file", async ({ page, browser }, testInfo) => {
  const path = await exportFile(page, testInfo);
  const { context, requests, errors } = await offlineContext(browser);
  const host = await context.newPage();
  await host.goto(pathToFileURL(path).href);
  await expect(view(host, "title")).toBeVisible();
  const audience = await openAudience(host, context);
  await presentMedia(host, audience);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await context.close();
});

test("AC7: a quiz file saved in one browser opens in another with the same quiz and media; opening it twice duplicates nothing; another version asks", async ({ page, browser }, testInfo) => {
  await openMediaQuiz(page);
  await expect(root(page).locator("[data-media-size]")).toContainText("Media: 92.4 kB of 250 MB");
  const download = page.waitForEvent("download");
  await root(page).locator("[data-quiz-more] summary").click(); // the quiz file is folded under the actions
  await root(page).locator("[data-save-file]").click();
  const saved = await download;
  expect(saved.suggestedFilename()).toMatch(/^Media[ _]night\.quizzard$/);
  const path = testInfo.outputPath("Media night.quizzard");
  await saved.saveAs(path);
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 8).toString("latin1")).toBe("QUIZZARD");
  expect(bytes.length).toBeLessThan(110_000); // the media as it is: nothing is base64-ed

  // Another browser with nothing in it.
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto("./#/quiz");
  await expect(root(other).locator("[data-open-file]")).toBeVisible();
  await axe(other, "library, empty, with Open a quiz file");
  await root(other).locator("[data-open-file-input]").setInputFiles(path);
  await expect(root(other).locator("[data-quiz-name]")).toHaveValue("Media night");
  await expect(root(other).locator("[data-media-size]")).toContainText("Media: 92.4 kB of 250 MB");
  expect(await storedMedia(other)).toEqual(BLOBS.map(([id]) => `media-quiz/${id}`).sort());
  await root(other).locator('[data-focus="round:r1"]').click();
  const cards = root(other).locator("[data-question]");
  await expect(cards).toHaveCount(6);
  await expectWhole(cards.nth(1).locator("[data-slide-picture]"));
  // The file's bytes are the same as the ones that were saved.
  const sizes = await storedMediaSizes(other);
  expect(sizes).toEqual(QUIZ.media.map((entry) => entry.bytes).sort((a, b) => a - b));
  // The host note came along.
  await cards.nth(3).locator(".quiz-qcard-open").click();
  await expect(root(other).locator("[data-host-note]")).toHaveValue(NOTE);
  await expect(root(other).locator("[data-live-slide]")).not.toContainText("zebra-note-7");

  // The same file again: nothing is added, nothing is duplicated.
  await other.goto("./#/quiz");
  await expect(root(other).locator(".quiz-card")).toHaveCount(1);
  await root(other).locator("[data-open-file-input]").setInputFiles(path);
  await expect(other.getByText("“Media night” is already in your quizzes — nothing was changed")).toBeVisible();
  await expect(root(other).locator("[data-quiz-name]")).toHaveValue("Media night");
  expect(await storedMedia(other)).toHaveLength(6);

  // Changed here, then the file again: "Replace" takes the file's version; the media is still there once.
  await root(other).locator("[data-quiz-name]").fill("Media night, edited");
  await expect(other.locator(".quiz-saved[data-saved='saved']")).toBeVisible();
  await other.goto("./#/quiz");
  await root(other).locator("[data-open-file-input]").setInputFiles(path);
  const ask = other.getByRole("alertdialog");
  await expect(ask).toContainText("“Media night” is already in your quizzes");
  await ask.getByRole("button", { name: "Replace" }).click();
  await expect(root(other).locator("[data-quiz-name]")).toHaveValue("Media night");
  expect(await storedMedia(other)).toHaveLength(6);

  // Changed again and "Keep both": the file's quiz comes in as a copy with its own files; Undo takes the copy away.
  await root(other).locator("[data-quiz-name]").fill("Mine");
  await expect(other.locator(".quiz-saved[data-saved='saved']")).toBeVisible();
  await other.goto("./#/quiz");
  await root(other).locator("[data-open-file-input]").setInputFiles(path);
  await other.getByRole("alertdialog").getByRole("button", { name: "Keep both" }).click();
  await expect(root(other).locator("[data-quiz-name]")).toHaveValue("Media night (copy)");
  expect(await storedMedia(other)).toHaveLength(12);
  await other.getByRole("button", { name: "Undo" }).last().click();
  await expect(root(other).locator(".quiz-card")).toHaveCount(1);
  await expect.poll(() => storedMedia(other)).toHaveLength(6);
  await context.close();
});

test("F10: the version-1 quiz file kept in the repo opens; a file that is not a quiz file, a cut one and a newer one are refused by name", async ({ page }) => {
  await page.goto("./#/quiz");
  const input = root(page).locator("[data-open-file-input]");
  const fixture = readFileSync(QUIZ_FILE_FIXTURE);
  await input.setInputFiles({ name: "notes.html", mimeType: "text/html", buffer: Buffer.from("<!doctype html><title>x</title>") });
  await expect(page.getByText("“notes.html” is not a Quizzard quiz file.")).toBeVisible();
  await input.setInputFiles({ name: "cut.quizzard", mimeType: "application/octet-stream", buffer: fixture.subarray(0, fixture.length - 500) });
  await expect(page.getByText("“cut.quizzard” is damaged or incomplete. Ask for it to be sent again.")).toBeVisible();
  const newer = Buffer.from(fixture);
  newer[8] = 2;
  await input.setInputFiles({ name: "future.quizzard", mimeType: "application/octet-stream", buffer: newer });
  await expect(page.getByText("“future.quizzard” was made with a newer Quizzard.")).toBeVisible();
  expect(await storedMedia(page)).toEqual([]);
  await expect(root(page).locator(".quiz-card")).toHaveCount(0);

  // Dropped on the library — a computer's way — the fixture opens: its quiz, its note, its two files.
  const data = await page.evaluateHandle((base64) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))], "fixture-night.quizzard"));
    return transfer;
  }, fixture.toString("base64"));
  await root(page).locator('[data-screen="library"]').dispatchEvent("drop", { dataTransfer: data });
  await expect(root(page).locator("[data-quiz-name]")).toHaveValue("Fixture night");
  expect(await storedMedia(page)).toEqual(["fixture-quiz-file-v1/m-picture", "fixture-quiz-file-v1/m-sound"]);
  await root(page).locator('[data-focus="round:r1"]').click();
  await expectWhole(root(page).locator("[data-question]").first().locator("[data-slide-picture]"));
});

test("the round's \"apply to all\": says how many questions change, clears their own time and points, and can be undone", async ({ page }) => {
  await openMediaQuiz(page);
  await root(page).locator('[data-focus="round:r1"]').click();
  await root(page).locator("[data-round-settings] summary").click();
  const apply = root(page).locator("[data-apply]");
  await expect(apply.locator("[data-apply-note]")).toHaveText("1 question has its own time or points.");
  const fourth = root(page).locator("[data-question]").nth(3);
  await expect(fourth.locator(".quiz-fact[data-own]")).toHaveText("5 s");
  await axe(page, "round settings with apply to all");
  await apply.locator("[data-apply-all]").click();
  const ask = page.getByRole("alertdialog");
  await expect(ask).toContainText("Apply to all 6 questions of this round?");
  await expect(ask).toContainText("1 question loses its own time and points and takes the round's: 30 s · 1 point.");
  await ask.getByRole("button", { name: "Apply to all" }).click();
  await expect(fourth.locator(".quiz-fact[data-own]")).toHaveCount(0);
  await expect(fourth.locator(".quiz-fact").first()).toHaveText("30 s");
  await expect(apply).toBeHidden();
  await page.getByRole("button", { name: "Undo" }).last().click();
  await expect(root(page).locator("[data-question]").nth(3).locator(".quiz-fact[data-own]")).toHaveText("5 s");
});

test("the export of a quiz with media shows its progress and the size; the creator's pages raise no CSP violation while media plays", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => { if (message.type() === "error" && /Content Security Policy/i.test(message.text())) violations.push(message.text()); });
  await openMediaQuiz(page);
  const download = page.waitForEvent("download");
  await root(page).locator("[data-export]").click();
  await download;
  await expect(root(page).locator("[data-exported]")).toContainText(/Exported: Media night\.html · [\d.]+ kB/);
  await root(page).locator("[data-play-quiz]").click();
  await expect(view(page, "title")).toBeVisible();
  await page.keyboard.press("KeyM");
  await page.locator('[data-dialog="menu"] [data-jump-grid]').getByRole("button", { name: "Question 5" }).click();
  await stage(page).locator("[data-clip-toggle]").click();
  await expect.poll(() => clipTime(stage(page))).toBeGreaterThan(0.2);
  expect(violations).toEqual([]);
});

// Moni 2026-11-26: the file with the answer may be a clip too — a short video or a sound played at the reveal.
test("a video can be kept with the answer: it is on the answer's slide, not with the question", async ({ page }) => {
  await newQuizWithRound(page);
  await root(page).locator("[data-add-question]").click();
  await root(page).locator("[data-prompt]").fill("Who scored the goal?");
  await root(page).locator("[data-open-answer]").fill("Stoichkov");
  const answerPicker = root(page).locator("[data-answer-picker]");
  await expect(answerPicker).toContainText("File for the answer");
  await root(page).locator("[data-answer-input]").setInputFiles(file("clip.mp4"));
  await expect(answerPicker.locator("[data-answer-name]")).toHaveText("clip.mp4");
  await expect(answerPicker).toHaveAttribute("data-answer-picker", "video");
  expect((await storedMedia(page)).length).toBe(1);
  await root(page).locator("[data-done]").click();
  await root(page).locator("[data-question] [data-more]").first().click();
  await root(page).locator("[data-sheet] [data-play-from]").click();
  await expect(prompt(page)).toHaveText("Who scored the goal?");
  await expect(stage(page).locator("[data-slide-video]")).toHaveCount(0);
  await page.keyboard.press("Space"); // "Answers"
  await page.keyboard.press("Space"); // the answer's slide
  await page.keyboard.press("Space"); // revealed
  await expect(stage(page).locator(".quiz-slide-right")).toHaveText("Stoichkov");
  await expectWhole(stage(page).locator("[data-slide-video]"));
  await page.keyboard.press("Escape");
});

// Moni 2026-11-26: a song under a question, and a playlist over the whole quiz.
test("music: a song on one question, then a playlist fills the others in order and the quiz lists what is left", async ({ page }) => {
  await newQuizWithRound(page);
  // Three text questions and one audio question.
  for (const prompt of ["One?", "Two?", "Three?"]) {
    await root(page).locator("[data-add-question]").click();
    await root(page).locator("[data-prompt]").fill(prompt);
    await root(page).locator("[data-open-answer]").fill("Yes");
    await root(page).locator("[data-done]").click();
  }
  // The first question gets its own song in the editor: the fold opens with it.
  await root(page).locator("[data-question]").first().locator(".quiz-qcard-open, .quiz-qrow-open").click();
  const fold = root(page).locator("[data-music-fold]");
  await expect(fold).not.toHaveAttribute("open", "");
  await fold.locator("summary").click();
  await root(page).locator("[data-music-input]").setInputFiles(file("clip.mp3"));
  await expect(root(page).locator("[data-music-picker] [data-music-name]")).toHaveText("clip.mp3");
  await expect(root(page).locator("[data-music-fold]")).toHaveAttribute("open", "");
  await root(page).locator("[data-done]").click();
  const music = (): Promise<(string | null)[]> => stored(page).then((all) => (all[0]?.quiz.rounds[0]?.questions ?? []).map((question) => (question as { music?: { id: string } }).music?.id ?? null));
  await expect.poll(async () => (await music()).map((id) => id !== null)).toEqual([true, false, false]);

  // The quiz's tools: one song for the two questions left — it goes to both, the first keeps its own.
  // The quiz's header card is beside the round on a wide screen; on a phone it is one level up.
  const toQuiz = async (): Promise<void> => { if (!(await root(page).locator("[data-play-quiz]").isVisible())) await root(page).locator("[data-up]:visible").first().click(); };
  await toQuiz();
  await root(page).locator("[data-quiz-more] summary").click();
  await root(page).locator("[data-music-files-input]").setInputFiles([file("clip.m4a")]);
  await expect.poll(async () => (await music()).filter((id) => id !== null).length, { timeout: 20_000 }).toBe(3);
  const ids = await music();
  expect(ids[1]).toBe(ids[2]);
  expect(ids[0]).not.toBe(ids[1]);
  await expect(root(page).locator("[data-quiz-no-music]")).toHaveCount(0);

  // A new question has no music: the quiz says so and lists it.
  if (!(await root(page).locator("[data-add-question]").isVisible())) await root(page).locator(".quiz-round-open").first().click();
  await root(page).locator("[data-add-question]").click();
  await root(page).locator("[data-prompt]").fill("Four?");
  await root(page).locator("[data-open-answer]").fill("No");
  await root(page).locator("[data-done]").click();
  await toQuiz();
  const note = root(page).locator("[data-quiz-no-music]");
  await expect(note).toHaveText("1 question has no music");
  await note.click();
  await expect(page.locator("[data-music-missing-item]")).toHaveText(/Round 1 .* question 4/);
  await page.locator("[data-music-missing-cancel]").click();

  // Playing: on the first question the song starts with the timer, by itself, and rests when the timer is paused.
  await page.evaluate(() => {
    const played: string[] = [];
    Object.assign(window, { quizMusicPlayed: played });
    const play = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "play")?.value as (this: HTMLMediaElement) => Promise<void>;
    HTMLMediaElement.prototype.play = function patched(this: HTMLMediaElement): Promise<void> {
      if (!this.isConnected) played.push(this.loop ? "loop" : "once");
      return play.call(this);
    };
  });
  await root(page).locator("[data-play-quiz]").click();
  if (await page.locator("[data-unfinished-go]").isVisible().catch(() => false)) await page.locator("[data-unfinished-go]").click();
  for (let press = 0; press < 8 && !(await prompt(page).isVisible().catch(() => false)); press += 1) await page.keyboard.press("Space");
  await expect(prompt(page)).toHaveText("One?");
  await expect.poll(() => page.evaluate(() => (window as unknown as { quizMusicPlayed: string[] }).quizMusicPlayed)).toEqual(["loop"]);
  await page.keyboard.press("Escape");
});
