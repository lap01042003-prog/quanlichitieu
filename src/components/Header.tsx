import React, { useState, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  LayoutDashboard,
  CalendarDays, 
  Table2, 
  RefreshCw, 
  Download, 
  Check,
  AlertCircle,
  Target,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type NavTabType = 'dashboard' | 'budget' | 'daily' | 'table';

interface HeaderProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
  selectedYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  onAddYear: (year: number) => void;
  onOpenGoogleSheetsModal: () => void;
  onOpenAddTxModal: () => void;
  onExportCSV: () => void;
  onReloadFromSheet: () => void;
  isSheetLinked: boolean;
  isLoadingSheet: boolean;
  isPushingToSheet: boolean;
  lastSyncError?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedYear,
  availableYears,
  onSelectYear,
  onAddYear,
  onOpenGoogleSheetsModal,
  onOpenAddTxModal,
  onExportCSV,
  onReloadFromSheet,
  isSheetLinked,
  isLoadingSheet,
  isPushingToSheet,
  lastSyncError,
}) => {
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [showAddYearForm, setShowAddYearForm] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
        setShowAddYearForm(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateNewYear = (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = parseInt(newYearInput.trim(), 10);
    if (!isNaN(yearNum) && yearNum >= 2020 && yearNum <= 2099) {
      onAddYear(yearNum);
      setNewYearInput('');
      setShowAddYearForm(false);
      setIsYearDropdownOpen(false);
    }
  };

  const handleQuickAddNextYear = () => {
    const nextYear = Math.max(...availableYears, 2026) + 1;
    onAddYear(nextYear);
    setIsYearDropdownOpen(false);
  };

  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sorted = [...availableYears].sort((a, b) => a - b);
    const idx = sorted.indexOf(selectedYear);
    if (idx > 0) {
      onSelectYear(sorted[idx - 1]);
    }
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const sorted = [...availableYears].sort((a, b) => a - b);
    const idx = sorted.indexOf(selectedYear);
    if (idx < sorted.length - 1) {
      onSelectYear(sorted[idx + 1]);
    }
  };

  const sortedYears = [...availableYears].sort((a, b) => a - b);
  const canGoPrev = sortedYears.indexOf(selectedYear) > 0;
  const canGoNext = sortedYears.indexOf(selectedYear) < sortedYears.length - 1;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Zone 1: Wordmark & Year Selector */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            <div 
              className="flex items-center gap-2 cursor-pointer select-none" 
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="w-8 h-8 rounded-lg bg-[#0A66C2] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                <span className="font-mono tracking-tighter">FT</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  FinTrack
                </span>
                <span className="text-xs font-semibold text-[#0A66C2]">
                  VN
                </span>
              </div>
            </div>

            {/* Smart Multi-Year Selector */}
            <div className="relative" ref={yearDropdownRef}>
              <div className="flex items-center bg-slate-100 hover:bg-slate-200/80 rounded-lg p-0.5 border border-slate-200/80 transition-colors">
                {/* Stepper Left */}
                <button
                  onClick={handlePrevYear}
                  disabled={!canGoPrev}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 rounded cursor-pointer transition-colors"
                  title="Năm trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Main Year Badge Trigger */}
                <button
                  onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold text-slate-800 hover:text-[#0A66C2] cursor-pointer"
                  title="Bấm để chọn hoặc thêm năm mới"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#0A66C2]" />
                  <span>{selectedYear}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Stepper Right */}
                <button
                  onClick={handleNextYear}
                  disabled={!canGoNext}
                  className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500 rounded cursor-pointer transition-colors"
                  title="Năm tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Year Dropdown Menu */}
              {isYearDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-slate-900 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Chọn năm tài chính
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Đa năm
                    </span>
                  </div>

                  {/* Available years list */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {sortedYears.map((yr) => {
                      const isSelected = yr === selectedYear;
                      return (
                        <button
                          key={yr}
                          onClick={() => {
                            onSelectYear(yr);
                            setIsYearDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 text-[#0A66C2] font-bold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0A66C2]' : 'text-slate-400'}`} />
                            <span>Năm {yr}</span>
                            {yr === 2026 && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                Gốc
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0A66C2]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Add New Year Section */}
                  <div className="pt-1.5 border-t border-slate-100">
                    {!showAddYearForm ? (
                      <div className="space-y-1">
                        <button
                          onClick={handleQuickAddNextYear}
                          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tạo nhanh Năm {Math.max(...availableYears, 2026) + 1}</span>
                        </button>
                        <button
                          onClick={() => setShowAddYearForm(true)}
                          className="w-full text-center py-1 text-[11px] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          + Nhập năm tùy chọn khác...
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleCreateNewYear} className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="2020"
                            max="2099"
                            placeholder="VD: 2027, 2028..."
                            value={newYearInput}
                            onChange={(e) => setNewYearInput(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-[#0A66C2] font-mono"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-2 py-1 bg-[#0A66C2] text-white text-xs font-semibold rounded-md hover:bg-[#084e96] cursor-pointer"
                          >
                            Tạo
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddYearForm(false)}
                            className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          * Tự động chuyển số dư lũy kế và ngân sách sang năm mới
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links (3 Clean Tabs) */}
          <nav className="hidden sm:flex items-center gap-1 md:gap-2 h-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`h-full px-4 flex items-center gap-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Tổng quan</span>
            </button>

            <button
              onClick={() => setActiveTab('budget')}
              className={`h-full px-4 flex items-center gap-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'budget'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Ngân sách</span>
            </button>

            <button
              onClick={() => setActiveTab('daily')}
              className={`h-full px-4 flex items-center gap-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Nhập theo ngày</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`h-full px-4 flex items-center gap-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'border-[#0A66C2] text-[#0A66C2]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>Bảng theo tháng</span>
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2">
            {/* Nút Tải lại từ Sheet */}
            <button
              onClick={onReloadFromSheet}
              disabled={isLoadingSheet}
              title={
                isSheetLinked
                  ? 'Tải lại dữ liệu mới nhất từ Google Sheet'
                  : 'Chưa có link Sheet. Bấm để cấu hình link Google Sheets'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer disabled:opacity-60 ${
                lastSyncError
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : isSheetLinked
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isLoadingSheet ? (
                <RefreshCw className="w-3.5 h-3.5 text-[#0A66C2] animate-spin" />
              ) : lastSyncError ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              ) : isSheetLinked ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden md:inline font-medium">
                {isLoadingSheet
                  ? 'Đang tải...'
                  : isSheetLinked
                  ? 'Tải lại từ Sheet'
                  : 'Kết nối Sheet'}
              </span>
            </button>

            {/* Cấu hình Sheet Modal Trigger */}
            <button
              onClick={onOpenGoogleSheetsModal}
              title="Cài đặt kết nối Google Sheets"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Cài đặt Sheet</span>
            </button>

            {/* Xuất CSV */}
            <button
              onClick={onExportCSV}
              title="Xuất file CSV chuẩn"
              className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Xuất CSV</span>
            </button>

            {/* Ghi chép nhanh */}
            <button
              onClick={onOpenAddTxModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ghi chép</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex sm:hidden items-center justify-around py-1.5 border-t border-slate-100 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-semibold cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-[#0A66C2] text-white' : 'text-slate-600'
            }`}
          >
            Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-semibold cursor-pointer ${
              activeTab === 'budget' ? 'bg-[#0A66C2] text-white' : 'text-slate-600'
            }`}
          >
            Ngân sách
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-semibold cursor-pointer ${
              activeTab === 'daily' ? 'bg-[#0A66C2] text-white' : 'text-slate-600'
            }`}
          >
            Theo ngày
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-semibold cursor-pointer ${
              activeTab === 'table' ? 'bg-[#0A66C2] text-white' : 'text-slate-600'
            }`}
          >
            Theo tháng
          </button>
        </div>
      </div>
    </header>
  );
};
