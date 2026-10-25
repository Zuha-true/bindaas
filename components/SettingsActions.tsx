import { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Body, Button, Card } from './ui';
import { colors, radii, shadow, type } from '../theme/tokens';
import { ROUTES } from '../constants/routes';
import { useSkin } from '../skins/context';
import { supportCopy } from '../data/support';
import { eraseLocalData, logOutKeepingLocalData } from '../services/logout';

export function SettingsActions() {
  const { skin, copy, reset } = useSkin();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [supportExpanded, setSupportExpanded] = useState(false);
  const isTadka = skin === 'tadka';
  const logoutTitle = copy.logout;
  const navigateToLogin = () => { setSheetOpen(false); router.dismissAll(); requestAnimationFrame(() => router.replace(ROUTES.login)); };
  const logout = async (erase: boolean) => {
    if (erase) {
      const title = isTadka ? copy.logoutEraseTitle : supportCopy.eraseTitle;
      const message = isTadka ? copy.logoutEraseMessage : supportCopy.eraseMessage;
      Alert.alert(title, message, [
        { text: isTadka ? copy.logoutCancel : supportCopy.cancel, style: 'cancel' },
        { text: isTadka ? copy.logoutClear : supportCopy.confirmErase, onPress: () => { void eraseLocalData().then(() => { reset(); navigateToLogin(); }); } },
      ]);
      return;
    }
    await logOutKeepingLocalData();
    navigateToLogin();
  };
  return <>
    <Card style={{ paddingVertical: 4, gap: 0 }}>
      <SettingsActionRow title={copy.editProfile} onPress={() => router.push(ROUTES.editProfile)} />
      <SettingsActionRow title={copy.support} onPress={() => isTadka ? setSupportExpanded(value => !value) : router.push(ROUTES.support)} expanded={supportExpanded} />
      {isTadka && supportExpanded && <Pressable accessibilityRole="button" accessibilityLabel={copy.supportOpen} onPress={() => router.push(ROUTES.support)} style={{ minHeight: 48, paddingLeft: 18, justifyContent: 'center' }}><Text style={{ color: colors.ink2, fontFamily: type.medium, fontSize: 14 }}>{copy.supportOpen}　›</Text></Pressable>}
    </Card>
    <Button title={logoutTitle} variant="line" onPress={() => setSheetOpen(true)} />
    <Modal transparent visible={sheetOpen} animationType="slide" onRequestClose={() => setSheetOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View style={{ backgroundColor: colors.pink50, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 32, gap: 14, ...shadow }}>
          <Text style={{ color: colors.ink, fontFamily: type.display, fontSize: 26 }}>{logoutTitle}</Text>
          <Body style={{ fontSize: 13 }}>{isTadka ? copy.logoutNotice : supportCopy.logOutNotice}</Body>
          <Button title={logoutTitle} onPress={() => void logout(false)} />
          <Button title={isTadka ? copy.logoutErase : supportCopy.signOutErase} variant="line" onPress={() => void logout(true)} />
          <Button title={isTadka ? copy.logoutCancel : supportCopy.cancel} variant="line" onPress={() => setSheetOpen(false)} />
        </View>
      </View>
    </Modal>
  </>;
}

function SettingsActionRow({ title, onPress, expanded }: { title: string; onPress: () => void; expanded?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={expanded === undefined ? undefined : { expanded }} onPress={onPress} style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 4 }}>
    <Text style={{ color: colors.ink, fontFamily: type.medium, fontSize: 15 }}>{title}</Text><ChevronRight size={19} color={colors.ink2} />
  </Pressable>;
}
