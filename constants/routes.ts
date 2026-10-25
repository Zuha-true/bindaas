import type { Href } from 'expo-router';

export const ROUTES = {
  onboarding: '/onboarding',
  signup: '/signup',
  hub: '/(tabs)/hub',
  route: '/route',
  circle: '/(tabs)/circle',
  tools: '/(tabs)/tools',
  calculator: '/calculator',
  sos: '/sos',
  sosCountdown: '/sos-countdown' as Href,
  live: '/live',
  routeBreakdown: '/route-breakdown',
  timer: '/timer',
  fakeCall: '/fake-call',
  incomingCall: '/incoming-call',
  accountCheck: '/account-check',
  scanResult: '/scan-result',
  report: '/report',
  evidence: '/evidence',
  privacy: '/privacy',
  areYouOk: '/are-you-ok',
  settings: '/settings',
  cooking: '/cooking',
} as const satisfies Record<string, Href>;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
