export interface ExpenseCategory {
  id: string;
  name: string;
  icon?: string;
  isSavings?: boolean; // e.g. "Tiền tiết kiệm"
  color?: string;
}

export interface IncomeStream {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  monthKey: string;
  categoryId: string; // expense or income ID
  type: 'expense' | 'income';
  amount: number;
  description: string;
  date: string;
}

export interface MonthlyRecord {
  monthKey: string; // "T9", "T10", "T11", "T12" or "T1".."T12"
  label: string;    // "Tháng 9", "Tháng 10", ...
  expenses: Record<string, number>; // categoryId -> amount
  incomes: Record<string, number>;  // incomeId -> amount
  budgets?: Record<string, number>; // categoryId -> budget limit amount
  transactions?: Transaction[];
  note?: string;
}

export interface YearData {
  year: number;
  startingSavings: number;
  months: string[]; // e.g. ["T1", "T2", ... "T12"] or ["T9", "T10", "T11", "T12"]
  records: Record<string, MonthlyRecord>;
  defaultBudgets?: Record<string, number>;
}

export interface AppFinanceData {
  version: number;
  selectedYear: number; // e.g. 2026, 2027, 2028
  availableYears: number[]; // e.g. [2025, 2026, 2027, 2028]
  startingSavings: number; // starting savings for current selected year
  months: string[]; // months for current selected year
  records: Record<string, MonthlyRecord>; // monthKey -> MonthlyRecord for current selected year
  yearsData?: Record<number, YearData>; // multi-year store for all years
  expenseCategories: ExpenseCategory[];
  incomeStreams: IncomeStream[];
  defaultBudgets?: Record<string, number>; // fallback default budget for categories
  lastSyncedAt?: string;
  googleSheetUrl?: string;
  googleScriptWebhookUrl?: string;
  autoSyncToGoogleSheet?: boolean;
  lastPushedToSheetAt?: string;
}
