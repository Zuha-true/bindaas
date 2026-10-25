export interface TadkaRecipe {
  slug: string; title: string; category: string; meta: string; blurb: string; icon: string; feature: string;
}

export const tadkaRecipes: TadkaRecipe[] = [
  { slug: 'spicy-onion-soup', title: 'Spicy Onion Soup', category: 'Soups', meta: '5 min · Easy', blurb: 'A quick soup with a little heat.', icon: '🍲', feature: 'countdown' },
  { slug: 'rasta-rasam', title: 'Rasta Rasam', category: 'Soups', meta: '25 min · Medium', blurb: 'Choose a route with more open places along the way.', icon: '🥣', feature: 'route' },
  { slug: 'eggs-on-the-clock', title: 'Eggs on the Clock', category: 'Breakfast', meta: '15 min · Easy', blurb: 'Set a timer and keep your check-in time close.', icon: '🍳', feature: 'timer' },
  { slug: 'ring-ring-rajma', title: 'Ring-Ring Rajma', category: 'Mains', meta: '10 min · Easy', blurb: 'Set up a call to arrive when you need it.', icon: '🫘', feature: 'call' },
  { slug: 'pin-drop-pulao', title: 'Pin-Drop Pulao', category: 'Mains', meta: '10 min · Easy', blurb: 'Prepare a note in your messages app.', icon: '🍚', feature: 'share' },
  { slug: 'family-thali', title: 'The Family Thali', category: 'Mains', meta: '20 min · Easy', blurb: 'Choose who stays in your circle.', icon: '🍱', feature: 'contacts' },
  { slug: 'nakli-naan', title: 'Nakli Naan', category: 'Sides', meta: '30 min · Medium', blurb: 'Review the details of an account.', icon: '🫓', feature: 'account' },
  { slug: 'sealed-jar-achaar', title: 'Sealed-Jar Achaar', category: 'Sides', meta: '45 min · Medium', blurb: 'Review the privacy settings on your accounts.', icon: '🫙', feature: 'privacy' },
  { slug: 'check-in-chai', title: 'Check-In Chai', category: 'Drinks', meta: '8 min · Easy', blurb: 'Try a check-in prompt with a simulated route change.', icon: '☕', feature: 'checkin' },
  { slug: 'shake-it-shake', title: 'Shake-It Shake', category: 'Drinks', meta: '5 min · Easy', blurb: 'Set up a shake trigger while this screen is open.', icon: '🥤', feature: 'shake' },
  { slug: 'speak-up-souffle', title: 'Speak-Up Soufflé', category: 'Desserts', meta: '40 min · Hard', blurb: 'Set up a spoken cue while this screen is open.', icon: '🍮', feature: 'voice' },
];

export const tadkaCopy = {
  greeting: 'Good evening', search: 'Search recipes', feed: "Tonight's picks", recipeBox: 'Recipe Box', pantry: 'Pantry',
  countdownStart: 'Start cooking', countdown: 'Soup is on in 5s', cancel: 'Take off the heat', proceed: 'Serve now', opened: 'Message opened for you to send', noCircle: 'Add someone to your thali first',
  startFrom: 'Start from', serveAt: 'Serve at', cookAt: 'Cook at 9:30 PM', demoTime: 'Demo time', ranked: '3 ways to make it, ranked', score: 'Rasam score', estimate: 'An estimate from the kitchen, not a guarantee. Demo data.',
  openNow: 'Open now', closed: 'Closed', timerStart: 'Start the timer', eggsDone: 'Eggs are done', add15: 'Add 15 min', timerNote: 'The timer runs while the app is open. If it ends, the soup starts for you to serve.',
  caller: 'Who is calling?', ringAfter: 'Ring after', ringtone: 'Ring and buzz', script: 'What they say', ringMe: 'Ring me', callNote: 'A simulation. Keep the app open for the call to appear.',
  whoGets: 'Who gets a bowl', pack: 'Pack the pulao', shareNote: 'Opens your messages app. Nothing goes anywhere until you press send.',
  addBowl: 'Add a bowl', removeBowl: 'Remove bowl', account: 'Dish you are checking', original: 'The original recipe', where: 'Where you found it', taste: 'Taste test',
  jarCheck: 'Jar lid check', jarNote: 'Only the first 5 characters of a scrambled copy leave your phone. Nothing is stored.', pantryChecklist: 'Pantry checklist',
  checkPrompt: 'Is the chai ready?', allGood: 'All good', stir: 'Serve the soup now', shake: 'Shake the pan 3 times to start the soup', voice: 'Say your cue word to start the soup',
  layout: 'Kitchen layout', secret: 'Secret ingredient', cookAsIf: "Cook as if it's 9:30 PM", recent: 'Recent soups',
  footer: "Kitchen layout only changes how the app looks. The app name and icon stay the same in your phone's settings.",
  routeRows: ['Open stalls on the way', 'Open helpers nearby', 'Main-road stretch', 'Open transport spots', 'Fewer gaps between stalls', 'Fewer turns'],
  routeStats: ['Longest stretch without a helper', 'Longest quiet stretch'],
  contactsTitle: 'The Family Thali', contactsSub: '3 bowls. Kept on this phone only.',
  accountChecks: ['Kitchen is brand new', 'Only a few recipes posted', 'Asks for payment or pictures', 'Cover photo looks borrowed', 'Rushes you to order', 'Wants to take the order elsewhere'],
  accountResult: '7 of 9 flavours found', accountReassurance: 'These are tasting notes, not proof. Only the platform can confirm who owns a kitchen.',
  accountNext: ['Do not pay or send pictures', 'Check the cover photo', 'Save to Recipe Box', 'Flag it on the platform', 'Tell the original chef'],
  accountFingerprint: 'Recipe seal 9f3a…c71e', accountHelpDesk: 'Kitchen help desk',
  jarWarning: 'This lid has been opened before. Pick a new one.', jarCount: '3 of 10 jars are open',
  checkinLabels: ['Evening chai after 9 PM', 'Chai is boiling over', 'Chai left to cool', 'Gas is running low'],
  checkinMessage: 'It looks like the chai may have boiled over.', checkinTime: 'Chai boils over in 42s', checkinToggle: 'Make the chai boil over (demo)',
  shakeOn: 'Shaker on', voiceStart: 'Listening for your cue', voiceSimulate: 'Simulate cue heard (simulation)',
  timerPresets: ['Soft 15', 'Medium 30', 'Hard 60'], timerCaption: 'until the eggs are done', timerNotification: 'Your eggs are ready', reminderNotification: 'Stir the pulao?',
  callLabel: 'Ring-Ring Rajma', callIncoming: 'Mom is calling', callGender: ['Female', 'Male'], callLanguages: ['English', 'हिंदी'],
  shareReady: 'Pin-drop pack', shareState: 'Ready', shareReminder: 'Remind me to stir every 5 min', shareTracker: 'Live pulao tracker', shareSoon: 'Coming soon',
  pantryStart: 'Start here: seal your number and use a new lid for each jar.', recentStarted: 'started', recentCancelled: 'taken off heat',
  disclosure: 'Message opened for you to send. Nothing is sent until you press send.',
  editProfile: 'Edit chef profile', support: 'Kitchen help desk', logout: 'Sign out', supportOpen: 'Open help desk',
  logoutNotice: 'Saved bowls and notes stay here unless you choose to clear them.',
  logoutErase: 'Sign out and clear the pantry on this phone', logoutEraseTitle: 'Clear the pantry?',
  logoutEraseMessage: 'This clears your chef profile, bowls, tasting notes, and settings from this phone.', logoutClear: 'Clear pantry', logoutCancel: 'Cancel',
  saveProfile: 'Save chef profile', profileFootnote: 'Your chef details stay on this phone.',
  loginTitle: 'Back to the kitchen', loginContinue: 'Open the kitchen', loginSetup: 'Set up your kitchen',
} as const;

export const TADKA_BANNED = ['bindaas','safety','safe','emergency','sos','alert','panic','police','fake','scam','impersonat','harass','stalk','location','tracking','contacts','trusted','evidence','shield','siren'];
