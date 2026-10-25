import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Body, Button, Card, Screen, Title } from './ui';
import { readProfile } from '../services/profile';
import { ROUTES } from '../constants/routes';
import { colors, type } from '../theme/tokens';
import { useCopy, useSkin } from '../skins/context';
import { readAppSettings } from '../services/appSettings';

export function LoginScreen() {
  const copy = useCopy();
  const { skin } = useSkin();
  const [name, setName] = useState('');
  useEffect(() => { void readProfile().then(profile => setName(profile?.name ?? '')); }, []);
  const continueOnPhone = async () => {
    if (!await readProfile()) { router.replace(ROUTES.signup); return; }
    await AsyncStorage.setItem('session:v1', 'active');
    const settings = await readAppSettings();
    router.replace(settings.disguise === 'cooking' ? ROUTES.tadka : settings.disguise === 'calculator' ? ROUTES.calculator : ROUTES.hub);
  };
  return <Screen backgroundColor={skin==='tadka'?'#FFF6EC':undefined}><Text style={{ fontFamily: type.display, fontSize: 34, color: skin==='tadka'?'#2B1D16':colors.ink }}>{copy.loginTitle}</Text><Card><Title>{name ? `Welcome back, ${name}` : 'Welcome back'}</Title><Body>This demo keeps your profile on this phone. It does not use an online account.</Body></Card><Button title={copy.loginContinue} onPress={() => void continueOnPhone()} /><Button title={copy.loginSetup} variant="line" onPress={() => router.replace(ROUTES.signup)} /></Screen>;
}
