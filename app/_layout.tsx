import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../theme/tokens';
export default function RootLayout() {
  const [loaded] = useFonts({ DMSerifDisplay_400Regular, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold });
  if (!loaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink50 }}><ActivityIndicator color={colors.ink} /></View>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.pink50 }, animation: 'slide_from_right' }} />;
}
