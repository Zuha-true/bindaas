export type Platform = 'instagram' | 'whatsapp' | 'facebook' | 'other';

export type ChecklistKey =
  | 'newAccount'
  | 'fewPosts'
  | 'asksMoneyOrPhotos'
  | 'copiedPhoto'
  | 'urgentTone'
  | 'asksToMoveApp';

export type ChecklistValues = Record<ChecklistKey, boolean>;
export type Indicator = {
  id: string;
  kind: 'auto' | 'checklist';
  label: string;
  detail: string;
  found: boolean;
};
export type DiffSegment = { text: string; changed: boolean };
export type AnalysisResult = {
  indicators: Indicator[];
  foundCount: number;
  total: 9;
  similarityPct: number;
  diff: DiffSegment[];
  notFound: string[];
  error?: string;
};
export type AnalysisInput = {
  suspect: string;
  real: string;
  platform: Platform;
  checklist: ChecklistValues;
};

export const CHECKLIST_ITEMS: ReadonlyArray<{ key: ChecklistKey; id: string; label: string }> = [
  { key: 'newAccount', id: 'new-account', label: 'Account is new' },
  { key: 'fewPosts', id: 'few-posts', label: 'Very few posts' },
  { key: 'asksMoneyOrPhotos', id: 'asks-money-or-photos', label: 'Asks for money or photos' },
  { key: 'copiedPhoto', id: 'copied-photo', label: 'Profile picture looks copied' },
  { key: 'urgentTone', id: 'urgent-tone', label: 'Uses an urgent tone' },
  { key: 'asksToMoveApp', id: 'move-app', label: 'Asks to move to another app' },
];

const SEPARATORS = /[._\-\s]/gu;
const FILLER_SUFFIXES = new Set(['official', 'real', 'backup', 'new', 'xo']);
const CONFUSABLES: Record<string, string> = {
  '0': 'o', '1': 'l', '|': 'l', '5': 's', '$': 's', '@': 'a',
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0441': 'c',
  '\u0445': 'x', '\u0443': 'y', '\u0456': 'i', '\u0458': 'j', '\u0455': 's',
  '\u043A': 'k', '\u043C': 'm', '\u0442': 't', '\u0432': 'b', '\u043D': 'h',
  '\u0410': 'a', '\u0415': 'e', '\u041E': 'o', '\u0420': 'p', '\u0421': 'c',
  '\u0425': 'x', '\u0423': 'y', '\u0406': 'i', '\u0408': 'j', '\u0405': 's',
  '\u0391': 'a', '\u03B1': 'a', '\u0395': 'e', '\u03B5': 'e', '\u039F': 'o',
  '\u03BF': 'o', '\u03A1': 'p', '\u03C1': 'p', '\u03A7': 'x', '\u03C7': 'x',
  '\u0399': 'l', '\u03B9': 'l', '\u039A': 'k', '\u03BA': 'k', '\u039C': 'm',
  '\u03BC': 'm', '\u039D': 'n', '\u03BD': 'n', '\u03A4': 't', '\u03C4': 't',
  '\u03A5': 'y', '\u03C5': 'y', '\u0396': 'z', '\u03B6': 'z',
};

function cleanHandle(value: string): string {
  return value.normalize('NFKC').trim().replace(/^@/u, '').toLowerCase().replace(SEPARATORS, '');
}

function levenshtein(left: string, right: string): number {
  const a = Array.from(left);
  const b = Array.from(right);
  if (a.length > 128 || b.length > 128) return Math.max(a.length, b.length);
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function similarity(left: string, right: string): number {
  if (!left || !right) return 0;
  return Math.round((1 - levenshtein(left, right) / Math.max(Array.from(left).length, Array.from(right).length)) * 100);
}

function confusableForm(value: string): string {
  return value.normalize('NFKC').trim().replace(/^@/u, '').replace(/I/gu, 'l').toLowerCase()
    .replace(/rn/gu, 'm').replace(/vv/gu, 'w').replace(/cl/gu, 'd')
    .replace(/[01i|5$@аевросхуіјѕкмтнАЕВРОСХУІЈЅКМТНΑαΕεΟοΡρΧχΙιΚκΜμΝνΤτΥυΖζ]/gu, char => CONFUSABLES[char] ?? char)
    .replace(SEPARATORS, '');
}

function confusableSwaps(left: string, right: string): string[] {
  const swaps: string[] = [];
  const normalizedLeft = left.normalize('NFKC').trim().replace(/^@/u, '').replace(/I/gu, 'l').toLowerCase();
  const normalizedRight = right.normalize('NFKC').trim().replace(/^@/u, '').replace(/I/gu, 'l').toLowerCase();
  const pairs: Array<[RegExp, string]> = [
    [/rn/gu, '“rn” can read like “m”'],
    [/vv/gu, '“vv” can read like “w”'],
    [/cl/gu, '“cl” can read like “d”'],
    [/[01i|5$@]/gu, 'A number or symbol can resemble a letter'],
    [/[аевросхуіјѕкмтнΑαΕεΟοΡρΧχΙιΚκΜμΝνΤτΥυΖζ]/gu, 'A Cyrillic or Greek character can resemble a Latin letter'],
  ];
  for (const [pattern, detail] of pairs) {
    pattern.lastIndex = 0;
    const matched = pattern.test(normalizedLeft) || (pattern.lastIndex = 0, pattern.test(normalizedRight));
    pattern.lastIndex = 0;
    if (matched) {
      const canonical = (value: string) => value.replace(pattern, char => CONFUSABLES[char] ?? char)
        .replace(/rn|vv|cl/gu, value => ({ rn: 'm', vv: 'w', cl: 'd' })[value] ?? value);
      const leftForm = canonical(normalizedLeft);
      const rightForm = canonical(normalizedRight);
      if (leftForm === rightForm || levenshtein(leftForm, rightForm) <= 1) swaps.push(detail);
    }
  }
  return [...new Set(swaps)];
}

function removeExtraSuffix(value: string): string {
  const parts = value.normalize('NFKC').trim().replace(/^@/u, '').toLowerCase().split(/[._\-\s]+/u).filter(Boolean);
  while (parts.length > 1 && (FILLER_SUFFIXES.has(parts[parts.length - 1]) || /^\d+$/u.test(parts[parts.length - 1]))) parts.pop();
  if (parts.length) parts[parts.length - 1] = parts[parts.length - 1].replace(/\d+$/u, '');
  return parts.join('');
}

function makeDiff(real: string, suspect: string): DiffSegment[] {
  const a = Array.from(real);
  const b = Array.from(suspect);
  if (a.length > 128 || b.length > 128) return [{ text: suspect, changed: true }];
  const table = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = a.length; i >= 0; i -= 1) {
    for (let j = b.length; j >= 0; j -= 1) {
      if (i === a.length) table[i][j] = b.length - j;
      else if (j === b.length) table[i][j] = a.length - i;
      else if (a[i] === b[j]) table[i][j] = table[i + 1][j + 1];
      else table[i][j] = 1 + Math.min(table[i + 1][j], table[i][j + 1], table[i + 1][j + 1]);
    }
  }
  const operations: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      operations.push({ text: b[j], changed: false }); i += 1; j += 1; continue;
    }
    const substitute = i < a.length && j < b.length ? table[i + 1][j + 1] : Number.POSITIVE_INFINITY;
    const remove = i < a.length ? table[i + 1][j] : Number.POSITIVE_INFINITY;
    const insert = j < b.length ? table[i][j + 1] : Number.POSITIVE_INFINITY;
    if (substitute <= remove && substitute <= insert) {
      operations.push({ text: b[j], changed: true }); i += 1; j += 1;
    } else if (insert <= remove) {
      operations.push({ text: b[j], changed: true }); j += 1;
    } else {
      operations.push({ text: '', changed: true }); i += 1;
    }
  }
  const segments: DiffSegment[] = [];
  for (const operation of operations) {
    const last = segments[segments.length - 1];
    if (last && last.changed === operation.changed) last.text += operation.text;
    else segments.push({ ...operation });
  }
  return segments.filter(segment => segment.text.length > 0);
}

export function analyzeAccount(input: AnalysisInput): AnalysisResult {
  const suspect = input.suspect.trim();
  const real = input.real.trim();
  const cleanSuspect = cleanHandle(suspect);
  const cleanReal = cleanHandle(real);
  if (!cleanSuspect || !cleanReal) {
    return {
      indicators: [],
      foundCount: 0,
      total: 9,
      similarityPct: 0,
      diff: [],
      notFound: CHECKLIST_ITEMS.map(item => item.label),
      error: 'Enter both handles to compare them.',
    };
  }

  const similarityPct = similarity(cleanSuspect, cleanReal);
  const distinctRawHandles = suspect.toLowerCase() !== real.toLowerCase();
  const similarityFound = distinctRawHandles && similarityPct >= 80;
  const normalizedSuspect = confusableForm(suspect);
  const normalizedReal = confusableForm(real);
  const swaps = confusableSwaps(suspect, real);
  const lookalikeFound = distinctRawHandles
    && (normalizedSuspect === normalizedReal || levenshtein(normalizedSuspect, normalizedReal) <= 1)
    && swaps.length > 0;
  const extraSuspect = removeExtraSuffix(suspect);
  const extraReal = removeExtraSuffix(real);
  const extrasSimilar = extraSuspect === extraReal || similarity(extraSuspect, extraReal) >= 80;
  const suffixDetail = /(?:official|real|backup|new|xo|\d+)\s*$/iu.test(suspect)
    || /(?:official|real|backup|new|xo|\d+)\s*$/iu.test(real);
  const separatorsDiffer = /[._-]/u.test(suspect) && /[._-]/u.test(real)
    && (suspect.replace(/[._-]/gu, '').toLowerCase() === real.replace(/[._-]/gu, '').toLowerCase()
      || similarity(cleanSuspect, cleanReal) >= 80);
  const separatorFound = distinctRawHandles && extrasSimilar && (suffixDetail || separatorsDiffer);
  const separatorDetail = suffixDetail
    ? 'A suffix such as a number or an extra word was added.'
    : 'A separator changed while the remaining handle stayed similar.';

  const checklistIndicator = (key: ChecklistKey) => input.checklist[key] === true;
  const indicators: Indicator[] = [
    { id: 'similar-name', kind: 'auto', label: 'Similar name', detail: similarityPct + '% match after cleaning separators.', found: similarityFound },
    { id: 'lookalike-letters', kind: 'auto', label: 'Lookalike letters', detail: swaps.length ? swaps.join('; ') : 'No mapped lookalike-letter swap was found.', found: lookalikeFound },
    { id: 'separator-extras', kind: 'auto', label: 'Separator or extras changed', detail: separatorFound ? separatorDetail : 'No separator or suffix change was detected.', found: separatorFound },
    ...CHECKLIST_ITEMS.map(item => ({
      id: item.id,
      kind: 'checklist' as const,
      label: item.label,
      detail: item.label,
      found: checklistIndicator(item.key),
    })),
  ];

  return {
    indicators,
    foundCount: indicators.filter(indicator => indicator.found).length,
    total: 9,
    similarityPct,
    diff: makeDiff(real, suspect),
    notFound: CHECKLIST_ITEMS.filter(item => !checklistIndicator(item.key)).map(item => item.label),
  };
}
