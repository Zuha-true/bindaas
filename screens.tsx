import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, Linking, Modal, Pressable, Share, Text, TextInput, Vibration, View } from 'react-native';
import { Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { StatusBar } from 'expo-status-bar';
import { AudioModule, useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { Activity, Bell, Calculator as CalculatorIcon, Delete, Heart, Phone, RotateCcwClock, Search, ShieldCheck, Siren, Utensils, X } from 'lucide-react-native';
import { Button, Body, Card, Chip, Field, Heading, HeaderBand, Label, MapPlaceholder, ScoreRing, Screen, Tile, Title, Toggle } from './components/ui';
import { colors, shadow, type } from './theme/tokens';
import { ROUTES, AppRoute } from './constants/routes';
import { recipes, routes } from './data/mock';
import { readTrustedContacts, TrustedContact, writeTrustedContacts } from './services/contacts';
import { cancelSOS, getActiveSosSource, prepareSOSMessage, readSosLog, requestSOSCoordinates, SosLogEntry, triggerSOS } from './services/sos';
import { endTrip, isTripActive, setLocationReminderEnabled, startTrip } from './services/tripStore';
import { requestVoicePermissions } from './services/voicePermissions';
import { setShakeEnabled, setVoiceEnabled, useTriggerStatus } from './services/triggerPreferences';
import { cancelFakeCallNotification, DEFAULT_FAKE_CALL_SETTINGS, FakeCallSettings, readFakeCallSettings, scheduleFakeCall, writeFakeCallSettings } from './services/fakeCall';
import { ScriptLanguage, speakScript } from './services/speakScript';
import { loadNotifications } from './services/notificationRuntime';
import { isExpoGo } from './services/runtime';
import { OnboardingIllustration } from './components/OnboardingIllustration';
import { CHECKLIST_ITEMS, type AnalysisInput, type AnalysisResult, type ChecklistKey, type ChecklistValues, type Platform } from './services/lookalike';
import { createAccountCheck, deleteAccountCheck, readAccountChecks, readLatestAccountCheck, type SavedAccountCheck } from './services/accountChecks';
import { deleteEvidence, evidenceFromCheck, readEvidence, saveEvidence, verifyEvidence, type EvidenceNote } from './services/evidence';
import { readAppSettings, setDisguiseMode, writeAppSettings, type DisguiseMode } from './services/appSettings';
import { readProfile, saveProfile } from './services/profile';
import { validateProfile } from './services/profileValidation';
import { SettingsActions } from './components/SettingsActions';

const go=(path:AppRoute)=>router.push(path as Href);
const indicators = ['Similar name', 'Lookalike letters', 'Separator changed', 'New account', 'Few posts', 'Copied picture', 'Urgent tone'];
const txt=(size:number,color:string=colors.ink,font:string=type.ui)=>({fontSize:size,color,fontFamily:font});
export function SplashScreen({cta=true}:{cta?:boolean}={}){return <Screen dark><View style={{flex:1,alignItems:'center',justifyContent:'center',gap:16,paddingBottom:64,overflow:'hidden'}}><View pointerEvents="none" style={{position:'absolute',width:370,height:370,borderRadius:200,borderWidth:1,borderColor:colors.splashRim,alignItems:'center',justifyContent:'center'}}><View style={{width:290,height:290,borderRadius:150,borderWidth:1,borderColor:colors.splashRim,alignItems:'center',justifyContent:'center'}}><View style={{width:250,height:250,borderRadius:125,backgroundColor:colors.ink3,opacity:.55}}/></View></View><View style={{width:116,height:116,borderRadius:38,backgroundColor:colors.pink,alignItems:'center',justifyContent:'center'}}><ShieldCheck color={colors.ink} size={54}/></View><Text style={{fontFamily:type.display,fontSize:56,color:colors.pink}}>Bindaas</Text><Text style={{...txt(16,colors.white)}}>Fearless, on your own terms.</Text>{cta&&<View style={{position:'absolute',left:0,right:0,bottom:12,paddingHorizontal:12}}><Button title="Get started" variant="pink" onPress={()=>go(ROUTES.onboarding)}/></View>}</View></Screen>}
export function OnboardingScreen(){
  const [step,setStep]=useState(0);
  const pages=[
    {title:'Choose with more context.',body:'Compare sample routes by the places listed open when you pass. Estimates are not a safety rating.'},
    {title:'Keep your circle close.',body:'Save trusted contacts on this phone. Bindaas can prepare a message for the people you select.'},
    {title:'You stay in control.',body:'SOS opens a short cancellation window, then your messaging app opens a draft for you to review and send.'},
  ];
  return <Screen><HeaderBand><OnboardingIllustration step={step}/></HeaderBand><View style={{gap:14,paddingTop:14}}><Text style={{fontFamily:type.display,fontSize:34,lineHeight:40,color:colors.ink}}>{pages[step].title}</Text><Body>{pages[step].body}</Body><View accessibilityLabel={`Introduction page ${step+1} of ${pages.length}`} style={{flexDirection:'row',gap:7,justifyContent:'center',paddingVertical:10}}>{pages.map((_,index)=><View key={index} style={{width:index===step?24:8,height:8,borderRadius:8,backgroundColor:index===step?colors.ink:colors.pink}}/>)}</View><Button title={step===pages.length-1?'Create account':'Next'} onPress={()=>step===pages.length-1?go(ROUTES.signup):setStep(value=>value+1)}/><Pressable accessibilityRole="button" onPress={()=>step===pages.length-1?go(ROUTES.signup):setStep(pages.length-1)}><Text style={{textAlign:'center',...txt(14,colors.ink2,type.semibold)}}>{step===pages.length-1?'Continue as demo user':'Skip introduction'}</Text></Pressable></View></Screen>
}
export function SignupScreen(){
  const [name,setName]=useState(''); const [phone,setPhone]=useState('');
  const createAccount=async()=>{
    const profileError=validateProfile({name,phone,email:''});if(profileError){Alert.alert('Check your details',profileError);return;}
    if(!name.trim()||!/^\+?[\d\s()-]{7,}$/.test(phone.trim())){Alert.alert('Check your details','Enter your name and a valid phone number.');return;}
    await saveProfile({name:name.trim(),phone:phone.trim(),email:'',photoUri:null});
    await AsyncStorage.setItem('session:v1','active');
    router.replace(ROUTES.hub);
  };
  return <Screen><HeaderBand><Heading title="Create your account" back/><Text style={{fontFamily:type.display,fontSize:28,color:colors.ink,marginTop:26}}>A little about you</Text></HeaderBand><Field label="Name" placeholder="Your name" value={name} onChangeText={setName}/><Field label="Phone number" placeholder="+91" keyboardType="phone-pad" value={phone} onChangeText={setPhone}/><Body style={{fontSize:13}}>This local demo stores your profile on this phone only. It has no account authentication. SOS prepares a message for you to review; Bindaas cannot confirm delivery.</Body><Button title="Create local profile" onPress={()=>void createAccount()}/><Text style={{textAlign:'center',...txt(14,colors.ink2)}}>or</Text><Button title="Continue with Google" variant="line" onPress={()=>Alert.alert('Google sign-in unavailable','This demo has no connected sign-in provider. Create a local profile to continue.')}/><Pressable accessibilityRole="button" onPress={()=>void AsyncStorage.setItem('bindaas:profile:v1',JSON.stringify({name:'Demo user'})).then(()=>router.replace(ROUTES.hub))}><Text style={{textAlign:'center',...txt(14,colors.ink2,type.semibold)}}>Continue as demo user</Text></Pressable></Screen>
}
export function HubScreen() {
  const { shakeEnabled, voiceEnabled, voiceListening, voiceTier } = useTriggerStatus();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [profileName,setProfileName]=useState('Meera');
  useFocusEffect(useCallback(() => {
    void readTrustedContacts().then(setContacts);
    void readProfile().then(profile=>{if(profile?.name)setProfileName(profile.name.split(' ')[0]);});
  }, []));
  return <Screen>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View><Text style={txt(14, colors.ink2)}>Good evening</Text><Text style={{ fontFamily: type.display, fontSize: 30, color: colors.ink }}>Hi, {profileName}</Text></View>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Lock now" onPress={() => go(ROUTES.calculator)} style={{ backgroundColor: colors.white, paddingHorizontal: 16, borderRadius: 30, justifyContent: 'center', minHeight: 44 }}><Text style={txt(13, colors.ink, type.semibold)}>Lock now</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings and notifications" onPress={() => go(ROUTES.settings)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}><Bell color={colors.ink} size={21} /></Pressable>
      </View>
    </View>
    {shakeEnabled && <Chip>Shake detection on · Works while Bindaas is open</Chip>}
    {voiceEnabled && <Chip>{voiceListening ? `Listening · ${voiceTier ?? 'Starting'}` : 'Voice help enabled · Microphone unavailable'}</Chip>}
    <Pressable accessibilityRole="button" accessibilityLabel="Start SOS countdown" onPress={() => triggerSOS('button')} style={{ backgroundColor: colors.sos, borderRadius: 26, padding: 21, minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View pointerEvents="none" style={{ backgroundColor: colors.sosWash, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}><Siren color={colors.white} size={26} /></View>
      <View pointerEvents="none" style={{ flex: 1 }}><Text style={{ ...txt(25, colors.white, type.bold) }}>SOS</Text><Text style={{ ...txt(13, colors.white) }}>Prepare a message for {contacts.length} trusted {contacts.length === 1 ? 'contact' : 'contacts'}</Text></View>
    </Pressable>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      <Tile title="Route finder" description="Compare activity estimates" icon="route" />
      <Tile title="Safety timer" description="Keep a check-in time" icon="heart" />
      <Tile title="Simulated call" description="Set up an incoming call" icon="call" />
      <Tile title="Share location" description="Prepare a location snapshot" icon="route" />
      <Tile title="Account check" description="Review warning indicators" icon="shield" />
      <Tile title="Privacy audit" description="Review account exposure" icon="circle" />
    </View>
    <Text style={{ ...txt(12, colors.ink2), textAlign: 'center', paddingHorizontal: 10 }}>Location is used only when requested. No background tracking.</Text>
  </Screen>;
}
export function CalculatorScreen(){
  const [value,setValue]=useState('0');const [pin,setPin]=useState('2468');const [code,setCode]=useState('1122');const [calculationHistory,setCalculationHistory]=useState<string[]>([]);
  useEffect(()=>{AsyncStorage.multiGet(['unlock-pin:v1','sos-code:v1']).then(([p,c])=>{if(p[1])setPin(p[1]);if(c[1])setCode(c[1])})},[]);
  const add=(key:string)=>{
    if(key==='='){
      if(value===pin){go(ROUTES.hub);return}
      if(value===code){go(ROUTES.sos);return}
      const result=safeMath(value);
      if(result!==value)setCalculationHistory(items=>[`${value} = ${result}`,...items].slice(0,12));
      setValue(result);return;
    }
    if(key==='⌫'){setValue(current=>current==='Error'||current.length<=1?'0':current.slice(0,-1));return;}
    if(key==='±'){setValue(current=>{if(current==='Error')return '0';const match=current.match(/(-?\d*\.?\d+)$/);if(!match)return current==='0'?'-0':`${current}-`;const token=match[0];return current.slice(0,-token.length)+(token.startsWith('-')?token.slice(1):`-${token}`)});return;}
    if(key==='%'){setValue(current=>current==='Error'?'0':safeMath(`(${current})/100`));return;}
    setValue(current=>current==='0'||current==='Error'?key:current+key);
  };
  const keys=['C','×','÷','⌫','7','8','9','−','4','5','6','+','1','2','3','%','±','0','.','='];
  const operations=new Set(['×','÷','−','+','%']);
  const utility=new Set(['C','⌫']);
  return <Screen dark scroll={false} backgroundColor="#000"><StatusBar style="light"/><View style={{flex:1,paddingHorizontal:20,paddingTop:12,paddingBottom:22,backgroundColor:'#000'}}>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
      <Pressable accessibilityRole="button" accessibilityLabel="Calculation history" onPress={()=>Alert.alert('Calculation history',calculationHistory.length?calculationHistory.slice(0,8).join('\n'):'No calculations yet.')} style={{width:54,height:54,borderRadius:28,backgroundColor:'#29292B',alignItems:'center',justifyContent:'center'}}><RotateCcwClock size={29} color="#D8D8DA"/></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Clear current calculation" onPress={()=>setValue('0')} style={{width:54,height:54,borderRadius:28,backgroundColor:'#29292B',alignItems:'center',justifyContent:'center'}}><CalculatorIcon size={27} color="#D8D8DA"/></Pressable>
    </View>
    <View style={{flex:1,justifyContent:'flex-end',paddingBottom:22}}>
      <Text accessibilityLabel={`Calculator display ${value}`} numberOfLines={1} adjustsFontSizeToFit style={{fontFamily:type.ui,fontSize:54,color:'#F5F5F7',textAlign:'right',minHeight:72}}>{value==='0'?'':value}</Text>
    </View>
    <View style={{gap:10}}>{Array.from({length:5},(_,row)=><View key={row} style={{flexDirection:'row',gap:10}}>{keys.slice(row*4,row*4+4).map(key=>{
      const isEquals=key==='=';const isOperation=operations.has(key);const isUtility=utility.has(key);
      return <Pressable accessibilityRole="button" accessibilityLabel={key==='C'?'Clear':key==='⌫'?'Delete last digit':key==='='?'Calculate':key==='±'?'Change sign':key} key={key} onPress={()=>key==='C'?setValue('0'):add(key)} style={{flex:1,height:80,borderRadius:40,backgroundColor:isEquals?'#FF5F0A':isOperation||isUtility?'#4A4A4C':'#242426',alignItems:'center',justifyContent:'center'}}>
        {key==='⌫'?<Delete size={30} color="#F5F5F7"/>:<Text style={{fontFamily:type.ui,fontSize:key==='±'?31:34,color:'#F5F5F7'}}>{key}</Text>}
      </Pressable>;
    })}</View>)}</View>
  </View></Screen>
}
function safeMath(expr:string){try{const clean=expr.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replace(/[^0-9.+*/()%\-]/g,'');if(!clean||/[+*/.-]$/.test(clean))return expr;const tokens=clean.match(/\d+(?:\.\d+)?|[()+*/%-]/g)||[];let i=0;const primary=():number=>{const t=tokens[i++];if(t==='('){const n=sum();i++;return n}if(t==='-')return-primary();return Number(t)};const product=():number=>{let n=primary();while(['*','/','%'].includes(tokens[i])){const op=tokens[i++],b=primary();n=op==='*'?n*b:op==='/'?n/b:n%b}return n};const sum=():number=>{let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();n=op==='+'?n+b:n-b}return n};const out=sum();return Number.isFinite(out)?String(Number(out.toFixed(8))):'Error'}catch{return expr}}
export function SosScreen() {
  return <Screen>
    <Heading title="SOS" />
    <View style={{ alignItems: 'center', paddingTop: 10, gap: 14 }}>
      <View pointerEvents="none" style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.sosSoft, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: colors.sos, alignItems: 'center', justifyContent: 'center' }}><Siren size={38} color={colors.white} /></View></View>
      <Title>Prepare a message</Title><Body style={{ textAlign: 'center' }}>Review a draft and choose what to include. Your messages app will open for you.</Body>
    </View>
    <Card><Title>Example message</Title><Body>“I need help. My location: [map link]”</Body><Body style={{ fontSize: 13 }}>The actual message is prepared after you select recipients and location options. You review and send it in your messaging app.</Body></Card>
    <Button title="Start SOS countdown" variant="sos" onPress={() => triggerSOS('button')} />
    <Button title="Call India emergency number 112" variant="line" onPress={() => void Linking.openURL('tel:112').catch(() => Alert.alert('Call unavailable', 'Open your phone app and dial 112.'))} />
    <Body style={{ fontSize: 13, textAlign: 'center' }}>A 5-second cancellation window opens first. Expo cannot send SMS silently.</Body>
  </Screen>;
}
export function SosCountdownScreen() {
  const [seconds, setSeconds] = useState(5);
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);
  const handled = useRef(false);
  const source = getActiveSosSource();

  useEffect(() => {
    const interval = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, []);

  const openMessage = async (withLocation: boolean) => {
    if (handled.current || working) return;
    handled.current = true;
    setWorking(true);
    try {
      const contacts = await readTrustedContacts();
      if (!contacts.length) {
        await AsyncStorage.setItem('circle:notice:v1', 'Add a trusted contact first');
        router.replace(ROUTES.circle);
        return;
      }
      const coords = withLocation ? await requestSOSCoordinates() : null;
      const result = await prepareSOSMessage(coords);
      if (result === 'opened') setStatus(`${withLocation && !coords ? 'Location unavailable. ' : ''}Message opened for you to send. Bindaas cannot confirm delivery.`);
      else if (result === 'failed') {
        setStatus('The message could not be opened. Tap Open message now to retry.');
        handled.current = false;
      }
    } catch {
      setStatus('The message could not be opened. Tap Open message now to retry.');
      handled.current = false;
    } finally {
      setWorking(false);
    }
  };

  const requestLocationAndOpen = () => Alert.alert(
    'Add your location?',
    'Bindaas uses foreground location only to add a map link to this message.',
    [
      { text: 'Continue', onPress: () => { void openMessage(true); } },
      { text: 'Continue without location', onPress: () => { void openMessage(false); } },
      { text: 'Cancel', style: 'cancel', onPress: () => { handled.current = false; setWorking(false); } },
    ],
    { cancelable: false },
  );
  const call112 = async () => {
    try { await Linking.openURL('tel:112'); }
    catch { Alert.alert('Call unavailable', 'Open your phone app and dial 112 for emergency assistance.'); }
  };

  useEffect(() => {
    if (seconds === 0 && !handled.current) requestLocationAndOpen();
  }, [seconds]);

  return <Screen>
    <Heading title="SOS" />
    <View style={{ alignItems: 'center', paddingTop: 12, gap: 16 }}>
      <View pointerEvents="none" style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: colors.sosSoft }} />
        <View style={{ position: 'absolute', width: 172, height: 172, borderRadius: 86, backgroundColor: colors.pink100 }} />
        <ScoreRing value={seconds * 20} size={132} showValue={false} />
        <Text pointerEvents="none" style={{ position: 'absolute', fontFamily: type.display, fontSize: 42, color: colors.sos }}>{seconds}</Text>
      </View>
      <Text style={{ fontFamily: type.display, fontSize: 26, color: colors.ink, textAlign: 'center' }}>{working ? 'Preparing your message' : `Opening your message in ${seconds}s`}</Text>
      <Chip>Trigger: {source}</Chip>
    </View>
    {status ? <Body accessibilityLiveRegion="polite" style={{ textAlign: 'center' }}>{status}</Body> : <Body style={{ textAlign: 'center' }}>Your messages app opens with a draft. You review it and press send.</Body>}
    <Button title="Cancel, I’m OK" variant="line" disabled={working} onPress={() => { void cancelSOS(); }} />
    <Button title="Open message now" variant="sos" disabled={working} onPress={requestLocationAndOpen} />
    <Button title="Call India emergency number 112" variant="line" onPress={() => void call112()} />
    <Body style={{ fontSize: 12, textAlign: 'center' }}>Expo cannot send SMS silently. Your contacts are only messaged if you choose to send.</Body>
  </Screen>;
}

export function LiveScreen() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [position, setPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [locationUnavailable, setLocationUnavailable] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [foregroundReminder, setForegroundReminder] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [status, setStatus] = useState('');
  const watching = useRef<Location.LocationSubscription | null>(null);

  useFocusEffect(useCallback(() => {
    let active=true;
    void readTrustedContacts().then(saved => {if(active){setContacts(saved);setSelectedPhones(saved.map(contact => contact.phone));}});
    void isTripActive().then(setTripActive);
    void AsyncStorage.getItem('trip:location-reminder-enabled:v1').then(value => {setReminderEnabled(value === 'true');setForegroundReminder(value === 'true'&&isExpoGo);});
    return ()=>{active=false;};
  }, []));

  useEffect(() => {
    if (!foregroundReminder || !reminderEnabled || !tripActive) return undefined;
    const id = setInterval(() => {
      if (AppState.currentState === 'active') Alert.alert('Location check-in', 'Prepare a location update if you still need to share one.');
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [foregroundReminder, reminderEnabled, tripActive]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    if (!position) return undefined;
    void Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 }, latest => {
      setPosition(latest.coords);
    }).then(subscription => {
      if (cancelled) subscription.remove(); else watching.current = subscription;
    }).catch(() => setLocationUnavailable(true));
    return () => { cancelled = true; watching.current?.remove(); watching.current = null; };
  }, [Boolean(position)]));

  const showLocationReason = () => Alert.alert(
    'Use your location?',
    'Bindaas uses foreground location only to prepare this message and update the map while this screen is open.',
    [
      { text: 'Continue', onPress: () => { void requestLocationAndSend(); } },
      { text: 'Continue without location', onPress: () => { void sendLocationMessage(null); } },
      { text: 'Cancel', style: 'cancel' },
    ],
  );

  const sendLocationMessage = async (coords: Location.LocationObjectCoords | null) => {
    const saved = await readTrustedContacts();
    if (!saved.length) {
      await AsyncStorage.setItem('circle:notice:v1', 'Add a trusted contact first');
      router.replace(ROUTES.circle);
      return;
    }
    const recipients = saved.filter(contact => selectedPhones.includes(contact.phone));
    if (!recipients.length) { Alert.alert('Choose a contact', 'Select at least one trusted contact.'); return; }
    const where = coords ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}` : 'location unavailable';
    const message = `I'm sharing my location (BINDAAS): ${where}`;
    try {
      if (await SMS.isAvailableAsync()) await SMS.sendSMSAsync(recipients.map(contact => contact.phone), message);
      else await Share.share({ message });
      setStatus('Message opened for you to send');
    } catch {
      setStatus('The message could not be opened. Check your messaging app and retry.');
    }
  };

  const requestLocationAndSend = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setLocationUnavailable(true);
        setPosition(null);
        setStatus('Location unavailable. You can retry or prepare the message without it.');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPosition(current.coords);
      setLocationUnavailable(false);
      setTripActive(true);
      await startTrip();
      await sendLocationMessage(current.coords);
    } catch {
      setLocationUnavailable(true);
      setPosition(null);
      setStatus('Location unavailable. You can retry or prepare the message without it.');
    }
  };

  const changeReminder = (enabled: boolean) => {
    if (!enabled) {
      setReminderEnabled(false);
      setForegroundReminder(false);
      void setLocationReminderEnabled(false);
      return;
    }
    Alert.alert('Location reminder', 'Bindaas can remind you every five minutes while this screen is open. Background reminders need a compatible development build.', [
      { text: 'Continue', onPress: () => { void (async () => {
        const notifications = await loadNotifications();
        if (!notifications || typeof notifications.getPermissionsAsync !== 'function') {
          await startTrip();
          await AsyncStorage.setItem('trip:location-reminder-enabled:v1','true');
          setForegroundReminder(true);setReminderEnabled(true);setTripActive(true);
          setStatus('Five-minute reminders are active while this screen stays open.');
          return;
        }
        const current = await notifications.getPermissionsAsync();
        const permission = current.granted ? current : await notifications.requestPermissionsAsync();
        if (!permission.granted) {
          await startTrip();await AsyncStorage.setItem('trip:location-reminder-enabled:v1','true');
          setForegroundReminder(true);setReminderEnabled(true);setTripActive(true);
          setStatus('Notifications are off. Five-minute reminders will appear while this screen stays open.');
          return;
        }
        await startTrip();
        const scheduled = await setLocationReminderEnabled(true);
        if (!scheduled) { Alert.alert('Reminder unavailable', 'Notifications could not be loaded in this Expo Go build.'); return; }
        setForegroundReminder(false);setReminderEnabled(true);setTripActive(true);
      })().catch(()=>Alert.alert('Reminder unavailable','The reminder could not be started.')); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleContact = (phone: string) => setSelectedPhones(current => current.includes(phone) ? current.filter(item => item !== phone) : [...current, phone]);
  return <Screen>
    <Heading title="Share location" />
    <Card><Title>Who can receive this draft?</Title><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      {contacts.map(contact => <Pressable key={contact.phone} accessibilityRole="checkbox" accessibilityLabel={contact.name} accessibilityState={{ checked: selectedPhones.includes(contact.phone) }} onPress={() => toggleContact(contact.phone)} style={{ width: 74, alignItems: 'center', gap: 5 }}>
        <View pointerEvents="none" style={{ width: 52, height: 52, borderRadius: 26, borderWidth: selectedPhones.includes(contact.phone) ? 2 : 0, borderColor: colors.ink, backgroundColor: colors.pink100, alignItems: 'center', justifyContent: 'center' }}><Text style={txt(17, colors.ink, type.bold)}>{contact.name.slice(0, 1).toUpperCase()}</Text></View>
        <Text numberOfLines={1} style={{ ...txt(12, colors.ink2, type.semibold), maxWidth: 72 }}>{contact.name}</Text>
      </Pressable>)}
      <Pressable accessibilityRole="button" accessibilityLabel="Add trusted contact" onPress={() => go(ROUTES.circle)} style={{ width: 74, alignItems: 'center', gap: 5 }}><View pointerEvents="none" style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.ink2, alignItems: 'center', justifyContent: 'center' }}><Text style={txt(22, colors.ink)}>+</Text></View><Text style={txt(12, colors.ink2, type.semibold)}>Add</Text></Pressable>
      {!contacts.length && <Body style={{ fontSize: 13 }}>Add a trusted contact before preparing a message.</Body>}
    </View></Card>
    <View style={{ height: 220 }}><MapPlaceholder position={position} /></View>
    <Text style={{ ...txt(11, colors.ink2), textAlign: 'right' }}>{position ? 'Map illustration · marker uses your foreground location' : 'Map illustration · no live location loaded'}</Text>
    {position && <Body style={{ fontSize: 12 }}>Your location is updating while this screen is open.</Body>}
    {locationUnavailable && <Body style={{ color: colors.warn }}>Location unavailable. Retry permission or prepare without location.</Body>}
    {status ? <Body accessibilityLiveRegion="polite">{status}</Body> : null}
    <Card>
      <Row title="Snapshot message" sub="Prepared with a map link" right="" />
      <Toggle label="Remind me to resend every 5 min" value={reminderEnabled} onValueChange={changeReminder} />
      <Row title="Location marker" sub="Updates only while this screen is open" right={position?'Updating':'Paused'} />
    </Card>
    {tripActive && <Button title="End trip" variant="line" onPress={() => { void endTrip(); setTripActive(false); setReminderEnabled(false);setForegroundReminder(false); }} />}
    <Button title={locationUnavailable ? 'Retry location permission' : 'Prepare location message'} onPress={showLocationReason} />
    <Body style={{ fontSize: 12, textAlign: 'center' }}>Location sharing is foreground-only. No background tracking.</Body>
  </Screen>;
}
function Row({title,sub,right='›'}:{title:string;sub?:string;right?:string}){return <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}><View style={{flex:1}}><Text style={txt(15,colors.ink,type.semibold)}>{title}</Text>{sub&&<Text style={txt(12,colors.ink2)}>{sub}</Text>}</View><Text style={txt(18,colors.ink2)}>{right}</Text></View>}
export function RouteScreen(){
  const [from,setFrom]=useState('My location'); const [destination,setDestination]=useState(''); const [departure,setDeparture]=useState<'now'|'later'>('now'); const [selected,setSelected]=useState(0); const [searched,setSearched]=useState(false);
  useEffect(()=>{void AsyncStorage.getItem('route:departure-demo:v1').then(value=>{if(value==='true')setDeparture('later');});},[]);
  const compare=()=>{if(!destination.trim()){Alert.alert('Add a destination','Enter a destination to compare the sample route estimates.');return;}setSearched(true);};
  const openBreakdown=async()=>{await AsyncStorage.setItem('route:selected:v1',JSON.stringify({name:routes[selected].name,destination:destination.trim(),from:from.trim(),departure}));go(ROUTES.routeBreakdown);};
  return <Screen><Heading title="Route finder"/><MapPlaceholder/><Body style={{fontSize:12}}>Map and route estimates are sample data. Entering places lets you compare the demo options; it does not request live directions.</Body><Card style={{marginTop:-8}}><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><View style={{flex:1,minWidth:130}}><Field label="From" placeholder="My location" value={from} onChangeText={setFrom}/></View><View style={{flex:1,minWidth:130}}><Field label="To" placeholder="Destination" value={destination} onChangeText={setDestination}/></View></View><View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8}}><Chip active={departure==='now'} onPress={()=>setDeparture('now')}>Leave now</Chip><Chip active={departure==='later'} onPress={()=>setDeparture('later')}>Leave at 9:30 PM</Chip></View><Button title="Compare sample routes" small onPress={compare}/></Card>{searched&&<Card><Title>Sample routes from {from.trim()||'your start'} to {destination.trim()}</Title><Text style={txt(12,colors.ink2)}>{departure==='now'?'Using your current departure time.':'Using the 9:30 PM demo departure.'}</Text>{routes.map((r,i)=><Pressable key={r.name} accessibilityRole="radio" accessibilityLabel={`${r.name}, ${r.time}, activity estimate ${r.score}`} accessibilityState={{ selected: selected===i }} onPress={()=>setSelected(i)} style={{borderWidth:selected===i?1.5:1,borderColor:selected===i?colors.ink:colors.line,borderRadius:18,padding:11,flexDirection:'row',alignItems:'center',gap:12}}><ScoreRing value={r.score} size={62}/><View style={{flex:1,gap:3,minWidth:0}}><Text style={txt(16,colors.ink,type.bold)}>{r.name}</Text><Text style={txt(12,colors.ink2)}>{r.time} · {r.distance}</Text><Text style={txt(11,colors.ink2)}>{r.places} sample places listed open when you pass</Text></View></Pressable>)}<Body style={{fontSize:12}}>Activity estimate, not a safety rating. Sample data only.</Body><Button title="See selected route breakdown" small onPress={()=>void openBreakdown()}/></Card>}</Screen>
}
export function BreakdownScreen(){
  const [route,setRoute]=useState(routes[0]); const [destination,setDestination]=useState('');
  useEffect(()=>{void AsyncStorage.getItem('route:selected:v1').then(raw=>{if(!raw)return;try{const saved=JSON.parse(raw) as {name?:string;destination?:string};const match=routes.find(item=>item.name===saved.name);if(match)setRoute(match);if(saved.destination)setDestination(saved.destination);}catch{}});},[]);
  const rows:[string,string][]=[['Open places along sample route',`${route.places}/25`],['Open help points nearby',`${Math.round(route.score*.18)}/15`],['Distance on main roads',`${Math.round(route.score*.18)}/15`],['Open transport locations',`${Math.round(route.score*.1)}/10`],['Fewer gaps between open places',`${Math.round(route.score*.16)}/15`],['Fewer turns',`${Math.round(route.score*.1)}/10`]];
  return <Screen><Heading title="Route breakdown"/><Card style={{backgroundColor:colors.ink,alignItems:'center'}}><ScoreRing value={route.score} size={105}/><Text style={txt(17,colors.pink,type.bold)}>{route.name} · Sample activity score</Text><Text style={txt(12,colors.pink)}>For {destination||'the selected demo route'}. Not a safety rating.</Text></Card><Card>{rows.map(([name,val])=><View key={name} style={{gap:5}}><Row title={name} right={val}/><View style={{height:7,backgroundColor:colors.pink100,borderRadius:9}}><View style={{width:`${Math.min(100,parseInt(val)*4)}%`,height:7,backgroundColor:colors.ink,borderRadius:9}}/></View></View>)}</Card><View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}><Card style={{flex:1,minWidth:145}}><Text style={txt(25,colors.ink,type.display)}>{Math.max(250,900-route.places*30)} m</Text><Body style={{fontSize:12}}>Sample longest stretch without a listed help point</Body></Card><Card style={{flex:1,minWidth:145}}><Text style={txt(25,colors.ink,type.display)}>{Math.max(200,800-route.places*25)} m</Text><Body style={{fontSize:12}}>Sample longest quiet stretch</Body></Card></View><Card><Title>Sample places when you pass</Title>{['Pharmacy · 8 min','Cafe · 12 min','Metro station · 19 min'].map((p,i)=><Row key={p} title={p} right={i===1?'Sample · listed closed':'Sample · listed open'}/>)}</Card><Button title="Start check-in timer" onPress={()=>go(ROUTES.timer)}/></Screen>
}
export function PrivacyScreen(){
  const [password,setPassword]=useState('');
  const [checks,setChecks]=useState<string[]>([]);
  const checklist=['Two-step verification enabled','Recovery email reviewed','Profile visibility limited','Old sessions signed out'];
  const passwordScore=[password.length>=12,/[a-z]/.test(password),/[A-Z]/.test(password),/\d/.test(password),/[^A-Za-z0-9]/.test(password)].filter(Boolean).length*20;
  const strength=passwordScore<40?'Needs work':passwordScore<80?'Getting stronger':password?'Strong':'Not checked';
  return <Screen><Heading title="Privacy audit"/><Card><Title>On-device password check</Title><Field label="Password" placeholder="Enter a password" secureTextEntry value={password} onChangeText={setPassword}/><View style={{backgroundColor:passwordScore<40?colors.warnBg:colors.pink100,padding:12,borderRadius:15}}><Text style={txt(13,colors.ink,type.semibold)}>{password?`Strength: ${strength} · ${passwordScore}/100`:'Enter a password to check its length and character variety.'}</Text></View><Body style={{fontSize:12}}>This check runs only on this phone. It does not compare against breach databases or send the password anywhere. Use a unique password and avoid sharing it.</Body></Card><Card><Title>Exposure checklist</Title><View style={{alignItems:'center',gap:8}}><ScoreRing value={Math.round(checks.length*25)} size={90}/><Body>{checks.length} of {checklist.length} actions marked complete</Body></View>{checklist.map(label=><Toggle key={label} label={label} value={checks.includes(label)} onValueChange={enabled=>setChecks(current=>enabled?[...current,label]:current.filter(item=>item!==label))}/>)}</Card><Card style={{backgroundColor:colors.pink100}}><Text style={txt(14,colors.ink,type.bold)}>A small step helps</Text><Body>Use a unique password and enable two-step verification wherever available.</Body></Card></Screen>
}
export function TimerScreen() {
  const params = useLocalSearchParams<{ minutes?: string }>();
  const requestedMinutes = Number(params.minutes);
  const [seconds, setSeconds] = useState(Number.isFinite(requestedMinutes) && requestedMinutes > 0 ? requestedMinutes * 60 : 24 * 60 + 35);
  const [expired, setExpired] = useState(false);
  const [running, setRunning] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  useEffect(() => { void startTrip(); }, []);
  useEffect(() => {
    if (!running) return undefined;
    if (seconds <= 0) {
      if (!expired) { setExpired(true); triggerSOS('timer'); }
      return undefined;
    }
    const id = setTimeout(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(id);
  }, [seconds, expired, running]);
  useEffect(() => {
    if (!reminderEnabled || !running) return undefined;
    const id = setTimeout(() => {
      if (AppState.currentState === 'active') Alert.alert('Check-in reminder', 'Take a moment to prepare a location update if you need one.');
      setReminderEnabled(false);
    }, 5 * 60 * 1000);
    return () => clearTimeout(id);
  }, [reminderEnabled, running]);
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  const finishTrip = () => { void endTrip(); router.replace(ROUTES.hub); };
  return <Screen>
    <Heading title="Safety timer" />
    <Card>
      <Chip active>Trip · Home</Chip>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 16 }}>
        <ScoreRing value={Math.min(100, seconds / 15)} size={204} showValue={false} />
        <Text pointerEvents="none" style={{ position: 'absolute', top: 82, fontFamily: type.display, fontSize: 38, color: colors.ink }}>{mins}:{secs}</Text>
        <Text style={txt(14, colors.ink2)}>Check-in reminder</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {[15, 30, 60].map(minutes => <Chip key={minutes} onPress={() => { setExpired(false); setSeconds(minutes * 60); setRunning(true); }}>{minutes} min</Chip>)}
      </View>
      <Toggle label="One check-in reminder in 5 min (while app is open)" value={reminderEnabled} onValueChange={setReminderEnabled} />
    </Card>
    <Button title={running ? 'Pause timer' : 'Resume timer'} variant="line" onPress={() => setRunning(value => !value)} />
    <Button title="I’m OK" onPress={finishTrip} />
    <Button title="Add 15 min" variant="line" onPress={() => { setExpired(false); setSeconds(value => value + 900); }} />
    <Body style={{ textAlign: 'center', fontSize: 13 }}>The timer runs while the app is open. If it ends, Bindaas opens an SOS draft for you to review.</Body>
  </Screen>;
}
export function FakeCallSetupScreen() {
  const [settings, setSettings] = useState<FakeCallSettings>(DEFAULT_FAKE_CALL_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('');
  const fireAt = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void readFakeCallSettings().then(setSettings).finally(() => setLoaded(true));
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);
  useEffect(() => { if (loaded) void writeFakeCallSettings(settings); }, [loaded, settings]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && fireAt.current && Date.now() >= fireAt.current) {
        fireAt.current = null;
        void cancelFakeCallNotification();
        go(ROUTES.incomingCall);
      }
    });
    return () => subscription.remove();
  }, []);

  const update = (patch: Partial<FakeCallSettings>) => setSettings(current => ({ ...current, ...patch }));
  const updateScript = (script: string) => setSettings(current => ({ ...current, scripts: { ...current.scripts, [current.language]: script } }));
  const start = () => Alert.alert('Simulated-call reminder', 'Allow a local notification so the call reminder can appear if Bindaas moves to the background.', [
    { text: 'Continue', onPress: () => { void (async () => {
      const notifications = await loadNotifications();
      const previous = notifications ? await notifications.getPermissionsAsync() : null;
      const permission = notifications ? (previous?.granted ? previous : await notifications.requestPermissionsAsync()) : null;
      if (!permission?.granted) setStatus('Background notifications are unavailable here. The call will open only while Bindaas remains open.');
      await writeFakeCallSettings(settings);
      if (permission?.granted) await scheduleFakeCall(settings.delaySeconds, settings.callerName);
      fireAt.current = Date.now() + settings.delaySeconds * 1000;
      timer.current = setTimeout(() => {
        if (AppState.currentState === 'active') {
          fireAt.current = null;
          void cancelFakeCallNotification();
          go(ROUTES.incomingCall);
        }
      }, settings.delaySeconds * 1000);
      setStatus(permission?.granted
        ? `Call scheduled in ${settings.delaySeconds} seconds. Simulation only.`
        : `Call is set for ${settings.delaySeconds} seconds while Bindaas stays open. Background notifications are unavailable in this Expo Go build.`);
    })().catch(() => setStatus('The call could not be scheduled. Try again.')); } },
    { text: 'Cancel', style: 'cancel' },
  ]);

  const defaults = DEFAULT_FAKE_CALL_SETTINGS.scripts;
  return <Screen>
    <HeaderBand><Heading title="Simulated call" /><Body style={{ marginTop: 5 }}>In case you need an excuse to leave an awkward situation.</Body><View style={{ alignSelf: 'flex-start', marginTop: 10 }}><Chip>Simulation</Chip></View></HeaderBand>
    <Card><Text style={txt(12, colors.ink2)}>INCOMING CALL PREVIEW</Text><Text style={{ fontFamily: type.display, fontSize: 30, color: colors.ink }}>{settings.callerName || 'Caller name'}</Text><Text style={txt(14, colors.ink2)}>Mobile · incoming</Text></Card>
    <Field label="Caller name" placeholder="Caller name" value={settings.callerName} onChangeText={callerName => update({ callerName })} />
    <Label>Ring after</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{([5, 30, 60] as const).map(delay => <Chip key={delay} active={settings.delaySeconds === delay} onPress={() => update({ delaySeconds: delay })}>{delay === 60 ? '1 min' : `${delay} s`}</Chip>)}</View>
    <Toggle label="Ringtone" value={settings.ringtoneEnabled} onValueChange={ringtoneEnabled => update({ ringtoneEnabled })} />
    <Toggle label="Vibration" value={settings.vibrationEnabled} onValueChange={vibrationEnabled => update({ vibrationEnabled })} />
    <Label>Script language</Label><View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip active={settings.language === 'en'} onPress={() => update({ language: 'en' })}>English</Chip>
      <Chip active={settings.language === 'hi'} onPress={() => update({ language: 'hi' })}>हिंदी</Chip>
    </View>
    <Label>Caller voice</Label><View style={{ flexDirection: 'row', gap: 8 }}>
      <Chip active={settings.voiceGender === 'female'} onPress={() => update({ voiceGender: 'female' })}>Female</Chip>
      <Chip active={settings.voiceGender === 'male'} onPress={() => update({ voiceGender: 'male' })}>Male</Chip>
    </View>
    <Body style={{ fontSize: 12 }}>Add PAUSE in the script for a natural pause. Voice availability depends on the speech voices installed on your phone.</Body>
    <Field label="Call script" placeholder="Write a short line to say" value={settings.scripts[settings.language]} onChangeText={updateScript} multiline />
    <Pressable accessibilityRole="button" onPress={() => update({ scripts: { ...settings.scripts, [settings.language]: defaults[settings.language] } })}><Text style={txt(14, colors.ink, type.semibold)}>Reset to default</Text></Pressable>
    <Toggle label="Start speaking as soon as it rings" value={settings.speakOnRing} onValueChange={speakOnRing => update({ speakOnRing })} />
    {status ? <Body accessibilityLiveRegion="polite">{status}</Body> : null}
    <Button title="Start simulated call" onPress={start} />
  </Screen>;
}
export function IncomingCallScreen() {
  useKeepAwake();
  const player = useAudioPlayer(require('./assets/sounds/ringtone.wav'));
  const [settings, setSettings] = useState<FakeCallSettings>(DEFAULT_FAKE_CALL_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceHint, setVoiceHint] = useState('');
  const active = useRef(false);
  const speechStarted = useRef(false);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { void readFakeCallSettings().then(setSettings).finally(() => setLoaded(true)); }, []);
  const speakTwice = useCallback(async () => {
    if (speechStarted.current) return;
    speechStarted.current = true;
    const speakOnce = async () => {
      const result = await speakScript(settings.scripts[settings.language], settings.language, settings.voiceGender, () => active.current);
      if (!result.hindiVoiceAvailable) setVoiceHint('Install Hindi voice data in your phone’s text-to-speech settings.');
      else if (!result.selectedVoiceAvailable) setVoiceHint(`A named ${settings.voiceGender} voice was not found, so the device voice was used with a ${settings.voiceGender}-leaning pitch.`);
    };
    try {
      await speakOnce();
      if (!active.current) return;
      speechTimer.current = setTimeout(() => { if (active.current) void speakOnce(); }, 4000);
    } catch { setVoiceHint('Speech is unavailable on this device.'); }
  }, [settings]);

  const stopAll = useCallback(() => {
    active.current = false;
    player.pause();
    player.loop = false;
    Vibration.cancel();
    SpeechStop();
    if (speechTimer.current) clearTimeout(speechTimer.current);
    void cancelFakeCallNotification();
  }, [player]);

  useFocusEffect(useCallback(() => {
    if (!loaded) return undefined;
    active.current = true;
    // Expo Go can play an in-app simulation, but cannot present a true native call over the lock screen.
    if (settings.ringtoneEnabled) {
      player.loop = true;
      player.volume = settings.speakOnRing ? 0.2 : 1;
      player.play();
    }
    if (settings.vibrationEnabled) Vibration.vibrate([0, 800, 600], true);
    if (settings.speakOnRing) void speakTwice();
    return stopAll;
  }, [loaded, player, settings, speakTwice, stopAll]));

  useEffect(() => {
    if (!accepted) return undefined;
    const id = setInterval(() => setElapsed(value => value + 1), 1000);
    return () => clearInterval(id);
  }, [accepted]);

  const accept = () => {
    setAccepted(true);
    player.pause();
    Vibration.cancel();
    if (!settings.speakOnRing) void speakTwice();
  };
  const end = () => { stopAll(); router.back(); };
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return <Screen dark scroll={false}>
    <View style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 }}>
      <Chip>Simulation</Chip>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <View pointerEvents="none" style={{ width: 205, height: 205, borderRadius: 110, borderWidth: 18, borderColor: colors.ink3, backgroundColor: colors.ink3, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: type.display, fontSize: 68, color: colors.pink }}>{settings.callerName.slice(0, 1).toUpperCase()}</Text></View>
        <Text style={{ fontFamily: type.display, fontSize: 38, color: colors.white }}>{settings.callerName}</Text>
        <Text style={txt(16, colors.pink)}>{accepted ? 'Call connected · Simulation' : 'Simulated incoming call'}</Text>
        {accepted && <Text style={txt(20, colors.white, type.semibold)}>{mm}:{ss}</Text>}
        {voiceHint ? <Text style={{ ...txt(12, colors.pink), textAlign: 'center', maxWidth: 300 }}>{voiceHint}</Text> : null}
      </View>
      {!accepted ? <View style={{ flexDirection: 'row', gap: 48 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Decline simulated call" onPress={end} style={{ width: 68, height: 68, borderRadius: 40, backgroundColor: colors.sos, alignItems: 'center', justifyContent: 'center' }}><Phone color={colors.white} size={27} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Accept simulated call" onPress={accept} style={{ width: 68, height: 68, borderRadius: 40, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}><Phone color={colors.white} size={27} /></Pressable>
      </View> : <Button title="End call" variant="sos" onPress={end} />}
      <Body style={{ color: colors.pink, fontSize: 12 }}>Simulation only. No real call is placed.</Body>
    </View>
  </Screen>;
}

function SpeechStop(): void {
  void import('expo-speech').then(Speech => Speech.stop()).catch(() => undefined);
}
const emptyChecklist: ChecklistValues = { newAccount: false, fewPosts: false, asksMoneyOrPhotos: false, copiedPhoto: false, urgentTone: false, asksToMoveApp: false };
const platformNames: Record<Platform, string> = { instagram: 'Instagram', whatsapp: 'WhatsApp', facebook: 'Facebook', other: 'Other' };
export function AccountCheckScreen(){
  const [suspect,setSuspect]=useState('');const [real,setReal]=useState('');const [platform,setPlatform]=useState<Platform>('instagram');const [checklist,setChecklist]=useState<ChecklistValues>(emptyChecklist);const [contacts,setContacts]=useState<TrustedContact[]>([]);const [picker,setPicker]=useState(false);
  useEffect(()=>{void readTrustedContacts().then(setContacts)},[]);
  const check=async()=>{const input:AnalysisInput={suspect:suspect.trim(),real:real.trim(),platform,checklist};if(!input.suspect||!input.real)return;const saved=await createAccountCheck(input,Constants.expoConfig?.version??'unknown');if(saved.result.error){Alert.alert('Add both handles',saved.result.error);return;}go(ROUTES.scanResult)};
  const useContact=(contact:TrustedContact)=>{const found=contact.platformHandles?.[platform]??contact.handle;if(found)setReal(found.startsWith('@')?found:`@${found}`);setPicker(false)};
  return <><Screen><HeaderBand><Heading title="Account check"/><Body style={{marginTop:5}}>Compare what you can observe. This check stays on this device.</Body><View style={{alignSelf:'flex-start',marginTop:10}}><Chip>Local indicator review</Chip></View></HeaderBand>
    <Field label="Account you are checking" placeholder="@handle" value={suspect} onChangeText={setSuspect}/><Field label="Known real account" placeholder="@known-handle" value={real} onChangeText={setReal}/>
    <Pressable accessibilityRole="button" onPress={()=>setPicker(true)} style={{paddingVertical:8}}><Text style={txt(14,colors.ink,type.semibold)}>Pick from contacts</Text></Pressable>
    <Label>Platform</Label><View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>{(Object.keys(platformNames) as Platform[]).map(key=><Chip key={key} active={platform===key} onPress={()=>setPlatform(key)}>{platformNames[key]}</Chip>)}</View>
    <Card><Title>Check what you noticed</Title>{CHECKLIST_ITEMS.map(item=><Toggle key={item.key} label={item.label} value={checklist[item.key]} onValueChange={value=>setChecklist(old=>({...old,[item.key]:value}))}/>)}</Card>
    <Button title="Review indicators" disabled={!suspect.trim()||!real.trim()} onPress={()=>void check()}/><Body style={{fontSize:12}}>A similarity or checklist result is a warning sign, not proof. Only the platform can confirm who owns an account. Bindaas does not look up profiles or upload handles.</Body>
  </Screen><Modal transparent visible={picker} animationType="slide" onRequestClose={()=>setPicker(false)}><View style={{flex:1,backgroundColor:colors.scrim,justifyContent:'flex-end'}}><View style={{backgroundColor:colors.pink50,borderTopLeftRadius:30,borderTopRightRadius:30,padding:22,gap:12,maxHeight:'75%'}}><Title>Choose a saved contact</Title>{contacts.map((contact,index)=><Pressable key={`${contact.phone}-${index}`} onPress={()=>useContact(contact)} style={{padding:12,backgroundColor:colors.white,borderRadius:14}}><Text style={txt(15,colors.ink,type.semibold)}>{contact.name}</Text><Text style={txt(13,colors.ink2)}>{contact.platformHandles?.[platform]??contact.handle??'No saved handle'}</Text></Pressable>)}{!contacts.length&&<Body>No contacts saved on this device.</Body>}<Button title="Close" variant="line" onPress={()=>setPicker(false)}/></View></View></Modal></>
}
export function ScanResultScreen(){
  const [scan,setScan]=useState<SavedAccountCheck|null>(null);const [history,setHistory]=useState<SavedAccountCheck[]>([]);
  useFocusEffect(useCallback(()=>{void Promise.all([readLatestAccountCheck(),readAccountChecks()]).then(([latest,all])=>{setScan(latest);setHistory(all)})},[]));
  const remove=async(id:string)=>{await deleteAccountCheck(id);const [latest,all]=await Promise.all([readLatestAccountCheck(),readAccountChecks()]);setScan(latest);setHistory(all)};
  const saveEvidenceNote=async()=>{if(!scan)return;const note=await evidenceFromCheck(scan);await saveEvidence(note);Alert.alert('Evidence saved','This summary and its SHA-256 fingerprint are saved on this phone. The fingerprint can help detect later changes; it is not a legal certification.')};
  return <Screen><Heading title="Indicator review"/>{!scan?<Card><Title>No saved review yet</Title><Body>Enter both account handles to run the local comparison.</Body><Button title="Start account check" onPress={()=>go(ROUTES.accountCheck)}/></Card>:<>
    <Card style={{backgroundColor:colors.ink,alignItems:'center',paddingVertical:24}}><Text style={{fontFamily:type.display,fontSize:58,color:colors.pink}}>{scan.result.foundCount}/9</Text><Text style={txt(17,colors.white,type.bold)}>warning signs noticed</Text><Text style={{...txt(13,colors.pink),textAlign:'center'}}>Handle similarity: {scan.result.similarityPct}%. These findings are not proof. Only the platform can confirm ownership.</Text></Card>
    <Card><Text style={txt(12,colors.ink2,type.bold)}>KNOWN REAL ACCOUNT</Text><Text style={txt(15,colors.ink,type.bold)}>@{scan.real}</Text><Text style={{...txt(12,colors.ink2,type.bold),marginTop:12}}>ACCOUNT YOU ARE CHECKING</Text><Text style={txt(15,colors.ink,type.bold)}>@{scan.suspect}</Text><Body>{platformNames[scan.platform]} · reviewed {new Date(scan.createdAt).toLocaleString()}</Body><View style={{flexDirection:'row',flexWrap:'wrap'}}>{scan.result.diff.map((part,index)=><Text key={index} style={{...txt(17,part.changed?colors.sos:colors.ink,type.bold),backgroundColor:part.changed?colors.sosSoft:'transparent'}}>{part.text}</Text>)}</View><Body style={{fontSize:12}}>Highlighted characters differ from the known handle.</Body></Card>
    <Card><Title>Indicators found · {scan.result.foundCount}/9</Title>{scan.result.indicators.filter(item=>item.found).map(item=><Row key={item.id} title={item.label} sub={item.detail} right="Noticed"/>)}{!scan.result.foundCount&&<Body>No warning signs were marked in this review.</Body>}</Card>
    <Card><Title>Not noticed or unchecked</Title>{scan.result.indicators.filter(item=>!item.found).map(item=><Row key={item.id} title={item.label} sub={item.kind==='checklist'?'Not selected':item.detail} right="—"/>)}</Card>
    <Button title="See what to do next" onPress={()=>go(ROUTES.report)}/><Button title="Save evidence on this phone" variant="line" onPress={()=>void saveEvidenceNote()}/>
  </>}
    <Card><Title>Recent checks</Title>{history.slice(0,5).map(item=><View key={item.id} style={{flexDirection:'row',alignItems:'center',gap:8}}><Pressable style={{flex:1,paddingVertical:8}} onPress={()=>setScan(item)}><Text style={txt(14,colors.ink,type.semibold)}>@{item.suspect} · {item.result.foundCount}/9</Text><Text style={txt(12,colors.ink2)}>{new Date(item.createdAt).toLocaleString()}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete check for ${item.suspect}`} onPress={()=>void remove(item.id)} style={{padding:10}}><Text style={txt(13,colors.sos,type.semibold)}>Delete</Text></Pressable></View>)}</Card>
  </Screen>
}
export function ReportScreen(){
  const [note,setNote]=useState('');const [savedAt,setSavedAt]=useState('');const [check,setCheck]=useState<SavedAccountCheck|null>(null);const [contacts,setContacts]=useState<TrustedContact[]>([]);const [picker,setPicker]=useState(false);const [status,setStatus]=useState('');const [evidence,setEvidence]=useState<EvidenceNote[]>([]);
  useFocusEffect(useCallback(()=>{void Promise.all([readLatestAccountCheck(),readTrustedContacts(),readEvidence()]).then(([latest,c,saved])=>{setCheck(latest);setContacts(c);setEvidence(saved)})},[]));
  const save=async()=>{if(!note.trim()){Alert.alert('Add a note','Write the handle, time, or detail you want to keep on this phone.');return;}const time=new Date().toISOString();await AsyncStorage.setItem('report:note:v1',JSON.stringify({note:note.trim(),time}));setSavedAt(time);Alert.alert('Saved on this phone','Your note is stored locally.');};
  const tell=async(contact?:TrustedContact)=>{if(!check)return;const message=`I noticed some warning signs on @${check.suspect} (${platformNames[check.platform]}). This is not proof; please verify through the platform. Prepared with Bindaas.`;try{if(contact&&await SMS.isAvailableAsync())await SMS.sendSMSAsync([contact.phone],message);else await Share.share({message});setStatus('Message opened for you to send. Bindaas cannot confirm delivery.')}catch{setStatus('Could not open a message. You can copy the details or share them manually.')}};
  const saveProof=async()=>{if(!check)return;const item=await evidenceFromCheck(check);await saveEvidence(item);setEvidence(await readEvidence());setStatus(`Evidence preview saved locally. SHA-256: ${item.fingerprint.slice(0,16)}…`)};
  const openLens=(url:string)=>void Linking.openURL(url).catch(()=>setStatus('Could not open the browser. Search manually for Lens or TinEye.'));
  const steps:Record<Platform,string[]>={instagram:['Open the profile','Tap ⋯','Tap Report','Choose Something about this account','Choose Pretending to be someone'],facebook:['Open the profile','Tap ⋯','Tap Find support or report profile','Choose Pretending to be someone'],whatsapp:['Open the chat','Tap the contact name','Tap Report'],other:['Open the platform’s profile menu','Choose Report and follow its prompts']};
  return <><Screen><Heading title="Report and evidence"/><Card><Title>Pause before responding</Title><Body>Do not send money, verification codes, or private photos. Check through the platform using a known profile or contact method.</Body></Card>
    {check&&<Card><Title>Manual image checks</Title><Body>Only upload an image yourself after reviewing the destination. Bindaas does not send your screenshots or images.</Body><Button small title="Open Google Lens" variant="line" onPress={()=>openLens('https://lens.google.com/')}/><Button small title="Open TinEye" variant="line" onPress={()=>openLens('https://tineye.com/')}/></Card>}
    {check&&<Card><Title>{platformNames[check.platform]} report steps</Title>{(steps[check.platform]??steps.other).map((step,index)=><Body key={step}>{index+1}. {step}</Body>)}</Card>}
    <Card><Title>Tell someone you trust</Title><Body>Opens your messaging app with a draft. You review and send it.</Body><Button small title="Choose a circle contact" onPress={()=>setPicker(true)} disabled={!check}/><Button small title="Share message" variant="line" onPress={()=>void tell()} disabled={!check}/>{status?<Body accessibilityLiveRegion="polite" style={{fontSize:12}}>{status}</Body>:null}</Card>
    <Card><Title>Keep a note locally</Title><Field label="Details" placeholder="Handle, date, what happened…" value={note} onChangeText={setNote} multiline/><Button title="Save note locally" small onPress={()=>void save()}/>{savedAt?<Body style={{fontSize:12}}>Saved {new Date(savedAt).toLocaleString()}</Body>:null}</Card>
    {check&&<Card><Title>Evidence summary</Title><Body>Save a canonical summary with a SHA-256 fingerprint. A hash can show that these saved bytes later changed; it does not prove the account or event.</Body><Button title="Preview and save evidence" small onPress={()=>void saveProof()}/></Card>}
    <Card><Title>Saved evidence · {evidence.length}</Title>{evidence.length>0&&<Button small title="Open evidence and verify" variant="line" onPress={()=>go(ROUTES.evidence)}/>}<Body style={{fontSize:12}}>Evidence stays on this phone unless you share or export it.</Body></Card>
    <Card style={{backgroundColor:colors.ink}}><Text style={txt(15,colors.pink,type.bold)}>Need cybercrime support in India?</Text><Pressable accessibilityRole="button" onPress={()=>void Linking.openURL('tel:1930').catch(()=>undefined)}><Text style={txt(14,colors.white)}>Call 1930</Text></Pressable><Pressable accessibilityRole="link" onPress={()=>openLens('https://cybercrime.gov.in/')}><Text style={txt(14,colors.pink)}>Open cybercrime.gov.in</Text></Pressable></Card>
    <Button title="Done" onPress={()=>go(ROUTES.hub)}/>
  </Screen><Modal transparent visible={picker} animationType="slide" onRequestClose={()=>setPicker(false)}><View style={{flex:1,backgroundColor:colors.scrim,justifyContent:'flex-end'}}><View style={{backgroundColor:colors.pink50,borderTopLeftRadius:30,borderTopRightRadius:30,padding:22,gap:10}}><Title>Choose a trusted contact</Title>{contacts.map((contact,index)=><Pressable key={`${contact.phone}-${index}`} onPress={()=>{setPicker(false);void tell(contact)}} style={{padding:12,backgroundColor:colors.white,borderRadius:14}}><Text style={txt(15,colors.ink,type.semibold)}>{contact.name} · {contact.phone}</Text></Pressable>)}{!contacts.length&&<Body>No circle contacts saved.</Body>}<Button title="Close" variant="line" onPress={()=>setPicker(false)}/></View></View></Modal></>
}
export function EvidenceScreen(){
  const [items,setItems]=useState<EvidenceNote[]>([]);const [status,setStatus]=useState('');
  useFocusEffect(useCallback(()=>{void readEvidence().then(setItems)},[]));
  const verify=async(item:EvidenceNote)=>setStatus(await verifyEvidence(item)?`Unchanged · ${item.fingerprint}`:`Fingerprint mismatch · ${item.suspectHandle}`);
  const copy=async(item:EvidenceNote)=>{await Clipboard.setStringAsync(JSON.stringify(item,null,2));setStatus('Evidence copied to clipboard.')};
  const share=async(item:EvidenceNote)=>{try{const uri=FileSystem.cacheDirectory+`bindaas-evidence-${item.id}.txt`;await FileSystem.writeAsStringAsync(uri,JSON.stringify(item,null,2));if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:'text/plain',dialogTitle:'Share Bindaas evidence'});else setStatus('Sharing is unavailable on this device.')}catch{setStatus('Could not export evidence.')}};
  const remove=async(item:EvidenceNote)=>{await deleteEvidence(item.id);setItems(await readEvidence());setStatus('Evidence deleted from this phone.')};
  return <Screen><Heading title="Saved evidence"/><Body>Evidence is a local record, not a legal certification or proof of account ownership.</Body>{status?<Body accessibilityLiveRegion="polite" style={{fontSize:12}}>{status}</Body>:null}{items.map(item=><Card key={item.id}><Title>@{item.suspectHandle}</Title><Body>Compared with @{item.realHandle} · {platformNames[item.platform]} · {new Date(item.createdAt).toLocaleString()}</Body><Body>{item.foundCount} of 9 warning signs · SHA-256</Body><Text selectable style={{fontSize:12,color:colors.ink2}}>{item.fingerprint}</Text><Button small title="Verify unchanged" onPress={()=>void verify(item)}/><Button small title="Copy" variant="line" onPress={()=>void copy(item)}/><Button small title="Share as text file" variant="line" onPress={()=>void share(item)}/><Button small title="Delete" variant="line" onPress={()=>void remove(item)}/></Card>)}{!items.length&&<Card><Body>No saved evidence yet.</Body></Card>}<Button title="Back to report" onPress={()=>go(ROUTES.report)}/></Screen>
}
export function CircleScreen() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactHandle, setContactHandle] = useState('');
  const [contactPlatform, setContactPlatform] = useState<Platform>('instagram');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const { voiceEnabled, voiceListening, voiceTier } = useTriggerStatus();

  useEffect(() => {
    void readTrustedContacts().then(setContacts).finally(() => setLoaded(true));
    void AsyncStorage.getItem('circle:notice:v1').then(value => {
      if (value) { setNotice(value); void AsyncStorage.removeItem('circle:notice:v1'); }
    });
  }, []);
  useEffect(() => { if (loaded) void writeTrustedContacts(contacts); }, [contacts, loaded]);

  const save = () => {
    const cleanPhone = phone.trim();
    if (!name.trim() || !/^\+?[\d\s()-]{7,}$/.test(cleanPhone)) {
      Alert.alert('Check the details', 'Enter a name and a valid phone number.');
      return;
    }
    const cleanHandle = contactHandle.trim().replace(/^@/u, '');
    const platformHandles = cleanHandle ? { ...(editIndex === null ? {} : contacts[editIndex]?.platformHandles), [contactPlatform]: cleanHandle } : (editIndex === null ? undefined : contacts[editIndex]?.platformHandles);
    const nextContact: TrustedContact = { name: name.trim(), phone: cleanPhone, ...(cleanHandle ? { handle: cleanHandle } : {}), ...(platformHandles ? { platformHandles } : {}) };
    setContacts(current => editIndex === null ? [...current, nextContact] : current.map((contact, index) => index === editIndex ? nextContact : contact));
    setName(''); setPhone(''); setContactHandle(''); setEditIndex(null); setForm(false); setNotice('');
  };

  const changeVoice = (enabled: boolean) => {
    if (!enabled) { void setVoiceEnabled(false); return; }
    Alert.alert('Microphone access', 'Voice help listens only while Bindaas is open. Audio is not stored or uploaded.', [
      { text: 'Continue', onPress: () => { void requestVoicePermissions().then(granted => {
        if (granted) void setVoiceEnabled(true);
        else Alert.alert('Microphone unavailable', 'Allow microphone access in your phone settings to enable voice help.');
      }).catch(() => Alert.alert('Voice help unavailable', 'Microphone access could not be started.')); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return <>
    <Screen>
      <HeaderBand><Heading title="Your circle" /></HeaderBand>
      {notice ? <View style={{ backgroundColor: colors.warnBg, borderRadius: 16, padding: 14 }}><Text style={txt(14, colors.warn, type.semibold)}>{notice}</Text></View> : null}
      {!contacts.length && <Card><Title>No trusted contacts yet</Title><Body>Add someone you trust before preparing an SOS or location message.</Body></Card>}
      {contacts.map((contact, index) => <Card key={`${contact.phone}-${index}`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View pointerEvents="none" style={{ width: 48, height: 48, borderRadius: 25, backgroundColor: colors.pink100, alignItems: 'center', justifyContent: 'center' }}><Text style={txt(16, colors.ink, type.bold)}>{contact.name[0]}</Text></View>
          <View style={{ flex: 1 }}><Text style={txt(16, colors.ink, type.bold)}>{contact.name}</Text><Text style={txt(13, colors.ink2)}>{contact.phone}</Text>{contact.handle&&<Text style={txt(12,colors.ink2)}>@{contact.handle}</Text>}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${contact.name}`} onPress={() => { setEditIndex(index); setName(contact.name); setPhone(contact.phone); setContactHandle(contact.platformHandles?.[contactPlatform]??contact.handle??''); setForm(true); }} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={txt(12, colors.ink, type.semibold)}>Edit</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${contact.name}`} onPress={() => setContacts(current => current.filter((_, item) => item !== index))} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><X color={colors.ink2} /></Pressable>
        </View>
      </Card>)}
      <Button title="Add contact" onPress={() => { setEditIndex(null); setName(''); setPhone(''); setContactHandle(''); setForm(true); }} />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Title>Voice help</Title><Chip>{voiceListening?'Active':'Opt in'}</Chip></View>
        <Toggle label={isExpoGo?'Scream detection (opt-in)':'Scream or say “help” (opt-in)'} value={voiceEnabled} onValueChange={changeVoice} />
        {voiceEnabled && <Body style={{ fontSize: 12 }}>{voiceListening ? `Listening · ${voiceTier ?? 'Starting'}` : 'Voice help is enabled but the microphone is unavailable.'}</Body>}
        <Body style={{ fontSize: 12 }}>{isExpoGo?'Expo Go detects sustained loud sound. Spoken phrase detection needs a development build.':'Works while Bindaas is open. On-device audio is not stored or uploaded.'}</Body>
        <Button title="Simulate help phrase heard (simulation)" small variant="line" onPress={() => triggerSOS('voice')} />
      </Card>
      <Body style={{ textAlign: 'center', fontSize: 12 }}>Contacts stay on this device. No background tracking.</Body>
    </Screen>
    <Modal transparent visible={form} animationType="slide" onRequestClose={() => setForm(false)}>
      <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.pink50, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 22, gap: 16 }}>
          <Text style={{ fontFamily: type.display, fontSize: 27, color: colors.ink }}>{editIndex === null ? 'Add a contact' : 'Edit contact'}</Text>
          <Field label="Name" placeholder="Contact name" value={name} onChangeText={setName} />
          <Field label="Phone number" placeholder="+91 98765 43210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <Label>Social platform</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{(Object.keys(platformNames) as Platform[]).map(key=><Chip key={key} active={contactPlatform===key} onPress={()=>setContactPlatform(key)}>{platformNames[key]}</Chip>)}</View>
          <Field label="Account handle (optional)" placeholder="@handle" value={contactHandle} onChangeText={setContactHandle} />
          <Button title={editIndex === null ? 'Save contact' : 'Update contact'} onPress={save} />
          <Button title="Cancel" variant="line" onPress={() => setForm(false)} />
        </View>
      </View>
    </Modal>
  </>;
}
export function AreYouOkScreen() {
  const [seconds, setSeconds] = useState(60);
  const timedOut = useRef(false);
  useEffect(() => { const id = setInterval(() => setSeconds(value => Math.max(0,value-1)), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { if(seconds===0&&!timedOut.current){timedOut.current=true;triggerSOS('deviation');} }, [seconds]);
  return <Screen>
    <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
      <MapPlaceholder />
      <Card style={{ alignItems: 'center', marginTop: -58, borderWidth: 1, borderColor: colors.line }}>
        <View pointerEvents="none" style={{ width: 52, height: 52, borderRadius: 27, backgroundColor: colors.pink100, alignItems: 'center', justifyContent: 'center' }}><Heart color={colors.ink} /></View>
        <Title>Are you OK?</Title><Body style={{ textAlign: 'center' }}>A demo prompt after a simulated route change.</Body>
        <ScoreRing value={seconds * 100 / 60} size={78} /><Text style={txt(14, colors.ink2)}>{seconds} seconds</Text>
        <Button title="I’m OK" onPress={() => { void endTrip(); go(ROUTES.hub); }} />
        <Button title="Open SOS draft now" variant="sos" onPress={() => triggerSOS('deviation')} />
        <Chip>Demo: simulated deviation</Chip>
      </Card>
    </View>
  </Screen>;
}
export function SettingsScreen() {
  const [mode, setMode] = useState('Bindaas');
  const [demoDeparture, setDemoDeparture] = useState(false);
  const [profile,setProfile]=useState<{name:string;phone?:string}>({name:'Meera Sharma'});
  const [pin, setPin] = useState('2468');
  const [code, setCode] = useState('1122');
  const [log, setLog] = useState<SosLogEntry[]>([]);
  const { shakeEnabled, voiceEnabled, voiceListening, voiceTier } = useTriggerStatus();
  useEffect(() => {
    void readAppSettings().then(value => setMode(value.disguise === 'calculator' ? 'Calculator' : value.disguise === 'cooking' ? 'Cooking app' : 'Bindaas'));
    void AsyncStorage.getItem('route:departure-demo:v1').then(value => setDemoDeparture(value === 'true'));
    void readProfile().then(value=>{if(value)setProfile({name:value.name,phone:value.phone});});
    void AsyncStorage.multiGet(['unlock-pin:v1', 'sos-code:v1']).then(([savedPin, savedCode]) => {
      if (savedPin[1]) setPin(savedPin[1]);
      if (savedCode[1]) setCode(savedCode[1]);
    });
  }, []);
  useFocusEffect(useCallback(() => {
    void readSosLog().then(setLog);
    void readProfile().then(value => { if (value) setProfile({ name: value.name, phone: value.phone }); });
  }, []));
  const chooseMode = (value: string) => {
    setMode(value);
    const disguise: DisguiseMode = value === 'Calculator' ? 'calculator' : value === 'Cooking app' ? 'cooking' : 'none';
    void setDisguiseMode(disguise).then(() => router.replace(disguise === 'cooking' ? ROUTES.tadka as Href : disguise === 'calculator' ? ROUTES.calculator as Href : ROUTES.hub as Href));
  };
  const changeVoice = (enabled: boolean) => {
    if (!enabled) { void setVoiceEnabled(false); return; }
    Alert.alert('Microphone access', 'Voice help listens only while Bindaas is open. Audio is not stored or uploaded.', [
      { text: 'Continue', onPress: () => { void requestVoicePermissions().then(granted => {
        if (granted) void setVoiceEnabled(true);
        else Alert.alert('Microphone unavailable', 'Allow microphone access in your phone settings to enable voice help.');
      }).catch(() => Alert.alert('Voice help unavailable', 'Microphone access could not be started.')); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  return <Screen>
    <Heading title="Settings" />
    <Card><Row title={profile.name} sub={profile.phone??'Local demo profile'} right="" /></Card>
    <Card>
      <Title>Discreet Mode</Title><Body style={{ fontSize: 13 }}>Switch this screen to</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{['Bindaas', 'Calculator', 'Cooking app'].map(value => <Chip key={value} active={mode === value} onPress={() => chooseMode(value)}>{value}</Chip>)}</View><Body style={{fontSize:12}}>The app name and icon remain visible in your phone's settings.</Body>
      <Field label="Unlock PIN" placeholder="2468" keyboardType="number-pad" value={pin} onChangeText={value => { setPin(value); void readAppSettings().then(settings => writeAppSettings({ ...settings, pin: value })); }} />
      <Field label="SOS code" placeholder="1122" keyboardType="number-pad" value={code} onChangeText={value => { setCode(value); void readAppSettings().then(settings => writeAppSettings({ ...settings, sosCode: value })); }} />
      <Body style={{ fontSize: 12 }}>Demo codes: PIN 2468 · SOS 1122</Body>
      <View style={{ backgroundColor: colors.warnBg, borderRadius: 14, padding: 12 }}><Text style={txt(12, colors.warn)}>Discreet Mode changes what appears on screen. The app name and icon are still visible in your phone's settings.</Text></View>
    </Card>
    <Card>
      <Title>Quick SOS options</Title>
      <Toggle label="Shake 3 times to open SOS" value={shakeEnabled} onValueChange={value => { void setShakeEnabled(value); }} />
      <Body style={{ fontSize: 12 }}>Works while Bindaas is open. Shake threshold: {2.3}g.</Body>
      <Toggle label="Scream or say “help” (opt-in)" value={voiceEnabled} onValueChange={changeVoice} />
      {voiceEnabled && <Body style={{ fontSize: 12 }}>{voiceListening ? `Listening · ${voiceTier ?? 'Starting'}` : 'Voice help enabled but the microphone is unavailable.'}</Body>}
      <Body style={{ fontSize: 12 }}>Audio is never stored or uploaded. Speech keyword recognition needs a development build; Expo Go uses loud-sound detection.</Body>
    </Card>
    <Card><Title>Route preview</Title><Toggle label="Use 9:30 PM demo departure by default" value={demoDeparture} onValueChange={value=>{setDemoDeparture(value);void AsyncStorage.setItem('route:departure-demo:v1',String(value));}}/><Body style={{fontSize:12}}>Route estimates are sample data; this setting only chooses the displayed demo departure.</Body><Button title="Preview check-in prompt" small variant="line" onPress={()=>go(ROUTES.areYouOk)}/></Card>
    <Card>
      <Title>Recent SOS activity</Title>
      {!log.length && <Body style={{ fontSize: 13 }}>No SOS activity recorded on this device.</Body>}
      {log.slice(0, 5).map((entry, index) => <Row key={`${entry.time}-${index}`} title={`${entry.source} · ${entry.outcome}`} sub={new Date(entry.time).toLocaleString()} />)}
    </Card>
    <Button title="Set up a trip check-in reminder" variant="line" onPress={()=>go(ROUTES.live)} />
    <SettingsActions />
  </Screen>;
}
export function CookingScreen(){const [query,setQuery]=useState('');const [category,setCategory]=useState('All');const [detail,setDetail]=useState<(typeof recipes)[number]|null>(null);const filtered=useMemo(()=>recipes.filter(r=>r.title.toLowerCase().includes(query.toLowerCase())&&(category==='All'||r.category===category)),[query,category]);const search=(text:string)=>{if(text==='2468'){go(ROUTES.hub);return}if(text==='1122'){go(ROUTES.sos);return}setQuery(text);setDetail(null)};return <Screen><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View><Text style={txt(14,colors.ink2)}>Good evening</Text><Text style={{fontFamily:type.display,fontSize:42,color:colors.orange}}>Tadka</Text></View><Utensils color={colors.orange} size={26}/></View><View style={{height:54,borderRadius:18,backgroundColor:colors.white,borderColor:colors.cookingLine,borderWidth:1,flexDirection:'row',alignItems:'center',paddingHorizontal:14,gap:10}}><Search color={colors.muted}/><TextInput value={query} onChangeText={setQuery} onSubmitEditing={e=>search(e.nativeEvent.text)} returnKeyType="search" placeholder="Search recipes" placeholderTextColor={colors.muted} style={{flex:1,fontFamily:type.ui,color:colors.ink}}/></View><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['All','Breakfast','Drinks','Desserts'].map(x=><Chip key={x} active={category===x} onPress={()=>setCategory(x)}>{x}</Chip>)}</View>{detail?<Card><Pressable accessibilityRole="button" accessibilityLabel="Back to recipes" onPress={()=>setDetail(null)}><Text style={txt(14,colors.orange,type.bold)}>‹ Back to recipes</Text></Pressable><View style={{height:130,backgroundColor:detail.color,borderRadius:18}}/><Title>{detail.title}</Title><Label>Ingredients</Label><Body>{detail.ingredients}</Body><Label>Method</Label><Body>{detail.steps}</Body></Card>:<><Title>Tonight's picks</Title>{filtered.map(r=><Pressable accessibilityRole="button" accessibilityLabel={`Open recipe: ${r.title}`} key={r.title} onPress={()=>setDetail(r)} style={{backgroundColor:colors.white,borderRadius:22,overflow:'hidden',...shadow}}><View pointerEvents="none" style={{height:112,backgroundColor:r.color}}/><View pointerEvents="none" style={{padding:15,gap:5}}><Text style={txt(17,colors.ink,type.bold)}>{r.title}</Text><Text style={txt(13,colors.ink2)}>{r.meta}</Text></View></Pressable>)}{filtered.length===0&&<Body>No recipes match this search and category.</Body>}</>}</Screen>}




