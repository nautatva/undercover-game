import { StyleSheet, Text, View } from 'react-native';

import { type GameState, pointsForGame, type Winner } from '../game/logic';
import { Button, colors, Eyebrow, PopIn, ROLE_INFO, Screen, Title } from './kit';

const WINNER_TITLES: Record<Winner, string> = {
  civilians: 'Civilians win',
  infiltrators: 'The impostors win',
  mrwhite: 'Mr. White wins alone',
};

export function GameOverScreen({
  game,
  scores,
  onPlayAgain,
  onNewSession,
}: {
  game: GameState;
  scores: Record<string, number>;
  onPlayAgain: () => void;
  onNewSession: () => void;
}) {
  const earned = pointsForGame(game);
  const ranked = [...game.players].sort((a, b) => (scores[b.name] ?? 0) - (scores[a.name] ?? 0));

  return (
    <Screen
      footer={
        <>
          <Button label="Play again" onPress={onPlayAgain} />
          <Button label="New players, reset scores" variant="ghost" onPress={onNewSession} />
        </>
      }
    >
      <Eyebrow>Game over</Eyebrow>
      <PopIn>
        <Title>{game.winner ? WINNER_TITLES[game.winner] : 'Game over'}</Title>
      </PopIn>

      <View style={styles.words}>
        <View style={styles.wordBox}>
          <Text style={styles.wordLabel}>Civilian word</Text>
          <Text style={[styles.wordValue, { color: ROLE_INFO.civilian.color }]}>{game.civilianWord}</Text>
        </View>
        <View style={styles.wordBox}>
          <Text style={styles.wordLabel}>Undercover word</Text>
          <Text style={[styles.wordValue, { color: ROLE_INFO.undercover.color }]}>
            {game.undercoverWord}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        {ranked.map((p) => (
          <View key={p.id} style={styles.row}>
            <View style={styles.rowText}>
              <Text numberOfLines={1} style={styles.name}>
                {p.name}
              </Text>
              <Text style={[styles.role, { color: ROLE_INFO[p.role].color }]}>
                {ROLE_INFO[p.role].label}
              </Text>
            </View>
            {earned[p.id] > 0 ? <Text style={styles.earned}>{`+${earned[p.id]}`}</Text> : null}
            <Text style={styles.total}>{scores[p.name] ?? 0}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  words: { flexDirection: 'row', gap: 10, marginTop: 8 },
  wordBox: { backgroundColor: colors.surface, borderRadius: 14, flex: 1, gap: 4, padding: 14 },
  wordLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  wordValue: { fontSize: 20, fontWeight: '800' },
  table: { backgroundColor: colors.surface, borderRadius: 14, marginTop: 4, paddingHorizontal: 14 },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
  },
  rowText: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  role: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  earned: { color: colors.success, fontSize: 15, fontVariant: ['tabular-nums'], fontWeight: '700' },
  total: {
    color: colors.text,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    minWidth: 34,
    textAlign: 'right',
  },
});
