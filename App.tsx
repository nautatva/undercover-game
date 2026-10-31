import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  acknowledgeElimination,
  advanceReveal,
  createGame,
  defaultRoleCounts,
  eliminate,
  type GameState,
  pointsForGame,
  type RoleCounts,
  submitMrWhiteGuess,
} from './src/game/logic';
import { pickWordPair } from './src/game/words';
import { GameOverScreen } from './src/ui/GameOverScreen';
import { colors } from './src/ui/kit';
import { RevealScreen } from './src/ui/RevealScreen';
import {
  DiscussScreen,
  EliminatedScreen,
  MrWhiteGuessScreen,
  VoteScreen,
} from './src/ui/RoundScreens';
import { SetupScreen } from './src/ui/SetupScreen';

const DEFAULT_PLAYER_COUNT = 5;

export default function App() {
  const [names, setNames] = useState<string[]>(() => Array<string>(DEFAULT_PLAYER_COUNT).fill(''));
  const [counts, setCounts] = useState<RoleCounts>(() => defaultRoleCounts(DEFAULT_PLAYER_COUNT));
  const [scores, setScores] = useState<Record<string, number>>({});
  const [usedPairs, setUsedPairs] = useState<number[]>([]);
  const [game, setGame] = useState<GameState | null>(null);

  function deal(playerNames: string[], roleCounts: RoleCounts) {
    const { pair, usedIndexes } = pickWordPair(usedPairs);
    setUsedPairs(usedIndexes);
    setNames(playerNames);
    setCounts(roleCounts);
    setGame(createGame(playerNames, roleCounts, pair));
  }

  /** Scores are paid here, the one moment a game moves into its game-over phase. */
  function applyTurn(next: GameState) {
    if (next.phase === 'gameover') {
      const earned = pointsForGame(next);
      setScores((current) => {
        const updated = { ...current };
        for (const p of next.players) updated[p.name] = (updated[p.name] ?? 0) + earned[p.id];
        return updated;
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setGame(next);
  }

  function renderPhase() {
    if (!game) {
      return <SetupScreen initialNames={names} initialCounts={counts} onStart={deal} />;
    }
    const eliminated = game.players.find((p) => p.id === game.lastEliminatedId);
    switch (game.phase) {
      case 'reveal':
        return (
          <RevealScreen
            key={game.revealIndex}
            player={game.players[game.revealIndex]}
            position={game.revealIndex + 1}
            total={game.players.length}
            onDone={() => setGame(advanceReveal(game))}
          />
        );
      case 'discuss':
        return (
          <DiscussScreen
            key={game.round}
            game={game}
            onVote={() => setGame({ ...game, phase: 'vote' })}
            onQuit={() => setGame(null)}
          />
        );
      case 'vote':
        return (
          <VoteScreen
            game={game}
            onEliminate={(id) => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setGame(eliminate(game, id));
            }}
            onBack={() => setGame({ ...game, phase: 'discuss' })}
          />
        );
      case 'eliminated':
        return eliminated ? (
          <EliminatedScreen
            player={eliminated}
            onContinue={() => applyTurn(acknowledgeElimination(game))}
          />
        ) : null;
      case 'mrwhite':
        return eliminated ? (
          <MrWhiteGuessScreen
            player={eliminated}
            onGuess={(guess) => applyTurn(submitMrWhiteGuess(game, guess))}
          />
        ) : null;
      case 'gameover':
        return (
          <GameOverScreen
            game={game}
            scores={scores}
            onPlayAgain={() => deal(names, counts)}
            onNewSession={() => {
              setScores({});
              setGame(null);
            }}
          />
        );
    }
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {renderPhase()}
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
