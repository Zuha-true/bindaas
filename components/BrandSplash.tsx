import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Screen } from './ui';
import { colors, type } from '../theme/tokens';
import { ROUTES } from '../constants/routes';
import { IMAGES } from '../constants/assets';

export function BrandSplash({ cta = true }: { cta?: boolean } = {}) {
  const intro = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const breathing = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    breathing.start();
    return () => breathing.stop();
  }, [glow, intro]);

  const logoStyle = {
    opacity: intro,
    transform: [
      { scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
      { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
    ],
  };
  const glowStyle = {
    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.4] }),
    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.14] }) }],
  };
  const fadeStyle = { opacity: intro };

  return <Screen dark>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 64, overflow: 'hidden' }}>
      <View pointerEvents="none" style={{ position: 'absolute', width: 370, height: 370, borderRadius: 200, borderWidth: 1, borderColor: colors.splashRim, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 290, height: 290, borderRadius: 150, borderWidth: 1, borderColor: colors.splashRim, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 250, height: 250, borderRadius: 125, backgroundColor: colors.ink3, opacity: 0.55 }} />
        </View>
      </View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: colors.pink }, glowStyle]} />
      <Animated.View style={logoStyle}>
        <Image source={IMAGES.logo} style={{ width: 300, height: 251 }} resizeMode="contain" accessibilityLabel="Bindaas logo" />
      </Animated.View>
      <Animated.Text style={[{ fontFamily: type.ui, fontSize: 16, color: colors.white }, fadeStyle]}>Fearless, on your own terms.</Animated.Text>
      {cta && <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 12, paddingHorizontal: 12 }, fadeStyle]}>
        <Button title="Get started" variant="pink" onPress={() => router.push(ROUTES.onboarding)} />
      </Animated.View>}
    </View>
  </Screen>;
}
