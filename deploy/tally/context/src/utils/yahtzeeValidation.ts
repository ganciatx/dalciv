import type { YahtzeeCategory } from '../types';
import { getYahtzeeCategory } from '../games/yahtzeeCategories';

export type YahtzeeValidationResult =
  | { valid: true }
  | { valid: false; message: string };

/**
 * Validate a score for a Yahtzee category per the official scorecard rules.
 * Fixed categories are tap-only in the UI; this guards sum-category keypad entry.
 */
export function validateYahtzeeScore(
  category: YahtzeeCategory,
  value: number,
): YahtzeeValidationResult {
  if (!Number.isInteger(value) || value < 0) {
    return { valid: false, message: 'Enter a whole number of 0 or more.' };
  }

  if (category.kind === 'fixed') {
    if (value === 0 || value === category.fixedValue) {
      return { valid: true };
    }
    return {
      valid: false,
      message: `${category.label} must be ${category.fixedValue} or 0 (scratch).`,
    };
  }

  const max = category.maxScore ?? 30;
  if (value > max) {
    return { valid: false, message: `Max for ${category.label} is ${max}.` };
  }

  if (category.faceValue !== undefined && value > 0 && value % category.faceValue !== 0) {
    return {
      valid: false,
      message: `${category.label} must be a multiple of ${category.faceValue} (0–${max}).`,
    };
  }

  return { valid: true };
}

export function validateYahtzeeScoreById(
  categoryId: string,
  value: number,
): YahtzeeValidationResult {
  const category = getYahtzeeCategory(categoryId);
  if (!category) {
    return { valid: false, message: 'Unknown category.' };
  }
  return validateYahtzeeScore(category, value);
}

/** All legal scores for upper-section tap-to-fill chips (0, face, 2×face, … max). */
export function getYahtzeeQuickPicks(category: YahtzeeCategory): number[] {
  if (category.faceValue === undefined || category.maxScore === undefined) {
    return [];
  }
  const picks: number[] = [0];
  for (let v = category.faceValue; v <= category.maxScore; v += category.faceValue) {
    picks.push(v);
  }
  return picks;
}

/** Hint shown while entering a sum-category score. */
export function yahtzeeScoreHint(category: YahtzeeCategory): string {
  if (category.kind === 'fixed') {
    return `${category.fixedValue} or scratch (0)`;
  }
  if (category.faceValue !== undefined) {
    return `0–${category.maxScore}, multiples of ${category.faceValue}`;
  }
  return `0–${category.maxScore ?? 30}`;
}
