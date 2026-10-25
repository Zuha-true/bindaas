import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, usePreventRemove } from 'expo-router';
import { Body, Button, Card, Field, Heading, Screen } from './ui';
import { colors, type } from '../theme/tokens';
import { readProfile, saveProfile } from '../services/profile';
import { validateProfile, type ProfileFields } from '../services/profileValidation';
import { useCopy } from '../skins/context';

const blank: ProfileFields = { name: '', phone: '', email: '', photoUri: null };

export default function EditProfileScreen() {
  const copy = useCopy();
  const [fields, setFields] = useState<ProfileFields>(blank);
  const [initial, setInitial] = useState<ProfileFields>(blank);
  const [loaded, setLoaded] = useState(false);
  const [allowLeave, setAllowLeave] = useState(false);
  const dirty = useMemo(() => loaded && (fields.name !== initial.name || fields.phone !== initial.phone || fields.email !== initial.email || fields.photoUri !== initial.photoUri), [fields, initial, loaded]);
  useEffect(() => { void readProfile().then(profile => { const value = profile ?? blank; setFields(value); setInitial(value); setLoaded(true); }); }, []);
  usePreventRemove(dirty && !allowLeave, ({ repeat }) => Alert.alert('Discard changes?', 'Your unsaved profile edits will be lost.', [
    { text: 'Keep editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: () => { setAllowLeave(true); requestAnimationFrame(repeat); } },
  ]));
  const update = (key: keyof ProfileFields, value: string | null) => setFields(current => ({ ...current, [key]: value }));
  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('Photo access needed', 'Allow photo library access to choose a profile picture.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]?.uri) update('photoUri', result.assets[0].uri);
    } catch { Alert.alert('Photo unavailable', 'A picture could not be selected on this device.'); }
  };
  const save = async () => {
    const error = validateProfile(fields);
    if (error) { Alert.alert('Check your details', error); return; }
    const value = { ...fields, name: fields.name.trim(), phone: fields.phone.trim(), email: fields.email.trim() };
    await saveProfile(value);
    setFields(value); setInitial(value); setAllowLeave(true);
    requestAnimationFrame(() => { if (router.canGoBack()) router.back(); else router.replace('/settings'); });
  };
  return <Screen>
    <Heading title={copy.editProfile} />
    <Card style={{ alignItems: 'center' }}>
      {fields.photoUri ? <Image source={{ uri: fields.photoUri }} style={{ width: 104, height: 104, borderRadius: 52 }} /> : <Text style={{ width: 104, height: 104, borderRadius: 52, textAlign: 'center', textAlignVertical: 'center', backgroundColor: colors.pink100, color: colors.ink, fontSize: 36 }}>＋</Text>}
      <Button title="Choose photo" variant="line" onPress={() => void pickPhoto()} />
      {fields.photoUri && <Button title="Remove photo" variant="line" onPress={() => update('photoUri', null)} />}
    </Card>
    <Field label="Name" placeholder="Your name" value={fields.name} onChangeText={value => update('name', value)} />
    <Field label="Phone" placeholder="+919876543210" keyboardType="phone-pad" value={fields.phone} onChangeText={value => update('phone', value)} />
    <Field label="Email (optional)" placeholder="you@example.com" keyboardType="email-address" value={fields.email} onChangeText={value => update('email', value)} />
    <Body style={{ fontSize: 13 }}>{copy.profileFootnote}</Body>
    <Button title={copy.saveProfile} onPress={() => void save()} />
  </Screen>;
}
