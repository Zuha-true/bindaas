import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as SMS from 'expo-sms';
import { Body, Button, Card, Heading, Screen, ScoreRing, Title } from '../../components/ui';
import { colors, type } from '../../theme/tokens';
import { demoRoutes } from '../../data/demoRoute';
import { analyseRoute } from '../../services/route/score';
import { applySafetyScores } from '../../services/routeSafetyScoring';
import { useRouteSelection } from '../../state/routeStore';

export default function BreakdownScreen() {
  const selected = useRouteSelection();
  const route = selected || applySafetyScores([analyseRoute(demoRoutes[0], Date.now(), 'walk')])[0];
  const [expanded, setExpanded] = useState<string>();
  const share = async () => { if (await SMS.isAvailableAsync()) await SMS.sendSMSAsync([], `My Bindaas journey is ${route.durationMin} minutes. Activity estimate, not a safety rating. Please review and send this prepared message yourself.`); };
  return <Screen>
    <Heading title="Route breakdown" />
    <Card style={{ backgroundColor: colors.ink, alignItems: 'center' }}>
      <ScoreRing value={100 - (route.relativeConcern ?? 50)} size={112} />
      <Text accessibilityLabel={`relative route concern ${route.relativeConcern ?? 'unknown'} out of 100`} style={{ fontFamily: type.bold, fontSize: 17, color: colors.pink }}>Relative route concern: {route.relativeConcern ?? 'unknown'}/100</Text>
      <Text style={{ fontFamily: type.ui, fontSize: 12, color: colors.pink }}>Experimental estimate based on available data, not a safety rating.</Text>
      <Text style={{ fontFamily: type.ui, fontSize: 12, color: colors.pink }}>{route.durationMin} min · {(route.distanceM / 1000).toFixed(1)} km · {route.concernConfidence} data coverage</Text>
    </Card>
    <Card><Title>Why this route ranked here</Title>{(route.concernReasons || ['Insufficient data to compare reliably.']).map(reason => <Body key={reason} style={{ fontSize: 12 }}>• {reason}</Body>)}{(route.concernUnknowns || []).map(unknown => <Body key={unknown} style={{ fontSize: 12, color: colors.muted }}>Unknown: {unknown}</Body>)}</Card>
    <Card><Title>Activity strip</Title><View style={{ height: 20, flexDirection: 'row', gap: 2 }}>{Array.from({ length: 32 }, (_, i) => <View key={i} style={{ flex: 1, borderRadius: 3, backgroundColor: i % 5 === 0 ? colors.orange : colors.rose }} />)}</View><Body style={{ fontSize: 12 }}>The longest quiet stretch is {route.longestQuietM} m. Listed places may be missing or have outdated hours.</Body></Card>
    <Card><Title>Activity components</Title>{route.components.map((component, index) => <View key={component.key} style={{ gap: 5 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ flex: 1, fontFamily: type.semibold, color: colors.ink }}>{index + 1}. {component.label}</Text><Text style={{ fontFamily: type.bold, color: colors.ink }}>{component.available ? `${Math.round(component.earned)}/${component.max}` : 'n/a'}</Text></View><View style={{ height: 7, borderRadius: 4, backgroundColor: colors.pink100 }}><View style={{ height: 7, borderRadius: 4, backgroundColor: colors.ink, width: `${component.available ? Math.round(component.earned / component.max * 100) : 0}%` }} /></View><Text style={{ fontFamily: type.ui, fontSize: 12, color: colors.ink2 }}>{component.hint}</Text></View>)}</Card>
    <Card><Title>What we saw along the way</Title>{route.places.map(place => <View key={place.id}><Pressable accessibilityRole="button" accessibilityLabel={`${place.name}, ${place.status || 'unknown'}`} onPress={() => setExpanded(expanded === place.id ? undefined : place.id)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={{ fontFamily: type.semibold, color: colors.ink }}>{place.name}</Text><Text style={{ fontFamily: type.ui, fontSize: 12, color: place.status === 'open' ? colors.green : place.status === 'closing_soon' ? colors.orange : colors.muted }}>{place.status?.replace('_', ' ')}</Text></Pressable>{expanded === place.id && <Body style={{ fontSize: 12, paddingVertical: 8 }}>Weekly schedule: {place.openingHours || 'Hours not listed'}. Passing-time status: {place.status || 'unknown'}.</Body>}</View>)}</Card>
    <Button title="Start check-in timer" onPress={() => router.push(`/timer?minutes=${Math.ceil(route.durationMin * 1.25) + 5}` as never)} />
    <Button title="Share this route" variant="line" onPress={() => void share()} />
    <Button title="Back to route finder" variant="line" onPress={() => router.back()} />
  </Screen>;
}
