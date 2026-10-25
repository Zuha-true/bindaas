import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

/** Code-drawn illustration so onboarding artwork scales cleanly on every phone. */
export function OnboardingIllustration({ step = 0 }: { step?: number }) {
  const accent = step === 1 ? colors.rose : colors.sos;
  return <View style={{ height: 260, borderRadius: 30, overflow: 'hidden', backgroundColor: colors.pink }}>
    <View style={{ position: 'absolute', width: 190, height: 190, borderRadius: 100, right: -10, top: -45, backgroundColor: '#FFDAD7' }} />
    <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 70, left: -25, bottom: -30, backgroundColor: '#FFDAD7' }} />
    <View style={{ position: 'absolute', left: '17%', top: 36, width: '68%', height: 176, backgroundColor: '#FFFDFC', borderRadius: 28, transform: [{ rotate: '-7deg' }], padding: 18 }}>
      <View style={{ height: 100, backgroundColor: '#FFF2F1', borderRadius: 18, overflow: 'hidden' }}>
        <Svg width="100%" height="100%" viewBox="0 0 240 110">
          <Path d={step === 0 ? 'M12 82 L50 82 L50 53 L112 53 L112 22 L218 22' : 'M12 78 L54 78 L54 42 L110 42 L110 70 L215 70'} fill="none" stroke="#E99595" strokeWidth="5" strokeDasharray="4 7" strokeLinecap="round" />
          <Path d={step === 0 ? 'M12 82 L50 82 L50 53 L112 53 L112 22 L218 22' : 'M12 78 L54 78 L54 42 L110 42 L110 70 L215 70'} fill="none" stroke={colors.ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="12" cy={step === 0 ? 82 : 78} r="7" fill={colors.pink} stroke={colors.ink} strokeWidth="4" />
          <Circle cx="218" cy={step === 0 ? 22 : 70} r="9" fill={accent} />
        </Svg>
      </View>
      <View style={{ height: 12, width: '64%', borderRadius: 8, backgroundColor: colors.ink, marginTop: 14 }} />
      <View style={{ height: 9, width: '85%', borderRadius: 8, backgroundColor: '#F8BDBB', marginTop: 9 }} />
      <View style={{ height: 9, width: '52%', borderRadius: 8, backgroundColor: '#FFE1DF', marginTop: 8 }} />
    </View>
    <View style={{ position: 'absolute', left: 14, top: 33, backgroundColor: colors.ink, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, transform: [{ rotate: '7deg' }] }}>
      <Text style={{ color: colors.pink, fontWeight: '700', fontSize: 12 }}>{step === 1 ? 'SOS' : step === 2 ? 'SAFE' : '12 × 3'}</Text>
      <Text style={{ color: colors.white, fontWeight: '700', fontSize: 17 }}>{step === 1 ? 'Circle' : step === 2 ? 'In control' : '36'}</Text>
    </View>
    <View style={{ position: 'absolute', right: 32, bottom: 45, backgroundColor: colors.ink, width: 48, height: 48, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.pink, fontSize: 28, fontWeight: '700' }}>✓</Text></View>
  </View>;
}
