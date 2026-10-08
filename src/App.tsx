/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppFinanceData, Transaction } from './types/finance';
import { INITIAL_FINANCE_DATA } from './utils/initialData';
import { 
  calculateAllMonthSummaries, 
  exportToUserCSV, 
  fetchGoogleSheetCSV,
  parseCSVToFinanceData,
  pushFinanceDataToGoogleSheet 
} from './utils/googleSheetsSync';
import { switchActiveYear, addNewYearToData } from './utils/multiYearHelpers';
import { Header, NavTabType } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { BudgetView } from './components/BudgetView';
import { DailyMatrixSheet } from './components/DailyMatrixSheet';
import { MultiMonthTable } from './components/MultiMonthTable';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

const STORAGE_KEY = 'fintrack_vn_v14';

export default function App() {
  const [data, setData] = useState<AppFinanceData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version === 14) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved finance data', e);
    }
    return INITIAL_FINANCE_DATA;
  });

  // Active navigation: 3 tabs only (Tổng quan, Nhập theo ngày, Bảng theo tháng)
  const [activeTab, setActiveTab] = useState<NavTabType>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('T10');

  // Modals
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);

  // Sync statuses
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetSyncError, setSheetSyncError] = useState<string | null>(null);
  const [isPushingToSheet, setIsPushingToSheet] = useState(false);

  // Cache to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveStatus('Đã lưu');
      const timer = setTimeout(() => setSaveStatus(null), 1800);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Failed to save finance data', e);
    }
  }, [data]);

  // Function to reload data from Google Sheet URL
  const reloadFromSheet = useCallback(async (urlToUse?: string) => {
    const url = urlToUse || data.googleSheetUrl;
    if (!url || !url.trim()) {
      setIsGoogleSheetsModalOpen(true);
      return;
    }

    setIsLoadingSheet(true);
    setSheetSyncError(null);

    try {
      const csvText = await fetchGoogleSheetCSV(url.trim());
      const parsed = parseCSVToFinanceData(csvText, data);
      parsed.googleSheetUrl = url.trim();
      setData(parsed);
      setSaveStatus('Đã nạp số liệu mới từ Google Sheet!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      console.warn('Google Sheet fetch error:', err);
      setSheetSyncError(err.message || 'Lỗi khi tải dữ liệu từ Google Sheets.');
    } finally {
      setIsLoadingSheet(false);
    }
  }, [data]);

  // Auto-fetch from Google Sheet on app mount if a link is configured
  const hasAttemptedInitialFetch = useRef(false);
  useEffect(() => {
    if (!hasAttemptedInitialFetch.current && data.googleSheetUrl) {
      hasAttemptedInitialFetch.current = true;
      reloadFromSheet(data.googleSheetUrl);
    }
  }, [data.googleSheetUrl, reloadFromSheet]);

  // Background push to Google Sheet when Webhook is configured
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!data.googleScriptWebhookUrl || data.autoSyncToGoogleSheet === false) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsPushingToSheet(true);
        await pushFinanceDataToGoogleSheet(data.googleScriptWebhookUrl!, data);
        setSaveStatus('Đã đẩy lên Sheet');
        setTimeout(() => setSaveStatus(null), 2500);
      } catch (err) {
        console.warn('Auto-sync to Google Sheet failed:', err);
      } finally {
        setIsPushingToSheet(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [data]);

  // Ensure selectedMonth is valid
  useEffect(() => {
    if (!data.months.includes(selectedMonth) && data.months.length > 0) {
      setSelectedMonth(data.months[0]);
    }
  }, [data.months, selectedMonth]);

  // Compute summaries with memoization
  const summaries = useMemo(() => {
    return calculateAllMonthSummaries(data);
  }, [data]);

  // Cell Updates in Multi-Month Table
  const handleUpdateExpenseCell = useCallback((monthKey: string, categoryId: string, amount: number) => {
    setData((prev) => {
      const records = { ...prev.records };
      const currentRecord = records[monthKey] || {
        monthKey,
        label: monthKey,
        expenses: {},
        incomes: {},
        transactions: [],
      };

      const validAmount = Math.max(0, amount);
      const existingTxs = currentRecord.transactions || [];
      const catTxs = existingTxs.filter((t) => t.type === 'expense' && t.categoryId === categoryId);
      const otherTxs = existingTxs.filter((t) => !(t.type === 'expense' && t.categoryId === categoryId));

      const updatedTxs = [...otherTxs];
      if (validAmount > 0) {
        if (catTxs.length > 0) {
          updatedTxs.push({ ...catTxs[0], amount: validAmount });
        } else {
          const mNum = monthKey.startsWith('T') && !isNaN(Number(monthKey.slice(1)))
            ? monthKey.slice(1).padStart(2, '0')
            : '10';
          const catName = prev.expenseCategories.find((c) => c.id === categoryId)?.name || 'Chi tiêu';
          updatedTxs.push({
            id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            monthKey,
            categoryId,
            type: 'expense',
            amount: validAmount,
            description: catName,
            date: `2026-${mNum}-05`,
          });
        }
      }

      records[monthKey] = {
        ...currentRecord,
        expenses: {
          ...currentRecord.expenses,
          [categoryId]: validAmount,
        },
        transactions: updatedTxs,
      };

      return { ...prev, records };
    });
  }, []);

  const handleUpdateIncomeCell = useCallback((monthKey: string, incomeId: string, amount: number) => {
    setData((prev) => {
      const records = { ...prev.records };
      const currentRecord = records[monthKey] || {
        monthKey,
        label: monthKey,
        expenses: {},
        incomes: {},
        transactions: [],
      };

      const validAmount = Math.max(0, amount);
      const existingTxs = currentRecord.transactions || [];
      const incTxs = existingTxs.filter((t) => t.type === 'income' && t.categoryId === incomeId);
      const otherTxs = existingTxs.filter((t) => !(t.type === 'income' && t.categoryId === incomeId));

      const updatedTxs = [...otherTxs];
      if (validAmount > 0) {
        if (incTxs.length > 0) {
          updatedTxs.push({ ...incTxs[0], amount: validAmount });
        } else {
          const mNum = monthKey.startsWith('T') && !isNaN(Number(monthKey.slice(1)))
            ? monthKey.slice(1).padStart(2, '0')
            : '10';
          const streamName = prev.incomeStreams.find((s) => s.id === incomeId)?.name || 'Thu nhập';
          const defaultDay = incomeId.includes('dot2') ? '25' : '05';
          updatedTxs.push({
            id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            monthKey,
            categoryId: incomeId,
            type: 'income',
            amount: validAmount,
            description: streamName,
            date: `2026-${mNum}-${defaultDay}`,
          });
        }
      }

      records[monthKey] = {
        ...currentRecord,
        incomes: {
          ...currentRecord.incomes,
          [incomeId]: validAmount,
        },
        transactions: updatedTxs,
      };

      return { ...prev, records };
    });
  }, []);

  const handleUpdateDailyExpenseCell = useCallback((
    monthKey: string,
    dateStr: string,
    categoryId: string,
    amount: number
  ) => {
    setData((prev) => {
      const records = { ...prev.records };
      const currentRecord = records[monthKey] || {
        monthKey,
        label: monthKey,
        expenses: {},
        incomes: {},
        transactions: [],
      };

      const existingTxs = currentRecord.transactions || [];
      const remainingTxs = existingTxs.filter(
        (t) => !(t.date === dateStr && t.categoryId === categoryId && t.type === 'expense')
      );

      if (amount > 0) {
        const catName = prev.expenseCategories.find((c) => c.id === categoryId)?.name || 'Chi tiêu';
        remainingTxs.push({
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          monthKey,
          categoryId,
          type: 'expense',
          amount,
          description: catName,
          date: dateStr,
        });
      }

      const updatedExpenses = { ...currentRecord.expenses };
      const catSum = remainingTxs
        .filter((t) => t.type === 'expense' && t.categoryId === categoryId)
        .reduce((sum, t) => sum + t.amount, 0);

      updatedExpenses[categoryId] = catSum;

      records[monthKey] = {
        ...currentRecord,
        expenses: updatedExpenses,
        transactions: remainingTxs,
      };

      return { ...prev, records };
    });
  }, []);

  const handleUpdateDailyIncomeCell = useCallback((
    monthKey: string,
    dateStr: string,
    incomeId: string,
    amount: number
  ) => {
    setData((prev) => {
      const records = { ...prev.records };
      const currentRecord = records[monthKey] || {
        monthKey,
        label: monthKey,
        expenses: {},
        incomes: {},
        transactions: [],
      };

      const existingTxs = currentRecord.transactions || [];
      const remainingTxs = existingTxs.filter(
        (t) => !(t.date === dateStr && t.categoryId === incomeId && t.type === 'income')
      );

      if (amount > 0) {
        const streamName = prev.incomeStreams.find((s) => s.id === incomeId)?.name || 'Thu nhập';
        remainingTxs.push({
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          monthKey,
          categoryId: incomeId,
          type: 'income',
          amount,
          description: streamName,
          date: dateStr,
        });
      }

      const updatedIncomes = { ...currentRecord.incomes };
      const incSum = remainingTxs
        .filter((t) => t.type === 'income' && t.categoryId === incomeId)
        .reduce((sum, t) => sum + t.amount, 0);

      updatedIncomes[incomeId] = incSum;

      records[monthKey] = {
        ...currentRecord,
        incomes: updatedIncomes,
        transactions: remainingTxs,
      };

      return { ...prev, records };
    });
  }, []);

  const handleAddTransaction = useCallback((txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    setData((prev) => {
      const records = { ...prev.records };
      const currentRecord = records[txData.monthKey] || {
        monthKey: txData.monthKey,
        label: txData.monthKey,
        expenses: {},
        incomes: {},
        transactions: [],
      };

      const existingTxs = currentRecord.transactions || [];
      const updatedTxs = [newTx, ...existingTxs];

      const updatedExpenses = { ...currentRecord.expenses };
      const updatedIncomes = { ...currentRecord.incomes };

      if (txData.type === 'expense') {
        updatedExpenses[txData.categoryId] = (updatedExpenses[txData.categoryId] || 0) + txData.amount;
      } else {
        updatedIncomes[txData.categoryId] = (updatedIncomes[txData.categoryId] || 0) + txData.amount;
      }

      records[txData.monthKey] = {
        ...currentRecord,
        expenses: updatedExpenses,
        incomes: updatedIncomes,
        transactions: updatedTxs,
      };

      return { ...prev, records };
    });
  }, []);

  const handleDeleteTransaction = useCallback((monthKey: string, txId: string) => {
    setData((prev) => {
      const records = { ...prev.records };
      const currentRecord = records[monthKey];
      if (!currentRecord) return prev;

      const txToRemove = currentRecord.transactions?.find((t) => t.id === txId);
      const remainingTxs = (currentRecord.transactions || []).filter((t) => t.id !== txId);

      const updatedExpenses = { ...currentRecord.expenses };
      const updatedIncomes = { ...currentRecord.incomes };

      if (txToRemove) {
        if (txToRemove.type === 'expense') {
          updatedExpenses[txToRemove.categoryId] = Math.max(
            0,
            (updatedExpenses[txToRemove.categoryId] || 0) - txToRemove.amount
          );
        } else {
          updatedIncomes[txToRemove.categoryId] = Math.max(
            0,
            (updatedIncomes[txToRemove.categoryId] || 0) - txToRemove.amount
          );
        }
      }

      records[monthKey] = {
        ...currentRecord,
        expenses: updatedExpenses,
        incomes: updatedIncomes,
        transactions: remainingTxs,
      };

      return { ...prev, records };
    });
  }, []);

  const handleUpdateStartingSavings = useCallback((amount: number) => {
    setData((prev) => ({
      ...prev,
      startingSavings: Math.max(0, amount),
    }));
  }, []);

  const handleAddMonth = useCallback((monthKey: string) => {
    if (data.months.includes(monthKey)) return;
    setData((prev) => {
      const newMonths = [...prev.months, monthKey];
      const records = { ...prev.records };
      if (!records[monthKey]) {
        records[monthKey] = {
          monthKey,
          label: monthKey.startsWith('T') && !isNaN(Number(monthKey.slice(1))) ? `Tháng ${monthKey.slice(1)}` : monthKey,
          expenses: {},
          incomes: {},
          transactions: [],
        };
      }
      return { ...prev, months: newMonths, records };
    });
    setSelectedMonth(monthKey);
  }, [data.months]);

  const handleDeleteMonth = useCallback((monthKey: string) => {
    if (data.months.length <= 1) return;
    setData((prev) => {
      const newMonths = prev.months.filter((m) => m !== monthKey);
      const records = { ...prev.records };
      delete records[monthKey];
      return { ...prev, months: newMonths, records };
    });
  }, [data.months.length]);

  const handleAddExpenseCategory = useCallback((name: string, isSavings = false) => {
    const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setData((prev) => ({
      ...prev,
      expenseCategories: [
        ...prev.expenseCategories,
        {
          id,
          name,
          isSavings,
          color: isSavings ? '#16a34a' : '#6366f1',
        },
      ],
    }));
  }, []);

  const handleDeleteExpenseCategory = useCallback((id: string) => {
    if (data.expenseCategories.length <= 1) return;
    setData((prev) => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter((c) => c.id !== id),
    }));
  }, [data.expenseCategories.length]);

  const handleAddIncomeStream = useCallback((name: string) => {
    const id = `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setData((prev) => ({
      ...prev,
      incomeStreams: [...prev.incomeStreams, { id, name }],
    }));
  }, []);

  const handleDeleteIncomeStream = useCallback((id: string) => {
    if (data.incomeStreams.length <= 1) return;
    setData((prev) => ({
      ...prev,
      incomeStreams: prev.incomeStreams.filter((s) => s.id !== id),
    }));
  }, [data.incomeStreams.length]);

  const handleUpdateCategoryBudget = useCallback((
    monthKey: string,
    categoryId: string,
    budgetAmount: number,
    applyToAllMonths = false
  ) => {
    setData((prev) => {
      const validBudget = Math.max(0, budgetAmount);
      const updatedDefaultBudgets = {
        ...(prev.defaultBudgets || {}),
        [categoryId]: validBudget,
      };

      const records = { ...prev.records };

      if (applyToAllMonths) {
        prev.months.forEach((m) => {
          const rec = records[m] || {
            monthKey: m,
            label: m,
            expenses: {},
            incomes: {},
          };
          records[m] = {
            ...rec,
            budgets: {
              ...(rec.budgets || {}),
              [categoryId]: validBudget,
            },
          };
        });
      } else {
        const currentRecord = records[monthKey] || {
          monthKey,
          label: monthKey,
          expenses: {},
          incomes: {},
        };
        records[monthKey] = {
          ...currentRecord,
          budgets: {
            ...(currentRecord.budgets || {}),
            [categoryId]: validBudget,
          },
        };
      }

      return {
        ...prev,
        defaultBudgets: updatedDefaultBudgets,
        records,
      };
    });
  }, []);

  const handleApplyRecommendedBudget = useCallback((
    monthKey: string,
    newBudgets: Record<string, number>
  ) => {
    setData((prev) => {
      const records = { ...prev.records };
      const currentRecord = records[monthKey] || {
        monthKey,
        label: monthKey,
        expenses: {},
        incomes: {},
      };
      records[monthKey] = {
        ...currentRecord,
        budgets: {
          ...(currentRecord.budgets || {}),
          ...newBudgets,
        },
      };

      return {
        ...prev,
        records,
      };
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    const csvContent = exportToUserCSV(data);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinTrack_VN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);

  const handleResetToOfficialSheet = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    setData(INITIAL_FINANCE_DATA);
    setSelectedMonth('T10');
    setSaveStatus('Đã khôi phục dữ liệu chuẩn từ Sheet!');
    setTimeout(() => setSaveStatus(null), 2500);
  }, []);

  const handleSelectYear = useCallback((targetYear: number) => {
    setData((prev) => switchActiveYear(prev, targetYear));
    setSaveStatus(`Đã chuyển sang bảng tài chính năm ${targetYear}`);
    setTimeout(() => setSaveStatus(null), 2500);
  }, []);

  const handleAddYear = useCallback((newYear: number) => {
    setData((prev) => addNewYearToData(prev, newYear));
    setSaveStatus(`Đã khởi tạo dữ liệu năm mới ${newYear}!`);
    setTimeout(() => setSaveStatus(null), 3000);
  }, []);

  const isSheetLinked = Boolean(data.googleSheetUrl || data.googleScriptWebhookUrl);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased">
      {/* 1. Header Navigation Bar (Year Selector + Navigation Tabs) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedYear={data.selectedYear || 2026}
        availableYears={data.availableYears || [2025, 2026, 2027, 2028]}
        onSelectYear={handleSelectYear}
        onAddYear={handleAddYear}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        onOpenAddTxModal={() => setIsAddTxModalOpen(true)}
        onExportCSV={handleExportCSV}
        onReloadFromSheet={() => reloadFromSheet()}
        isSheetLinked={isSheetLinked}
        isLoadingSheet={isLoadingSheet}
        isPushingToSheet={isPushingToSheet}
        lastSyncError={sheetSyncError}
      />

      {/* 2. Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Subtle Save/Sync notification */}
        {saveStatus && (
          <div className="flex justify-end">
            <span className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{saveStatus}</span>
            </span>
          </div>
        )}

        {/* Clear Notice Banner if Google Sheet URL has a 401 error or sync error */}
        {sheetSyncError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Không thể tải dữ liệu từ Google Sheets:</span>
                <p className="text-rose-800 leading-relaxed">{sheetSyncError}</p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={() => reloadFromSheet()}
                    disabled={isLoadingSheet}
                    className="font-semibold text-[#0A66C2] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingSheet ? 'animate-spin' : ''}`} />
                    <span>Thử tải lại</span>
                  </button>
                  <button
                    onClick={() => setIsGoogleSheetsModalOpen(true)}
                    className="font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                  >
                    Xem hướng dẫn mở quyền chia sẻ
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSheetSyncError(null)}
              className="text-rose-400 hover:text-rose-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 1: Tổng quan (Dashboard View - Data Analyst Financial Intelligence) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            data={data}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            summaries={summaries}
            onNavigateToDailySheet={() => setActiveTab('daily')}
            onNavigateToBudget={() => setActiveTab('budget')}
          />
        )}

        {/* Tab 2: Bảng Ngân sách (Budget Management & Financial Health) */}
        {activeTab === 'budget' && (
          <BudgetView
            data={data}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            summaries={summaries}
            onUpdateCategoryBudget={handleUpdateCategoryBudget}
            onApplyRecommendedBudget={handleApplyRecommendedBudget}
          />
        )}

        {/* Tab 3: Nhập theo ngày (Daily Matrix Spreadsheet View) */}
        {activeTab === 'daily' && (
          <DailyMatrixSheet
            data={data}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            summaries={summaries}
            onUpdateDailyCell={handleUpdateDailyExpenseCell}
            onUpdateDailyIncomeCell={handleUpdateDailyIncomeCell}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* Tab 3: Bảng theo tháng (Multi-Month Matrix View) */}
        {activeTab === 'table' && (
          <MultiMonthTable
            data={data}
            summaries={summaries}
            onUpdateExpenseCell={handleUpdateExpenseCell}
            onUpdateIncomeCell={handleUpdateIncomeCell}
            onUpdateStartingSavings={handleUpdateStartingSavings}
            onAddMonth={handleAddMonth}
            onDeleteMonth={handleDeleteMonth}
            onAddExpenseCategory={handleAddExpenseCategory}
            onDeleteExpenseCategory={handleDeleteExpenseCategory}
            onAddIncomeStream={handleAddIncomeStream}
            onDeleteIncomeStream={handleDeleteIncomeStream}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-xs bg-[#0A66C2] flex items-center justify-center text-white font-bold text-[9px]">
              FT
            </div>
            <span className="font-semibold text-slate-800">FinTrack VN</span>
            <span>·</span>
            <span>Quản Lý Thu Chi Cá Nhân</span>
            {data.lastSyncedAt && (
              <>
                <span>·</span>
                <span className="text-slate-400">
                  Đồng bộ lúc {new Date(data.lastSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <button
              onClick={handleResetToOfficialSheet}
              className="text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
              title="Khôi phục số liệu chuẩn xác 100% theo đúng bảng Google Sheet"
            >
              Đặt lại số liệu chuẩn Sheet
            </button>
            <span>·</span>
            <button
              onClick={() => reloadFromSheet()}
              disabled={isLoadingSheet}
              className="hover:text-[#0A66C2] transition-colors cursor-pointer"
            >
              Tải lại từ Sheet
            </button>
            <span>·</span>
            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="hover:text-[#0A66C2] transition-colors cursor-pointer"
            >
              Cấu hình Google Sheets
            </button>
            <span>·</span>
            <button
              onClick={handleExportCSV}
              className="hover:text-[#0A66C2] transition-colors cursor-pointer"
            >
              Xuất file CSV
            </button>
          </div>
        </div>
      </footer>

      {/* 4. Google Sheets Sync Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        data={data}
        onApplyNewData={(newData) => setData(newData)}
        onTriggerReload={() => reloadFromSheet()}
      />

      {/* 5. Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        data={data}
        defaultMonth={selectedMonth}
        onAddTransaction={handleAddTransaction}
      />
    </div>
  );
}
