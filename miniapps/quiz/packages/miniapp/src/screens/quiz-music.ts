// Music over the whole quiz (core music.ts, media/playlist.ts): in the quiz's folded tools, "Choose a folder of
// songs" and "Choose single songs" hand the picked songs out to the questions without music, and "Remove the
// music" takes it off again; on the header card, while the quiz asks for music, a note says how many
// questions have none — it opens their list, each a way to its question, with the pickers under it.
import { type Quiz, type WithoutMusic, clearMusic, questionsWithoutMusic, wantsMusic } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { labelButton } from "../dom/controls.ts";
import { h } from "../dom/h.ts";
import { icon } from "../dom/icons.ts";
import { offerUndo } from "./common.ts";

/** The longest list of questions without music shown; the rest is said as a number. */
const MAX_LISTED = 12;

/** Whether this browser can hand over a whole folder (a phone's picker cannot). */
function canPickFolder(): boolean {
  return "webkitdirectory" in HTMLInputElement.prototype && matchMedia("(pointer: fine)").matches;
}

/** A hidden picker of songs: a folder, or several files. */
function songInput(isFolder: boolean, hook: string, onFiles: (files: readonly File[]) => void): HTMLInputElement {
  const input = h("input", { type: "file", class: "visually-hidden", multiple: "", tabindex: "-1", "aria-hidden": "true", [hook]: "", ...(isFolder ? { webkitdirectory: "" } : { accept: "audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac" }) });
  input.addEventListener("change", () => {
    const files = [...(input.files ?? [])];
    input.value = "";
    if (files.length > 0) onFiles(files);
  });
  return input;
}

/** Says what a playlist did, as a toast. */
function report(app: App, result: { readonly given: number; readonly songs: number; readonly refused: readonly string[]; readonly left: number }): void {
  const { t } = app;
  if (result.songs === 0) {
    app.context.shell.toast(result.refused.length > 0 ? t("music.noneTaken", { names: result.refused.slice(0, 3).join(", ") }) : t("music.noSongs"), { tone: "error" });
    return;
  }
  const parts = [t("music.done", { count: result.given, songs: result.songs })];
  if (result.refused.length > 0) parts.push(t("music.refused", { count: result.refused.length, names: result.refused.slice(0, 3).join(", ") }));
  if (result.left > 0) parts.push(t("music.left", { count: result.left }));
  app.context.shell.toast(parts.join(" "));
}

/** The pickers with their progress line; `pick()` opens the folder picker where there is one, else the files picker. */
function pickers(app: App): { readonly element: HTMLElement; readonly pick: () => void } {
  const { t } = app;
  const status = h("p", { class: "quiz-hint", role: "status", "data-music-status": "" });
  status.hidden = true;
  let isBusy = false;
  const take = (files: readonly File[]): void => {
    if (isBusy) return;
    isBusy = true;
    status.hidden = false;
    status.textContent = t("music.reading");
    void import("../media/playlist.ts")
      .then(({ addPlaylist }) => addPlaylist(app, files, (done, total) => { status.textContent = t("music.adding", { n: done + 1, total }); }))
      .then((result) => {
        if (result === null || app.signal.aborted) return;
        report(app, result);
        app.draw();
      })
      .catch(() => { if (!app.signal.aborted) app.context.shell.toast(t("menu.failed"), { tone: "error" }); })
      .finally(() => {
        isBusy = false;
        status.hidden = true;
      });
  };
  const fileInput = songInput(false, "data-music-files-input", take);
  const files = labelButton("audio", t("music.fromFiles"), { class: "button", "data-music-files": "" });
  files.addEventListener("click", () => { fileInput.click(); });
  const row = h("div", { class: "quiz-actions quiz-actions--stack" }, files, fileInput);
  if (!canPickFolder()) return { element: h("div", { class: "quiz-music-pick" }, row, status), pick: () => { fileInput.click(); } };
  const folderInput = songInput(true, "data-music-folder-input", take);
  const folder = labelButton("folder", t("music.fromFolder"), { class: "button", "data-music-folder": "" });
  folder.addEventListener("click", () => { folderInput.click(); });
  row.prepend(folder, folderInput);
  return { element: h("div", { class: "quiz-music-pick" }, row, status), pick: () => { folderInput.click(); } };
}

/** Whether any question of the quiz has music. */
function hasMusic(quiz: Quiz): boolean {
  return quiz.rounds.some((round) => round.questions.some((question) => question.music !== undefined));
}

/**
 * The music row of the quiz's folded tools: what it does, the pickers and — once there is music — the way to take it off.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 */
export function musicRow(app: App, quiz: Quiz): { readonly element: HTMLElement; readonly pick: () => void } {
  const { t } = app;
  const { element, pick } = pickers(app);
  const row = h("div", { class: "quiz-file-row", "data-music-row": "" }, h("p", { class: "quiz-hint" }, t("music.hint")), element);
  if (hasMusic(quiz) || wantsMusic(quiz)) {
    const remove = labelButton("trash", t("music.remove"), { class: "button button--destructive", "data-music-remove": "" });
    remove.addEventListener("click", () => {
      const now = app.current?.quiz;
      if (!now || !app.change(clearMusic(now))) return;
      app.draw();
      // The songs stay on the device until the quiz is opened in a later visit: Undo puts every pointer back.
      offerUndo(app, t("music.removed"), (current) => ({ ...current, settings: now.settings, rounds: current.rounds.map((round) => ({ ...round, questions: round.questions.map((question) => {
        const old = now.rounds.flatMap((was) => was.questions).find((was) => was.id === question.id)?.music;
        return old ? { ...question, music: old } : question;
      }) })) }), () => { app.draw(); });
    });
    element.querySelector(".quiz-actions")?.append(remove);
  }
  return { element: row, pick };
}

/** Opens the list of the questions without music: each leads to its question; "Choose songs" fills them. */
function listMissing(app: App, list: readonly WithoutMusic[], pick: () => void): void {
  const { t } = app;
  const quizId = app.current?.quiz.id ?? "";
  void import("../dom/sheet.ts").then(({ openSheet }) => {
    if (app.signal.aborted) return;
    const more = list.length > MAX_LISTED ? ` ${t("unfinished.more", { count: list.length - MAX_LISTED })}` : "";
    openSheet({
      host: app.host,
      title: t("music.missingTitle", { count: list.length }),
      text: `${t("music.missingText")}${more}`,
      items: list.slice(0, MAX_LISTED).map((item) => ({
        label: t("music.where", { round: item.roundIndex + 1, name: item.round.name, n: item.index + 1 }),
        icon: "open" as const,
        hook: "data-music-missing-item",
        run: (): undefined => {
          app.view.drafts.clear();
          app.go({ screen: "editor", quiz: quizId, question: item.question.id });
          return undefined;
        },
      })),
      closeLabel: t("menu.close"),
      actions: [
        { label: t("cancel"), hook: "data-music-missing-cancel", run: () => undefined },
        { label: t("music.fill"), hook: "data-music-missing-fill", isPrimary: true, run: () => { pick(); return undefined; } },
      ],
    });
  }).catch(() => { if (!app.signal.aborted) app.context.shell.toast(t("menu.failed"), { tone: "error" }); });
}

/**
 * "5 questions have no music": shown while the quiz asks for music on every question and some have none.
 * @param app - the mounted creator
 * @param quiz - the open quiz
 * @param pick - opens the songs picker (from {@link musicRow})
 */
export function musicNote(app: App, quiz: Quiz, pick: () => void): HTMLElement | null {
  if (!wantsMusic(quiz)) return null;
  const list = questionsWithoutMusic(quiz, app.env.registries);
  if (list.length === 0) return null;
  const link = h("button", { type: "button", class: "quiz-note-link", "data-quiz-no-music": String(list.length) }, icon("audio", 18), h("span", {}, app.t("music.missing", { count: list.length })));
  link.addEventListener("click", () => { listMissing(app, list, pick); });
  return link;
}
