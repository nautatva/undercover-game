import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Player } from '../game/logic';
import { Body, Button, colors, Eyebrow, PopIn, ROLE_INFO, Screen, Title } from './kit';

/**
 * Civilians and Undercovers only ever see a word, never a role: not knowing which
 * side you are on is the heart of the game. Only Mr. White is told who they are.
 */
export function RevealScreen({
  player,
  position,
  total,
  onDone,
}: {
  player: Player;
  position: number;
  total: number;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(false);
  const isLast = position === total;

  if (!shown) {
    return (
      <Screen
        footer={
          <Button
            label="Show my word"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShown(true);
            }}
          />
        }
      >
        <Eyebrow>{`Player ${position} of ${total}`}</Eyebrow>
        <View style={styles.center}>
          <Body>Pass the phone to</Body>
          <Title>{player.name}</Title>
          <Body>Make sure nobody else can see the screen.</Body>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={<Button label={isLast ? 'Hide and start' : 'Hide and pass on'} onPress={onDone} />}
    >
      <Eyebrow>{player.name}</Eyebrow>
      <View style={styles.center}>
        <PopIn>
          {player.word ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Your secret word</Text>
              <Text adjustsFontSizeToFit numberOfLines={2} style={styles.word}>
                {player.word}
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>You are</Text>
              <Text style={[styles.word, { color: ROLE_INFO.mrwhite.color }]}>Mr. White</Text>
              <Text style={styles.cardHint}>
                You have no word. Listen closely and bluff. If you are caught, one correct guess of
                the civilians’ word still wins you the game.
              </Text>
            </View>
          )}
        </PopIn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'stretch', gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 44,
    alignItems: 'center',
  },
  cardLabel: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  word: { color: colors.text, fontSize: 44, fontWeight: '800', textAlign: 'center' },
  cardHint: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
