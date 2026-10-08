import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Link2, 
  Clipboard, 
  Download, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  FileCheck,
  Send,
  Zap
} from 'lucide-react';
import { AppFinanceData } from '../types/finance';
import { 
  fetchGoogleSheetCSV, 
  parseCSVToFinanceData, 
  exportToUserCSV,
  pushFinanceDataToGoogleSheet
} from '../utils/googleSheetsSync';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppFinanceData;
  onApplyNewData: (newData: AppFinanceData) => void;
  onTriggerReload?: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  data,
  onApplyNewData,
  onTriggerReload,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'paste' | 'autosync' | 'export'>('link');

  // Link state
  const [sheetUrl, setSheetUrl] = useState(data.googleSheetUrl || '');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlSuccess, setUrlSuccess] = useState<string | null>(null);

  // Paste state
  const [pastedCSV, setPastedCSV] = useState('');
  const [pasteTargetMonth, setPasteTargetMonth] = useState('T10');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);

  // Webhook 2-way sync state
  const [webhookUrl, setWebhookUrl] = useState(data.googleScriptWebhookUrl || '');
  const [autoSync, setAutoSync] = useState(data.autoSyncToGoogleSheet ?? true);
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Export state
  const [copiedExport, setCopiedExport] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleSyncFromUrl = async () => {
    setUrlError(null);
    setUrlSuccess(null);
    if (!sheetUrl.trim()) {
      setUrlError('Vui lòng nhập đường link Google Sheet của bạn.');
      return;
    }

    setIsLoadingUrl(true);
    try {
      const csvText = await fetchGoogleSheetCSV(sheetUrl.trim());
      const parsed = parseCSVToFinanceData(csvText, data);
      parsed.googleSheetUrl = sheetUrl.trim();
      onApplyNewData(parsed);
      setUrlSuccess(`Đồng bộ thành công ${parsed.months.length} tháng (${parsed.months.join(', ')}) từ Google Sheets!`);
    } catch (err: any) {
      setUrlError(err.message || 'Lỗi khi tải dữ liệu từ Google Sheets.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleImportPastedCSV = () => {
    setPasteError(null);
    setPasteSuccess(null);
    if (!pastedCSV.trim()) {
      setPasteError('Vui lòng dán nội dung CSV hoặc bảng tính vào ô bên dưới.');
      return;
    }

    try {
      const parsed = parseCSVToFinanceData(pastedCSV.trim(), data, pasteTargetMonth);
      onApplyNewData(parsed);
      setPasteSuccess(`Đã nạp thành công dữ liệu vào app!`);
    } catch (err: any) {
      setPasteError(err.message || 'Không thể đọc định dạng CSV này.');
    }
  };

  const handleSaveWebhookSettings = async () => {
    setPushError(null);
    setPushStatus(null);
    const updated = {
      ...data,
      googleScriptWebhookUrl: webhookUrl.trim(),
      autoSyncToGoogleSheet: autoSync,
    };
    onApplyNewData(updated);

    if (webhookUrl.trim()) {
      setIsPushing(true);
      try {
        await pushFinanceDataToGoogleSheet(webhookUrl.trim(), updated);
        setPushStatus('Đã kết nối và đẩy thành công toàn bộ dữ liệu vào Google Sheet!');
      } catch (err: any) {
        setPushError(err.message || 'Lỗi khi kết nối đến Apps Script Webhook.');
      } finally {
        setIsPushing(false);
      }
    } else {
      setPushStatus('Đã lưu cấu hình webhook.');
    }
  };

  const exportCsvContent = exportToUserCSV(data);

  const handleDownloadCSV = () => {
    const blob = new Blob(['\uFEFF' + exportCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FinTrack_VN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportCsvContent);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    if (payload.csv) {
      var lines = Utilities.parseCsv(payload.csv);
      sheet.clearContents();
      if (lines.length > 0) {
        sheet.getRange(1, 1, lines.length, lines[0].length).setValues(lines);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: "no_data" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Đồng Bộ Google Sheets</span>
              </h2>
              <p className="text-xs text-slate-500">
                Kết nối link bảng tính Google Sheets để tự động cập nhật số liệu chuẩn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('link')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'link'
                ? 'border-[#0A66C2] text-[#0A66C2]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Đọc từ link URL</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'paste'
                ? 'border-[#0A66C2] text-[#0A66C2]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Dán CSV / Bảng tính</span>
          </button>

          <button
            onClick={() => setActiveTab('autosync')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'autosync'
                ? 'border-[#0A66C2] text-[#0A66C2]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Apps Script Webhook (2 chiều)</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#0A66C2] text-[#0A66C2]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file CSV</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: LINK URL */}
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Đường dẫn link Google Sheets của bạn:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] font-mono"
                  />
                  <button
                    onClick={handleSyncFromUrl}
                    disabled={isLoadingUrl}
                    className="px-4 py-2 text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                  >
                    {isLoadingUrl ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>{isLoadingUrl ? 'Đang tải...' : 'Tải dữ liệu'}</span>
                  </button>
                </div>
              </div>

              {urlError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Lỗi tải dữ liệu:</span>
                  </div>
                  <p className="leading-relaxed pl-5">{urlError}</p>
                </div>
              )}

              {urlSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{urlSuccess}</span>
                </div>
              )}

              {/* Instructions on how to set permissions to avoid 401 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
                <span className="font-bold text-slate-800 block">
                  💡 Hướng dẫn mở quyền xem Google Sheet (tránh lỗi 401 riêng tư):
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
                  <li>Mở file Google Sheets trên trình duyệt.</li>
                  <li>Bấm nút <strong>Chia sẻ (Share)</strong> ở góc trên bên phải.</li>
                  <li>Tại mục <em>Quyền truy cập chung</em>, chọn: <strong>"Bất kỳ ai có đường liên kết đều có thể xem"</strong> (Anyone with the link).</li>
                  <li>Nhấn <strong>Sao chép đường liên kết</strong> và dán vào ô bên trên.</li>
                </ol>
                <p className="text-[11px] text-slate-500 pt-1">
                  * Sau khi lưu link, mỗi lần bạn mở app hoặc bấm nút "Tải lại từ Sheet", app sẽ tự động tải số liệu mới nhất.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE CSV */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Dán nội dung CSV hoặc copy trực tiếp các ô từ Google Sheets:
                </label>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Nếu dán sheet ngày, chọn tháng:</span>
                  <select
                    value={pasteTargetMonth}
                    onChange={(e) => setPasteTargetMonth(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-900 font-mono"
                  >
                    {data.months.map(m => (
                      <option key={m} value={m}>{m} ({m === 'T9' ? 'Tháng 9' : m === 'T10' ? 'Tháng 10' : m})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <textarea
                  rows={8}
                  placeholder={`Hỗ trợ cả 3 định dạng:\n1. Bảng tổng hợp đa tháng: ,T9,T10,T11,T12...\n2. Bảng ma trận theo ngày: Ngày, Nhà, Điện, Ăn...\n3. Sổ giao dịch từng dòng: Ngày, Khoản chi, Số tiền, Ghi chú...`}
                  value={pastedCSV}
                  onChange={(e) => setPastedCSV(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#0A66C2] resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold block">💡 Vì sao link chỉ đọc 1 trang tính mà không thấy các ngày?</span>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  Google Sheets chia mỗi tháng thành 1 Tab (Trang tính) riêng ở chân trang tính. Khi copy link, bạn hãy bấm vào đúng tab <strong>"Tháng 9"</strong> hoặc <strong>"Tháng 10"</strong> rồi sao chép đường link trên trình duyệt (sẽ có chứa mã <code>#gid=...</code> riêng của tab đó), hoặc bôi đen toàn bộ bảng tính trong tab đó (Ctrl+A rồi Ctrl+C) và dán vào đây!
                </p>
              </div>

              {pasteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pasteError}</span>
                </div>
              )}

              {pasteSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pasteSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleImportPastedCSV}
                  className="px-4 py-2 text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Nạp dữ liệu vào App</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOSYNC VIA WEBHOOK */}
          {activeTab === 'autosync' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#0A66C2]">
                  <Zap className="w-4 h-4" />
                  <span>Đồng bộ 2 chiều qua Google Apps Script Webhook</span>
                </div>
                <p className="leading-relaxed">
                  Khi cấu hình Webhook, mọi thay đổi bạn nhập trên app sẽ được tự động ghi thẳng vào file Google Sheet của bạn.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Webhook URL của Google Apps Script:
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0A66C2] font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Tự động đẩy lên Sheet khi có thay đổi</span>
                  <span className="text-[11px] text-slate-500">Tự động cập nhật bảng tính mỗi khi ghi thêm số tiền</span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="h-4 w-4 rounded text-[#0A66C2] focus:ring-[#0A66C2]"
                />
              </div>

              {pushStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pushStatus}</span>
                </div>
              )}

              {pushError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pushError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSaveWebhookSettings}
                  disabled={isPushing}
                  className="px-4 py-2 text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPushing ? 'Đang lưu...' : 'Lưu cấu hình Webhook'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT CSV */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  Dữ liệu CSV chuẩn định dạng cấu trúc Sheet:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyExport}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-xs cursor-pointer"
                  >
                    {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                    <span>{copiedExport ? 'Đã sao chép' : 'Sao chép CSV'}</span>
                  </button>

                  <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file .CSV</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                rows={9}
                value={exportCsvContent}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-mono focus:outline-none select-all resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>Dữ liệu lưu an toàn trên trình duyệt (Local Storage).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold shadow-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
