import React from 'react';
import { View } from 'react-native';
import { useSegments } from 'expo-router';
import { TabBar } from './ui';
import { colors } from '../theme/tokens';

export default function PersistentNav() {
  const segments = useSegments();
  const current = segments.join('/');
  const hidden = !current || ['splash', 'onboarding', 'signup', 'settings', 'calculator', 'cooking', 'tadka', 'feed', 'recipe', 'pantry', 'box'].some(name => current.includes(name));
  if (hidden) return null;
  const active = current.includes('circle') ? 'Circle' : current.includes('tools') ? 'Tools' : current.includes('route') ? 'Route' : current.includes('hub') ? 'Home' : undefined;
  return <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: 8, zIndex: 20 }}><View style={{ backgroundColor: colors.pink50, borderRadius: 999, padding: 2 }}><TabBar active={active} /></View></View>;
}
