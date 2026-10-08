import React, { useState } from 'react';
import { X, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AppFinanceData, Transaction } from '../types/finance';
import { parseMoneyInput, formatVND, getMonthDisplay } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppFinanceData;
  defaultMonth: string;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  data,
  defaultMonth,
  onAddTransaction,
}) => {
  const [monthKey, setMonthKey] = useState(defaultMonth);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState(data.expenseCategories[0]?.id || '');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const mNum = defaultMonth.startsWith('T') && !isNaN(Number(defaultMonth.slice(1)))
      ? defaultMonth.slice(1).padStart(2, '0')
      : '10';
    return `2026-${mNum}-08`;
  });

  React.useEffect(() => {
    setMonthKey(defaultMonth);
    const mNum = defaultMonth.startsWith('T') && !isNaN(Number(defaultMonth.slice(1)))
      ? defaultMonth.slice(1).padStart(2, '0')
      : '10';
    setDate(`2026-${mNum}-08`);
  }, [defaultMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseMoneyInput(amountStr);
    if (!amount || amount <= 0) return;

    onAddTransaction({
      monthKey,
      categoryId,
      type,
      amount,
      description: description.trim() || (type === 'expense' ? 'Khoản chi tiêu' : 'Khoản thu nhập'),
      date,
    });

    setAmountStr('');
    setDescription('');
    onClose();
  };

  const parsedAmount = parseMoneyInput(amountStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A66C2] flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ghi Chép Giao Dịch</h2>
              <p className="text-xs text-slate-500">Ghi nhận khoản thu hoặc chi vào sổ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId(data.expenseCategories[0]?.id || '');
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Khoản chi tiêu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategoryId(data.incomeStreams[0]?.id || '');
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Khoản thu nhập</span>
            </button>
          </div>

          {/* Month & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Tháng ghi nhận:
              </label>
              <select
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] font-mono"
              >
                {data.months.map((m) => (
                  <option key={m} value={m}>
                    {m} ({getMonthDisplay(m)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Ngày phát sinh:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] font-mono"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              {type === 'expense' ? 'Danh mục chi tiêu:' : 'Nguồn thu nhập:'}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2]"
            >
              {type === 'expense'
                ? data.expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isSavings ? '(Quỹ tiết kiệm)' : ''}
                    </option>
                  ))
                : data.incomeStreams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-600">Số tiền (VNĐ):</label>
              {parsedAmount > 0 && (
                <span className="text-xs font-mono font-bold text-[#0A66C2]">
                  = {formatVND(parsedAmount)}
                </span>
              )}
            </div>
            <input
              type="text"
              placeholder="VD: 50k, 500k, 2.5tr, 2.750.000..."
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono font-semibold focus:outline-none focus:border-[#0A66C2]"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Ghi chú nội dung:
            </label>
            <input
              type="text"
              placeholder="VD: Ăn tối, Mua sắm, Đổ xăng..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2]"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Lưu giao dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
