import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  defaultRoleCounts,
  isValidRoleCounts,
  MAX_PLAYERS,
  maxInfiltrators,
  MIN_PLAYERS,
  type RoleCounts,
} from '../game/logic';
import { Body, Button, colors, Eyebrow, Screen, Stepper, Title } from './kit';

function resolveNames(names: string[]): string[] {
  return names.map((name, i) => name.trim() || `Player ${i + 1}`);
}

function hasDuplicates(names: string[]): boolean {
  return new Set(names.map((n) => n.toLowerCase())).size !== names.length;
}

export function SetupScreen({
  initialNames,
  initialCounts,
  onStart,
}: {
  initialNames: string[];
  initialCounts: RoleCounts;
  onStart: (names: string[], counts: RoleCounts) => void;
}) {
  const [names, setNames] = useState(initialNames);
  const [counts, setCounts] = useState(initialCounts);

  const playerCount = names.length;
  const maxTotal = maxInfiltrators(playerCount);
  const civilians = playerCount - counts.undercover - counts.mrWhite;
  const resolved = resolveNames(names);
  const duplicate = hasDuplicates(resolved);

  function changePlayerCount(next: number) {
    setNames((current) =>
      next > current.length
        ? [...current, ...Array<string>(next - current.length).fill('')]
        : current.slice(0, next),
    );
    if (!isValidRoleCounts(next, counts)) setCounts(defaultRoleCounts(next));
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <Screen
        footer={
          <>
            {duplicate ? <Text style={styles.error}>Each player needs a different name.</Text> : null}
            <Button
              label="Deal the words"
              disabled={duplicate}
              onPress={() => onStart(resolved, counts)}
            />
          </>
        }
      >
        <Eyebrow>Pass-and-play party game</Eyebrow>
        <Title>Undercover</Title>
        <Body>
          Everyone gets a secret word, but a few got a different one. Describe yours without giving
          it away, then vote out the impostors.
        </Body>

        <View style={styles.card}>
          <Stepper
            label="Players"
            value={playerCount}
            min={MIN_PLAYERS}
            max={MAX_PLAYERS}
            onChange={changePlayerCount}
          />
          <View style={styles.divider} />
          <Stepper
            label="Undercover"
            hint="A similar, different word"
            value={counts.undercover}
            min={counts.mrWhite === 0 ? 1 : 0}
            max={maxTotal - counts.mrWhite}
            onChange={(undercover) => setCounts({ ...counts, undercover })}
          />
          <Stepper
            label="Mr. White"
            hint="No word at all"
            value={counts.mrWhite}
            min={counts.undercover === 0 ? 1 : 0}
            max={maxTotal - counts.undercover}
            onChange={(mrWhite) => setCounts({ ...counts, mrWhite })}
          />
          <Text style={styles.summary}>
            {civilians} civilians share a word
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Names</Text>
        {names.map((name, i) => (
          <TextInput
            key={i}
            accessibilityLabel={`Name of player ${i + 1}`}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={16}
            onChangeText={(text) =>
              setNames((current) => current.map((n, index) => (index === i ? text : n)))
            }
            placeholder={`Player ${i + 1}`}
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            style={styles.input}
            value={name}
          />
        ))}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 8, marginTop: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  summary: { color: colors.muted, fontSize: 14, marginTop: 2 },
  sectionLabel: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 10 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    color: colors.text,
    fontSize: 17,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  error: { color: colors.danger, fontSize: 15, textAlign: 'center' },
});
