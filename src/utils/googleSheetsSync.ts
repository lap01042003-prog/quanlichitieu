import { AppFinanceData, MonthlyRecord, Transaction, ExpenseCategory, IncomeStream } from '../types/finance';
import { formatVND, parseMoneyInput, formatPercentChange, getMonthDisplay } from './formatters';

export interface MonthSummary {
  monthKey: string;
  label: string;
  totalIncome: number;
  totalExpense: number;   // sum of all expenses including savings transfer
  actualSpend: number;    // sum of expenses excluding savings transfer (thực chi sinh hoạt)
  monthlySavings: number; // amount transferred to savings
  surplus: number;        // totalIncome - totalExpense
  accumulatedSavings: number; // cumulative savings up to this month
  hasData: boolean;       // whether this month has real data recorded
}

export interface FinancialInsights {
  cashFlowStatus: 'surplus' | 'deficit' | 'balanced';
  cashFlowMessage: string;
  topExpenseName: string;
  topExpenseAmount: number;
  topExpensePercentage: number;
  savingsRate: number;
  savingsRateMessage: string;
  momLargestIncrease?: {
    categoryName: string;
    diff: number;
    percent: number;
    currentAmount: number;
  };
  momLargestDecrease?: {
    categoryName: string;
    diff: number;
    percent: number;
    currentAmount: number;
  };
  spendingAlerts: string[];
}

export function calculateAllMonthSummaries(data: AppFinanceData): Record<string, MonthSummary> {
  const summaries: Record<string, MonthSummary> = {};
  let currentAccumulatedSavings = data.startingSavings || 14000000;

  for (const monthKey of data.months) {
    const record = data.records[monthKey] || {
      monthKey,
      label: monthKey,
      expenses: {},
      incomes: {},
    };

    let totalIncome = 0;
    for (const inc of data.incomeStreams) {
      totalIncome += record.incomes?.[inc.id] || 0;
    }

    let totalExpense = 0;
    let monthlySavings = 0;
    let actualSpend = 0;

    for (const exp of data.expenseCategories) {
      const val = record.expenses?.[exp.id] || 0;
      totalExpense += val;
      if (exp.isSavings) {
        monthlySavings += val;
      } else {
        actualSpend += val;
      }
    }

    currentAccumulatedSavings += monthlySavings;

    const surplus = totalIncome - totalExpense;
    // Month has real active data if totalIncome > 0 or actualSpend > 0
    const hasData = totalIncome > 0 || actualSpend > 0;

    summaries[monthKey] = {
      monthKey,
      label: record.label || getMonthDisplay(monthKey),
      totalIncome,
      totalExpense,
      actualSpend,
      monthlySavings,
      surplus,
      accumulatedSavings: currentAccumulatedSavings,
      hasData,
    };
  }

  return summaries;
}

/**
 * Generate actionable data analyst insights from actual numbers
 */
export function generateFinancialInsights(
  data: AppFinanceData,
  selectedMonth: string,
  summaries: Record<string, MonthSummary>
): FinancialInsights {
  const current = summaries[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    totalIncome: 0,
    totalExpense: 0,
    actualSpend: 0,
    monthlySavings: 0,
    surplus: 0,
    accumulatedSavings: data.startingSavings,
    hasData: false,
  };

  const record = data.records[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    expenses: {},
    incomes: {},
  };

  // Find previous month that has data or previous month in chronological list
  const monthIdx = data.months.indexOf(selectedMonth);
  const prevMonthKey = monthIdx > 0 ? data.months[monthIdx - 1] : undefined;
  const prevRecord = prevMonthKey ? data.records[prevMonthKey] : undefined;
  const prevSummary = prevMonthKey ? summaries[prevMonthKey] : undefined;

  // 1. Cash flow status
  let cashFlowStatus: 'surplus' | 'deficit' | 'balanced' = 'balanced';
  let cashFlowMessage = '';

  if (current.surplus > 0) {
    cashFlowStatus = 'surplus';
    cashFlowMessage = `Thu nhập tháng vượt chi tiêu ${formatVND(current.surplus)}. Dòng tiền thặng dư an toàn sau khi đã trích ${formatVND(current.monthlySavings)} vào quỹ tích lũy.`;
  } else if (current.surplus < 0) {
    cashFlowStatus = 'deficit';
    if (current.totalIncome < 6000000 && !record.incomes['inc_dot2']) {
      cashFlowMessage = `Hiện tại chi vượt thu ${formatVND(Math.abs(current.surplus))} do mới chỉ nhận lương đợt 1 và đã trích trước ${formatVND(current.monthlySavings)} vào tiết kiệm. Sẽ cân đối trở lại sau khi nhận đợt 2.`;
    } else {
      cashFlowMessage = `Chi tiêu vượt thu nhập ${formatVND(Math.abs(current.surplus))}. Cần xem xét cắt giảm các khoản chi không thiết yếu.`;
    }
  } else {
    cashFlowMessage = `Thu chi tháng đạt mức cân bằng 100%.`;
  }

  // 2. Top spending category
  let topExpenseName = 'Chưa có';
  let topExpenseAmount = 0;
  let topExpensePercentage = 0;

  const validExpenses = data.expenseCategories
    .filter(c => !c.isSavings)
    .map(c => ({
      name: c.name,
      amount: record.expenses[c.id] || 0,
    }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (validExpenses.length > 0) {
    topExpenseName = validExpenses[0].name;
    topExpenseAmount = validExpenses[0].amount;
    topExpensePercentage = current.actualSpend > 0 
      ? Math.round((topExpenseAmount / current.actualSpend) * 100) 
      : 0;
  }

  // 3. Savings rate (% of total income)
  const savingsRate = current.totalIncome > 0 
    ? Math.round((current.monthlySavings / current.totalIncome) * 1000) / 10
    : 0;
  
  let savingsRateMessage = '';
  if (savingsRate >= 30) {
    savingsRateMessage = `Tỷ lệ tiết kiệm xuất sắc (${savingsRate}% thu nhập). Bạn đang duy trì kỷ luật tài chính rất vững vàng.`;
  } else if (savingsRate >= 15) {
    savingsRateMessage = `Tỷ lệ tiết kiệm tốt (${savingsRate}% thu nhập), đạt tiêu chuẩn khuyến nghị 15-20%.`;
  } else if (current.monthlySavings > 0) {
    savingsRateMessage = `Đã trích ${formatVND(current.monthlySavings)} vào tích lũy (${savingsRate}% thu nhập).`;
  } else {
    savingsRateMessage = `Tháng này chưa ghi nhận khoản trích tiết kiệm.`;
  }

  // 4. MoM comparisons
  let momLargestIncrease: FinancialInsights['momLargestIncrease'];
  let momLargestDecrease: FinancialInsights['momLargestDecrease'];

  if (prevRecord && prevSummary && prevSummary.hasData) {
    let maxInc = 0;
    let maxIncItem: any = null;
    let maxDec = 0;
    let maxDecItem: any = null;

    data.expenseCategories
      .filter(c => !c.isSavings)
      .forEach(cat => {
        const currVal = record.expenses[cat.id] || 0;
        const prevVal = prevRecord.expenses[cat.id] || 0;
        const diff = currVal - prevVal;

        if (diff > maxInc) {
          maxInc = diff;
          const pct = prevVal > 0 ? Math.round((diff / prevVal) * 100) : 100;
          maxIncItem = {
            categoryName: cat.name,
            diff,
            percent: pct,
            currentAmount: currVal,
          };
        } else if (diff < maxDec) {
          maxDec = diff;
          const pct = prevVal > 0 ? Math.round((Math.abs(diff) / prevVal) * 100) : 100;
          maxDecItem = {
            categoryName: cat.name,
            diff: Math.abs(diff),
            percent: pct,
            currentAmount: currVal,
          };
        }
      });

    momLargestIncrease = maxIncItem;
    momLargestDecrease = maxDecItem;
  }

  // 5. Actionable alerts
  const spendingAlerts: string[] = [];
  if (topExpensePercentage > 50) {
    spendingAlerts.push(`Khoản "${topExpenseName}" chiếm đến ${topExpensePercentage}% tổng chi hoạt động sinh hoạt.`);
  }
  if (momLargestIncrease && momLargestIncrease.diff >= 500000) {
    spendingAlerts.push(`Khoản "${momLargestIncrease.categoryName}" tăng mạnh nhất (+${formatVND(momLargestIncrease.diff)}) so với ${getMonthDisplay(prevMonthKey || '')}.`);
  }
  if (momLargestDecrease && momLargestDecrease.diff >= 500000) {
    spendingAlerts.push(`Khoản "${momLargestDecrease.categoryName}" giảm nhiều nhất (-${formatVND(momLargestDecrease.diff)}) so với ${getMonthDisplay(prevMonthKey || '')}.`);
  }

  return {
    cashFlowStatus,
    cashFlowMessage,
    topExpenseName,
    topExpenseAmount,
    topExpensePercentage,
    savingsRate,
    savingsRateMessage,
    momLargestIncrease,
    momLargestDecrease,
    spendingAlerts,
  };
}

/**
 * Format CSV matching the exact user structure
 */
export function exportToUserCSV(data: AppFinanceData): string {
  const summaries = calculateAllMonthSummaries(data);
  const rows: string[] = [];

  // 1. Header for Expenses
  rows.push([ '', ...data.months ].join(','));

  // 2. Expense categories
  for (const exp of data.expenseCategories) {
    const rowVals = [ `"${exp.name.replace(/"/g, '""')}"` ];
    for (const m of data.months) {
      const val = data.records[m]?.expenses?.[exp.id] ?? 0;
      rowVals.push(val > 0 ? `"${val.toLocaleString('vi-VN')}"` : '0');
    }
    rows.push(rowVals.join(','));
  }

  // 3. Tổng chi
  const tongChiRow = [ '"Tổng"' ];
  for (const m of data.months) {
    const sum = summaries[m]?.totalExpense ?? 0;
    tongChiRow.push(sum > 0 ? `"${sum.toLocaleString('vi-VN')}"` : '0');
  }
  rows.push(tongChiRow.join(','));

  // 4. Dư
  const duRow = [ '"Dư"' ];
  for (const m of data.months) {
    const du = summaries[m]?.surplus ?? 0;
    duRow.push(du !== 0 ? `"${du.toLocaleString('vi-VN')}"` : '0');
  }
  rows.push(duRow.join(','));

  // Spacer
  rows.push(',,,,');
  rows.push(',,,,');

  // 5. Tiền tiết kiệm tích lũy
  rows.push([ '"Tiền tiết kiệm"', ...data.months ].join(','));
  const tietKiemVals = [ `${data.startingSavings}` ];
  for (const m of data.months) {
    const accum = summaries[m]?.accumulatedSavings ?? 0;
    tietKiemVals.push(`"${accum.toLocaleString('vi-VN')}"`);
  }
  rows.push(tietKiemVals.join(','));

  // Spacer
  rows.push(',,,,');
  rows.push(',,,,');

  // 6. Incomes
  for (const inc of data.incomeStreams) {
    const rowVals = [ `"${inc.name.replace(/"/g, '""')}"` ];
    for (const m of data.months) {
      const val = data.records[m]?.incomes?.[inc.id] ?? 0;
      rowVals.push(val > 0 ? `"${val.toLocaleString('vi-VN')}"` : '0');
    }
    rows.push(rowVals.join(','));
  }

  // 7. Tổng thu nhập
  const tongThuRow = [ '"Tổng thu nhập"' ];
  for (const m of data.months) {
    const totalInc = summaries[m]?.totalIncome ?? 0;
    tongThuRow.push(totalInc > 0 ? `"${totalInc.toLocaleString('vi-VN')}"` : '0');
  }
  rows.push(tongThuRow.join(','));

  return rows.join('\r\n');
}

/**
 * Split CSV line taking quotes into account
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalize Vietnamese category and income names for resilient matching
 */
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/đọt/g, 'đợt')
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim();
}

/**
 * Detect sheet format and parse CSV into AppFinanceData
 * Supports:
 * 1. Multi-month summary matrix (,T9,T10,T11,T12...)
 * 2. Daily matrix sheet (Ngày, Nhà, Điện, Ăn...)
 * 3. Daily transaction ledger (Ngày, Khoản chi / Danh mục, Số tiền, Diễn giải)
 */
export function parseCSVToFinanceData(
  csvText: string, 
  currentData: AppFinanceData, 
  monthHint?: string
): AppFinanceData {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    throw new Error('Dữ liệu CSV không hợp lệ hoặc quá ngắn.');
  }

  const headerCols = parseCsvLine(lines[0]);
  const headerLower = headerCols.map(c => c.toLowerCase().trim());

  // Detect Format 1: Multi-Month Summary (Headers have T9, T10, T11 or Tháng 9...)
  const isMultiMonthSummary = headerCols.some(c => {
    const clean = c.replace(/"/g, '').trim();
    return clean.startsWith('T') && !isNaN(Number(clean.slice(1)));
  });

  // Detect Format 3: Transaction Ledger (Columns: Ngày, Danh mục/Khoản chi, Số tiền...)
  const dateColIdx = headerLower.findIndex(c => c.includes('ngày') || c.includes('date'));
  const amountColIdx = headerLower.findIndex(c => c.includes('tiền') || c.includes('số tiền') || c.includes('chi') || c.includes('amount'));
  const catColIdx = headerLower.findIndex(c => c.includes('danh mục') || c.includes('khoản chi') || c.includes('loại') || c.includes('nội dung') || c.includes('category'));
  const descColIdx = headerLower.findIndex(c => c.includes('diễn giải') || c.includes('ghi chú') || c.includes('mô tả') || c.includes('note'));

  const isTransactionLedger = dateColIdx !== -1 && amountColIdx !== -1 && catColIdx !== -1;

  // Format 2: Daily Matrix (Date column + category columns)
  const isDailyMatrix = !isMultiMonthSummary && dateColIdx !== -1 && headerCols.length > 3;

  if (isTransactionLedger && !isDailyMatrix) {
    return parseTransactionLedgerCSV(lines, headerCols, currentData, monthHint);
  }

  if (isDailyMatrix) {
    return parseDailyMatrixCSV(lines, headerCols, currentData, monthHint);
  }

  // Otherwise, default to Multi-Month Summary parser
  return parseMultiMonthSummaryCSV(lines, headerCols, currentData);
}

/**
 * Parse Multi-Month Summary CSV (,T9,T10,T11,T12)
 */
function parseMultiMonthSummaryCSV(lines: string[], headerCols: string[], currentData: AppFinanceData): AppFinanceData {
  let months: string[] = [];
  for (let i = 1; i < headerCols.length; i++) {
    const col = headerCols[i].replace(/"/g, '').trim();
    if (col && (col.startsWith('T') || !isNaN(Number(col)))) {
      months.push(col.startsWith('T') ? col : `T${col}`);
    }
  }

  if (months.length === 0) {
    months = ['T9', 'T10', 'T11', 'T12'];
  }

  const records: Record<string, MonthlyRecord> = {};
  for (const m of months) {
    records[m] = {
      monthKey: m,
      label: m.startsWith('T') && !isNaN(Number(m.slice(1))) ? `Tháng ${m.slice(1)}` : m,
      expenses: {},
      incomes: {},
      budgets: currentData.records[m]?.budgets ? { ...currentData.records[m]!.budgets } : undefined,
      transactions: currentData.records[m]?.transactions ? [...currentData.records[m]!.transactions!] : [],
      note: currentData.records[m]?.note || '',
    };
  }

  let parsingSection: 'expense' | 'savings' | 'income' = 'expense';
  let startingSavings = currentData.startingSavings || 14000000;
  const expenseCategories = [...currentData.expenseCategories];
  const incomeStreams = [...currentData.incomeStreams];

  for (let idx = 1; idx < lines.length; idx++) {
    const cols = parseCsvLine(lines[idx]);
    if (cols.length === 0 || cols.every(c => c === '')) continue;

    const rowTitle = (cols[0] || '').replace(/"/g, '').trim();
    if (!rowTitle) continue;
    const lower = rowTitle.toLowerCase();
    const normalizedRow = normalizeName(rowTitle);

    if (lower.includes('tiền tiết kiệm') && cols.length > 1 && (cols[1].startsWith('T') || cols[1] === months[0])) {
      parsingSection = 'savings';
      continue;
    }

    if (lower.startsWith('thu nhập')) {
      parsingSection = 'income';
    }

    if (rowTitle === 'Tổng' || rowTitle === 'Dư' || rowTitle === 'Tổng thu nhập') {
      continue;
    }

    const hasAnyValue = months.some((_, colIdx) => {
      const v = cols[colIdx + 1];
      return v !== undefined && v !== '' && parseMoneyInput(v) > 0;
    });

    if (parsingSection === 'savings') {
      const numVal = parseMoneyInput(cols[0]);
      if (numVal > 0) {
        startingSavings = numVal;
      }
      continue;
    }

    if (parsingSection === 'expense') {
      let cat = expenseCategories.find(c => normalizeName(c.name) === normalizedRow);
      if (!cat) {
        if (!hasAnyValue) continue;

        cat = {
          id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: rowTitle,
          isSavings: lower.includes('tiết kiệm'),
          color: lower.includes('tiết kiệm') ? '#16a34a' : '#6366f1',
        };
        expenseCategories.push(cat);
      }

      months.forEach((m, colIdx) => {
        const rawVal = cols[colIdx + 1];
        if (rawVal !== undefined && rawVal !== '') {
          const num = parseMoneyInput(rawVal);
          if (records[m]) {
            records[m].expenses[cat.id] = num;

            const mNum = m.startsWith('T') && !isNaN(Number(m.slice(1))) ? m.slice(1).padStart(2, '0') : '10';
            const txs = records[m].transactions || [];
            const catTxs = txs.filter(t => t.type === 'expense' && t.categoryId === cat.id);
            const currentCatSum = catTxs.reduce((sum, t) => sum + t.amount, 0);

            if (catTxs.length === 0 && num > 0) {
              // No daily transactions exist yet, add placeholder
              txs.push({
                id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                monthKey: m,
                categoryId: cat.id,
                type: 'expense',
                amount: num,
                description: cat.name,
                date: `2026-${mNum}-05`,
              });
            } else if (catTxs.length === 1 && currentCatSum !== num) {
              // Only 1 placeholder transaction existed, update amount
              catTxs[0].amount = num;
            }
            // If catTxs.length > 1, preserve the detailed daily transactions!
          }
        }
      });
    } else if (parsingSection === 'income') {
      let inc = incomeStreams.find(s => {
        const sNorm = normalizeName(s.name);
        if (sNorm === normalizedRow) return true;
        if (normalizedRow.includes('đợt 2') && sNorm.includes('đợt 2')) return true;
        if (normalizedRow.includes('đợt 1') && sNorm.includes('đợt 1')) return true;
        return false;
      });

      if (!inc) {
        if (!hasAnyValue) continue;

        inc = {
          id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: rowTitle,
        };
        incomeStreams.push(inc);
      }

      months.forEach((m, colIdx) => {
        const rawVal = cols[colIdx + 1];
        if (rawVal !== undefined && rawVal !== '') {
          const num = parseMoneyInput(rawVal);
          if (records[m]) {
            records[m].incomes[inc.id] = num;

            const mNum = m.startsWith('T') && !isNaN(Number(m.slice(1))) ? m.slice(1).padStart(2, '0') : '10';
            const defaultDay = inc.id.includes('dot2') || inc.name.includes('2') ? '25' : '05';
            const txs = records[m].transactions || [];
            const existingIncTx = txs.find(t => t.type === 'income' && t.categoryId === inc.id);
            if (num > 0) {
              if (existingIncTx) {
                existingIncTx.amount = num;
              } else {
                txs.push({
                  id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                  monthKey: m,
                  categoryId: inc.id,
                  type: 'income',
                  amount: num,
                  description: inc.name,
                  date: `2026-${mNum}-${defaultDay}`,
                });
              }
            } else if (existingIncTx) {
              records[m].transactions = txs.filter(t => !(t.type === 'income' && t.categoryId === inc.id));
            }
          }
        }
      });
    }
  }

  return {
    ...currentData,
    months,
    startingSavings,
    expenseCategories,
    incomeStreams,
    records,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Map column name to category or income stream with resilient alias matching
 */
export function mapColumnToCategory(
  colName: string, 
  expenseCategories: ExpenseCategory[], 
  incomeStreams: IncomeStream[]
): { id: string; name: string; type: 'expense' | 'income' } | null {
  const norm = normalizeName(colName);
  const lower = colName.toLowerCase().trim();

  // Skip summary / total columns
  if (lower === 'tổng' || lower === 'tổng cộng' || lower === 'total' || lower === 'sum' || lower === 'ngày' || lower === 'date') {
    return null;
  }

  // Income columns
  if (norm.startsWith('thu nhập') || norm.includes('lương') || norm.includes('thưởng')) {
    if (norm.includes('2') || norm.includes('đợt 2')) {
      const inc = incomeStreams.find(s => normalizeName(s.name).includes('2'));
      if (inc) return { id: inc.id, name: inc.name, type: 'income' };
    }
    const inc1 = incomeStreams.find(s => normalizeName(s.name).includes('1')) || incomeStreams[0];
    if (inc1) return { id: inc1.id, name: inc1.name, type: 'income' };
  }

  // 1. "Date" / "Đi chơi Tiên" -> exp_dichoi_tien
  if (lower === 'date' || norm.includes('tiên') || norm.includes('người yêu')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('tiên'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 2. "Đi chơi" / "Đi chơi Bạn" -> exp_dichoi_ban
  if (norm === 'đi chơi' || norm.includes('bạn') || norm.includes('cafe')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('bạn'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 3. "Tiền mua đồ" / "Mua đồ" / "Shopee" -> exp_shopee
  if (norm.includes('mua đồ') || norm.includes('shopee') || norm.includes('sắm')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('shopee'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 4. "Tiền 5G" / "Nước lọc" / "Cắt tóc" / "Cá nhân" -> exp_canhan
  if (norm.includes('5g') || norm.includes('nước lọc') || norm.includes('cắt tóc') || norm.includes('cá nhân')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('cá nhân'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 5. "Tiền ăn uống" / "Ăn uống" / "Ăn" -> exp_an
  if (norm.includes('ăn')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('ăn'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 6. "Tiền Grab" / "Grab" -> exp_grab
  if (norm.includes('grab') || norm.includes('taxi')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('grab'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 7. "Tiền Xăng" / "Xăng" -> exp_xang
  if (norm.includes('xăng')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('xăng'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 8. "Gửi xe" / "Giữ xe" -> exp_giuxe
  if (norm.includes('xe')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('xe'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 9. "Nhà" / "Tiền nhà" / "Phòng" -> exp_nha
  if (norm.includes('nhà') || norm.includes('phòng')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('nhà'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 10. "Điện" / "Tiền điện" -> exp_dien
  if (norm.includes('điện')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('điện'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 11. "Về quê" -> exp_veque
  if (norm.includes('quê')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('quê'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // 12. "Tiết kiệm" / "Tiền tiết kiệm" -> exp_tietkiem
  if (norm.includes('tiết kiệm')) {
    const cat = expenseCategories.find(c => normalizeName(c.name).includes('tiết kiệm'));
    if (cat) return { id: cat.id, name: cat.name, type: 'expense' };
  }

  // Direct match with existing category
  const directCat = expenseCategories.find(c => normalizeName(c.name) === norm);
  if (directCat) return { id: directCat.id, name: directCat.name, type: 'expense' };

  // New category creation
  const newId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newCat = {
    id: newId,
    name: colName,
    color: '#6366f1',
  };
  expenseCategories.push(newCat);
  return { id: newId, name: colName, type: 'expense' };
}

/**
 * Parse Daily Matrix CSV:
 * Header: Ngày, Đi chơi, Tiền Grab, Tiền 5G, Tiền Xăng, Tiền ăn uống, Nước lọc, Tiền mua đồ, Nhà, Gửi xe, Date, Cắt tóc, Tổng
 * Rows: 1/9, 84000, ...
 */
function parseDailyMatrixCSV(lines: string[], headerCols: string[], currentData: AppFinanceData, monthHint?: string): AppFinanceData {
  const expenseCategories = [...currentData.expenseCategories];
  const incomeStreams = [...currentData.incomeStreams];

  // Map each column index to matched category
  const colMap: Record<number, { id: string; name: string; type: 'expense' | 'income' }> = {};
  for (let c = 1; c < headerCols.length; c++) {
    const colName = headerCols[c].replace(/"/g, '').trim();
    if (!colName) continue;
    const mapping = mapColumnToCategory(colName, expenseCategories, incomeStreams);
    if (mapping) {
      colMap[c] = mapping;
    }
  }

  // Automatically detect month from the first rows (e.g., "1/9", "01/10", "1/11", "1/12")
  let targetMonth = monthHint || 'T10';
  for (let r = 1; r < Math.min(lines.length, 5); r++) {
    const cols = parseCsvLine(lines[r]);
    if (cols.length > 0) {
      const cell = cols[0].replace(/"/g, '').trim();
      const slashMatch = cell.match(/(\d+)[/-](\d+)/);
      if (slashMatch) {
        const m = parseInt(slashMatch[2], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) {
          targetMonth = `T${m}`;
          break;
        }
      }
    }
  }

  const mNum = targetMonth.startsWith('T') && !isNaN(Number(targetMonth.slice(1)))
    ? targetMonth.slice(1).padStart(2, '0')
    : '10';

  const newTransactions: Transaction[] = [];
  const expensesSum: Record<string, number> = {};
  const incomesSum: Record<string, number> = {};

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);
    if (cols.length === 0 || cols.every(c => c === '')) continue;

    const dayRaw = cols[0].replace(/"/g, '').trim();
    const dayMatch = dayRaw.match(/\d+/);
    if (!dayMatch) continue;
    const dayNum = parseInt(dayMatch[0], 10);
    if (dayNum < 1 || dayNum > 31) continue;

    const paddedDay = dayNum.toString().padStart(2, '0');
    const dateStr = `2026-${mNum}-${paddedDay}`;

    Object.keys(colMap).forEach((colIdxStr) => {
      const colIdx = Number(colIdxStr);
      const valRaw = cols[colIdx];
      if (!valRaw) return;
      const amt = parseMoneyInput(valRaw);
      if (amt <= 0) return;

      const mapping = colMap[colIdx];
      if (!mapping) return;

      newTransactions.push({
        id: `tx_${targetMonth}_${paddedDay}_${mapping.id}_${colIdx}`,
        monthKey: targetMonth,
        categoryId: mapping.id,
        type: mapping.type,
        amount: amt,
        description: mapping.name,
        date: dateStr,
      });

      if (mapping.type === 'expense') {
        expensesSum[mapping.id] = (expensesSum[mapping.id] || 0) + amt;
      } else {
        incomesSum[mapping.id] = (incomesSum[mapping.id] || 0) + amt;
      }
    });
  }

  // Ensure targetMonth exists in months
  const months = currentData.months.includes(targetMonth) 
    ? [...currentData.months] 
    : [...currentData.months, targetMonth];

  const records = { ...currentData.records };
  records[targetMonth] = {
    monthKey: targetMonth,
    label: targetMonth.startsWith('T') && !isNaN(Number(targetMonth.slice(1))) ? `Tháng ${targetMonth.slice(1)}` : targetMonth,
    expenses: expensesSum,
    incomes: incomesSum,
    budgets: currentData.records[targetMonth]?.budgets ? { ...currentData.records[targetMonth]!.budgets } : undefined,
    transactions: newTransactions,
  };

  return {
    ...currentData,
    months,
    expenseCategories,
    incomeStreams,
    records,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Parse Transaction Ledger CSV:
 * Header: Ngày, Danh mục, Số tiền, Diễn giải
 */
function parseTransactionLedgerCSV(lines: string[], headerCols: string[], currentData: AppFinanceData, monthHint?: string): AppFinanceData {
  const headerLower = headerCols.map(c => c.toLowerCase().trim());
  const dateColIdx = headerLower.findIndex(c => c.includes('ngày') || c.includes('date'));
  const amountColIdx = headerLower.findIndex(c => c.includes('tiền') || c.includes('số tiền') || c.includes('chi') || c.includes('amount'));
  const catColIdx = headerLower.findIndex(c => c.includes('danh mục') || c.includes('khoản chi') || c.includes('loại') || c.includes('nội dung') || c.includes('category'));
  const descColIdx = headerLower.findIndex(c => c.includes('diễn giải') || c.includes('ghi chú') || c.includes('mô tả') || c.includes('note'));

  const expenseCategories = [...currentData.expenseCategories];
  const incomeStreams = [...currentData.incomeStreams];
  const newTransactionsByMonth: Record<string, Transaction[]> = {};

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);
    if (cols.length === 0) continue;

    const dateRaw = cols[dateColIdx]?.replace(/"/g, '').trim() || '';
    const catRaw = cols[catColIdx]?.replace(/"/g, '').trim() || '';
    const amtRaw = cols[amountColIdx]?.replace(/"/g, '').trim() || '';
    const descRaw = descColIdx !== -1 ? cols[descColIdx]?.replace(/"/g, '').trim() || '' : catRaw;

    const amt = parseMoneyInput(amtRaw);
    if (amt <= 0 || !catRaw) continue;

    // Detect month from date
    let mKey = monthHint || 'T10';
    let dateStr = dateRaw;
    const parts = dateRaw.split(/[-/]/);
    if (parts.length === 3) {
      const monthPart = parts[0].length === 4 ? parseInt(parts[1], 10) : parseInt(parts[1], 10);
      if (!isNaN(monthPart) && monthPart >= 1 && monthPart <= 12) {
        mKey = `T${monthPart}`;
      }
    }

    const normCat = normalizeName(catRaw);
    const isIncome = normCat.includes('thu nhập') || normCat.includes('lương') || normCat.includes('thưởng');

    let catId = '';
    if (isIncome) {
      let inc = incomeStreams.find(s => normalizeName(s.name) === normCat);
      if (!inc) {
        inc = { id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: catRaw };
        incomeStreams.push(inc);
      }
      catId = inc.id;
    } else {
      let exp = expenseCategories.find(c => normalizeName(c.name) === normCat);
      if (!exp) {
        exp = {
          id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: catRaw,
          isSavings: normCat.includes('tiết kiệm'),
          color: normCat.includes('tiết kiệm') ? '#16a34a' : '#6366f1',
        };
        expenseCategories.push(exp);
      }
      catId = exp.id;
    }

    if (!newTransactionsByMonth[mKey]) newTransactionsByMonth[mKey] = [];
    newTransactionsByMonth[mKey].push({
      id: `tx_ledger_${Date.now()}_${r}`,
      monthKey: mKey,
      categoryId: catId,
      type: isIncome ? 'income' : 'expense',
      amount: amt,
      description: descRaw || catRaw,
      date: dateStr,
    });
  }

  const records = { ...currentData.records };
  Object.keys(newTransactionsByMonth).forEach(mKey => {
    const txs = newTransactionsByMonth[mKey];
    const expenses: Record<string, number> = {};
    const incomes: Record<string, number> = {};

    txs.forEach(t => {
      if (t.type === 'expense') {
        expenses[t.categoryId] = (expenses[t.categoryId] || 0) + t.amount;
      } else {
        incomes[t.categoryId] = (incomes[t.categoryId] || 0) + t.amount;
      }
    });

    records[mKey] = {
      monthKey: mKey,
      label: mKey.startsWith('T') && !isNaN(Number(mKey.slice(1))) ? `Tháng ${mKey.slice(1)}` : mKey,
      expenses,
      incomes,
      transactions: txs,
    };
  });

  return {
    ...currentData,
    expenseCategories,
    incomeStreams,
    records,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Fetch published Google Sheet URL as CSV with clear error detection (401/403 private sheet)
 */
export async function fetchGoogleSheetCSV(rawUrl: string): Promise<string> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('Vui lòng nhập đường link Google Sheets.');
  }

  let finalUrl = trimmed;

  // Extract Sheet ID and GID if standard edit URL
  const sheetIdMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetIdMatch) {
    const sheetId = sheetIdMatch[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    if (trimmed.includes('/pub?')) {
      // It's a published web link, ensure output=csv
      finalUrl = trimmed.includes('output=csv') 
        ? trimmed 
        : `${trimmed}${trimmed.includes('?') ? '&' : '?'}output=csv`;
    } else {
      // Use Google Visualization API CSV endpoint (better CORS and direct download)
      finalUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
    }
  }

  try {
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Lỗi 401/403: Bảng tính Google Sheets đang ở chế độ Riêng tư (Private). Bạn hãy mở Google Sheet > chọn Chia sẻ (Share) > chuyển sang "Bất kỳ ai có đường liên kết đều có thể xem" rồi thử lại.'
      );
    }

    if (!response.ok) {
      // Fallback: try export endpoint if gviz failed with other error
      if (sheetIdMatch && finalUrl.includes('/gviz/tq')) {
        const sheetId = sheetIdMatch[1];
        const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        const fallbackRes = await fetch(exportUrl);
        if (fallbackRes.ok) {
          const text = await fallbackRes.text();
          if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com')) {
            throw new Error(
              'Lỗi 401: Bảng tính Google Sheets đang để Riêng tư. Hãy vào Google Sheet > Chia sẻ > Chuyển sang "Bất kỳ ai có đường liên kết đều có thể xem".'
            );
          }
          return text;
        }
      }
      throw new Error(`Máy chủ Google Sheets phản hồi mã lỗi ${response.status} (${response.statusText}). Hãy kiểm tra quyền chia sẻ link.`);
    }

    const text = await response.text();
    // Check if Google redirected to a sign-in HTML page
    if (text.includes('<!DOCTYPE html>') || text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
      throw new Error(
        'Lỗi 401: Bảng tính Google Sheets đang để Riêng tư và yêu cầu đăng nhập Google. Hãy mở Google Sheet > Chia sẻ > Chọn "Bất kỳ ai có đường liên kết đều có thể xem".'
      );
    }

    return text;
  } catch (err: any) {
    if (err.message && err.message.includes('401')) {
      throw err;
    }
    // Network / CORS error
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Trình duyệt bị chặn truy cập (CORS). Hãy đảm bảo bạn đã mở Google Sheet > Tệp > Chia sẻ > Xuất bản lên web (Publish to web) dạng CSV, hoặc mở quyền "Bất kỳ ai có liên kết". Bạn cũng có thể copy và Dán trực tiếp nội dung bảng tính vào app.'
      );
    }
    throw err;
  }
}

/**
 * Push current finance data back to Google Sheet via Google Apps Script Webhook
 */
export async function pushFinanceDataToGoogleSheet(webhookUrl: string, data: AppFinanceData): Promise<boolean> {
  const csvContent = exportToUserCSV(data);
  const payload = {
    action: 'sync_sheet',
    timestamp: new Date().toISOString(),
    csv: csvContent,
    months: data.months,
    startingSavings: data.startingSavings,
  };

  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });
    return true;
  } catch (err: any) {
    console.error('Error updating Google Sheet via webhook', err);
    throw new Error(err.message || 'Không thể gửi dữ liệu đến Google Apps Script.');
  }
}
