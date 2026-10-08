import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { AppFinanceData } from '../types/finance';
import { formatVND, parseMoneyInput, getMonthDisplay } from '../utils/formatters';
import { MonthSummary } from '../utils/googleSheetsSync';

interface MultiMonthTableProps {
  data: AppFinanceData;
  summaries: Record<string, MonthSummary>;
  onUpdateExpenseCell: (monthKey: string, categoryId: string, amount: number) => void;
  onUpdateIncomeCell: (monthKey: string, incomeId: string, amount: number) => void;
  onUpdateStartingSavings: (amount: number) => void;
  onAddMonth: (monthKey: string) => void;
  onDeleteMonth: (monthKey: string) => void;
  onAddExpenseCategory: (name: string, isSavings?: boolean) => void;
  onDeleteExpenseCategory: (id: string) => void;
  onAddIncomeStream: (name: string) => void;
  onDeleteIncomeStream: (id: string) => void;
}

export const MultiMonthTable: React.FC<MultiMonthTableProps> = ({
  data,
  summaries,
  onUpdateExpenseCell,
  onUpdateIncomeCell,
  onUpdateStartingSavings,
  onAddMonth,
  onDeleteMonth,
  onAddExpenseCategory,
  onDeleteExpenseCategory,
  onAddIncomeStream,
  onDeleteIncomeStream,
}) => {
  const [editingCell, setEditingCell] = useState<{
    key: string;
    value: string;
  } | null>(null);

  // New month input
  const [showAddMonth, setShowAddMonth] = useState(false);
  const [newMonthName, setNewMonthName] = useState('');

  // New category inputs
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [isExpenseSavings, setIsExpenseSavings] = useState(false);

  const [showAddIncome, setShowAddIncome] = useState(false);
  const [newIncomeName, setNewIncomeName] = useState('');

  // Editing starting savings
  const [isEditingStartingSavings, setIsEditingStartingSavings] = useState(false);
  const [tempStartingSavings, setTempStartingSavings] = useState('');

  const handleCellBlur = (monthKey: string, id: string, type: 'expense' | 'income') => {
    if (!editingCell) return;
    const num = parseMoneyInput(editingCell.value);
    if (type === 'expense') {
      onUpdateExpenseCell(monthKey, id, num);
    } else {
      onUpdateIncomeCell(monthKey, id, num);
    }
    setEditingCell(null);
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    monthKey: string,
    id: string,
    type: 'expense' | 'income'
  ) => {
    if (e.key === 'Enter') {
      handleCellBlur(monthKey, id, type);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleCreateMonth = () => {
    if (!newMonthName.trim()) return;
    let normalized = newMonthName.trim();
    if (!normalized.toUpperCase().startsWith('T') && !isNaN(Number(normalized))) {
      normalized = `T${normalized}`;
    }
    onAddMonth(normalized);
    setNewMonthName('');
    setShowAddMonth(false);
  };

  const handleCreateExpense = () => {
    if (!newExpenseName.trim()) return;
    onAddExpenseCategory(newExpenseName.trim(), isExpenseSavings);
    setNewExpenseName('');
    setIsExpenseSavings(false);
    setShowAddExpense(false);
  };

  const handleCreateIncome = () => {
    if (!newIncomeName.trim()) return;
    onAddIncomeStream(newIncomeName.trim());
    setNewIncomeName('');
    setShowAddIncome(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Bảng Tổng Hợp Thu Chi - Năm {data.selectedYear || 2026}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-[#0A66C2] font-semibold border border-blue-200">
              Cấu trúc Google Sheets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhấp chuột vào bất kỳ ô nào để sửa trực tiếp. Dữ liệu sẽ tự động tính tổng chi, tiền dư và lũy kế.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!showAddMonth ? (
            <button
              onClick={() => {
                setShowAddMonth(true);
                const last = data.months[data.months.length - 1];
                if (last && last.startsWith('T') && !isNaN(Number(last.slice(1)))) {
                  const nextNum = Number(last.slice(1)) + 1;
                  setNewMonthName(`T${nextNum > 12 ? 1 : nextNum}`);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span>Thêm cột tháng</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-300 shadow-xs">
              <input
                type="text"
                placeholder="VD: T1, T2..."
                value={newMonthName}
                onChange={(e) => setNewMonthName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateMonth()}
                className="w-20 bg-transparent text-xs text-slate-900 px-2 py-1 focus:outline-none font-mono"
                autoFocus
              />
              <button
                onClick={handleCreateMonth}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowAddMonth(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Spreadsheet Matrix Grid */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/90 sticky top-0 z-10 text-slate-700">
              <th className="py-2.5 px-4 font-bold text-slate-800 w-64 min-w-[220px] border-r border-slate-200">
                Khoản mục thu / chi
              </th>
              {data.months.map((m) => (
                <th
                  key={m}
                  className="py-2.5 px-3 font-bold text-center min-w-[125px] border-r border-slate-200 relative group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">{m}</span>
                    <span className="text-[11px] text-slate-500 font-normal">({getMonthDisplay(m)})</span>
                    {data.months.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa cột tháng ${m} không?`)) {
                            onDeleteMonth(m);
                          }
                        }}
                        title={`Xóa cột ${m}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* ================= SECTION 1: CHI TIÊU (EXPENSES) ================= */}
            <tr className="bg-slate-100/90 border-y border-slate-200">
              <td
                colSpan={data.months.length + 1}
                className="py-2 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span>1. Danh mục các khoản chi tiêu</span>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="text-xs normal-case text-slate-600 hover:text-[#0A66C2] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm khoản chi</span>
                  </button>
                </div>
              </td>
            </tr>

            {/* Expense Categories Rows */}
            {data.expenseCategories.map((exp) => (
              <tr
                key={exp.id}
                className={`border-b border-slate-200/80 transition-colors group ${
                  exp.isSavings ? 'bg-emerald-50/25' : 'hover:bg-slate-50'
                }`}
              >
                <td className="py-2 px-4 font-medium text-slate-800 border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${exp.isSavings ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                      <span className={exp.isSavings ? 'text-emerald-900 font-bold' : ''}>
                        {exp.name}
                      </span>
                      {exp.isSavings && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-normal">
                          Quỹ
                        </span>
                      )}
                    </div>
                    {data.expenseCategories.length > 1 && (
                      <button
                        onClick={() => onDeleteExpenseCategory(exp.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                        title="Xóa danh mục này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>

                {data.months.map((m) => {
                  const cellKey = `exp_${m}_${exp.id}`;
                  const isEditing = editingCell?.key === cellKey;
                  const val = data.records[m]?.expenses?.[exp.id] ?? 0;

                  return (
                    <td
                      key={m}
                      onClick={() => !isEditing && setEditingCell({ key: cellKey, value: val > 0 ? val.toString() : '' })}
                      className="py-1.5 px-3 text-right border-r border-slate-200 cursor-pointer font-mono hover:bg-blue-50/50 transition-colors"
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                          onBlur={() => handleCellBlur(m, exp.id, 'expense')}
                          onKeyDown={(e) => handleCellKeyDown(e, m, exp.id, 'expense')}
                          placeholder="0"
                          className="w-full text-right bg-white border border-[#0A66C2] rounded px-1.5 py-0.5 text-slate-900 font-mono text-xs focus:outline-none shadow-xs"
                        />
                      ) : (
                        <span className={`inline-block px-1 py-0.5 rounded tabular-nums ${
                          val > 0
                            ? (exp.isSavings ? 'text-emerald-900 font-bold' : 'text-slate-900 font-semibold')
                            : 'text-slate-300 hover:text-slate-600 font-normal'
                        }`}>
                          {val > 0 ? val.toLocaleString('vi-VN') : '—'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Quick Add Expense Row */}
            {showAddExpense && (
              <tr className="bg-slate-50 border-b border-blue-200">
                <td className="py-2 px-4 border-r border-slate-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tên khoản chi..."
                      value={newExpenseName}
                      onChange={(e) => setNewExpenseName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateExpense()}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none w-full"
                      autoFocus
                    />
                    <label className="flex items-center gap-1 text-[11px] text-emerald-700 cursor-pointer whitespace-nowrap font-medium">
                      <input
                        type="checkbox"
                        checked={isExpenseSavings}
                        onChange={(e) => setIsExpenseSavings(e.target.checked)}
                        className="rounded accent-emerald-600"
                      />
                      <span>Là quỹ</span>
                    </label>
                  </div>
                </td>
                <td colSpan={data.months.length} className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleCreateExpense}
                      className="px-2.5 py-1 text-xs bg-[#0A66C2] text-white font-semibold rounded hover:bg-[#004182] cursor-pointer"
                    >
                      Thêm
                    </button>
                    <button
                      onClick={() => setShowAddExpense(false)}
                      className="px-2.5 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Row: Tổng Chi */}
            <tr className="bg-rose-50/50 border-b border-slate-200 font-bold text-rose-900">
              <td className="py-2.5 px-4 border-r border-slate-200">
                <div className="flex items-center justify-between">
                  <span>Tổng chi</span>
                  <span className="text-[10px] text-slate-400 font-normal">SUM()</span>
                </div>
              </td>
              {data.months.map((m) => {
                const total = summaries[m]?.totalExpense ?? 0;
                return (
                  <td
                    key={m}
                    className="py-2.5 px-3 text-right font-mono text-xs font-bold text-rose-800 border-r border-slate-200 tabular-nums"
                  >
                    {total.toLocaleString('vi-VN')}
                  </td>
                );
              })}
            </tr>

            {/* Row: Dư */}
            <tr className="bg-emerald-50/40 border-b-2 border-slate-300 font-bold">
              <td className="py-2.5 px-4 border-r border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-950">Dư</span>
                  <span className="text-[10px] text-slate-400 font-normal">Thu nhập - Chi tiêu</span>
                </div>
              </td>
              {data.months.map((m) => {
                const du = summaries[m]?.surplus ?? 0;
                return (
                  <td
                    key={m}
                    className={`py-2.5 px-3 text-right font-mono text-xs font-bold border-r border-slate-200 tabular-nums ${
                      du >= 0 ? 'text-emerald-800' : 'text-amber-800'
                    }`}
                  >
                    {du.toLocaleString('vi-VN')}
                  </td>
                );
              })}
            </tr>

            {/* Spacer */}
            <tr className="h-3 bg-slate-100/60">
              <td colSpan={data.months.length + 1} />
            </tr>

            {/* ================= SECTION 2: TIỀN TIẾT KIỆM TÍCH LŨY ================= */}
            <tr className="bg-emerald-50/70 border-y border-emerald-200">
              <td
                colSpan={data.months.length + 1}
                className="py-2 px-4 font-bold text-[11px] uppercase tracking-wider text-emerald-900"
              >
                <div className="flex items-center justify-between">
                  <span>2. Quỹ tiền tiết kiệm tích lũy</span>
                  <div className="flex items-center gap-2 text-xs normal-case text-slate-600 font-normal">
                    <span>Khởi điểm:</span>
                    {isEditingStartingSavings ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempStartingSavings}
                          onChange={(e) => setTempStartingSavings(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateStartingSavings(parseMoneyInput(tempStartingSavings));
                              setIsEditingStartingSavings(false);
                            }
                          }}
                          className="w-24 bg-white border border-emerald-400 rounded px-1.5 py-0.5 text-xs text-slate-900 font-mono"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            onUpdateStartingSavings(parseMoneyInput(tempStartingSavings));
                            setIsEditingStartingSavings(false);
                          }}
                          className="text-emerald-600 p-0.5 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTempStartingSavings(data.startingSavings.toString());
                          setIsEditingStartingSavings(true);
                        }}
                        className="font-mono text-slate-900 font-bold hover:text-emerald-700 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                      >
                        {formatVND(data.startingSavings)}
                        <Edit2 className="w-3 h-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </td>
            </tr>

            {/* Row: Cumulative savings */}
            <tr className="bg-emerald-50/20 border-b border-slate-200">
              <td className="py-2.5 px-4 font-bold text-emerald-950 border-r border-slate-200">
                <div className="flex items-center justify-between">
                  <span>Tiền tiết kiệm (Lũy kế)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tích lũy</span>
                </div>
              </td>
              {data.months.map((m) => {
                const accum = summaries[m]?.accumulatedSavings ?? 0;
                return (
                  <td
                    key={m}
                    className="py-2.5 px-3 text-right font-mono text-xs font-bold text-emerald-900 border-r border-slate-200 bg-emerald-50/30 tabular-nums"
                  >
                    {accum.toLocaleString('vi-VN')}
                  </td>
                );
              })}
            </tr>

            {/* Spacer */}
            <tr className="h-3 bg-slate-100/60">
              <td colSpan={data.months.length + 1} />
            </tr>

            {/* ================= SECTION 3: THU NHẬP (INCOME) ================= */}
            <tr className="bg-blue-50/70 border-y border-blue-200">
              <td
                colSpan={data.months.length + 1}
                className="py-2 px-4 font-bold text-[11px] uppercase tracking-wider text-blue-900"
              >
                <div className="flex items-center justify-between">
                  <span>3. Các nguồn thu nhập</span>
                  <button
                    onClick={() => setShowAddIncome(true)}
                    className="text-xs normal-case text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm nguồn thu</span>
                  </button>
                </div>
              </td>
            </tr>

            {/* Income streams */}
            {data.incomeStreams.map((inc) => (
              <tr
                key={inc.id}
                className="border-b border-slate-200 hover:bg-slate-50 transition-colors group"
              >
                <td className="py-2 px-4 font-medium text-slate-800 border-r border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>{inc.name}</span>
                    </div>
                    {data.incomeStreams.length > 1 && (
                      <button
                        onClick={() => onDeleteIncomeStream(inc.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                        title="Xóa nguồn thu này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>

                {data.months.map((m) => {
                  const cellKey = `inc_${m}_${inc.id}`;
                  const isEditing = editingCell?.key === cellKey;
                  const val = data.records[m]?.incomes?.[inc.id] ?? 0;

                  return (
                    <td
                      key={m}
                      onClick={() => !isEditing && setEditingCell({ key: cellKey, value: val > 0 ? val.toString() : '' })}
                      className="py-1.5 px-3 text-right border-r border-slate-200 cursor-pointer font-mono hover:bg-blue-50/50 transition-colors"
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                          onBlur={() => handleCellBlur(m, inc.id, 'income')}
                          onKeyDown={(e) => handleCellKeyDown(e, m, inc.id, 'income')}
                          placeholder="0"
                          className="w-full text-right bg-white border border-[#0A66C2] rounded px-1.5 py-0.5 text-slate-900 font-mono text-xs focus:outline-none shadow-xs"
                        />
                      ) : (
                        <span className={`inline-block px-1 py-0.5 rounded tabular-nums ${
                          val > 0
                            ? 'text-blue-900 font-bold'
                            : 'text-slate-300 hover:text-slate-600 font-normal'
                        }`}>
                          {val > 0 ? val.toLocaleString('vi-VN') : '—'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Quick Add Income Row */}
            {showAddIncome && (
              <tr className="bg-slate-50 border-b border-blue-200">
                <td className="py-2 px-4 border-r border-slate-200">
                  <input
                    type="text"
                    placeholder="Tên nguồn thu..."
                    value={newIncomeName}
                    onChange={(e) => setNewIncomeName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateIncome()}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none w-full"
                    autoFocus
                  />
                </td>
                <td colSpan={data.months.length} className="py-2 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleCreateIncome}
                      className="px-2.5 py-1 text-xs bg-[#0A66C2] text-white font-semibold rounded hover:bg-[#004182] cursor-pointer"
                    >
                      Thêm
                    </button>
                    <button
                      onClick={() => setShowAddIncome(false)}
                      className="px-2.5 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Row: Tổng Thu Nhập */}
            <tr className="bg-blue-50/50 font-bold text-blue-900 border-t border-slate-300">
              <td className="py-2.5 px-4 border-r border-slate-200">
                <div className="flex items-center justify-between">
                  <span>Tổng thu nhập</span>
                  <span className="text-[10px] text-slate-400 font-normal">SUM()</span>
                </div>
              </td>
              {data.months.map((m) => {
                const total = summaries[m]?.totalIncome ?? 0;
                return (
                  <td
                    key={m}
                    className="py-2.5 px-3 text-right font-mono text-xs font-bold text-blue-900 border-r border-slate-200 tabular-nums"
                  >
                    {total.toLocaleString('vi-VN')}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer tips */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Gõ tắt: <strong>2.5tr</strong>, <strong>500k</strong>, <strong>2.750.000</strong> rồi nhấn Enter.</span>
        </div>
        <div>
          <span>Công thức: Dư = Thu nhập - Chi tiêu | Lũy kế = Khởi điểm + Tiết kiệm hàng tháng</span>
        </div>
      </div>
    </div>
  );
};
