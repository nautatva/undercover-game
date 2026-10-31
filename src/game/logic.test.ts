import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  acknowledgeElimination,
  advanceReveal,
  buildSpeakingOrder,
  createGame,
  defaultRoleCounts,
  eliminate,
  findWinner,
  type GameState,
  isCorrectGuess,
  isValidRoleCounts,
  MAX_PLAYERS,
  MIN_PLAYERS,
  type Player,
  pointsForGame,
  type Role,
  submitMrWhiteGuess,
} from './logic.ts';
import { WORD_PAIRS } from './words.ts';

const names = (n: number) => Array.from({ length: n }, (_, i) => `P${i}`);
const pair = ['Coffee', 'Tea'] as const;
const idsOf = (game: GameState, role: Role) =>
  game.players.filter((p) => p.role === role).map((p) => p.id);

function player(id: number, role: Role, alive = true): Player {
  return { id, name: `P${id}`, role, word: role === 'mrwhite' ? null : 'x', alive };
}

test('default role counts are valid for every player count', () => {
  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
    assert.ok(isValidRoleCounts(n, defaultRoleCounts(n)), `n=${n}`);
  }
});

test('role counts need an infiltrator and at most one Mr. White', () => {
  assert.equal(isValidRoleCounts(3, { undercover: 0, mrWhite: 0 }), false);
  assert.equal(isValidRoleCounts(9, { undercover: 1, mrWhite: 2 }), false);
  assert.equal(isValidRoleCounts(2, { undercover: 1, mrWhite: 0 }), false);
});

test('infiltrators are only limited by leaving two civilians', () => {
  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
    assert.ok(isValidRoleCounts(n, { undercover: n - 2, mrWhite: 0 }), `n=${n}`);
    assert.equal(isValidRoleCounts(n, { undercover: n - 1, mrWhite: 0 }), false, `n=${n}`);
    if (n > 3) {
      assert.ok(isValidRoleCounts(n, { undercover: n - 3, mrWhite: 1 }), `n=${n}`);
      assert.equal(isValidRoleCounts(n, { undercover: n - 2, mrWhite: 1 }), false, `n=${n}`);
    }
  }
});

test('civilians can still win at the largest allowed infiltrator count', () => {
  let state = createGame(names(MAX_PLAYERS), { undercover: MAX_PLAYERS - 2, mrWhite: 0 }, pair);
  assert.equal(idsOf(state, 'civilian').length, 2);
  for (const id of idsOf(state, 'undercover')) {
    assert.equal(state.winner, null);
    state = acknowledgeElimination(eliminate(state, id));
  }
  assert.equal(state.winner, 'civilians');
});

test('voting out a civilian at the limit hands the win to the infiltrators', () => {
  const game = createGame(names(5), { undercover: 3, mrWhite: 0 }, pair);
  const state = acknowledgeElimination(eliminate(game, idsOf(game, 'civilian')[0]));
  assert.equal(state.winner, 'infiltrators');
});

test('createGame deals the requested roles and the right words', () => {
  const game = createGame(names(8), { undercover: 2, mrWhite: 1 }, pair);
  assert.equal(idsOf(game, 'civilian').length, 5);
  assert.equal(idsOf(game, 'undercover').length, 2);
  assert.equal(idsOf(game, 'mrwhite').length, 1);
  assert.notEqual(game.civilianWord, game.undercoverWord);
  for (const p of game.players) {
    const expected = { civilian: game.civilianWord, undercover: game.undercoverWord, mrwhite: null };
    assert.equal(p.word, expected[p.role]);
  }
});

test('Mr. White never speaks first', () => {
  const players = [player(0, 'mrwhite'), player(1, 'civilian'), player(2, 'undercover')];
  for (let i = 0; i < 500; i++) {
    assert.notEqual(buildSpeakingOrder(players)[0], 0);
  }
});

test('speaking order holds every living player once and skips the dead', () => {
  const players = [player(0, 'civilian'), player(1, 'civilian', false), player(2, 'mrwhite')];
  assert.deepEqual([...buildSpeakingOrder(players)].sort(), [0, 2]);
});

test('reveal passes through each player and then opens discussion', () => {
  let game = createGame(names(3), { undercover: 1, mrWhite: 0 }, pair);
  game = advanceReveal(game);
  assert.equal(game.phase, 'reveal');
  assert.equal(game.revealIndex, 1);
  game = advanceReveal(advanceReveal(game));
  assert.equal(game.phase, 'discuss');
});

test('civilians win once every infiltrator is out', () => {
  const game = createGame(names(5), { undercover: 2, mrWhite: 0 }, pair);
  const [first, second] = idsOf(game, 'undercover');
  let state = acknowledgeElimination(eliminate(game, first));
  assert.equal(state.phase, 'discuss');
  assert.equal(state.round, 2);
  assert.equal(state.winner, null);
  state = acknowledgeElimination(eliminate(state, second));
  assert.equal(state.phase, 'gameover');
  assert.equal(state.winner, 'civilians');
});

test('infiltrators win when one civilian remains', () => {
  const players = [player(0, 'civilian'), player(1, 'undercover'), player(2, 'civilian', false)];
  assert.equal(findWinner(players), 'infiltrators');
  assert.equal(findWinner([...players, player(3, 'civilian')]), null);
});

test('voting out an undercover is revealed before the result is shown', () => {
  const game = createGame(names(3), { undercover: 1, mrWhite: 0 }, pair);
  const state = eliminate(game, idsOf(game, 'undercover')[0]);
  assert.equal(state.phase, 'eliminated');
  assert.equal(state.winner, null);
  assert.equal(acknowledgeElimination(state).winner, 'civilians');
});

test('an eliminated Mr. White gets a guess, and a correct one wins alone', () => {
  const game = createGame(names(7), { undercover: 1, mrWhite: 1 }, pair);
  const state = eliminate(game, idsOf(game, 'mrwhite')[0]);
  assert.equal(state.phase, 'mrwhite');
  const won = submitMrWhiteGuess(state, ` ${game.civilianWord.toUpperCase()} `);
  assert.equal(won.winner, 'mrwhite');
  const points = pointsForGame(won);
  assert.equal(points[idsOf(game, 'mrwhite')[0]], 6);
  assert.equal(points[idsOf(game, 'undercover')[0]], 0);
  assert.equal(points[idsOf(game, 'civilian')[0]], 0);
});

test('a wrong guess continues the game, or ends it if Mr. White was the last infiltrator', () => {
  const withUndercover = createGame(names(7), { undercover: 1, mrWhite: 1 }, pair);
  const continued = submitMrWhiteGuess(
    eliminate(withUndercover, idsOf(withUndercover, 'mrwhite')[0]),
    'nonsense',
  );
  assert.equal(continued.phase, 'discuss');
  assert.equal(continued.round, 2);

  const aloneGame = createGame(names(5), { undercover: 0, mrWhite: 1 }, pair);
  const ended = submitMrWhiteGuess(eliminate(aloneGame, idsOf(aloneGame, 'mrwhite')[0]), 'nonsense');
  assert.equal(ended.winner, 'civilians');
});

test('guesses ignore case, spacing, punctuation and accents', () => {
  assert.ok(isCorrectGuess('  ice-cream ', 'Ice Cream'));
  assert.ok(isCorrectGuess('CAFE', 'Café'));
  assert.equal(isCorrectGuess('', 'Coffee'), false);
  assert.equal(isCorrectGuess('Tea', 'Coffee'), false);
});

test('infiltrator win pays each role its value, including eliminated teammates', () => {
  const game = createGame(names(7), { undercover: 1, mrWhite: 1 }, pair);
  const points = pointsForGame({ ...game, winner: 'infiltrators', phase: 'gameover' });
  assert.equal(points[idsOf(game, 'undercover')[0]], 10);
  assert.equal(points[idsOf(game, 'mrwhite')[0]], 6);
  assert.equal(points[idsOf(game, 'civilian')[0]], 0);
});

test('word pairs are well formed and unique', () => {
  const seen = new Set<string>();
  for (const [a, b] of WORD_PAIRS) {
    assert.ok(a.trim() && b.trim());
    assert.notEqual(isCorrectGuess(a, b), true, `${a}/${b}`);
    const key = [a, b].sort().join('|');
    assert.equal(seen.has(key), false, key);
    seen.add(key);
  }
  assert.ok(WORD_PAIRS.length >= 100);
});
