import React, { useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Search, 
  Plus, 
  Minus,
  Trash2, 
  Table2, 
  FileSpreadsheet, 
  Receipt,
  Check,
  CheckCircle2,
  Info,
  Filter
} from 'lucide-react';
import { AppFinanceData, Transaction } from '../types/finance';
import { formatVND, parseMoneyInput, getMonthDisplay } from '../utils/formatters';
import { MonthSummary } from '../utils/googleSheetsSync';

interface DailyMatrixSheetProps {
  data: AppFinanceData;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  summaries: Record<string, MonthSummary>;
  onUpdateDailyCell: (monthKey: string, dateStr: string, categoryId: string, amount: number) => void;
  onUpdateDailyIncomeCell: (monthKey: string, dateStr: string, incomeId: string, amount: number) => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (monthKey: string, txId: string) => void;
}

export const DailyMatrixSheet: React.FC<DailyMatrixSheetProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
  summaries,
  onUpdateDailyCell,
  onUpdateDailyIncomeCell,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  // Cell inline editing state
  const [editingCell, setEditingCell] = useState<{
    dateStr: string;
    id: string;
    type: 'expense' | 'income';
    val: string;
  } | null>(null);

  const [filterMode, setFilterMode] = useState<'all' | 'has_activity'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'ledger'>('matrix');

  const activeYear = data.selectedYear || 2026;

  // Quick Add Input State
  const [quickType, setQuickType] = useState<'expense' | 'income'>('expense');
  const [quickDate, setQuickDate] = useState(() => {
    const mNum = selectedMonth.startsWith('T') && !isNaN(Number(selectedMonth.slice(1)))
      ? selectedMonth.slice(1).padStart(2, '0')
      : '10';
    return `${activeYear}-${mNum}-08`;
  });
  const [quickCatId, setQuickCatId] = useState(
    data.expenseCategories[3]?.id || data.expenseCategories[0]?.id || ''
  );
  const [quickIncomeId, setQuickIncomeId] = useState(
    data.incomeStreams[0]?.id || ''
  );
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [entryToast, setEntryToast] = useState<string | null>(null);

  // Sync quick date when selected month or active year changes
  React.useEffect(() => {
    const mNum = selectedMonth.startsWith('T') && !isNaN(Number(selectedMonth.slice(1)))
      ? selectedMonth.slice(1).padStart(2, '0')
      : '10';
    setQuickDate(`${activeYear}-${mNum}-08`);
  }, [selectedMonth, activeYear]);

  const record = data.records[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    expenses: {},
    incomes: {},
    transactions: [],
  };

  const transactions = record.transactions || [];

  // Determine month number and days in month (handling leap years dynamically)
  const getMonthNumber = (mKey: string) => {
    if (mKey.startsWith('T') && !isNaN(Number(mKey.slice(1)))) {
      return Number(mKey.slice(1));
    }
    const match = mKey.match(/\d+/);
    if (match) return Number(match[0]);
    return 10;
  };

  const monthNum = getMonthNumber(selectedMonth);
  // Calculates exact days in month for any year including leap years
  const daysInMonth = new Date(activeYear, monthNum, 0).getDate();
  const paddedMonth = monthNum.toString().padStart(2, '0');

  // Generate all days in month
  const allDays = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const paddedDay = day.toString().padStart(2, '0');
      const dateStr = `${activeYear}-${paddedMonth}-${paddedDay}`;
      const dateObj = new Date(activeYear, monthNum - 1, day);
      const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()];
      return {
        day,
        dateStr,
        displayDate: `${paddedDay}/${paddedMonth}`,
        dayOfWeek,
      };
    });
  }, [daysInMonth, paddedMonth, monthNum, activeYear]);

  // Robust day extractor
  const getTxDayNumber = (txDate: string): number | null => {
    if (!txDate) return null;
    const parts = txDate.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const day = parseInt(parts[2], 10);
        return isNaN(day) ? null : day;
      } else {
        const day = parseInt(parts[0], 10);
        return isNaN(day) ? null : day;
      }
    }
    return null;
  };

  // Build daily matrix for both expense categories and income streams
  const { 
    dailyExpenseMatrix, 
    dailyIncomeMatrix, 
    dailyExpenseTotals, 
    dailyIncomeTotals, 
    colExpenseTotals, 
    colIncomeTotals 
  } = useMemo(() => {
    const expMatrix: Record<string, Record<string, number>> = {};
    const incMatrix: Record<string, Record<string, number>> = {};
    const expTotals: Record<string, number> = {};
    const incTotals: Record<string, number> = {};

    allDays.forEach((d) => {
      expMatrix[d.dateStr] = {};
      incMatrix[d.dateStr] = {};
      expTotals[d.dateStr] = 0;
      incTotals[d.dateStr] = 0;
    });

    transactions.forEach((tx) => {
      let targetDateStr = tx.date;
      if (!expMatrix[targetDateStr]) {
        const dayNum = getTxDayNumber(tx.date);
        if (dayNum && dayNum >= 1 && dayNum <= daysInMonth) {
          const paddedDay = dayNum.toString().padStart(2, '0');
          targetDateStr = `${activeYear}-${paddedMonth}-${paddedDay}`;
        }
      }

      if (expMatrix[targetDateStr]) {
        if (tx.type === 'expense') {
          expMatrix[targetDateStr][tx.categoryId] = (expMatrix[targetDateStr][tx.categoryId] || 0) + tx.amount;
          expTotals[targetDateStr] = (expTotals[targetDateStr] || 0) + tx.amount;
        } else if (tx.type === 'income') {
          incMatrix[targetDateStr][tx.categoryId] = (incMatrix[targetDateStr][tx.categoryId] || 0) + tx.amount;
          incTotals[targetDateStr] = (incTotals[targetDateStr] || 0) + tx.amount;
        }
      }
    });

    // Calculate Column totals
    const colExp: Record<string, number> = {};
    data.expenseCategories.forEach((cat) => {
      colExp[cat.id] = allDays.reduce((sum, d) => sum + (expMatrix[d.dateStr]?.[cat.id] || 0), 0);
    });

    const colInc: Record<string, number> = {};
    data.incomeStreams.forEach((inc) => {
      colInc[inc.id] = allDays.reduce((sum, d) => sum + (incMatrix[d.dateStr]?.[inc.id] || 0), 0);
    });

    return {
      dailyExpenseMatrix: expMatrix,
      dailyIncomeMatrix: incMatrix,
      dailyExpenseTotals: expTotals,
      dailyIncomeTotals: incTotals,
      colExpenseTotals: colExp,
      colIncomeTotals: colInc,
    };
  }, [allDays, transactions, daysInMonth, paddedMonth, data.expenseCategories, data.incomeStreams]);

  const sheetTotalExpense = useMemo(() => {
    return Object.values(colExpenseTotals).reduce((sum, v) => sum + v, 0);
  }, [colExpenseTotals]);

  const sheetTotalIncome = useMemo(() => {
    return Object.values(colIncomeTotals).reduce((sum, v) => sum + v, 0);
  }, [colIncomeTotals]);

  const sheetSurplus = sheetTotalIncome - sheetTotalExpense;

  // Filtered days based on user selection
  const displayedDays = useMemo(() => {
    return allDays.filter((d) => {
      const daySpend = dailyExpenseTotals[d.dateStr] || 0;
      const dayIncome = dailyIncomeTotals[d.dateStr] || 0;
      if (filterMode === 'has_activity' && daySpend === 0 && dayIncome === 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDate = d.displayDate.includes(q) || d.dateStr.includes(q);
        const matchTx = transactions.some(
          (t) => t.date === d.dateStr && (t.description.toLowerCase().includes(q) || t.amount.toString().includes(q))
        );
        return matchDate || matchTx;
      }
      return true;
    });
  }, [allDays, dailyExpenseTotals, dailyIncomeTotals, filterMode, searchQuery, transactions]);

  // Handle cell blur / edit save
  const handleCellBlur = (dateStr: string, id: string, type: 'expense' | 'income') => {
    if (!editingCell) return;
    const amount = parseMoneyInput(editingCell.val);
    if (type === 'expense') {
      onUpdateDailyCell(selectedMonth, dateStr, id, Math.max(0, amount));
    } else {
      onUpdateDailyIncomeCell(selectedMonth, dateStr, id, Math.max(0, amount));
    }
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, dateStr: string, id: string, type: 'expense' | 'income') => {
    if (e.key === 'Enter') {
      handleCellBlur(dateStr, id, type);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Quick Add submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseMoneyInput(quickAmount);
    if (!amount || amount <= 0) return;

    if (quickType === 'expense') {
      const catName = data.expenseCategories.find(c => c.id === quickCatId)?.name || 'Chi tiêu';
      onAddTransaction({
        monthKey: selectedMonth,
        categoryId: quickCatId,
        type: 'expense',
        amount,
        description: quickDesc.trim() || catName,
        date: quickDate,
      });
      setEntryToast(`Đã ghi ${formatVND(amount)} (${catName}) ngày ${quickDate.slice(8, 10)}/${quickDate.slice(5, 7)}`);
    } else {
      const streamName = data.incomeStreams.find(s => s.id === quickIncomeId)?.name || 'Thu nhập';
      onAddTransaction({
        monthKey: selectedMonth,
        categoryId: quickIncomeId,
        type: 'income',
        amount,
        description: quickDesc.trim() || streamName,
        date: quickDate,
      });
      setEntryToast(`Đã ghi thu ${formatVND(amount)} (${streamName}) ngày ${quickDate.slice(8, 10)}/${quickDate.slice(5, 7)}`);
    }

    setQuickAmount('');
    setQuickDesc('');
    setTimeout(() => setEntryToast(null), 2500);
  };

  const daysWithActivityCount = allDays.filter(d => (dailyExpenseTotals[d.dateStr] || 0) > 0 || (dailyIncomeTotals[d.dateStr] || 0) > 0).length;

  return (
    <div className="space-y-4">
      {/* 1. Header & Month Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Bảng Nhập Liệu Chi Tiết Từng Ngày ({getMonthDisplay(selectedMonth)})
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Sheet {selectedMonth}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Giao diện bảng tính: Nhấp chuột vào bất kỳ ô nào để nhập số tiền · Tự động tính tổng cột và tổng ngày
            </p>
          </div>

          {/* Month Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-center">
            {data.months.map((m) => {
              const isSel = m === selectedMonth;
              return (
                <button
                  key={m}
                  onClick={() => onSelectMonth(m)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    isSel
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sheet {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Sheet Quick Summary Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Số ngày trong tháng: <strong className="text-slate-800">{daysInMonth} ngày</strong> (Có phát sinh: {daysWithActivityCount} ngày)
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Tổng thu: <strong className="text-blue-700 font-bold">+{formatVND(sheetTotalIncome)}</strong></span>
            <span>Tổng chi: <strong className="text-rose-700 font-bold">{formatVND(sheetTotalExpense)}</strong></span>
            <span>Dư: <strong className={sheetSurplus >= 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>{formatVND(sheetSurplus)}</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Fast Inline Entry Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">
              Nhập Nhanh Khoản Thu / Chi Cho {getMonthDisplay(selectedMonth)}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (Số tiền sẽ lập tức cập nhật vào đúng ô ngày tương ứng bên dưới)
            </span>
          </div>

          {/* Toggle Type */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setQuickType('expense')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                quickType === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Minus className="w-3 h-3" />
              <span>Khoản chi</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickType('income')}
              className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                quickType === 'income'
                  ? 'bg-[#0A66C2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>Khoản thu</span>
            </button>
          </div>
        </div>

        {/* Entry Form */}
        <form onSubmit={handleQuickAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
          {/* Ngày */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Ngày ghi nhận:
            </label>
            <input
              type="date"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] focus:bg-white font-mono"
            />
          </div>

          {/* Danh mục */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              {quickType === 'expense' ? 'Danh mục chi tiêu:' : 'Nguồn thu nhập:'}
            </label>
            {quickType === 'expense' ? (
              <select
                value={quickCatId}
                onChange={(e) => setQuickCatId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] focus:bg-white"
              >
                {data.expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isSavings ? '(Tiết kiệm)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={quickIncomeId}
                onChange={(e) => setQuickIncomeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] focus:bg-white"
              >
                {data.incomeStreams.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Số tiền */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1 flex items-center justify-between">
              <span>Số tiền (₫):</span>
              <span className="text-[10px] text-slate-400 font-normal">Gõ: 50k, 2.5tr</span>
            </label>
            <input
              type="text"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              placeholder="VD: 50.000 hoặc 50k"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] focus:bg-white font-mono font-medium"
            />
          </div>

          {/* Diễn giải */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Ghi chú / Diễn giải:
            </label>
            <input
              type="text"
              value={quickDesc}
              onChange={(e) => setQuickDesc(e.target.value)}
              placeholder="VD: Cơm trưa, Đổ xăng..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] focus:bg-white"
            />
          </div>

          {/* Button */}
          <div>
            <button
              type="submit"
              className={`w-full py-1.5 px-3 text-xs font-bold rounded-lg text-white shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                quickType === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#0A66C2] hover:bg-[#004182]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Ghi vào bảng</span>
            </button>
          </div>
        </form>

        {entryToast && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{entryToast}</span>
          </div>
        )}
      </div>

      {/* 3. Sub-View Switcher & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Sub-tab Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('matrix')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-3.5 h-3.5 text-[#0A66C2]" />
            <span>Bảng ma trận ngày ({daysInMonth} ngày)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>Danh sách giao dịch ({transactions.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'matrix' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả {daysInMonth} ngày
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('has_activity')}
                className={`px-2.5 py-1 rounded font-medium transition-all cursor-pointer ${
                  filterMode === 'has_activity'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ ngày có số liệu ({daysWithActivityCount})
              </button>
            </div>
          )}

          <div className="relative min-w-[160px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm ngày, số tiền..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. MODE 1: MATRIX SPREADSHEET TABLE (Direct inline editable) */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[640px] scrollbar-thin">
            <table className="w-full border-collapse text-xs text-left">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-20 bg-slate-100 text-slate-700 font-bold border-b border-slate-300 shadow-xs">
                <tr>
                  {/* Sticky Left: Date */}
                  <th className="py-2.5 px-3 bg-slate-100 sticky left-0 z-30 font-bold text-slate-900 min-w-[85px] border-r border-slate-300">
                    Ngày / Thứ
                  </th>

                  {/* Expense category columns */}
                  {data.expenseCategories.map((cat) => (
                    <th
                      key={cat.id}
                      className={`py-2.5 px-2 text-right border-r border-slate-200 min-w-[95px] whitespace-nowrap ${
                        cat.isSavings ? 'bg-emerald-50/90 text-emerald-900 font-bold' : ''
                      }`}
                    >
                      <div className="truncate" title={cat.name}>
                        {cat.name}
                      </div>
                    </th>
                  ))}

                  {/* Income stream columns */}
                  {data.incomeStreams.map((inc) => (
                    <th
                      key={inc.id}
                      className="py-2.5 px-2 text-right bg-blue-50/90 text-blue-900 font-bold border-r border-slate-200 min-w-[95px] whitespace-nowrap"
                    >
                      <div className="truncate" title={inc.name}>
                        {inc.name}
                      </div>
                    </th>
                  ))}

                  {/* Sticky Right: Day Total Expense */}
                  <th className="py-2.5 px-3 text-right bg-rose-50/90 sticky right-0 z-30 font-bold text-rose-900 min-w-[105px] border-l border-slate-300">
                    Tổng chi ngày
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-200">
                {displayedDays.map((d) => {
                  const daySpend = dailyExpenseTotals[d.dateStr] || 0;
                  const dayIncome = dailyIncomeTotals[d.dateStr] || 0;
                  const isWeekend = d.dayOfWeek === 'T7' || d.dayOfWeek === 'CN';
                  const hasActivity = daySpend > 0 || dayIncome > 0;

                  return (
                    <tr
                      key={d.dateStr}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        hasActivity ? 'bg-white' : (isWeekend ? 'bg-slate-50/60' : 'bg-white')
                      }`}
                    >
                      {/* Sticky Date */}
                      <td className={`py-2 px-3 border-r border-slate-300 sticky left-0 z-10 font-mono font-medium ${
                        hasActivity ? 'bg-white text-slate-900 font-bold' : 'bg-slate-50/80 text-slate-600'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span>{d.displayDate}</span>
                          <span className={`text-[10px] px-1 py-0.2 rounded font-sans ${
                            isWeekend ? 'bg-amber-100/70 text-amber-900' : 'text-slate-400'
                          }`}>
                            {d.dayOfWeek}
                          </span>
                        </div>
                      </td>

                      {/* Expense Cells */}
                      {data.expenseCategories.map((cat) => {
                        const cellVal = dailyExpenseMatrix[d.dateStr]?.[cat.id] || 0;
                        const isEditing = editingCell?.dateStr === d.dateStr && editingCell?.id === cat.id && editingCell?.type === 'expense';

                        return (
                          <td
                            key={cat.id}
                            onClick={() => {
                              if (!isEditing) {
                                setEditingCell({
                                  dateStr: d.dateStr,
                                  id: cat.id,
                                  type: 'expense',
                                  val: cellVal > 0 ? cellVal.toString() : '',
                                });
                              }
                            }}
                            className={`py-1.5 px-2 text-right border-r border-slate-200 font-mono cursor-pointer transition-colors ${
                              cellVal > 0 ? 'hover:bg-blue-100/50' : 'hover:bg-slate-100 text-slate-400'
                            } ${cat.isSavings && cellVal > 0 ? 'bg-emerald-50/40' : ''}`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.val}
                                onChange={(e) => setEditingCell({ ...editingCell, val: e.target.value })}
                                onBlur={() => handleCellBlur(d.dateStr, cat.id, 'expense')}
                                onKeyDown={(e) => handleCellKeyDown(e, d.dateStr, cat.id, 'expense')}
                                placeholder="0"
                                className="w-full text-right bg-white border border-[#0A66C2] rounded px-1.5 py-0.5 text-slate-900 font-mono text-xs focus:outline-none shadow-xs"
                              />
                            ) : (
                              <span
                                className={`inline-block px-1 py-0.5 rounded tabular-nums ${
                                  cellVal > 0
                                    ? (cat.isSavings ? 'text-emerald-800 font-bold' : 'text-slate-900 font-semibold')
                                    : 'text-slate-300 hover:text-slate-600'
                                }`}
                              >
                                {cellVal > 0 ? cellVal.toLocaleString('vi-VN') : '—'}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Income Cells */}
                      {data.incomeStreams.map((inc) => {
                        const cellVal = dailyIncomeMatrix[d.dateStr]?.[inc.id] || 0;
                        const isEditing = editingCell?.dateStr === d.dateStr && editingCell?.id === inc.id && editingCell?.type === 'income';

                        return (
                          <td
                            key={inc.id}
                            onClick={() => {
                              if (!isEditing) {
                                setEditingCell({
                                  dateStr: d.dateStr,
                                  id: inc.id,
                                  type: 'income',
                                  val: cellVal > 0 ? cellVal.toString() : '',
                                });
                              }
                            }}
                            className={`py-1.5 px-2 text-right border-r border-slate-200 font-mono cursor-pointer transition-colors ${
                              cellVal > 0 ? 'bg-blue-50/40 hover:bg-blue-100/50' : 'hover:bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                autoFocus
                                value={editingCell.val}
                                onChange={(e) => setEditingCell({ ...editingCell, val: e.target.value })}
                                onBlur={() => handleCellBlur(d.dateStr, inc.id, 'income')}
                                onKeyDown={(e) => handleCellKeyDown(e, d.dateStr, inc.id, 'income')}
                                placeholder="0"
                                className="w-full text-right bg-white border border-[#0A66C2] rounded px-1.5 py-0.5 text-blue-900 font-mono text-xs focus:outline-none shadow-xs"
                              />
                            ) : cellVal > 0 ? (
                              <span className="text-blue-700 font-bold tabular-nums">
                                +{cellVal.toLocaleString('vi-VN')}
                              </span>
                            ) : (
                              <span className="text-slate-300 hover:text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Sticky Day Total */}
                      <td className={`py-2 px-3 text-right font-mono sticky right-0 z-10 border-l border-slate-300 font-bold tabular-nums ${
                        daySpend > 0 ? 'bg-rose-50/80 text-rose-900' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {daySpend > 0 ? daySpend.toLocaleString('vi-VN') : '0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Sticky Footer: Column totals */}
              <tfoot className="sticky bottom-0 z-20 bg-slate-100 border-t-2 border-slate-400 text-slate-900 font-bold shadow-lg">
                <tr>
                  <td className="py-2.5 px-3 text-left border-r border-slate-300 sticky left-0 bg-slate-100 z-30 font-bold text-slate-900 whitespace-nowrap">
                    TỔNG CỘNG ({selectedMonth})
                  </td>

                  {data.expenseCategories.map((cat) => {
                    const colSum = colExpenseTotals[cat.id] || 0;
                    return (
                      <td
                        key={cat.id}
                        className={`py-2.5 px-2 text-right font-mono border-r border-slate-300 font-bold tabular-nums ${
                          cat.isSavings ? 'text-emerald-900 bg-emerald-50/70' : 'text-slate-900'
                        }`}
                      >
                        {colSum > 0 ? colSum.toLocaleString('vi-VN') : '0'}
                      </td>
                    );
                  })}

                  {data.incomeStreams.map((inc) => {
                    const incSum = colIncomeTotals[inc.id] || 0;
                    return (
                      <td
                        key={inc.id}
                        className="py-2.5 px-2 text-right font-mono border-r border-slate-300 text-blue-700 font-bold bg-blue-50/70 tabular-nums"
                      >
                        +{incSum.toLocaleString('vi-VN')}
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-3 text-right font-mono sticky right-0 z-30 bg-rose-100 text-rose-900 border-l border-slate-300 font-bold text-xs tabular-nums">
                    {sheetTotalExpense.toLocaleString('vi-VN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODE 2: LEDGER TRANSACTIONS LIST */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#0A66C2]" />
              <h3 className="text-sm font-bold text-slate-900">
                Nhật Ký Từng Giao Dịch Trong {getMonthDisplay(selectedMonth)}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {transactions.length} giao dịch
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Chưa có giao dịch chi tiết nào trong {getMonthDisplay(selectedMonth)}</p>
              <p className="text-[11px] text-slate-400 mt-1">Dùng thanh nhập nhanh ở trên để thêm chi tiêu hoặc thu nhập.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Ngày</th>
                    <th className="py-2.5 px-4">Loại</th>
                    <th className="py-2.5 px-4">Danh mục / Nguồn thu</th>
                    <th className="py-2.5 px-4">Diễn giải</th>
                    <th className="py-2.5 px-4 text-right">Số tiền</th>
                    <th className="py-2.5 px-4 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((tx) => {
                      const isExp = tx.type === 'expense';
                      const catName = isExp
                        ? data.expenseCategories.find(c => c.id === tx.categoryId)?.name || 'Chi tiêu'
                        : data.incomeStreams.find(s => s.id === tx.categoryId)?.name || 'Thu nhập';

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                            {tx.date.slice(8, 10)}/{tx.date.slice(5, 7)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isExp ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {isExp ? 'Chi tiêu' : 'Thu nhập'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">
                            {catName}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {tx.description}
                          </td>
                          <td className={`py-2.5 px-4 text-right font-mono font-bold tabular-nums ${
                            isExp ? 'text-rose-700' : 'text-blue-700'
                          }`}>
                            {isExp ? `-${formatVND(tx.amount)}` : `+${formatVND(tx.amount)}`}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => onDeleteTransaction(selectedMonth, tx.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Xóa giao dịch này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
