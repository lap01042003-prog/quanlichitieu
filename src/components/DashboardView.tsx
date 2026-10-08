import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowRight,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { AppFinanceData } from '../types/finance';
import { 
  formatVND, 
  formatCompactVND, 
  formatPercentChange, 
  getMonthDisplay 
} from '../utils/formatters';
import { 
  MonthSummary, 
  generateFinancialInsights 
} from '../utils/googleSheetsSync';

interface DashboardViewProps {
  data: AppFinanceData;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  summaries: Record<string, MonthSummary>;
  onNavigateToDailySheet?: () => void;
  onNavigateToBudget?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
  summaries,
  onNavigateToDailySheet,
  onNavigateToBudget,
}) => {
  // Option to show only months with active data (defaults to true as requested: T11, T12 hidden)
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Smart Filter states for breakdown
  const [filterQuery, setFilterQuery] = useState('');
  const [amountRangeFilter, setAmountRangeFilter] = useState<'all' | 'under_200k' | '200k_1m' | '1m_plus'>('all');
  const [sortBy, setSortBy] = useState<'amount_desc' | 'amount_asc' | 'name'>('amount_desc');

  // Filter available months: only show months with data (unless showAllMonths is enabled)
  const availableMonths = useMemo(() => {
    if (showAllMonths) return data.months;
    const withData = data.months.filter(m => summaries[m]?.hasData);
    // If somehow no months have data, fallback to all months
    return withData.length > 0 ? withData : data.months;
  }, [data.months, summaries, showAllMonths]);

  // Current month summary and records
  const currentSummary = summaries[selectedMonth] || {
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
    transactions: [],
  };

  // Find previous month for Month-over-Month (MoM) delta calculations
  const monthIdx = data.months.indexOf(selectedMonth);
  const prevMonthKey = monthIdx > 0 ? data.months[monthIdx - 1] : undefined;
  const prevSummary = prevMonthKey ? summaries[prevMonthKey] : undefined;

  // Calculate MoM deltas for the 4 key cards
  const incomeDelta = useMemo(() => {
    return prevSummary 
      ? formatPercentChange(currentSummary.totalIncome, prevSummary.totalIncome)
      : null;
  }, [currentSummary.totalIncome, prevSummary]);

  const spendDelta = useMemo(() => {
    return prevSummary 
      ? formatPercentChange(currentSummary.actualSpend, prevSummary.actualSpend)
      : null;
  }, [currentSummary.actualSpend, prevSummary]);

  const savingsDelta = useMemo(() => {
    return prevSummary 
      ? formatPercentChange(currentSummary.monthlySavings, prevSummary.monthlySavings)
      : null;
  }, [currentSummary.monthlySavings, prevSummary]);

  const surplusDelta = useMemo(() => {
    return prevSummary 
      ? formatPercentChange(currentSummary.surplus, prevSummary.surplus)
      : null;
  }, [currentSummary.surplus, prevSummary]);

  // Generate automated financial data analyst insights
  const insights = useMemo(() => {
    return generateFinancialInsights(data, selectedMonth, summaries);
  }, [data, selectedMonth, summaries]);

  // Category breakdown for selected month (excluding savings transfer for the pure spending donut)
  const categoryBreakdown = useMemo(() => {
    const totalActual = currentSummary.actualSpend || 1;
    let list = data.expenseCategories
      .filter(cat => !cat.isSavings)
      .map(cat => {
        const amount = record.expenses[cat.id] || 0;
        const pct = totalActual > 0 ? (amount / totalActual) * 100 : 0;
        return {
          id: cat.id,
          name: cat.name,
          amount,
          pct,
          color: cat.color || '#64748b',
        };
      })
      .filter(item => item.amount > 0);

    // Apply Smart Filters
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      list = list.filter(item => item.name.toLowerCase().includes(q));
    }

    if (amountRangeFilter === 'under_200k') {
      list = list.filter(item => item.amount < 200000);
    } else if (amountRangeFilter === '200k_1m') {
      list = list.filter(item => item.amount >= 200000 && item.amount < 1000000);
    } else if (amountRangeFilter === '1m_plus') {
      list = list.filter(item => item.amount >= 1000000);
    }

    // Apply Sorting
    if (sortBy === 'amount_desc') {
      list.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'amount_asc') {
      list.sort((a, b) => a.amount - b.amount);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [data.expenseCategories, record.expenses, currentSummary.actualSpend, filterQuery, amountRangeFilter, sortBy]);

  // Multi-month comparison dataset for bar chart
  const multiMonthChartData = useMemo(() => {
    return availableMonths.map(m => {
      const s = summaries[m] || {
        monthKey: m,
        totalIncome: 0,
        totalExpense: 0,
        actualSpend: 0,
        monthlySavings: 0,
        surplus: 0,
        accumulatedSavings: data.startingSavings,
        hasData: false,
      };
      return {
        month: m,
        label: getMonthDisplay(m),
        income: s.totalIncome,
        actualSpend: s.actualSpend,
        savings: s.monthlySavings,
        surplus: s.surplus,
        hasData: s.hasData,
      };
    });
  }, [availableMonths, summaries, data.startingSavings]);

  const maxChartVal = useMemo(() => {
    return Math.max(
      ...multiMonthChartData.map(d => Math.max(d.income, d.actualSpend + d.savings)),
      10000000
    );
  }, [multiMonthChartData]);

  // Donut chart geometry calculations
  const donutRadius = 68;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedOffset = 0;

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Month Selector & Smart Month Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Bảng Phân Tích Dữ Liệu Tài Chính - Năm {data.selectedYear || 2026}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#0A66C2] border border-blue-200 font-mono">
              {getMonthDisplay(selectedMonth)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tích số liệu thực tế, theo dõi MoM và cơ cấu phân bổ dòng tiền
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {availableMonths.map((m) => {
              const isSelected = m === selectedMonth;
              const mSum = summaries[m];
              return (
                <button
                  key={m}
                  onClick={() => onSelectMonth(m)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{m}</span>
                  {mSum && mSum.totalIncome > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
                      ({formatCompactVND(mSum.totalIncome)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Toggle show/hide empty months */}
          <button
            onClick={() => setShowAllMonths(!showAllMonths)}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Bật/tắt hiển thị các tháng chưa có số liệu"
          >
            {showAllMonths ? 'Ẩn tháng trống' : 'Hiện đủ các tháng'}
          </button>
        </div>
      </div>

      {/* 2. 4 Main KPI Cards (Thu nhập, Chi tiêu sinh hoạt, Tiết kiệm, Còn dư + MoM %) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Thẻ 1: Thu nhập */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Tổng thu nhập ({selectedMonth})</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-[#0A66C2] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
            {formatVND(currentSummary.totalIncome)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[11px] text-slate-500">
              {record.incomes['inc_dot2'] ? '2 đợt lương' : '1 đợt lương'}
            </span>
            {incomeDelta && (
              <span className={`text-[11px] font-mono font-semibold flex items-center gap-0.5 ${
                incomeDelta.isPositive ? 'text-emerald-700' : incomeDelta.isNeutral ? 'text-slate-500' : 'text-rose-600'
              }`}>
                {incomeDelta.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{incomeDelta.formatted} MoM</span>
              </span>
            )}
          </div>
        </div>

        {/* Thẻ 2: Chi tiêu sinh hoạt (không tính tiết kiệm) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Chi tiêu sinh hoạt</span>
            <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 tracking-tight tabular-nums">
            {formatVND(currentSummary.actualSpend)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[11px] text-slate-500">
              {currentSummary.totalIncome > 0
                ? `${Math.round((currentSummary.actualSpend / currentSummary.totalIncome) * 100)}% thu nhập`
                : 'Thực chi'}
            </span>
            {spendDelta && (
              <span className={`text-[11px] font-mono font-semibold flex items-center gap-0.5 ${
                // Chi tiêu giảm là tốt (màu xanh lá)
                !spendDelta.isPositive ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {spendDelta.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{spendDelta.formatted} MoM</span>
              </span>
            )}
          </div>
        </div>

        {/* Thẻ 3: Tiền tiết kiệm trích trong tháng */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Trích tiết kiệm ({selectedMonth})</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight tabular-nums">
            {formatVND(currentSummary.monthlySavings)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Lũy kế: <strong className="text-slate-800">{formatCompactVND(currentSummary.accumulatedSavings)}</strong>
            </span>
            {savingsDelta && (
              <span className="text-[11px] font-mono text-slate-500 font-medium">
                {savingsDelta.formatted} MoM
              </span>
            )}
          </div>
        </div>

        {/* Thẻ 4: Còn dư (Thặng dư sau khi trừ sinh hoạt và tiết kiệm) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Còn dư ({selectedMonth})</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight tabular-nums ${
            currentSummary.surplus >= 0 ? 'text-emerald-700' : 'text-amber-600'
          }`}>
            {currentSummary.surplus >= 0 ? '+' : ''}{formatVND(currentSummary.surplus)}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-100 pt-2">
            <span className={`text-[11px] font-medium ${
              currentSummary.surplus >= 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}>
              {currentSummary.surplus >= 0 ? '✓ Dòng tiền dương' : 'Chi vượt thu đợt 1'}
            </span>
            {surplusDelta && (
              <span className={`text-[11px] font-mono font-medium ${
                surplusDelta.isPositive ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {surplusDelta.formatted}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Section Nhận Xét Tự Động Viết Từ Số Liệu (Automated Data Analyst Insights) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0A66C2]" />
            <h2 className="text-sm font-bold text-slate-900">
              Nhận Xét & Đánh Giá Dữ Liệu {getMonthDisplay(selectedMonth)}
            </h2>
            <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">
              (Tự động tính toán từ dữ liệu thực tế)
            </span>
          </div>
          {onNavigateToBudget && (
            <button
              onClick={onNavigateToBudget}
              className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <span>Xem Bảng Ngân Sách</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Nhận xét 1: Cân đối thu chi */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              1. Cân đối thu chi
            </span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {insights.cashFlowMessage}
            </p>
          </div>

          {/* Nhận xét 2: Khoản chi lớn nhất */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              2. Khoản chi tiêu lớn nhất
            </span>
            <p className="text-slate-800 leading-relaxed">
              Khoản <strong className="text-slate-900 font-bold">{insights.topExpenseName}</strong> lớn nhất với{' '}
              <strong className="font-mono text-rose-700">{formatVND(insights.topExpenseAmount)}</strong>, chiếm{' '}
              <strong className="font-bold">{insights.topExpensePercentage}%</strong> tổng chi sinh hoạt.
            </p>
          </div>

          {/* Nhận xét 3: Tỷ lệ tiết kiệm */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              3. Tỷ lệ tiết kiệm
            </span>
            <p className="text-slate-800 leading-relaxed">
              {insights.savingsRateMessage}
            </p>
          </div>

          {/* Nhận xét 4: Biến động so với tháng trước */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">
              4. Biến động đáng chú ý
            </span>
            {insights.momLargestIncrease || insights.momLargestDecrease ? (
              <p className="text-slate-800 leading-relaxed">
                {insights.momLargestDecrease && (
                  <span>
                    Giảm mạnh: <strong className="text-emerald-700 font-medium">{insights.momLargestDecrease.categoryName}</strong> (-{formatVND(insights.momLargestDecrease.diff)}).{' '}
                  </span>
                )}
                {insights.momLargestIncrease && (
                  <span>
                    Tăng nhiều: <strong className="text-rose-700 font-medium">{insights.momLargestIncrease.categoryName}</strong> (+{formatVND(insights.momLargestIncrease.diff)}).
                  </span>
                )}
              </p>
            ) : (
              <p className="text-slate-500 leading-relaxed">
                Tháng khởi điểm hoặc chưa có số liệu tháng liền kề trước để so sánh MoM.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Charts Grid: 
          - Left: Multi-Month Column Bar Chart (Thu nhập vs Chi tiêu vs Tiết kiệm - Bấm cột để đổi tháng)
          - Right: Category Donut Chart & Breakdown Table with Smart Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Interactive Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0A66C2]" />
                  <span>Biểu Đồ Cột: Thu Nhập, Chi Tiêu & Tiết Kiệm Theo Tháng</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm vào cột tháng để chuyển trực tiếp dữ liệu phân tích
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0A66C2]" />
                  <span className="text-slate-600 text-[11px]">Thu nhập</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  <span className="text-slate-600 text-[11px]">Sinh hoạt</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                  <span className="text-slate-600 text-[11px]">Tiết kiệm</span>
                </div>
              </div>
            </div>

            {/* Bar Visualization Canvas */}
            <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-200">
              {multiMonthChartData.map((d) => {
                const isSelected = d.month === selectedMonth;
                const incPct = maxChartVal > 0 ? (d.income / maxChartVal) * 100 : 0;
                const spendPct = maxChartVal > 0 ? (d.actualSpend / maxChartVal) * 100 : 0;
                const savPct = maxChartVal > 0 ? (d.savings / maxChartVal) * 100 : 0;

                return (
                  <div
                    key={d.month}
                    onClick={() => onSelectMonth(d.month)}
                    className={`flex-1 flex flex-col items-center h-full justify-end cursor-pointer group rounded-lg p-1 transition-all ${
                      isSelected ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'
                    }`}
                    title={`Bấm để xem chi tiết ${d.label}`}
                  >
                    {/* Bars grouping */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44">
                      {/* Income Bar */}
                      <div className="w-3.5 sm:w-5 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full bg-[#0A66C2] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${Math.max(4, incPct)}%` }}
                        />
                      </div>

                      {/* Actual Spend Bar */}
                      <div className="w-3.5 sm:w-5 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${Math.max(4, spendPct)}%` }}
                        />
                      </div>

                      {/* Savings Bar */}
                      <div className="w-3.5 sm:w-5 flex flex-col items-center h-full justify-end">
                        <div
                          className="w-full bg-emerald-600 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${Math.max(4, savPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* X-axis Label */}
                    <div className="mt-2 text-center">
                      <span className={`text-xs font-bold block ${
                        isSelected ? 'text-[#0A66C2]' : 'text-slate-700'
                      }`}>
                        {d.month}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                        {d.income > 0 ? formatCompactVND(d.income) : '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini Data Comparison Matrix */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            {multiMonthChartData.map((d) => (
              <div
                key={d.month}
                onClick={() => onSelectMonth(d.month)}
                className={`p-2 rounded-lg cursor-pointer transition-colors border ${
                  d.month === selectedMonth
                    ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-[11px] mb-0.5">{d.month} ({d.label})</div>
                <div className="text-[10px] font-mono text-blue-700 font-medium truncate">
                  Thu: +{formatCompactVND(d.income)}
                </div>
                <div className="text-[10px] font-mono text-rose-600 font-medium truncate">
                  Chi: -{formatCompactVND(d.actualSpend)}
                </div>
                <div className="text-[10px] font-mono text-emerald-700 font-medium truncate">
                  Quỹ: +{formatCompactVND(d.savings)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (5 cols): Donut Chart & Smart Breakdown */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-[#0A66C2]" />
                  <span>Cơ Cấu Chi Tiêu Sinh Hoạt ({selectedMonth})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tỷ lệ % phân bổ các khoản chi trong tháng
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700">
                {categoryBreakdown.length} khoản
              </span>
            </div>

            {/* Smart Filter Bar for Categories */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc danh mục..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2]"
                />
              </div>

              <select
                value={amountRangeFilter}
                onChange={(e) => setAmountRangeFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Tất cả mức tiền</option>
                <option value="under_200k">&lt; 200k</option>
                <option value="200k_1m">200k - 1 triệu</option>
                <option value="1m_plus">&gt; 1 triệu</option>
              </select>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Không có dữ liệu phù hợp với bộ lọc trong tháng {selectedMonth}.
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Donut Display */}
                <div className="flex items-center justify-center gap-4 py-1">
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                      {categoryBreakdown.map((item) => {
                        const strokeDash = (item.pct / 100) * donutCircumference;
                        const strokeOffset = accumulatedOffset;
                        accumulatedOffset += strokeDash;

                        return (
                          <circle
                            key={item.id}
                            cx="80"
                            cy="80"
                            r={donutRadius}
                            stroke={item.color}
                            strokeWidth="22"
                            fill="transparent"
                            strokeDasharray={`${strokeDash} ${donutCircumference}`}
                            strokeDashoffset={-strokeOffset}
                            className="transition-all duration-300 hover:opacity-80"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Sinh hoạt</span>
                      <span className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                        {formatCompactVND(currentSummary.actualSpend)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Breakdown List with Percentage and Amount */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {categoryBreakdown.map((item) => (
                    <div key={item.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="text-slate-500 font-bold text-[11px]">
                            {item.pct.toFixed(1)}%
                          </span>
                          <span className="text-slate-900 font-semibold text-xs tabular-nums">
                            {formatVND(item.amount)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.pct}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick link to Daily Sheet */}
          {onNavigateToDailySheet && (
            <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Chi tiết từng ngày trong tháng</span>
              <button
                onClick={onNavigateToDailySheet}
                className="text-xs font-bold text-[#0A66C2] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Mở bảng theo ngày</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
