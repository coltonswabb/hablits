// ============================================
// ERROR BOUNDARY
// ============================================
// Catches any render error below it so a bug in one screen shows a
// friendly recovery card instead of a blank white screen (which on a
// release build looks exactly like the app is broken forever).
//
// Deliberately styled with plain colors and no hooks: it sits OUTSIDE
// the Theme/App providers so it still works if a provider itself throws.
// User data is untouched — it lives in AsyncStorage, not in the tree.
// ============================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook a crash reporter (Sentry etc.) in here later
    console.error('Hablits crashed:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.face}>(ᵕ̣̣̣̣̣̣﹏ᵕ̣̣̣̣̣̣)</Text>
          <Text style={styles.title}>Your pet tripped over something</Text>
          <Text style={styles.body}>
            Something went wrong drawing this screen. Your habits and streaks are safe — tap below to try again.
          </Text>
          <Pressable style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
          {__DEV__ && (
            <ScrollView style={styles.debug}>
              <Text style={styles.debugText}>{String(this.state.error?.stack || this.state.error)}</Text>
            </ScrollView>
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111318',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1c1f27',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  face: {
    fontSize: 28,
    color: '#f5c76b',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#a7adbb',
    textAlign: 'center',
    marginBottom: 22,
  },
  button: {
    backgroundColor: '#3ddc97',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  buttonText: {
    color: '#0b1a12',
    fontWeight: '700',
    fontSize: 16,
  },
  debug: {
    marginTop: 20,
    maxHeight: 180,
    alignSelf: 'stretch',
    backgroundColor: '#0d0f14',
    borderRadius: 10,
    padding: 10,
  },
  debugText: {
    color: '#ff8a8a',
    fontFamily: 'Courier',
    fontSize: 11,
  },
});
