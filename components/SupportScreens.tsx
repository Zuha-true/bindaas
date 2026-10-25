import { Alert, Linking, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, ArrowLeft } from 'lucide-react-native';
import { Body, Card, Screen } from './ui';
import { colors, radii, shadow, type } from '../theme/tokens';
import { ROUTES } from '../constants/routes';
import { lastChecked, supportCopy, supportScenarios, type SupportLink, type SupportNumber, type SupportScenario } from '../data/support';

function call(number: SupportNumber) {
  void Linking.openURL(`tel:${number.number}`).catch(() => Alert.alert(supportCopy.callUnavailable));
}

function NumberRow({ item }: { item: SupportNumber }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.label}, ${item.number}. Tap to call; long press to copy.`} accessibilityHint={supportCopy.copyNumber} onPress={() => call(item)} onLongPress={() => { void Clipboard.setStringAsync(item.number).then(() => Alert.alert(supportCopy.copied)); }} style={{ minHeight: 56, backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.ink, fontFamily: type.semibold, fontSize: 15 }}>{item.label}</Text>{!item.verified && <Text style={{ color: colors.warn, fontFamily: type.medium, fontSize: 11 }}>{supportCopy.checkNumber}</Text>}</View>
    <View style={{ alignItems: 'flex-end', gap: 2 }}><Text style={{ color: colors.ink, fontFamily: type.bold, fontSize: 17 }}>{item.number}</Text><Text style={{ color: colors.ink2, fontFamily: type.ui, fontSize: 10 }}>{supportCopy.copyNumber}</Text></View>
  </Pressable>;
}

function LinkRow({ item }: { item: SupportLink }) {
  return <Pressable accessibilityRole="link" accessibilityLabel={`${item.label}${item.verified ? '' : `, ${supportCopy.checkLink}`}`} onPress={() => void Linking.openURL(item.url).catch(() => Alert.alert(supportCopy.supportLinkUnavailable))} style={{ minHeight: 50, backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.ink, fontFamily: type.medium, fontSize: 14 }}>{item.label}</Text>{item.description && <Text style={{ color: colors.ink2, fontFamily: type.ui, fontSize: 12, lineHeight: 17 }}>{item.description}</Text>}</View>
    <View style={{ alignItems: 'flex-end' }}>{!item.verified && <Text style={{ color: colors.warn, fontFamily: type.medium, fontSize: 11 }}>{supportCopy.checkLink}</Text>}<Text style={{ color: colors.ink2, fontSize: 12 }}>{item.url.replace(/^https:\/\//, '')}</Text></View>
  </Pressable>;
}

function EmergencyCard() {
  const emergency = supportScenarios.find(scenario => scenario.id === 'immediate-danger')?.numbers.find(item => item.id === '112');
  if (!emergency) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${supportCopy.emergencyIntro} ${supportCopy.emergencyButton} ${emergency.number}`} accessibilityHint={supportCopy.copyNumber} onPress={() => call(emergency)} onLongPress={() => { void Clipboard.setStringAsync(emergency.number).then(() => Alert.alert(supportCopy.copied)); }} style={{ minHeight: 72, borderRadius: radii.card, backgroundColor: colors.ink, paddingHorizontal: 18, justifyContent: 'center', gap: 4, ...shadow }}>
    <Text style={{ color: colors.white, fontFamily: type.semibold, fontSize: 14 }}>{supportCopy.emergencyIntro}</Text>
    <Text style={{ color: colors.white, fontFamily: type.bold, fontSize: 21 }}>{supportCopy.emergencyButton} · {emergency.number}</Text>
  </Pressable>;
}

export function SupportHomeScreen() {
  return <Screen><Text style={{ fontFamily: type.display, fontSize: 32, color: colors.ink }}>{supportCopy.title}</Text><EmergencyCard />
    {supportScenarios.map(scenario => <ScenarioCard key={scenario.id} scenario={scenario} />)}
    <Text style={{ color: colors.ink2, fontFamily: type.ui, fontSize: 12, textAlign: 'center' }}>{supportCopy.lastCheckedPrefix} {lastChecked}.</Text>
  </Screen>;
}

function ScenarioCard({ scenario }: { scenario: SupportScenario }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${scenario.title} support guide`} onPress={() => router.push({ pathname: ROUTES.supportScenario as any, params: { scenario: scenario.id } })} style={{ minHeight: 56, backgroundColor: colors.white, borderRadius: radii.card, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadow }}>
    <Text style={{ flex: 1, color: colors.ink, fontFamily: type.semibold, fontSize: 16 }}>{scenario.title}</Text><ChevronRight size={20} color={colors.ink2} />
  </Pressable>;
}

export function SupportScenarioScreen() {
  const params = useLocalSearchParams<{ scenario?: string }>();
  const scenario = supportScenarios.find(item => item.id === params.scenario);
  if (!scenario) return <Screen><Pressable accessibilityRole="button" accessibilityLabel={supportCopy.back} onPress={() => router.replace(ROUTES.support)}><Text style={{ color: colors.ink, fontFamily: type.semibold }}>{supportCopy.title}</Text></Pressable></Screen>;
  return <Screen>
    <Pressable accessibilityRole="button" accessibilityLabel={supportCopy.back} onPress={() => router.back()} style={{ height: 44, width: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={20} color={colors.ink} /></Pressable>
    <Text style={{ fontFamily: type.display, fontSize: 30, color: colors.ink }}>{scenario.title}</Text>
    <Card><Text style={{ fontFamily: type.semibold, fontSize: 17, color: colors.ink }}>{supportCopy.firstSteps}</Text>{scenario.firstSteps.map((step,index)=><View key={`${scenario.id}-step-${index}`} style={{ flexDirection: 'row', gap: 10 }}><Text style={{ color: colors.orange, fontFamily: type.bold }}>•</Text><Body style={{ flex: 1 }}>{step}</Body></View>)}</Card>
    {scenario.numbers.length > 0 && <View style={{ gap: 10 }}><Text style={{ fontFamily: type.semibold, fontSize: 19, color: colors.ink }}>{supportCopy.whoToCall}</Text>{scenario.numbers.map(item=><NumberRow key={`${scenario.id}-${item.id}`} item={item} />)}</View>}
    {scenario.links.length > 0 && <View style={{ gap: 10 }}><Text style={{ fontFamily: type.semibold, fontSize: 19, color: colors.ink }}>{supportCopy.usefulLinks}</Text>{scenario.links.map(item=><LinkRow key={`${scenario.id}-${item.id}`} item={item} />)}</View>}
    {scenario.appRoute === 'accountCheck' && <Pressable accessibilityRole="button" accessibilityLabel={supportCopy.accountCheckTitle} onPress={() => router.push(ROUTES.accountCheck)} style={actionStyle}><Text style={actionText}>{supportCopy.accountCheck}</Text></Pressable>}
    {scenario.appRoute === 'privacy' && <Pressable accessibilityRole="button" accessibilityLabel={supportCopy.privacyAuditTitle} onPress={() => router.push(ROUTES.privacy)} style={actionStyle}><Text style={actionText}>{supportCopy.privacyAudit}</Text></Pressable>}
    <Text style={{ color: colors.ink2, fontFamily: type.ui, fontSize: 12, textAlign: 'center' }}>{supportCopy.lastCheckedPrefix} {lastChecked}.</Text>
  </Screen>;
}

const actionStyle = { minHeight: 52, borderRadius: 999, backgroundColor: colors.ink, alignItems: 'center' as const, justifyContent: 'center' as const, paddingHorizontal: 20 };
const actionText = { color: colors.white, fontFamily: type.bold, fontSize: 15 };
