import type { YahtzeeCategory } from '../types';

const FACE_VALUES: Record<string, number> = {
  ones: 1,
  twos: 2,
  threes: 3,
  fours: 4,
  fives: 5,
  sixes: 6,
};

function upperCategory(id: string, label: string): YahtzeeCategory {
  const face = FACE_VALUES[id]!;
  return {
    id,
    label,
    section: 'upper',
    kind: 'sum',
    faceValue: face,
    maxScore: face * 5,
  };
}

/** Upper section: count-and-add only matching dice (max = face × 5). */
const UPPER: YahtzeeCategory[] = [
  upperCategory('ones', 'Ones'),
  upperCategory('twos', 'Twos'),
  upperCategory('threes', 'Threes'),
  upperCategory('fours', 'Fours'),
  upperCategory('fives', 'Fives'),
  upperCategory('sixes', 'Sixes'),
];

/** Lower section: sum-of-all-dice boxes cap at 30; fixed boxes use tap-only entry. */
const LOWER: YahtzeeCategory[] = [
  { id: 'threeOfKind', label: 'Three of a Kind', section: 'lower', kind: 'sum', maxScore: 30 },
  { id: 'fourOfKind', label: 'Four of a Kind', section: 'lower', kind: 'sum', maxScore: 30 },
  { id: 'fullHouse', label: 'Full House', section: 'lower', kind: 'fixed', fixedValue: 25 },
  { id: 'smallStraight', label: 'Small Straight', section: 'lower', kind: 'fixed', fixedValue: 30 },
  { id: 'largeStraight', label: 'Large Straight', section: 'lower', kind: 'fixed', fixedValue: 40 },
  { id: 'yahtzee', label: 'Yahtzee', section: 'lower', kind: 'fixed', fixedValue: 50 },
  { id: 'chance', label: 'Chance', section: 'lower', kind: 'sum', maxScore: 30 },
];

export const YAHTZEE_CATEGORIES: YahtzeeCategory[] = [...UPPER, ...LOWER];

export const YAHTZEE_UPPER_IDS = UPPER.map((c) => c.id);
export const YAHTZEE_LOWER_IDS = LOWER.map((c) => c.id);

export function getYahtzeeCategory(categoryId: string): YahtzeeCategory | undefined {
  return YAHTZEE_CATEGORIES.find((c) => c.id === categoryId);
}
