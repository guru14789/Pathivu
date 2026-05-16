import { differenceInDays, differenceInYears, addYears, isAfter } from 'date-fns';

export interface DepreciationResult {
  annualDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
  percentDepreciated?: number;
}

/**
 * Straight Line Method (SLM)
 */
export function calcSLM(cost: number, salvage: number, lifeYears: number, purchaseDate: Date): DepreciationResult {
  const annualDepreciation = lifeYears > 0 ? (cost - salvage) / lifeYears : 0;
  const today = new Date();
  
  if (isAfter(purchaseDate, today)) {
    return { annualDepreciation, accumulatedDepreciation: 0, bookValue: cost, percentDepreciated: 0 };
  }

  const daysElapsed = differenceInDays(today, purchaseDate);
  const totalDays = lifeYears * 365.25;
  
  let accumulatedDepreciation = (daysElapsed / totalDays) * (cost - salvage);
  accumulatedDepreciation = Math.min(accumulatedDepreciation, cost - salvage);
  
  const bookValue = Math.max(cost - accumulatedDepreciation, salvage);
  const percentDepreciated = ((cost - bookValue) / (cost - salvage || 1)) * 100;

  return {
    annualDepreciation: Number(annualDepreciation.toFixed(2)),
    accumulatedDepreciation: Number(accumulatedDepreciation.toFixed(2)),
    bookValue: Number(bookValue.toFixed(2)),
    percentDepreciated: Number(percentDepreciated.toFixed(2)),
  };
}

/**
 * Written Down Value Method (WDV)
 */
export function calcWDV(cost: number, rate: number, purchaseDate: Date): DepreciationResult {
  const today = new Date();
  if (isAfter(purchaseDate, today)) {
    return { annualDepreciation: 0, accumulatedDepreciation: 0, bookValue: cost };
  }

  const yearsElapsed = differenceInYears(today, purchaseDate);
  let currentBookValue = cost;
  let totalAccumulated = 0;
  let lastYearDepreciation = 0;

  for (let i = 0; i < yearsElapsed; i++) {
    lastYearDepreciation = currentBookValue * (rate / 100);
    currentBookValue -= lastYearDepreciation;
    totalAccumulated += lastYearDepreciation;
  }

  // Fractional year depreciation
  const startOfThisYear = addYears(purchaseDate, yearsElapsed);
  const daysInThisYear = differenceInDays(today, startOfThisYear);
  const currentYearDepreciation = (currentBookValue * (rate / 100)) * (daysInThisYear / 365.25);
  
  totalAccumulated += currentYearDepreciation;
  currentBookValue -= currentYearDepreciation;

  return {
    annualDepreciation: Number(lastYearDepreciation.toFixed(2)), // For the last full year
    accumulatedDepreciation: Number(totalAccumulated.toFixed(2)),
    bookValue: Number(currentBookValue.toFixed(2)),
  };
}

export function getDepreciationSummary(asset: any): DepreciationResult {
  const cost = Number(asset.purchase_cost) || 0;
  const salvage = Number(asset.salvage_value) || 0;
  const lifeYears = Number(asset.useful_life_years) || 10;
  const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : new Date();
  
  if (asset.depreciation_method === 'WDV') {
    // Assuming 15% rate for WDV if not specified
    return calcWDV(cost, 15, purchaseDate);
  }
  
  return calcSLM(cost, salvage, lifeYears, purchaseDate);
}
