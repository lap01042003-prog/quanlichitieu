import React, { useState, useMemo } from 'react';
import { 
  Target, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle, 
  RefreshCw, 
  SlidersHorizontal, 
  Info, 
  Zap,
  Search,
  Filter,
  Flame,
  CheckCheck,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Minus,
  Calendar,
  Wallet,
  PiggyBank,
  BadgeAlert
} from 'lucide-react';
import { AppFinanceData, ExpenseCategory } from '../types/finance';
import { formatVND, parseMoneyInput, getMonthDisplay } from '../utils/formatters';
import { MonthSummary } from '../utils/googleSheetsSync';

interface BudgetViewProps {
  data: AppFinanceData;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  summaries: Record<string, MonthSummary>;
  onUpdateCategoryBudget: (monthKey: string, categoryId: string, budgetAmount: number, applyToAllMonths?: boolean) => void;
  onApplyRecommendedBudget: (monthKey: string, newBudgets: Record<string, number>) => void;
}

export type BudgetStatus = 'green' | 'yellow' | 'red';

export interface CategoryBudgetAnalysis {
  category: ExpenseCategory;
  budgetAmount: number;
  actualAmount: number;
  remainingAmount: number;
  percent: number;
  status: BudgetStatus;
  statusText: string;
  group: 'essential' | 'discretionary' | 'savings';
  groupName: string;
  recommendedAmount: number;
  recommendationReason: string;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
  summaries,
  onUpdateCategoryBudget,
  onApplyRecommendedBudget,
}) => {
  // View mode: 'table' | 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Editing state for budget limit
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempBudgetVal, setTempBudgetVal] = useState('');
  const [applyToAll, setApplyToAll] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'essential' | 'discretionary' | 'savings'>('all');
  
  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeYear = data.selectedYear || 2026;

  const record = data.records[selectedMonth] || {
    monthKey: selectedMonth,
    label: selectedMonth,
    expenses: {},
    incomes: {},
    budgets: {},
  };

  const summary = summaries[selectedMonth] || {
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

  // Classify category into 50/30/20 financial groups
  const categorizeGroup = (cat: ExpenseCategory): {
    group: 'essential' | 'discretionary' | 'savings';
    groupName: string;
  } => {
    if (cat.isSavings || cat.name.toLowerCase().includes('tiết kiệm')) {
      return { group: 'savings', groupName: 'Tích Lũy & Tiết Kiệm' };
    }
    const name = cat.name.toLowerCase();
    if (
      name.includes('nhà') || 
      name.includes('trọ') ||
      name.includes('điện') || 
      name.includes('xăng') || 
      name.includes('ăn') || 
      name.includes('xe') ||
      name.includes('gửi về') ||
      name.includes('về quê')
    ) {
      return { group: 'essential', groupName: 'Thiết Yếu (Cố Định & Sinh Hoạt)' };
    }
    return { group: 'discretionary', groupName: 'Linh Hoạt & Giải Trí' };
  };

  // Base income for smart recommendation
  const benchmarkIncome = summary.totalIncome > 0 ? summary.totalIncome : 5632692;

  // Simulator income state (defaults to actual income or 10M)
  const [simulatorIncome, setSimulatorIncome] = useState<number>(benchmarkIncome > 0 ? benchmarkIncome : 10000000);

  // Sync simulator income when selected month changes
  React.useEffect(() => {
    if (summary.totalIncome > 0) {
      setSimulatorIncome(summary.totalIncome);
    }
  }, [summary.totalIncome, selectedMonth]);

  const getSmartRecommendedAmount = (cat: ExpenseCategory, incomeBase = benchmarkIncome): { amount: number; reason: string } => {
    const name = cat.name.toLowerCase();
    if (cat.isSavings || name.includes('tiết kiệm')) {
      // 18-20% of income for savings
      const val = Math.round((incomeBase * 0.18) / 100000) * 100000;
      return { 
        amount: Math.max(1000000, val), 
        reason: 'Khoảng 18-20% thu nhập để xây dựng quỹ khẩn cấp & tích lũy lâu dài.' 
      };
    }
    if (name.includes('nhà') || name.includes('trọ')) {
      return { 
        amount: 1500000, 
        reason: 'Tiền trọ cố định hàng tháng (chiếm ~26% thu nhập đợt 1).' 
      };
    }
    if (name.includes('gửi về') || name.includes('về quê')) {
      return { 
        amount: 2000000, 
        reason: 'Hỗ trợ gia đình định kỳ hàng tháng (khoản cố định).' 
      };
    }
    if (name.includes('điện')) {
      return { 
        amount: 100000, 
        reason: 'Chi phí cước gói mạng 5G / điện thoại duy trì liên lạc.' 
      };
    }
    if (name.includes('ăn')) {
      // ~1.7M - 1.8M / month (~55k/day)
      const val = Math.min(2000000, Math.max(1500000, Math.round((incomeBase * 0.30) / 100000) * 100000));
      return { 
        amount: val, 
        reason: 'Định mức ăn uống ~50.000 ₫ – 55.000 ₫/ngày cho các bữa sinh hoạt.' 
      };
    }
    if (name.includes('xăng')) {
      return { 
        amount: 150000, 
        reason: 'Chi phí xăng xe đi lại làm việc (khoảng 2 lần đổ đầy bình).' 
      };
    }
    if (name.includes('giữ xe') || name.includes('gửi xe')) {
      return { 
        amount: 200000, 
        reason: 'Vé gửi xe đi làm các ngày trong tháng (20 ngày x 10k/ngày).' 
      };
    }
    if (name.includes('tiên')) {
      return { 
        amount: 500000, 
        reason: 'Ngân sách hẹn hò & cafe cuối tuần cùng người yêu.' 
      };
    }
    if (name.includes('bạn') || name.includes('đi chơi')) {
      return { 
        amount: 300000, 
        reason: 'Hạn mức giao lưu cafe bạn bè, thư giãn.' 
      };
    }
    if (name.includes('grab')) {
      return { 
        amount: 100000, 
        reason: 'Dự phòng di chuyển những ngày mưa hoặc tình huống gấp.' 
      };
    }
    if (name.includes('shopee') || name.includes('mua')) {
      return { 
        amount: 200000, 
        reason: 'Mua sắm vật dụng cá nhân thiết yếu trực tuyến.' 
      };
    }
    return { 
      amount: 200000, 
      reason: 'Chi tiêu cá nhân linh hoạt dự phòng.' 
    };
  };

  // Full detailed analysis of all categories
  const categoryAnalyses: CategoryBudgetAnalysis[] = useMemo(() => {
    return data.expenseCategories.map((cat) => {
      const customBudget = record.budgets?.[cat.id];
      const defaultBudget = data.defaultBudgets?.[cat.id];
      const smartRec = getSmartRecommendedAmount(cat, benchmarkIncome);

      const budgetAmount = customBudget !== undefined 
        ? customBudget 
        : (defaultBudget !== undefined ? defaultBudget : smartRec.amount);

      const actualAmount = record.expenses?.[cat.id] || 0;
      const remainingAmount = budgetAmount - actualAmount;

      let percent = 0;
      if (budgetAmount > 0) {
        percent = Math.round((actualAmount / budgetAmount) * 1000) / 10;
      } else if (actualAmount > 0) {
        percent = 999;
      }

      // COLOR CODING RULES (Theo đúng yêu cầu người dùng):
      // - < 80%: Xanh (green) - an toàn
      // - 80% <= percent <= 100%: Vàng (yellow) - gần 80% số thì vàng
      // - > 100%: Đỏ (red) - vượt quá sẽ đỏ
      let status: BudgetStatus = 'green';
      let statusText = 'An toàn';

      if (budgetAmount <= 0 && actualAmount > 0) {
        status = 'red';
        statusText = 'Chưa đặt hạn mức (Vượt)';
      } else if (percent > 100) {
        status = 'red';
        statusText = `Vượt ${Math.round(percent - 100)}% hạn mức!`;
      } else if (percent >= 80) {
        status = 'yellow';
        statusText = `Tiệm cận: Đã chi ${percent}%`;
      } else {
        status = 'green';
        statusText = `An toàn (${percent}%)`;
      }

      const { group, groupName } = categorizeGroup(cat);

      return {
        category: cat,
        budgetAmount,
        actualAmount,
        remainingAmount,
        percent,
        status,
        statusText,
        group,
        groupName,
        recommendedAmount: smartRec.amount,
        recommendationReason: smartRec.reason,
      };
    });
  }, [data.expenseCategories, record.budgets, record.expenses, data.defaultBudgets, benchmarkIncome]);

  // Overall Month Budget Summary
  const { totalBudget, totalActualSpend, totalExceededAmount, redCount, yellowCount, greenCount } = useMemo(() => {
    let budgetSum = 0;
    let actualSum = 0;
    let exceededSum = 0;
    let red = 0;
    let yellow = 0;
    let green = 0;

    categoryAnalyses.forEach((item) => {
      budgetSum += item.budgetAmount;
      actualSum += item.actualAmount;
      if (item.status === 'red') {
        red++;
        if (item.actualAmount > item.budgetAmount) {
          exceededSum += (item.actualAmount - item.budgetAmount);
        }
      } else if (item.status === 'yellow') {
        yellow++;
      } else {
        green++;
      }
    });

    return {
      totalBudget: budgetSum,
      totalActualSpend: actualSum,
      totalExceededAmount: exceededSum,
      redCount: red,
      yellowCount: yellow,
      greenCount: green,
    };
  }, [categoryAnalyses]);

  const totalPercent = totalBudget > 0 ? Math.round((totalActualSpend / totalBudget) * 1000) / 10 : 0;
  const overallStatus: BudgetStatus = totalPercent > 100 ? 'red' : (totalPercent >= 80 ? 'yellow' : 'green');

  // Filtered list
  const filteredCategories = useMemo(() => {
    return categoryAnalyses.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (groupFilter !== 'all' && item.group !== groupFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.category.name.toLowerCase().includes(q);
        const matchStatus = item.statusText.toLowerCase().includes(q);
        return matchName || matchStatus;
      }
      return true;
    });
  }, [categoryAnalyses, statusFilter, groupFilter, searchQuery]);

  // Quick Inline Editing
  const handleStartEdit = (catId: string, currentBudget: number) => {
    setEditingCatId(catId);
    setTempBudgetVal(currentBudget > 0 ? currentBudget.toString() : '');
    setApplyToAll(false);
  };

  const handleSaveBudget = (catId: string) => {
    const val = parseMoneyInput(tempBudgetVal);
    onUpdateCategoryBudget(selectedMonth, catId, Math.max(0, val), applyToAll);
    setEditingCatId(null);
    const catName = data.expenseCategories.find(c => c.id === catId)?.name || 'hạng mục';
    setToastMessage(`Đã cập nhật hạn mức cho "${catName}" thành ${formatVND(val)}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickAdjust = (catId: string, currentBudget: number, delta: number) => {
    const newBudget = Math.max(0, currentBudget + delta);
    onUpdateCategoryBudget(selectedMonth, catId, newBudget, false);
    const catName = data.expenseCategories.find(c => c.id === catId)?.name || 'hạng mục';
    setToastMessage(`Đã điều chỉnh hạn mức "${catName}": ${formatVND(newBudget)}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Apply one-click smart recommendation
  const handleApplyAllRecommendations = (incomeForRec = benchmarkIncome) => {
    const newBudgets: Record<string, number> = {};
    categoryAnalyses.forEach((item) => {
      newBudgets[item.category.id] = getSmartRecommendedAmount(item.category, incomeForRec).amount;
    });
    onApplyRecommendedBudget(selectedMonth, newBudgets);
    setToastMessage(`Đã áp dụng toàn bộ hạn mức đề xuất tài chính cho ${getMonthDisplay(selectedMonth)} (Năm ${activeYear})!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Month Switcher & Year Presence */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center justify-center shadow-xs shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Quản Trị Ngân Sách Hàng Tháng
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100/80 text-indigo-800 border border-indigo-200">
                  {getMonthDisplay(selectedMonth)} • Năm {activeYear}
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                  overallStatus === 'red' 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : overallStatus === 'yellow' 
                      ? 'bg-amber-50 text-amber-800 border-amber-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    overallStatus === 'red' ? 'bg-rose-500' : overallStatus === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  {overallStatus === 'red' ? 'Cảnh báo vượt chi' : overallStatus === 'yellow' ? 'Cận ngưỡng an toàn' : 'Kiểm soát tốt'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quy chuẩn màu thông minh: <span className="font-semibold text-emerald-700">&lt; 80% (Xanh an toàn)</span>, <span className="font-semibold text-amber-700">80%–100% (Vàng tiệm cận)</span>, <span className="font-semibold text-rose-700">&gt; 100% (Đỏ vượt hạn mức)</span>
              </p>
            </div>
          </div>

          {/* Month Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 self-start lg:self-center overflow-x-auto">
            {data.months.map((m) => {
              const isSel = m === selectedMonth;
              return (
                <button
                  key={m}
                  onClick={() => onSelectMonth(m)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isSel
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {getMonthDisplay(m)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Executive KPI Cards (4 Pillars) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100">
          {/* Card 1: Tổng hạn mức đặt */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Tổng Hạn Mức Đã Đặt</span>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tracking-tight">
                {formatVND(totalBudget)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {data.expenseCategories.length} danh mục theo dõi
              </span>
            </div>
          </div>

          {/* Card 2: Thực chi trong tháng */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Thực Tế Đã Chi Tiêu</span>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tracking-tight">
                {formatVND(totalActualSpend)}
              </div>
              <div className="text-[11px] font-semibold mt-0.5 flex items-center gap-1">
                <span className={overallStatus === 'red' ? 'text-rose-600' : overallStatus === 'yellow' ? 'text-amber-600' : 'text-emerald-600'}>
                  {totalPercent}%
                </span>
                <span className="text-slate-400 font-normal">ngân sách đã giải ngân</span>
              </div>
            </div>
          </div>

          {/* Card 3: Còn lại hoặc Vượt */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            totalBudget - totalActualSpend >= 0 
              ? 'bg-emerald-50/60 border-emerald-200/90 text-emerald-950' 
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">
                {totalBudget - totalActualSpend >= 0 ? 'Dư Địa Ngân Sách Còn' : 'Vượt Tổng Hạn Mức'}
              </span>
              {totalBudget - totalActualSpend >= 0 ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold font-mono tracking-tight">
                {totalBudget - totalActualSpend >= 0 
                  ? formatVND(totalBudget - totalActualSpend) 
                  : `-${formatVND(Math.abs(totalBudget - totalActualSpend))}`}
              </div>
              <span className="text-[11px] opacity-80 mt-0.5 block font-medium">
                {totalBudget - totalActualSpend >= 0 ? 'Trong ngưỡng kiểm soát' : 'Cần thắt chặt chi tiêu'}
              </span>
            </div>
          </div>

          {/* Card 4: 3-Color Spectrum Status Summary */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Phân Phối 3 Vùng Màu</span>
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 bg-emerald-100/90 border border-emerald-200 text-emerald-800 rounded-lg p-1.5 text-center">
                <span className="text-[10px] font-bold block uppercase tracking-wider text-emerald-700">Xanh</span>
                <span className="text-sm font-bold font-mono">{greenCount}</span>
              </div>
              <div className="flex-1 bg-amber-100/90 border border-amber-200 text-amber-800 rounded-lg p-1.5 text-center">
                <span className="text-[10px] font-bold block uppercase tracking-wider text-amber-700">Vàng</span>
                <span className="text-sm font-bold font-mono">{yellowCount}</span>
              </div>
              <div className="flex-1 bg-rose-100/90 border border-rose-200 text-rose-800 rounded-lg p-1.5 text-center">
                <span className="text-[10px] font-bold block uppercase tracking-wider text-rose-700">Đỏ</span>
                <span className="text-sm font-bold font-mono">{redCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Master Progress Bar with Threshold Markers */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2 font-medium">
            <span className="text-slate-600 flex items-center gap-2">
              <span className="font-semibold text-slate-800">Thước Đo Giải Ngân {getMonthDisplay(selectedMonth)}</span>
              <span className="text-slate-400">•</span>
              <span className="text-[11px] text-slate-500">Ngưỡng cảnh báo: 80% (Vàng) & 100% (Đỏ)</span>
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">{totalPercent}%</span>
          </div>

          <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            {/* 80% Marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-amber-500/60 z-10" 
              style={{ left: '80%' }}
              title="Ngưỡng cảnh báo 80%"
            />
            {/* Progress Fill */}
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                overallStatus === 'red' 
                  ? 'bg-rose-500' 
                  : overallStatus === 'yellow' 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, totalPercent)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1 px-1">
            <span>0%</span>
            <span className="text-amber-600 font-semibold">80% Cảnh báo</span>
            <span className="text-rose-600 font-semibold">100% Giới hạn</span>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold shadow-xs transition-all animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. HIGH PRIORITY WARNING ALERTS (Cảnh Báo Vượt & Gần Ngưỡng) */}
      {(redCount > 0 || yellowCount > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Cảnh Báo Vượt & Tiệm Cận Ngưỡng Hạn Mức
                </h2>
                <p className="text-xs text-slate-500">
                  Phát hiện <strong className="text-rose-600 font-bold">{redCount} khoản đã vượt hạn mức</strong> và <strong className="text-amber-600 font-bold">{yellowCount} khoản tiệm cận ngưỡng 80%</strong>.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              Ưu tiên xử lý
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Red Cards (Vượt đỏ) */}
            {categoryAnalyses.filter(item => item.status === 'red').map(item => (
              <div 
                key={item.category.id}
                className="bg-rose-50/70 border border-rose-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:border-rose-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: item.category.color || '#ef4444' }}
                      />
                      <div>
                        <h3 className="text-sm font-bold text-rose-950">
                          {item.category.name}
                        </h3>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider mt-0.5">
                          VƯỢT HẠN MỨC ({item.percent}%)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-rose-700 font-mono bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                      +{formatVND(item.actualAmount - item.budgetAmount)}
                    </span>
                  </div>

                  <p className="text-xs text-rose-900/90 leading-relaxed mt-2">
                    Hạn mức cho phép: <strong className="font-mono">{formatVND(item.budgetAmount)}</strong> nhưng đã thực chi <strong className="font-mono text-rose-700">{formatVND(item.actualAmount)}</strong>. Hãy tạm dừng chi tiêu khoản này cho các ngày còn lại.
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-rose-200/70 flex items-center justify-between text-xs">
                  <span className="text-rose-700 text-[11px]">Đề xuất: {formatVND(item.recommendedAmount)}</span>
                  <button
                    onClick={() => handleStartEdit(item.category.id, item.budgetAmount)}
                    className="text-xs font-bold text-rose-900 hover:text-rose-950 underline cursor-pointer"
                  >
                    Điều chỉnh lại hạn mức
                  </button>
                </div>
              </div>
            ))}

            {/* Yellow Cards (Gần 80% số thì vàng) */}
            {categoryAnalyses.filter(item => item.status === 'yellow').map(item => (
              <div 
                key={item.category.id}
                className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 flex flex-col justify-between shadow-2xs hover:border-amber-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: item.category.color || '#f59e0b' }}
                      />
                      <div>
                        <h3 className="text-sm font-bold text-amber-950">
                          {item.category.name}
                        </h3>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider mt-0.5">
                          TIỆM CẬN NGƯỠNG ({item.percent}%)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 font-mono bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                      Còn {formatVND(item.remainingAmount)}
                    </span>
                  </div>

                  <p className="text-xs text-amber-900/90 leading-relaxed mt-2">
                    Đã sử dụng <strong className="font-mono text-amber-800">{item.percent}%</strong> ngân sách ({formatVND(item.actualAmount)} / {formatVND(item.budgetAmount)}). Chỉ còn lại <strong className="font-mono">{formatVND(item.remainingAmount)}</strong> để chi tiêu.
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-amber-200/70 flex items-center justify-between text-xs">
                  <span className="text-amber-800 text-[11px]">Ngưỡng cảnh báo: 80% – 100%</span>
                  <button
                    onClick={() => handleStartEdit(item.category.id, item.budgetAmount)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                  >
                    Xem & sửa hạn mức
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Controls Toolbar (Filter by Status, Group, Search, View Mode) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc trạng thái:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({categoryAnalyses.length})
          </button>
          <button
            onClick={() => setStatusFilter('red')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'red'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Vượt đỏ ({redCount})
          </button>
          <button
            onClick={() => setStatusFilter('yellow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'yellow'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Cảnh báo vàng ({yellowCount})
          </button>
          <button
            onClick={() => setStatusFilter('green')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'green'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            An toàn xanh ({greenCount})
          </button>
        </div>

        {/* Right: Search & View Mode Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[180px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm hạng mục..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] focus:bg-white"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem bảng chi tiết"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Xem thẻ trực quan"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MAIN BUDGET CONTENT: Table View OR Cards Grid View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Bảng Chi Tiết Hạn Mức Từng Danh Mục</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Nhấp chuột vào số tiền hạn mức để chỉnh sửa nhanh)
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> &lt; 80% Xanh
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 80–100% Vàng
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> &gt; 100% Đỏ
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4 min-w-[150px]">Hạng mục chi tiêu</th>
                  <th className="py-3 px-3 min-w-[120px]">Nhóm tài chính</th>
                  <th className="py-3 px-3 text-right min-w-[140px]">Hạn mức đã đặt (₫)</th>
                  <th className="py-3 px-3 text-right min-w-[120px]">Thực chi (₫)</th>
                  <th className="py-3 px-3 text-right min-w-[120px]">Còn lại (₫)</th>
                  <th className="py-3 px-4 min-w-[170px]">Tiến độ & Màu sắc</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Không tìm thấy danh mục chi tiêu nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((item) => {
                    const isEditing = editingCatId === item.category.id;

                    // Row tinting based on user color rules
                    const rowBg = item.status === 'red'
                      ? 'hover:bg-rose-50/50 bg-rose-50/20'
                      : item.status === 'yellow'
                        ? 'hover:bg-amber-50/50 bg-amber-50/20'
                        : 'hover:bg-slate-50 bg-white';

                    const badgeClass = item.status === 'red'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : item.status === 'yellow'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                    const progressColor = item.status === 'red'
                      ? 'bg-rose-500'
                      : item.status === 'yellow'
                        ? 'bg-amber-400'
                        : 'bg-emerald-500';

                    return (
                      <tr key={item.category.id} className={`transition-colors ${rowBg}`}>
                        {/* 1. Category Name */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: item.category.color || '#6366f1' }}
                            />
                            <span className="font-bold">{item.category.name}</span>
                            {item.category.isSavings && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Tiết kiệm
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Financial Group */}
                        <td className="py-3.5 px-3 text-slate-500">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {item.group === 'essential' ? 'Thiết yếu' : item.group === 'savings' ? 'Tích lũy' : 'Linh hoạt'}
                          </span>
                        </td>

                        {/* 3. Budget Limit (Interactive) */}
                        <td className="py-3.5 px-3 text-right font-mono">
                          {isEditing ? (
                            <div className="space-y-1.5 flex flex-col items-end">
                              <input
                                type="text"
                                autoFocus
                                value={tempBudgetVal}
                                onChange={(e) => setTempBudgetVal(e.target.value)}
                                placeholder="VD: 1.500.000"
                                className="w-32 text-right bg-white border border-[#0A66C2] rounded-md px-2 py-1 text-slate-900 font-mono text-xs focus:outline-none shadow-xs"
                              />
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={applyToAll}
                                    onChange={(e) => setApplyToAll(e.target.checked)}
                                    className="w-3 h-3 text-[#0A66C2] rounded"
                                  />
                                  <span>Cho tất cả tháng</span>
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleStartEdit(item.category.id, item.budgetAmount)}
                              className="cursor-pointer group inline-flex items-center gap-1.5 hover:text-[#0A66C2]"
                              title="Nhấp để sửa hạn mức"
                            >
                              <span className="font-bold text-slate-900 group-hover:underline text-[13px]">
                                {formatVND(item.budgetAmount)}
                              </span>
                              <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-[#0A66C2]" />
                            </div>
                          )}
                        </td>

                        {/* 4. Actual Amount Spent */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-[13px]">
                          {formatVND(item.actualAmount)}
                        </td>

                        {/* 5. Remaining Safe Allowance */}
                        <td className={`py-3.5 px-3 text-right font-mono font-bold text-[13px] ${
                          item.remainingAmount < 0 ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {item.remainingAmount >= 0 ? formatVND(item.remainingAmount) : `-${formatVND(Math.abs(item.remainingAmount))}`}
                        </td>

                        {/* 6. Percentage & Colored Progress Bar */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}>
                                {item.statusText}
                              </span>
                              <span className="font-mono font-bold text-[11px] text-slate-800">
                                {item.percent}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${progressColor}`}
                                style={{ width: `${Math.min(100, item.percent)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 7. Action Buttons */}
                        <td className="py-3.5 px-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveBudget(item.category.id)}
                                className="p-1 rounded bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors cursor-pointer"
                                title="Lưu hạn mức"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleQuickAdjust(item.category.id, item.budgetAmount, -100000)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Giảm 100k"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleQuickAdjust(item.category.id, item.budgetAmount, 100000)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Tăng 100k"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleStartEdit(item.category.id, item.budgetAmount)}
                                className="p-1 text-slate-400 hover:text-[#0A66C2] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                title="Chỉnh sửa hạn mức"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Table Footer Summary */}
              <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900 font-mono text-[13px]">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 font-sans font-bold">
                    TỔNG CỘNG ({selectedMonth})
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(totalBudget)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(totalActualSpend)}
                  </td>
                  <td className={`py-3.5 px-3 text-right ${totalBudget - totalActualSpend < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {totalBudget - totalActualSpend >= 0 ? formatVND(totalBudget - totalActualSpend) : `-${formatVND(Math.abs(totalBudget - totalActualSpend))}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Tổng giải ngân:</span>
                      <span className={overallStatus === 'red' ? 'text-rose-600 font-bold' : overallStatus === 'yellow' ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {totalPercent}%
                      </span>
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View (Sleek visual representation) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((item) => {
            const isEditing = editingCatId === item.category.id;

            const cardBorder = item.status === 'red'
              ? 'border-rose-300/80 bg-rose-50/20'
              : item.status === 'yellow'
                ? 'border-amber-300/80 bg-amber-50/20'
                : 'border-slate-200 bg-white';

            const badgeBg = item.status === 'red'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : item.status === 'yellow'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            const progressBarColor = item.status === 'red'
              ? 'bg-rose-500'
              : item.status === 'yellow'
                ? 'bg-amber-400'
                : 'bg-emerald-500';

            return (
              <div 
                key={item.category.id}
                className={`rounded-2xl border p-4.5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${cardBorder}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: item.category.color || '#6366f1' }}
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {item.category.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.groupName}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                      {item.percent}%
                    </span>
                  </div>

                  {/* Amounts Grid */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Hạn mức đặt:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={tempBudgetVal}
                          onChange={(e) => setTempBudgetVal(e.target.value)}
                          className="w-full text-right bg-white border border-[#0A66C2] rounded px-1.5 py-0.5 text-slate-900 font-mono text-xs focus:outline-none shadow-xs mt-1"
                        />
                      ) : (
                        <span 
                          onClick={() => handleStartEdit(item.category.id, item.budgetAmount)}
                          className="font-mono font-bold text-slate-900 text-xs hover:text-[#0A66C2] cursor-pointer"
                        >
                          {formatVND(item.budgetAmount)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Thực tế đã chi:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {formatVND(item.actualAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Colored Progress Bar */}
                  <div className="space-y-1 my-2">
                    <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${progressBarColor}`}
                        style={{ width: `${Math.min(100, item.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{item.statusText}</span>
                      <span className={`font-mono font-bold ${item.remainingAmount < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {item.remainingAmount >= 0 ? `Còn ${formatVND(item.remainingAmount)}` : `Vượt ${formatVND(Math.abs(item.remainingAmount))}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Đề xuất: {formatVND(item.recommendedAmount)}
                  </span>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveBudget(item.category.id)}
                        className="p-1 rounded bg-[#0A66C2] text-white hover:bg-[#004182] transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(item.category.id, item.budgetAmount)}
                      className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Sửa hạn mức</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. PHẦN ĐỀ XUẤT NÊN ĐỂ CÁC KHOẢNG NHƯ THẾ NÀO (Smart Recommendations & Simulator) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Chuyên Gia Đề Xuất: Nên Phân Bổ Các Khoảng Hạn Mức Như Nào?</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mô hình quản trị tài chính cá nhân khoa học (50/30/20) chuẩn hóa theo thu nhập thực tế của bạn
              </p>
            </div>
          </div>

          <button
            onClick={() => handleApplyAllRecommendations(simulatorIncome)}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-center active:scale-95 shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Áp Dụng Bộ Đề Xuất Này</span>
          </button>
        </div>

        {/* Interactive Income Simulator Slider */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thử Nghiệm Mức Thu Nhập Hàng Tháng Để Xem Phân Bổ Đề Xuất:</span>
            </span>
            <span className="font-mono font-bold text-indigo-700 text-sm bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
              {formatVND(simulatorIncome)}
            </span>
          </div>

          <input
            type="range"
            min={4000000}
            max={30000000}
            step={500000}
            value={simulatorIncome}
            onChange={(e) => setSimulatorIncome(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>4.000.000 ₫ (Cơ bản)</span>
            <span>10.000.000 ₫</span>
            <span>20.000.000 ₫</span>
            <span>30.000.000 ₫ (Mục tiêu tương lai)</span>
          </div>
        </div>

        {/* 3 Pillars Breakdown (50 / 30 / 20) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Chi Phí Thiết Yếu */}
          <div className="bg-blue-50/50 border border-blue-200/90 rounded-2xl p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  1. Chi Phí Thiết Yếu
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  Tối đa 50–55%
                </span>
              </div>
              <div className="text-xl font-bold text-blue-950 font-mono mb-1.5">
                ~{formatVND(simulatorIncome * 0.52)}
              </div>
              <p className="text-xs text-blue-900/80 leading-relaxed">
                Bao gồm: <strong>Tiền trọ, Gửi về gia đình, Ăn uống hàng ngày, Xăng xe, Giữ xe, Điện thoại/5G</strong>. Đây là các khoản sinh hoạt bắt buộc để duy trì cuộc sống.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-blue-200/70 text-[11px] text-blue-900">
              💡 <em>Lời khuyên:</em> Giữ chi phí phòng trọ và gửi về trong ngưỡng dưới 55% thu nhập để không bị âm dòng tiền giữa các đợt lương.
            </div>
          </div>

          {/* Pillar 2: Linh Hoạt & Giải Trí */}
          <div className="bg-purple-50/50 border border-purple-200/90 rounded-2xl p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  2. Linh Hoạt & Giải Trí
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                  Khoảng 20–25%
                </span>
              </div>
              <div className="text-xl font-bold text-purple-950 font-mono mb-1.5">
                ~{formatVND(simulatorIncome * 0.25)}
              </div>
              <p className="text-xs text-purple-900/80 leading-relaxed">
                Bao gồm: <strong>Đi chơi với người yêu (Tiên), Cafe bạn bè, Mua sắm Shopee, Grab di chuyển, Chi tiêu cá nhân</strong>. Đây là các khoản có thể chủ động linh hoạt co giãn.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200/70 text-[11px] text-purple-900">
              💡 <em>Lời khuyên:</em> Đặt hạn mức cứng cho "Đi chơi" và "Shopee". Nếu tuần đầu đã chi nhiều, hãy chủ động hạn chế vào các tuần kế tiếp.
            </div>
          </div>

          {/* Pillar 3: Tích Lũy & Tiết Kiệm */}
          <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  3. Tích Lũy & Tiết Kiệm
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Tối thiểu 18–20%
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-950 font-mono mb-1.5">
                ~{formatVND(simulatorIncome * 0.20)}
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Bao gồm: <strong>Gửi tiết kiệm ngân hàng, Quỹ khẩn cấp (dự phòng bất ngờ)</strong>. Xây dựng tài chính vững vàng cho các mục tiêu dài hạn.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-200/70 text-[11px] text-emerald-900">
              💡 <em>Lời khuyên:</em> Nguyên tắc vàng <strong>"Tiết kiệm trước - Chi tiêu sau"</strong>: Ngay khi nhận lương, hãy chuyển ngay khoản tiết kiệm vào tài khoản riêng.
            </div>
          </div>
        </div>

        {/* Detailed Category Recommended Breakdown Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Chi Tiết Khuyến Nghị Từng Hạng Mục Cụ Thể (Mức thu nhập {formatVND(simulatorIncome)})</span>
            <span className="text-slate-400 font-normal">So sánh với hạn mức bạn đang đặt</span>
          </div>

          <div className="divide-y divide-slate-200 text-xs">
            {categoryAnalyses.map((item) => {
              const rec = getSmartRecommendedAmount(item.category, simulatorIncome);
              const diff = item.budgetAmount - rec.amount;

              return (
                <div key={item.category.id} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                  <div className="flex items-start gap-3">
                    <span 
                      className="w-3 h-3 rounded-full mt-0.5 shrink-0" 
                      style={{ backgroundColor: item.category.color || '#6366f1' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">{item.category.name}</strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                          {item.groupName}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {rec.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Đang đặt:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatVND(item.budgetAmount)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-indigo-600 font-semibold block">Đề xuất chuẩn:</span>
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {formatVND(rec.amount)}
                      </span>
                    </div>

                    <div className="min-w-[80px] text-right text-[11px] font-semibold">
                      {diff === 0 ? (
                        <span className="text-emerald-700">Chuẩn xác</span>
                      ) : diff > 0 ? (
                        <span className="text-amber-700">+{formatVND(diff)} (Nới lỏng)</span>
                      ) : (
                        <span className="text-blue-700">{formatVND(diff)} (Thắt chặt)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
