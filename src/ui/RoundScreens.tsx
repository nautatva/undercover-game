import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { GameState, Player } from '../game/logic';
import { Body, Button, colors, Eyebrow, PopIn, ROLE_INFO, Screen, Title } from './kit';

export function DiscussScreen({
  game,
  onVote,
  onQuit,
}: {
  game: GameState;
  onVote: () => void;
  onQuit: () => void;
}) {
  const byId = new Map(game.players.map((p) => [p.id, p]));
  const out = game.players.filter((p) => !p.alive);

  function confirmQuit() {
    Alert.alert('Quit this game?', 'The roles and words will be lost and no points are awarded.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: onQuit },
    ]);
  }

  return (
    <Screen
      footer={
        <>
          <Button label="Everyone has spoken: vote" onPress={onVote} />
          <Button label="Quit game" variant="ghost" onPress={confirmQuit} />
        </>
      }
    >
      <Eyebrow>{`Round ${game.round}`}</Eyebrow>
      <Title>Describe your word</Title>
      <Body>In order, each player says one word or short phrase about their secret word.</Body>
      <View style={styles.list}>
        {game.speakingOrder.map((id, index) => (
          <View key={id} style={styles.row}>
            <Text style={styles.rowNumber}>{index + 1}</Text>
            <Text style={styles.rowName}>{byId.get(id)?.name}</Text>
          </View>
        ))}
      </View>
      {out.length > 0 ? (
        <View style={styles.outBlock}>
          <Text style={styles.sectionLabel}>Out</Text>
          {out.map((p) => (
            <Text key={p.id} style={styles.outName}>
              {p.name} · <Text style={{ color: ROLE_INFO[p.role].color }}>{ROLE_INFO[p.role].label}</Text>
            </Text>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

export function VoteScreen({
  game,
  onEliminate,
  onBack,
}: {
  game: GameState;
  onEliminate: (playerId: number) => void;
  onBack: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const alive = game.players.filter((p) => p.alive);
  const selected = alive.find((p) => p.id === selectedId);

  return (
    <Screen
      footer={
        <>
          <Button
            label={selected ? `Eliminate ${selected.name}` : 'Choose a player'}
            variant="danger"
            disabled={!selected}
            onPress={() => {
              if (selected) onEliminate(selected.id);
            }}
          />
          <Button label="Back to the discussion" variant="ghost" onPress={onBack} />
        </>
      }
    >
      <Eyebrow>{`Round ${game.round}`}</Eyebrow>
      <Title>Who is out?</Title>
      <Body>Point on the count of three, then pick whoever got the most votes.</Body>
      <View style={styles.grid}>
        {alive.map((p) => {
          const isSelected = p.id === selectedId;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                void Haptics.selectionAsync();
                setSelectedId(p.id);
              }}
              style={[styles.voteCell, isSelected && styles.voteCellSelected]}
            >
              <Text numberOfLines={1} style={[styles.voteName, isSelected && styles.voteNameSelected]}>
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

export function EliminatedScreen({ player, onContinue }: { player: Player; onContinue: () => void }) {
  const info = ROLE_INFO[player.role];
  return (
    <Screen footer={<Button label="Continue" onPress={onContinue} />}>
      <Eyebrow>Eliminated</Eyebrow>
      <View style={styles.center}>
        <PopIn>
          <View style={[styles.verdict, { borderColor: info.color }]}>
            <Text style={styles.verdictName}>{player.name}</Text>
            <Text style={styles.verdictWas}>was</Text>
            <Text style={[styles.verdictRole, { color: info.color }]}>{info.label}</Text>
          </View>
        </PopIn>
      </View>
    </Screen>
  );
}

export function MrWhiteGuessScreen({
  player,
  onGuess,
}: {
  player: Player;
  onGuess: (guess: string) => void;
}) {
  const [guess, setGuess] = useState('');
  const canSubmit = guess.trim().length > 0;
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <Screen
        footer={<Button label="Lock in the guess" disabled={!canSubmit} onPress={() => onGuess(guess)} />}
      >
        <Eyebrow>Mr. White is caught</Eyebrow>
        <Title>{`${player.name}, last chance`}</Title>
        <Body>Guess the civilians’ word. Get it right and you win the game all by yourself.</Body>
        <TextInput
          accessibilityLabel="Your guess"
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          onChangeText={setGuess}
          onSubmitEditing={() => {
            if (canSubmit) onGuess(guess);
          }}
          placeholder="Your guess"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          style={styles.input}
          value={guess}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
  list: { gap: 8, marginTop: 8 },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  rowNumber: {
    color: colors.accent,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    minWidth: 22,
  },
  rowName: { color: colors.text, flex: 1, fontSize: 17, fontWeight: '600' },
  outBlock: { gap: 4, marginTop: 12 },
  sectionLabel: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  outName: { color: colors.muted, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  voteCell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1.5,
    flexBasis: '47%',
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: 10,
  },
  voteCellSelected: { backgroundColor: colors.danger, borderColor: colors.danger },
  voteName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  voteNameSelected: { color: '#FFFFFF' },
  verdict: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 44,
  },
  verdictName: { color: colors.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  verdictWas: { color: colors.muted, fontSize: 16 },
  verdictRole: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 20,
    marginTop: 8,
    minHeight: 56,
    paddingHorizontal: 14,
  },
});
