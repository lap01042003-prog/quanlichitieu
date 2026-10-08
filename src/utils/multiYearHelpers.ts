import { AppFinanceData, YearData, MonthlyRecord, ExpenseCategory } from '../types/finance';

/**
 * Creates empty 12-month data structure for any given calendar year
 */
export function createEmptyYearData(
  year: number,
  startingSavings: number = 0,
  defaultBudgets?: Record<string, number>
): YearData {
  const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
  const records: Record<string, MonthlyRecord> = {};

  months.forEach((mKey, idx) => {
    const monthNum = idx + 1;
    records[mKey] = {
      monthKey: mKey,
      label: `Tháng ${monthNum}`,
      expenses: {},
      incomes: {},
      budgets: defaultBudgets ? { ...defaultBudgets } : undefined,
      transactions: [],
      note: '',
    };
  });

  return {
    year,
    startingSavings,
    months,
    records,
    defaultBudgets: defaultBudgets ? { ...defaultBudgets } : undefined,
  };
}

/**
 * Computes cumulative savings at the end of a given YearData
 */
export function calculateYearEndingSavings(
  yearData: { startingSavings: number; months: string[]; records: Record<string, MonthlyRecord> },
  expenseCategories: ExpenseCategory[]
): number {
  let accumSavings = yearData.startingSavings || 0;
  const savingsCatIds = expenseCategories.filter((c) => c.isSavings).map((c) => c.id);

  for (const m of yearData.months) {
    const rec = yearData.records[m];
    if (rec && rec.expenses) {
      for (const sId of savingsCatIds) {
        accumSavings += rec.expenses[sId] || 0;
      }
    }
  }

  return accumSavings;
}

/**
 * Smoothly switches active year, saving current year's state and loading target year's state
 */
export function switchActiveYear(data: AppFinanceData, targetYear: number): AppFinanceData {
  const currentYear = data.selectedYear || 2026;
  if (currentYear === targetYear) return data;

  // 1. Snapshot current year
  const yearsData: Record<number, YearData> = { ...(data.yearsData || {}) };
  yearsData[currentYear] = {
    year: currentYear,
    startingSavings: data.startingSavings,
    months: [...data.months],
    records: { ...data.records },
    defaultBudgets: data.defaultBudgets ? { ...data.defaultBudgets } : undefined,
  };

  // 2. Prepare or retrieve target year
  let targetYearData = yearsData[targetYear];
  if (!targetYearData) {
    // Calculate intelligent starting savings: carry over from closest prior year if possible
    let carryOverSavings = 0;
    const sortedYears = Object.keys(yearsData)
      .map(Number)
      .sort((a, b) => a - b);

    const priorYears = sortedYears.filter((y) => y < targetYear);
    if (priorYears.length > 0) {
      const closestPrior = priorYears[priorYears.length - 1];
      carryOverSavings = calculateYearEndingSavings(yearsData[closestPrior], data.expenseCategories);
    } else {
      carryOverSavings = data.startingSavings || 14000000;
    }

    targetYearData = createEmptyYearData(targetYear, carryOverSavings, data.defaultBudgets);
    yearsData[targetYear] = targetYearData;
  }

  // 3. Ensure targetYear is in availableYears
  const availableYears = Array.from(new Set([...(data.availableYears || [2026]), targetYear])).sort((a, b) => a - b);

  return {
    ...data,
    selectedYear: targetYear,
    availableYears,
    startingSavings: targetYearData.startingSavings,
    months: [...targetYearData.months],
    records: { ...targetYearData.records },
    defaultBudgets: targetYearData.defaultBudgets || data.defaultBudgets,
    yearsData,
  };
}

/**
 * Add a new year to the system and immediately switch to it
 */
export function addNewYearToData(data: AppFinanceData, newYear: number): AppFinanceData {
  return switchActiveYear(data, newYear);
}
