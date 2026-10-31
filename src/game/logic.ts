export type Role = 'civilian' | 'undercover' | 'mrwhite';
export type Winner = 'civilians' | 'infiltrators' | 'mrwhite';
export type Phase = 'reveal' | 'discuss' | 'vote' | 'eliminated' | 'mrwhite' | 'gameover';
export type WordPair = readonly [string, string];
export type Rng = () => number;

export interface Player {
  id: number;
  name: string;
  role: Role;
  /** null for Mr. White, who gets no word. */
  word: string | null;
  alive: boolean;
}

export interface GameState {
  phase: Phase;
  players: Player[];
  civilianWord: string;
  undercoverWord: string;
  round: number;
  revealIndex: number;
  speakingOrder: number[];
  lastEliminatedId: number | null;
  winner: Winner | null;
}

export interface RoleCounts {
  undercover: number;
  mrWhite: number;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 20;
export const MIN_CIVILIANS = 2;
export const POINTS: Record<Role, number> = { civilian: 2, mrwhite: 6, undercover: 10 };

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** One civilian left is an infiltrator win, so civilians can only ever win starting from two. */
export function maxInfiltrators(playerCount: number): number {
  return playerCount - MIN_CIVILIANS;
}

export function defaultRoleCounts(playerCount: number): RoleCounts {
  if (playerCount < 5) return { undercover: 1, mrWhite: 0 };
  if (playerCount < 8) return { undercover: 1, mrWhite: 1 };
  if (playerCount < 12) return { undercover: 2, mrWhite: 1 };
  return { undercover: 3, mrWhite: 1 };
}

export function isValidRoleCounts(playerCount: number, { undercover, mrWhite }: RoleCounts): boolean {
  const infiltrators = undercover + mrWhite;
  return (
    playerCount >= MIN_PLAYERS &&
    playerCount <= MAX_PLAYERS &&
    undercover >= 0 &&
    mrWhite >= 0 &&
    infiltrators >= 1 &&
    infiltrators <= maxInfiltrators(playerCount)
  );
}

/** Mr. White may never open a round: going first with no word gives them away. */
export function buildSpeakingOrder(players: Player[], rng: Rng = Math.random): number[] {
  const order = shuffle(players.filter((p) => p.alive), rng);
  const firstSpeaker = order.findIndex((p) => p.role !== 'mrwhite');
  return [...order.slice(firstSpeaker), ...order.slice(0, firstSpeaker)].map((p) => p.id);
}

export function createGame(
  names: readonly string[],
  counts: RoleCounts,
  pair: WordPair,
  rng: Rng = Math.random,
): GameState {
  if (!isValidRoleCounts(names.length, counts)) {
    throw new Error('Invalid role counts');
  }
  // Either word of a pair can be the civilian one, so replaying a pair stays fair.
  const [civilianWord, undercoverWord] = rng() < 0.5 ? pair : [pair[1], pair[0]];
  const civilianCount = names.length - counts.undercover - counts.mrWhite;
  const roles = shuffle<Role>(
    [
      ...Array<Role>(civilianCount).fill('civilian'),
      ...Array<Role>(counts.undercover).fill('undercover'),
      ...Array<Role>(counts.mrWhite).fill('mrwhite'),
    ],
    rng,
  );
  const wordFor: Record<Role, string | null> = {
    civilian: civilianWord,
    undercover: undercoverWord,
    mrwhite: null,
  };
  const players = names.map((name, id) => ({
    id,
    name,
    role: roles[id],
    word: wordFor[roles[id]],
    alive: true,
  }));
  return {
    phase: 'reveal',
    players,
    civilianWord,
    undercoverWord,
    round: 1,
    revealIndex: 0,
    speakingOrder: buildSpeakingOrder(players, rng),
    lastEliminatedId: null,
    winner: null,
  };
}

export function advanceReveal(state: GameState): GameState {
  const revealIndex = state.revealIndex + 1;
  return revealIndex >= state.players.length
    ? { ...state, phase: 'discuss' }
    : { ...state, revealIndex };
}

export function findWinner(players: Player[]): Winner | null {
  const alive = players.filter((p) => p.alive);
  const civilians = alive.filter((p) => p.role === 'civilian').length;
  const infiltrators = alive.length - civilians;
  if (infiltrators === 0) return 'civilians';
  if (civilians <= 1) return 'infiltrators';
  return null;
}

export function eliminate(state: GameState, playerId: number): GameState {
  const players = state.players.map((p) => (p.id === playerId ? { ...p, alive: false } : p));
  const eliminated = players.find((p) => p.id === playerId);
  if (!eliminated) throw new Error(`Unknown player ${playerId}`);
  return {
    ...state,
    players,
    lastEliminatedId: playerId,
    phase: eliminated.role === 'mrwhite' ? 'mrwhite' : 'eliminated',
  };
}

function continueOrFinish(state: GameState, rng: Rng): GameState {
  const winner = findWinner(state.players);
  if (winner) return { ...state, winner, phase: 'gameover' };
  return {
    ...state,
    phase: 'discuss',
    round: state.round + 1,
    speakingOrder: buildSpeakingOrder(state.players, rng),
  };
}

export function acknowledgeElimination(state: GameState, rng: Rng = Math.random): GameState {
  return continueOrFinish(state, rng);
}

function normalizeWord(word: string): string {
  return word
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
}

export function isCorrectGuess(guess: string, civilianWord: string): boolean {
  return normalizeWord(guess) === normalizeWord(civilianWord);
}

/** A correct guess wins the game for that Mr. White alone, even if others are still in play. */
export function submitMrWhiteGuess(state: GameState, guess: string, rng: Rng = Math.random): GameState {
  if (isCorrectGuess(guess, state.civilianWord)) {
    return { ...state, winner: 'mrwhite', phase: 'gameover' };
  }
  return continueOrFinish(state, rng);
}

function isOnWinningSide(player: Player, state: GameState): boolean {
  if (state.winner === 'civilians') return player.role === 'civilian';
  // The Mr. White who just guessed is always the last player eliminated.
  if (state.winner === 'mrwhite') return player.id === state.lastEliminatedId;
  return state.winner === 'infiltrators' && player.role !== 'civilian';
}

/** Points earned this game by each player id. Eliminated teammates still share the win. */
export function pointsForGame(state: GameState): Record<number, number> {
  const points: Record<number, number> = {};
  for (const player of state.players) {
    points[player.id] = isOnWinningSide(player, state) ? POINTS[player.role] : 0;
  }
  return points;
}
