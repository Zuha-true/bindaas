import React, { PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Href, router } from 'expo-router';
import { ArrowLeft, Calculator, ChevronRight, Heart, Home, Map, Phone, ShieldCheck, Siren, Users, Wrench } from 'lucide-react-native';
import { colors, radii, shadow, type } from '../theme/tokens';
import { ROUTES, AppRoute } from '../constants/routes';
import { triggerSOS } from '../services/sos';

export function Screen({ children, dark = false, scroll = true, backgroundColor }: PropsWithChildren<{ dark?: boolean; scroll?: boolean; backgroundColor?: string }>) {
  const override = backgroundColor ? { backgroundColor } : undefined;
  const body = <View style={[styles.content, dark && styles.dark, override]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.safe, dark && styles.dark, override]} edges={['top', 'bottom']}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{body}</ScrollView> : body}
    </SafeAreaView>
  );
}

export function Heading({ title, back = true, right }: { title: string; back?: boolean; right?: ReactNode }) {
  return (
    <View style={styles.heading}>
      {back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><ArrowLeft color={colors.ink} size={21} /></Pressable>}
      <Text style={styles.h1}>{title}</Text>{right}
    </View>
  );
}

export function Button({ title, onPress, variant = 'ink', small = false, disabled = false }: {
  title: string; onPress?: () => void; variant?: 'ink' | 'pink' | 'line' | 'sos'; small?: boolean; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, styles[`button_${variant}`], small && styles.buttonSmall, disabled && styles.disabled]}>
      <Text style={[
        styles.buttonText,
        variant === 'line' && styles.buttonLineText,
        variant === 'pink' && styles.buttonPinkText,
        variant === 'sos' && styles.buttonSosText,
      ]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }: PropsWithChildren) { return <Text style={styles.label}>{children}</Text>; }
export function Body({ children, style, ...textProps }: PropsWithChildren<{ style?: StyleProp<TextStyle> } & Pick<React.ComponentProps<typeof Text>, 'accessibilityLiveRegion'>>) { return <Text {...textProps} style={[styles.body, style]}>{children}</Text>; }

export function Field({ label, placeholder, secureTextEntry = false, value, onChangeText, keyboardType = 'default', rightIcon, multiline = false, onSubmitEditing, returnKeyType }: {
  label?: string; placeholder: string; secureTextEntry?: boolean; value?: string; onChangeText?: (text: string) => void;
  keyboardType?: TextInputProps['keyboardType']; rightIcon?: ReactNode; multiline?: boolean;
  onSubmitEditing?: TextInputProps['onSubmitEditing']; returnKeyType?: TextInputProps['returnKeyType'];
}) {
  return (
    <View style={styles.fieldGroup}>
      {label && <Label>{label}</Label>}
      <View style={[styles.field, multiline && styles.multilineField]}>
        <TextInput accessibilityLabel={label || placeholder} style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry}
          value={value} onChangeText={onChangeText} keyboardType={keyboardType} multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'} onSubmitEditing={onSubmitEditing} returnKeyType={returnKeyType} />
        {rightIcon}
      </View>
    </View>
  );
}

export function Toggle({ label, initial = false, value, onValueChange, disabled = false }: {
  label: string; initial?: boolean; value?: boolean; onValueChange?: (value: boolean) => void; disabled?: boolean;
}) {
  const [internal, setInternal] = React.useState(initial);
  const on = value ?? internal;
  const change = () => {
    if (disabled) return;
    const next = !on;
    setInternal(next);
    onValueChange?.(next);
  };
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on, disabled }} onPress={change} style={styles.toggleRow}>
      <Text style={[styles.body, styles.toggleLabel]}>{label}</Text>
      <View pointerEvents="none" style={[styles.toggle, on && styles.toggleOn, disabled && styles.dimmed]}>
        <View style={[styles.knob, on && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

export function Chip({ children, active = false, onPress, accessibilityLabel }: PropsWithChildren<{ active?: boolean; onPress?: () => void; accessibilityLabel?: string }>) {
  return <Pressable accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={accessibilityLabel} onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
    <Text style={[styles.chipText, active && styles.chipTextOn]}>{children}</Text>
  </Pressable>;
}

const tabRoutes = [
  { name: 'Home', icon: Home, route: ROUTES.hub },
  { name: 'Route', icon: Map, route: ROUTES.route },
  { name: 'SOS', icon: Siren, route: null },
  { name: 'Tools', icon: Wrench, route: ROUTES.tools },
  { name: 'Circle', icon: Users, route: ROUTES.circle },
] as const;

export function TabBar({ active = 'Home' }: { active?: string }) {
  return <View style={styles.tabbar}>
    {tabRoutes.map(({ name, icon: Icon, route }) => <Pressable key={name}
      accessibilityRole="button" accessibilityLabel={name === 'SOS' ? 'Start SOS countdown' : `${name} tab`}
      onPress={() => route ? router.push(route) : triggerSOS('button')}
      style={[styles.tab, name === 'SOS' && styles.sosTabPressable]}>
      <View pointerEvents="none" style={[styles.tabIcon, name === active && styles.tabSelected, name === 'SOS' && styles.sosTab]}>
        <Icon color={name === 'SOS' ? colors.white : name === active ? colors.ink : colors.ink2} size={22} />
      </View>
      <Text pointerEvents="none" style={styles.tabText}>{name}</Text>
    </Pressable>)}
  </View>;
}

export function HeaderBand({ children }: PropsWithChildren) { return <View style={styles.headerBand}>{children}</View>; }

export function ScoreRing({ value, size = 86, showValue = true }: { value: number; size?: number; showValue?: boolean }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Svg pointerEvents="none" width={size} height={size} style={styles.ringSvg}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.pink100} strokeWidth={stroke} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.ink} strokeWidth={stroke}
        strokeDasharray={`${circumference * value / 100} ${circumference}`} strokeLinecap="round" fill="none" />
    </Svg>
    {showValue && <Text style={{ fontFamily: type.display, fontSize: size * 0.31, color: colors.ink }}>{value}</Text>}
  </View>;
}

export function MapPlaceholder({ position }: { position?: { latitude: number; longitude: number } | null }) {
  const markerX = position ? Math.max(35, Math.min(325, 180 + (position.longitude - 77.59) * 700)) : 180;
  const markerY = position ? Math.max(28, Math.min(260, 145 - (position.latitude - 12.97) * 700)) : 145;
  return <View style={styles.map}>
    <Svg width="100%" height="100%" viewBox="0 0 360 290">
      <Polyline points="-15,65 45,90 90,35 140,60 190,20 225,75 270,52 380,90" fill="none" stroke={colors.mapRoad} strokeWidth="14" />
      <Polyline points="10,250 70,205 115,225 160,180 220,197 270,155 350,175" fill="none" stroke={colors.mapRoad} strokeWidth="12" />
      <Polyline points="40,0 65,80 110,124 175,112 225,150 280,190 330,275" fill="none" stroke={colors.white} strokeWidth="17" />
      <Polyline points="40,0 65,80 110,124 175,112 225,150 280,190 330,275" fill="none" stroke={colors.ink} strokeWidth="6" strokeLinecap="round" />
      <Polyline points="22,18 82,105 105,154 210,183 256,230 315,275" fill="none" stroke={colors.rose} strokeWidth="3" strokeDasharray="8 8" />
      <Polyline points="-5,125 55,145 120,155 172,210 228,225 310,250 370,230" fill="none" stroke={colors.ink2} strokeWidth="3" strokeDasharray="4 8" />
      <Circle cx={markerX} cy={markerY} r="11" fill={colors.white} stroke={colors.ink} strokeWidth="4" />
      <Circle cx={markerX} cy={markerY} r="5" fill={colors.sos} />
      <Circle cx="40" cy="0" r="10" fill={colors.white} stroke={colors.ink} strokeWidth="4" />
      <Circle cx="330" cy="275" r="12" fill={colors.sos} />
    </Svg>
    <View pointerEvents="none" style={styles.mapCredit}><Text style={styles.mapLabel}>A</Text><Text style={styles.mapLabel}>B</Text></View>
  </View>;
}

const tileRoutes: Record<string, AppRoute> = {
  'Route finder': ROUTES.route,
  'Safety timer': ROUTES.timer,
  'Simulated call': ROUTES.fakeCall,
  'Share location': ROUTES.live,
  'Account check': ROUTES.accountCheck,
  'Privacy audit': ROUTES.privacy,
};

export function Tile({ title, description, icon = 'shield' }: { title: string; description: string; icon?: string }) {
  const Icon = icon === 'route' ? Map : icon === 'call' ? Phone : icon === 'circle' ? Users : icon === 'calculator' ? Calculator : icon === 'heart' ? Heart : ShieldCheck;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}: ${description}`} style={styles.tile} onPress={() => router.push((tileRoutes[title] ?? ROUTES.circle) as Href)}>
    <View pointerEvents="none" style={styles.tileIcon}><Icon color={colors.ink} size={22} /></View>
    <Text pointerEvents="none" style={styles.tileTitle}>{title}</Text>
    <Text pointerEvents="none" style={styles.tileDescription}>{description}</Text>
    <ChevronRight pointerEvents="none" size={17} color={colors.ink2} style={styles.tileChevron} />
  </Pressable>;
}

export function Title({ children }: PropsWithChildren) { return <Text style={styles.h2}>{children}</Text>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pink50 }, dark: { backgroundColor: colors.ink }, scroll: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: type.display, fontSize: 30, color: colors.ink, flex: 1 }, h2: { fontFamily: type.display, fontSize: 24, color: colors.ink },
  body: { fontFamily: type.ui, fontSize: 15, lineHeight: 22, color: colors.ink2 }, label: { fontFamily: type.semibold, fontSize: 13, color: colors.ink2 },
  button: { minHeight: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  buttonSmall: { minHeight: 44, paddingHorizontal: 16 }, button_ink: { backgroundColor: colors.ink }, button_pink: { backgroundColor: colors.pink },
  button_line: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.ink }, button_sos: { backgroundColor: colors.sos },
  buttonText: { fontFamily: type.bold, fontSize: 16, color: colors.pink },
  buttonLineText: { color: colors.ink }, buttonPinkText: { color: colors.ink },
  buttonSosText: { color: colors.white }, disabled: { opacity: 0.45 },
  card: { backgroundColor: colors.white, borderRadius: radii.card, padding: 18, gap: 14, ...shadow },
  fieldGroup: { gap: 7 }, field: { minHeight: 56, borderRadius: radii.input, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  multilineField: { minHeight: 108, alignItems: 'flex-start', paddingVertical: 12 }, input: { flex: 1, color: colors.ink, fontFamily: type.ui, fontSize: 15, paddingVertical: 0 }, multilineInput: { minHeight: 80 },
  toggleRow: { minHeight: 52, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  toggleLabel: { flex: 1, flexShrink: 1 },
  toggle: { width: 52, height: 32, flexShrink: 0, borderWidth: 2, borderColor: colors.ink2, borderRadius: 20, justifyContent: 'center', padding: 3, backgroundColor: colors.white },
  toggleOn: { backgroundColor: colors.ink, borderColor: colors.ink, alignItems: 'flex-end' }, knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink2 },
  knobOn: { backgroundColor: colors.pink }, dimmed: { opacity: 0.5 }, chip: { borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: colors.pink100, minHeight: 40, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.ink }, chipText: { fontFamily: type.semibold, color: colors.ink2, fontSize: 13 }, chipTextOn: { color: colors.pink },
  tabbar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: colors.white, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 6, ...shadow },
  tab: { alignItems: 'center', gap: 1, minWidth: 55 }, tabIcon: { width: 38, height: 36, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: colors.pink100 }, sosTabPressable: { zIndex: 2, elevation: 8 },
  sosTab: { backgroundColor: colors.sos, width: 56, height: 56, marginTop: -24, borderWidth: 4, borderColor: colors.pink50, zIndex: 2, elevation: 8 },
  tabText: { fontFamily: type.medium, fontSize: 10, color: colors.ink2 }, headerBand: { backgroundColor: colors.pink, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30, marginHorizontal: -20, marginTop: -14 },
  map: { height: 245, borderRadius: 26, overflow: 'hidden', backgroundColor: colors.mapSurface, position: 'relative' },
  mapCredit: { position: 'absolute', left: 14, right: 14, top: 12, flexDirection: 'row', justifyContent: 'space-between' }, mapLabel: { backgroundColor: colors.white, color: colors.ink, fontFamily: type.bold, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  tile: { backgroundColor: colors.white, borderRadius: radii.tile, padding: 16, minHeight: 150, width: '48%', gap: 8, ...shadow },
  tileIcon: { backgroundColor: colors.pink100, borderRadius: 99, width: 43, height: 43, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: type.bold, fontSize: 15, color: colors.ink, paddingRight: 12 }, tileDescription: { fontFamily: type.ui, fontSize: 12, lineHeight: 16, color: colors.ink2 },
  tileChevron: { position: 'absolute', right: 13, top: 14 }, ringSvg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
});
