// Builds a game from a quiz: the list of screens (title, teams, every round's own screens from its
// round kind, tiebreak, podium) with what the reducer needs of each written next to it — so the
// state carries no reference to the quiz and stays plain data.
import { type MediaEntry, type Question, type QuizFile, type Registry, type Round, type RoundKind, MAX_TEAMS, MIN_TEAMS, RESTING_PLAYBACK, STANDARD_SCREENS, clamp, createRoundKinds } from "@simeonts/quizzard-quiz-core/play";
import { type ScreenKind, screenKinds } from "./kinds.ts";
import { PLAYER_SCREENS, type GameScreen, type GameState, type Team, freshTimer } from "./state.ts";

/** What building a game needs besides the quiz; the defaults are the player's own registries. */
export interface GameSetup {
  /** The name a team has until the host types one: "Team 1". */
  readonly teamName: (number: number) => string;
  readonly rounds?: Registry<RoundKind>;
  readonly kinds?: Registry<ScreenKind>;
}

const defaultRounds = createRoundKinds();

/** One of the player's own screens: no round, no timer, no reveal. */
function own(screen: string): GameScreen {
  return { screen, seconds: 0, steps: 0 };
}

/**
 * What a question's file is to the game: a clip when it has a length (audio, video), else a still.
 * @param entry - the file's description; `undefined` for a question without a file
 */
export function mediaOfScreen(entry: MediaEntry | undefined): Pick<GameScreen, "media" | "clipMs" | "zoom"> {
  if (!entry) return {};
  if (entry.seconds === undefined) return { media: "still", zoom: true };
  // A video can fill the stage like a picture; a sound has nothing to enlarge.
  const zoom = entry.type === "video" ? { zoom: true as const } : {};
  return entry.seconds > 0 ? { media: "clip", clipMs: Math.round(entry.seconds * 1000), ...zoom } : { media: "clip", ...zoom };
}

/** A round's screens with their timer, reveals and media; a round without questions has nothing to play. */
function roundScreens(round: Round, media: ReadonlyMap<string, MediaEntry>, rounds: Registry<RoundKind>, kinds: Registry<ScreenKind>): readonly GameScreen[] {
  if (round.questions.length === 0) return [];
  const questions = new Map<string, Question>(round.questions.map((question) => [question.id, question]));
  return (rounds.get(round.kind)?.screens(round) ?? []).map((place) => {
    const kind = kinds.get(place.screen);
    const question = place.questionId === undefined ? undefined : questions.get(place.questionId);
    const seconds = question && kind?.seconds ? kind.seconds(round, question) : 0;
    // At the reveal the picture kept for the answer takes the place of the question's own file.
    const shown = place.screen === STANDARD_SCREENS.answer && question?.answerMedia ? question.answerMedia : question?.media;
    return { ...place, seconds, steps: kind?.steps ?? 0, ...(kind?.upright ? { upright: true as const } : {}), ...mediaOfScreen(shown ? media.get(shown.id) : undefined) };
  });
}

/**
 * The screens of a quiz in play order.
 * @param file - the quiz
 * @param rounds - the round kinds
 * @param kinds - the screen kinds
 */
export function buildScreens(file: QuizFile, rounds: Registry<RoundKind> = defaultRounds, kinds: Registry<ScreenKind> = screenKinds): readonly GameScreen[] {
  const media = new Map(file.media.map((entry) => [entry.id, entry]));
  return [
    own(PLAYER_SCREENS.title),
    own(PLAYER_SCREENS.teams),
    ...file.quiz.rounds.flatMap((round) => roundScreens(round, media, rounds, kinds)),
    own(PLAYER_SCREENS.tie),
    own(PLAYER_SCREENS.final),
  ];
}

/**
 * The first teams of a game.
 * @param count - how many; kept inside 2–12
 * @param teamName - gives "Team 1"
 */
export function firstTeams(count: number, teamName: (number: number) => string): readonly Team[] {
  const size = clamp(Math.round(count), MIN_TEAMS, MAX_TEAMS);
  return Array.from({ length: size }, (_, index) => ({ id: `t${String(index + 1)}`, name: teamName(index + 1) }));
}

/**
 * A new game of a quiz, on its title screen.
 * @param file - the quiz
 * @param setup - the first teams' names and, in tests, other registries
 */
export function createGame(file: QuizFile, setup: GameSetup): GameState {
  const teams = firstTeams(file.quiz.settings.teams, setup.teamName);
  return {
    screens: buildScreens(file, setup.rounds, setup.kinds),
    index: 0,
    step: 0,
    teams,
    nextTeam: teams.length + 1,
    scores: {},
    bonus: {},
    winner: null,
    auto: true,
    timer: freshTimer(0),
    media: RESTING_PLAYBACK,
    curtain: null,
  };
}

/**
 * The index of a round's first screen, for the jump menu.
 * @param state - the game
 * @param roundId - the round
 * @returns -1 when the round has no screens
 */
export function roundStart(state: GameState, roundId: string): number {
  return state.screens.findIndex((screen) => screen.roundId === roundId);
}
