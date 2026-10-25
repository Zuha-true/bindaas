export interface SupportNumber { id: string; label: string; number: string; verified: boolean }
export interface SupportLink { id: string; label: string; url: string; verified: boolean; description?: string }
export interface SupportScenario {
  id: string;
  title: string;
  firstSteps: string[];
  numbers: SupportNumber[];
  links: SupportLink[];
  appRoute?: 'accountCheck' | 'privacy';
}

export const supportCopy = {
  helpDeskDetails: '1930 · cybercrime.gov.in',
  back: 'Back to Support',
  title: 'Support', emergencyIntro: 'If you are in danger right now, call 112.', emergencyButton: 'Call 112',
  firstSteps: 'What to do first', whoToCall: 'Who to call', usefulLinks: 'Useful links',
  checkNumber: 'Check this number', checkLink: 'Check this link', copyNumber: 'Copy number', copied: 'Number copied.',
  lastCheckedPrefix: 'Numbers and websites can change. Last checked',
  notFault: 'It is not your fault.',
  accountCheck: 'Open Account check', privacyAudit: 'Open Privacy audit', accountCheckTitle: 'Account check', privacyAuditTitle: 'Privacy audit',
  logOutNotice: 'Contacts and notes stay on this phone unless you choose to erase them.',
  eraseTitle: 'Erase data on this phone?', eraseMessage: 'This clears saved profile details, contacts, checks, notes, settings, and local history from this phone.',
  cancel: 'Cancel', confirmErase: 'Erase data', signOutErase: 'Log out and erase data on this phone',
  supportLinkUnavailable: 'This link could not be opened. Check your connection and try again.',
  callUnavailable: 'The phone app could not open. You can dial this number from your phone.',
} as const;

export const lastChecked = '25 October 2026';

const n = (id: string, label: string, number: string, verified = true): SupportNumber => ({ id, label, number, verified });
const l = (id: string, label: string, url: string, verified = true, description?: string): SupportLink => ({ id, label, url, verified, description });

export const supportScenarios: SupportScenario[] = [
  {
    id: 'immediate-danger', title: 'Immediate danger',
    firstSteps: ['Move to a public place if you can.', 'Call 112.', 'Tell someone nearby.', 'Use the SOS feature in this app if you choose.'],
    numbers: [n('112','Emergency','112'),n('100','Police','100'),n('102','Ambulance','102'),n('108','Ambulance','108',false)], links: [],
  },
  {
    id: 'sexual-assault', title: 'Sexual assault or rape',
    firstSteps: ['Get to a place where you feel safer.', 'You can go to a police station or hospital to ask for help.', 'Seek medical care when you are ready.', 'You do not have to decide everything today. You can ask for a woman officer; you can ask to file an FIR at any police station. It is not your fault.'],
    numbers: [n('112','Emergency','112'),n('181','Women Helpline','181'),n('1091','Women in distress','1091',false),n('ncw-14490','NCW Women Helpline','14490'),n('ncw-long','NCW Women Helpline (alternate)','7827170170')],
    links: [l('ncw','National Commission for Women','https://ncw.gov.in/'),l('ncw-complaints','NCW online complaints','https://ncwapps.nic.in/onlinecomplaintsv2/')],
  },
  {
    id: 'domestic-abuse', title: 'Domestic abuse',
    firstSteps: ['Leave if you can do so safely.', 'Keep your ID and phone with you if you can.', 'Tell a person you trust.', 'Save messages and photos if doing so is safe. It is not your fault.'],
    numbers: [n('181','Women Helpline','181'),n('112','Emergency','112'),n('ncw-14490','NCW Women Helpline','14490'),n('ncw-long','NCW Women Helpline (alternate)','7827170170'),n('1091','Women in distress','1091',false)],
    links: [l('ncw','National Commission for Women','https://ncw.gov.in/')],
  },
  {
    id: 'stalking-harassment', title: 'Stalking and street harassment',
    firstSteps: ['Stay in a lit, busy place if you can.', 'Note the time, place, and description.', 'Save screenshots of messages.', 'Tell someone you trust.'],
    numbers: [n('112','Emergency','112'),n('100','Police','100'),n('1091','Women in distress','1091',false),n('181','Women Helpline','181')], links: [],
  },
  {
    id: 'workplace-harassment', title: 'Workplace harassment',
    firstSteps: ['Note dates and any witnesses.', "Ask your organisation about its Internal Committee.", 'Keep copies of relevant messages.'],
    numbers: [n('ncw-14490','NCW Women Helpline','14490'),n('ncw-long','NCW Women Helpline (alternate)','7827170170')],
    links: [l('shebox','SHe-Box workplace complaint portal','https://shebox.wcd.gov.in/',false)],
  },
  {
    id: 'impersonation', title: 'Impersonation and fake profiles',
    firstSteps: ['Do not send money or photos.', 'Save screenshots of the profile and messages.', 'Report the profile on its platform as pretending to be someone.', 'Tell the person being copied. You can use Account check and save notes.'],
    numbers: [n('1930','Report online financial fraud','1930')],
    links: [l('cybercrime','National Cyber Crime Reporting Portal','https://cybercrime.gov.in/')], appRoute: 'accountCheck',
  },
  {
    id: 'phishing-fraud', title: 'Phishing and online fraud',
    firstSteps: ['Stop responding and do not open links.', 'If money was lost, contact your bank and report it within the first few hours.', 'Change passwords for affected accounts.', 'Save screenshots and transaction details.'],
    numbers: [n('1930','Report online financial fraud','1930')],
    links: [l('cybercrime','National Cyber Crime Reporting Portal','https://cybercrime.gov.in/'),l('chakshu','Sanchar Saathi · Chakshu for suspicious calls and SMS','https://sancharsaathi.gov.in/',false)], appRoute: 'privacy',
  },
  {
    id: 'intimate-image-abuse', title: 'Sextortion and intimate image abuse',
    firstSteps: ['Do not pay.', 'Keep the messages and take screenshots that show usernames.', 'Stop contact if you can.', 'Report the account on its platform. It is not your fault.'],
    numbers: [n('1930','Report online financial fraud','1930')],
    links: [l('cybercrime','National Cyber Crime Reporting Portal','https://cybercrime.gov.in/'),l('stopncii','StopNCII.org · on-device image hashing','https://stopncii.org/',true,'Creates an image hash on your device. The image itself stays on your device; participating platforms compare the hash.')],
  },
  {
    id: 'overwhelmed', title: 'Feeling overwhelmed',
    firstSteps: ['You do not have to handle this alone.', 'Talk to a person you trust.', 'A small step: call and just listen.'],
    numbers: [n('tele-manas','Tele-MANAS mental health support','14416',false),n('181','Women Helpline','181')], links: [],
  },
  {
    id: 'free-legal-help', title: 'Free legal help',
    firstSteps: ['You can ask about free legal aid.', 'Keep relevant documents together if you can.', 'Ask the helpline what papers would be useful.'],
    numbers: [n('nalsa','NALSA legal aid helpline','15100',false),n('ncw-14490','NCW Women Helpline','14490'),n('ncw-long','NCW Women Helpline (alternate)','7827170170')], links: [],
  },
  {
    id: 'under-18', title: 'Under 18',
    firstSteps: ['Tell an adult you trust, if you can.', 'Call Child Helpline for help.', 'You can say what happened in your own words.'],
    numbers: [n('1098','Child Helpline','1098')], links: [],
  },
];
