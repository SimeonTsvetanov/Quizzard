// A playlist over the whole quiz (Moni 2026-11-26; lazy, loaded with the first pick): the picked songs
// are handed out, in the order of their names, to the questions that can have music and have none — the
// first song to the first such question, and from the first song again when the questions outnumber the
// songs. A question that has music keeps it. Where the browser can cut a clip, each song is cut to the
// time of the question it goes to (from its start), so twenty songs do not fill the quiz; elsewhere a song
// is taken whole when it is within the limits. A song that cannot be taken is named in the result.
import { MEDIA_RULES, type MediaEntry, assignMusic, effectiveSeconds, mimeOf, questionsWithoutMusic, setWantsMusic, usedMediaBytes, withMedia } from "@simeonts/quizzard-quiz-core";
import type { App } from "../app/state.ts";
import { hasRoomFor } from "../storage/space.ts";
import { canCut } from "./cut/can-cut.ts";
import { importMedia } from "./import.ts";

/** What a playlist did. */
export interface PlaylistResult {
  /** How many questions got music. */
  readonly given: number;
  /** How many songs were taken into the quiz. */
  readonly songs: number;
  /** The names of the picked songs that could not be taken (format, size, no room). */
  readonly refused: readonly string[];
  /** How many questions that can have music still have none. */
  readonly left: number;
}

/** The shortest piece a song is cut to, in seconds: a short question still gets a tune that does not jump back at once. */
const SHORTEST_CUT = 30;
/** A song this much longer than its question's time is cut, in seconds; a shorter overhang is not worth the work. */
const WORTH_CUTTING = 10;

/** Whether a picked file is a sound, by its type or its name's ending. */
function isSong(file: File): boolean {
  return mimeOf(file.type, file.name).startsWith("audio/") || /\.(mp3|m4a|wav|ogg|oga|aac|flac|opus)$/i.test(file.name);
}

/** The picked songs in the order of their names, numbers as numbers ("2 …" before "10 …"); a folder's other files are left out. */
export function songsOf(files: readonly File[]): readonly File[] {
  return files.filter(isSong).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
}

/** A song cut to the first `seconds` of it, where the browser can and it is worth it; else the song as it is. */
async function fitted(file: File, seconds: number, signal: AbortSignal): Promise<File> {
  if (!canCut("audio")) return file;
  try {
    const { clipSeconds, cutClip } = await import("./cut/convert.ts");
    const length = await clipSeconds(file);
    const wanted = Math.max(seconds, SHORTEST_CUT);
    const isLong = length > wanted + WORTH_CUTTING;
    if (!isLong && file.size <= MEDIA_RULES.audio.maxBytes && MEDIA_RULES.audio.mimes.includes(mimeOf(file.type, file.name))) return file;
    const cut = await cutClip({ file, isVideo: false, start: 0, end: isLong ? wanted : length, maxHeight: null, level: "medium", maxBytes: MEDIA_RULES.audio.maxBytes, onProgress: () => undefined, signal });
    return cut.ok ? new File([cut.blob], `${file.name.replace(/\.[a-z0-9]{1,5}$/i, "")}.m4a`, { type: cut.blob.type }) : file;
  } catch {
    // A song this browser cannot read for cutting: the usual check below says what is wrong with it.
    return file;
  }
}

/**
 * Hands the picked songs out to the questions without music and turns "music on every question" on.
 * @param app - the mounted creator, with its quiz open
 * @param files - what was picked: a folder's files or single songs
 * @param onProgress - called before each song with how many are done and how many there are
 * @returns what was done; `null` when the quiz was closed meanwhile
 */
export async function addPlaylist(app: App, files: readonly File[], onProgress: (done: number, total: number) => void): Promise<PlaylistResult | null> {
  const start = app.current;
  if (!start) return null;
  const quizId = start.quiz.id;
  const missing = questionsWithoutMusic(start.quiz, app.env.registries);
  const songs = songsOf(files).slice(0, missing.length);
  const taken: MediaEntry[] = [];
  const refused: string[] = [];
  let usedBytes = usedMediaBytes(start.quiz, start.media);
  for (const [index, song] of songs.entries()) {
    onProgress(index, songs.length);
    const place = missing[index];
    const file = await fitted(song, place ? effectiveSeconds(place.round, place.question) : SHORTEST_CUT, app.signal);
    const result = await importMedia(file, { type: "audio", usedBytes, id: app.env.ids(), hasRoomFor });
    if (app.signal.aborted || app.current?.quiz.id !== quizId) return null;
    if (!result.ok) {
      refused.push(song.name);
      continue;
    }
    await app.store.putMedia(quizId, result.entry.id, result.blob);
    app.media.add(result.entry.id, result.blob);
    taken.push(result.entry);
    usedBytes += result.entry.bytes;
  }
  const now = app.current;
  if (app.signal.aborted || now?.quiz.id !== quizId) return null;
  const before = questionsWithoutMusic(now.quiz, app.env.registries).length;
  const next = taken.length === 0 ? now.quiz : setWantsMusic(assignMusic(now.quiz, taken.map((entry) => entry.id), app.env.registries), true);
  const left = questionsWithoutMusic(next, app.env.registries).length;
  if (next !== now.quiz) app.change(next, taken.reduce(withMedia, now.media));
  return { given: before - left, songs: taken.length, refused, left };
}
