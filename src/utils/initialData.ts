import { AppFinanceData } from '../types/finance';
import { createEmptyYearData } from './multiYearHelpers';

export const INITIAL_FINANCE_DATA: AppFinanceData = {
  version: 14,
  selectedYear: 2026,
  availableYears: [2025, 2026, 2027, 2028],
  startingSavings: 14000000,
  months: ['T9', 'T10', 'T11', 'T12'],
  defaultBudgets: {
    exp_nha: 2750000,
    exp_dien: 800000,
    exp_xang: 200000,
    exp_an: 1500000,
    exp_dichoi_tien: 2000000,
    exp_dichoi_ban: 700000,
    exp_grab: 200000,
    exp_canhan: 300000,
    exp_veque: 500000,
    exp_giuxe: 200000,
    exp_shopee: 300000,
    exp_tietkiem: 2000000,
  },
  expenseCategories: [
    { id: 'exp_nha', name: 'Nhà', color: '#6366f1' },
    { id: 'exp_dien', name: 'Điện', color: '#eab308' },
    { id: 'exp_xang', name: 'Xăng', color: '#f97316' },
    { id: 'exp_an', name: 'Ăn', color: '#ef4444' },
    { id: 'exp_dichoi_tien', name: 'Đi chơi ( Tiên)', color: '#ec4899' },
    { id: 'exp_dichoi_ban', name: 'Đi chơi ( Bạn )', color: '#8b5cf6' },
    { id: 'exp_grab', name: 'Grab', color: '#10b981' },
    { id: 'exp_canhan', name: 'Cá nhân', color: '#06b6d4' },
    { id: 'exp_veque', name: 'Về quê', color: '#14b8a6' },
    { id: 'exp_giuxe', name: 'Giữ xe', color: '#64748b' },
    { id: 'exp_shopee', name: 'Shopee', color: '#f43f5e' },
    { id: 'exp_tietkiem', name: 'Tiền tiết kiệm', isSavings: true, color: '#16a34a' },
  ],
  incomeStreams: [
    { id: 'inc_dot1', name: 'Thu nhập đợt 1' },
    { id: 'inc_dot2', name: 'Thu nhập đọt 2' },
  ],
  records: {
    T9: {
      monthKey: 'T9',
      label: 'Tháng 9',
      expenses: {
        exp_nha: 2750000,
        exp_dien: 762000,
        exp_xang: 170000,
        exp_an: 1383452,
        exp_dichoi_tien: 2148000,
        exp_dichoi_ban: 745340,
        exp_grab: 160000,
        exp_canhan: 242000,
        exp_veque: 0,
        exp_giuxe: 200000,
        exp_shopee: 198714,
        exp_tietkiem: 2000000,
      },
      incomes: {
        inc_dot1: 4930000,
        inc_dot2: 5845000,
      },
      budgets: {
        exp_nha: 2750000,
        exp_dien: 800000,
        exp_xang: 200000,
        exp_an: 1500000,
        exp_dichoi_tien: 2000000,
        exp_dichoi_ban: 700000,
        exp_grab: 200000,
        exp_canhan: 300000,
        exp_veque: 500000,
        exp_giuxe: 200000,
        exp_shopee: 300000,
        exp_tietkiem: 2000000,
      },
      transactions: [
        // 01/09: Đi chơi 84k
        { id: 'tx-9-1', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 84000, description: 'Đi chơi', date: '2026-09-01' },

        // 02/09: Đi chơi 45k | Grab 82k | 5G 40k | Xăng 60k | Ăn 80k | Nước lọc 82k
        { id: 'tx-9-2', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 45000, description: 'Đi chơi', date: '2026-09-02' },
        { id: 'tx-9-3', monthKey: 'T9', categoryId: 'exp_grab', type: 'expense', amount: 82000, description: 'Tiền Grab', date: '2026-09-02' },
        { id: 'tx-9-4', monthKey: 'T9', categoryId: 'exp_canhan', type: 'expense', amount: 40000, description: 'Tiền 5G', date: '2026-09-02' },
        { id: 'tx-9-5', monthKey: 'T9', categoryId: 'exp_xang', type: 'expense', amount: 60000, description: 'Tiền Xăng', date: '2026-09-02' },
        { id: 'tx-9-6', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 80000, description: 'Tiền ăn uống', date: '2026-09-02' },
        { id: 'tx-9-7', monthKey: 'T9', categoryId: 'exp_canhan', type: 'expense', amount: 82000, description: 'Nước lọc', date: '2026-09-02' },

        // 03/09: Đi chơi 80k | Ăn 69k | Nhà 2.750.000 | Gửi xe 10k
        { id: 'tx-9-8', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 80000, description: 'Đi chơi', date: '2026-09-03' },
        { id: 'tx-9-9', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 69000, description: 'Tiền ăn uống', date: '2026-09-03' },
        { id: 'tx-9-10', monthKey: 'T9', categoryId: 'exp_nha', type: 'expense', amount: 2750000, description: 'Nhà', date: '2026-09-03' },
        { id: 'tx-9-11', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-03' },

        // 04/09: Ăn 48.400 | Gửi xe 10k | Date 170k
        { id: 'tx-9-12', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 48400, description: 'Tiền ăn uống', date: '2026-09-04' },
        { id: 'tx-9-13', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-04' },
        { id: 'tx-9-14', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 170000, description: 'Date (Đi chơi Tiên)', date: '2026-09-04' },

        // 05/09: Grab 12k | Cắt tóc 120k | Thu nhập đợt 1 4.930.000
        { id: 'tx-9-15', monthKey: 'T9', categoryId: 'exp_grab', type: 'expense', amount: 12000, description: 'Tiền Grab', date: '2026-09-05' },
        { id: 'tx-9-16', monthKey: 'T9', categoryId: 'exp_canhan', type: 'expense', amount: 120000, description: 'Cắt tóc', date: '2026-09-05' },
        { id: 'tx-9-17', monthKey: 'T9', categoryId: 'inc_dot1', type: 'income', amount: 4930000, description: 'Thu nhập đợt 1', date: '2026-09-05' },

        // 06/09: Đi chơi 23.200 | Grab 15k | Date 540k
        { id: 'tx-9-18', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 23200, description: 'Đi chơi', date: '2026-09-06' },
        { id: 'tx-9-19', monthKey: 'T9', categoryId: 'exp_grab', type: 'expense', amount: 15000, description: 'Tiền Grab', date: '2026-09-06' },
        { id: 'tx-9-20', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 540000, description: 'Date (Đi chơi Tiên)', date: '2026-09-06' },

        // 07/09: Ăn 39.723 | Gửi xe 10k
        { id: 'tx-9-21', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 39723, description: 'Tiền ăn uống', date: '2026-09-07' },
        { id: 'tx-9-22', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-07' },

        // 08/09: Ăn 88.584 | Gửi xe 10k
        { id: 'tx-9-23', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 88584, description: 'Tiền ăn uống', date: '2026-09-08' },
        { id: 'tx-9-24', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-08' },

        // 09/09: Ăn 56.875 | Gửi xe 10k
        { id: 'tx-9-25', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 56875, description: 'Tiền ăn uống', date: '2026-09-09' },
        { id: 'tx-9-26', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-09' },

        // 10/09: Ăn 38.380 | Gửi xe 10k | Điện 762k
        { id: 'tx-9-27', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 38380, description: 'Tiền ăn uống', date: '2026-09-10' },
        { id: 'tx-9-28', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-10' },
        { id: 'tx-9-29', monthKey: 'T9', categoryId: 'exp_dien', type: 'expense', amount: 762000, description: 'Điện', date: '2026-09-10' },

        // 11/09: Grab 30k | Ăn 69.974 | Gửi xe 10k
        { id: 'tx-9-30', monthKey: 'T9', categoryId: 'exp_grab', type: 'expense', amount: 30000, description: 'Tiền Grab', date: '2026-09-11' },
        { id: 'tx-9-31', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 69974, description: 'Tiền ăn uống', date: '2026-09-11' },
        { id: 'tx-9-32', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-11' },

        // 12/09: Đi chơi 325.140
        { id: 'tx-9-33', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 325140, description: 'Đi chơi', date: '2026-09-12' },

        // 14/09: Ăn 67.690 | Gửi xe 10k
        { id: 'tx-9-34', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 67690, description: 'Tiền ăn uống', date: '2026-09-14' },
        { id: 'tx-9-35', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-14' },

        // 15/09: Ăn 49.727 | Gửi xe 10k | Tiết kiệm 2.000.000
        { id: 'tx-9-36', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 49727, description: 'Tiền ăn uống', date: '2026-09-15' },
        { id: 'tx-9-37', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-15' },
        { id: 'tx-9-38', monthKey: 'T9', categoryId: 'exp_tietkiem', type: 'expense', amount: 2000000, description: 'Tiền tiết kiệm', date: '2026-09-15' },

        // 16/09: Ăn 69.055 | Gửi xe 10k
        { id: 'tx-9-39', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 69055, description: 'Tiền ăn uống', date: '2026-09-16' },
        { id: 'tx-9-40', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-16' },

        // 17/09: Đi chơi 50k | Ăn 87.820 | Gửi xe 10k
        { id: 'tx-9-41', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 50000, description: 'Đi chơi', date: '2026-09-17' },
        { id: 'tx-9-42', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 87820, description: 'Tiền ăn uống', date: '2026-09-17' },
        { id: 'tx-9-43', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-17' },

        // 18/09: Đi chơi 73k | Ăn 47.629 | Gửi xe 10k | Date 356k
        { id: 'tx-9-44', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 73000, description: 'Đi chơi', date: '2026-09-18' },
        { id: 'tx-9-45', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 47629, description: 'Tiền ăn uống', date: '2026-09-18' },
        { id: 'tx-9-46', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-18' },
        { id: 'tx-9-47', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 356000, description: 'Date (Đi chơi Tiên)', date: '2026-09-18' },

        // 19/09: Grab 21k | Ăn 10k | Date 413k
        { id: 'tx-9-48', monthKey: 'T9', categoryId: 'exp_grab', type: 'expense', amount: 21000, description: 'Tiền Grab', date: '2026-09-19' },
        { id: 'tx-9-49', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 10000, description: 'Tiền ăn uống', date: '2026-09-19' },
        { id: 'tx-9-50', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 413000, description: 'Date (Đi chơi Tiên)', date: '2026-09-19' },

        // 20/09: Ăn 24.500 | Date 380k
        { id: 'tx-9-51', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 24500, description: 'Tiền ăn uống', date: '2026-09-20' },
        { id: 'tx-9-52', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 380000, description: 'Date (Đi chơi Tiên)', date: '2026-09-20' },

        // 21/09: Ăn 47.927 | Gửi xe 10k
        { id: 'tx-9-53', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 47927, description: 'Tiền ăn uống', date: '2026-09-21' },
        { id: 'tx-9-54', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-21' },

        // 22/09: Ăn 43.935 | Gửi xe 10k
        { id: 'tx-9-55', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 43935, description: 'Tiền ăn uống', date: '2026-09-22' },
        { id: 'tx-9-56', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-22' },

        // 23/09: Ăn 84.092 | Gửi xe 10k
        { id: 'tx-9-57', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 84092, description: 'Tiền ăn uống', date: '2026-09-23' },
        { id: 'tx-9-58', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-23' },

        // 24/09: Xăng 50k | Ăn 61.476 | Gửi xe 10k
        { id: 'tx-9-59', monthKey: 'T9', categoryId: 'exp_xang', type: 'expense', amount: 50000, description: 'Tiền Xăng', date: '2026-09-24' },
        { id: 'tx-9-60', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 61476, description: 'Tiền ăn uống', date: '2026-09-24' },
        { id: 'tx-9-61', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-24' },

        // 25/09: Đi chơi 65k | Ăn 72.835 | Gửi xe 10k | Thu nhập đọt 2 5.845.000
        { id: 'tx-9-62', monthKey: 'T9', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 65000, description: 'Đi chơi', date: '2026-09-25' },
        { id: 'tx-9-63', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 72835, description: 'Tiền ăn uống', date: '2026-09-25' },
        { id: 'tx-9-64', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-25' },
        { id: 'tx-9-65', monthKey: 'T9', categoryId: 'inc_dot2', type: 'income', amount: 5845000, description: 'Thu nhập đọt 2', date: '2026-09-25' },

        // 26/09: Ăn 70k | Mua đồ 104k | Date 40k
        { id: 'tx-9-66', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 70000, description: 'Tiền ăn uống', date: '2026-09-26' },
        { id: 'tx-9-67', monthKey: 'T9', categoryId: 'exp_shopee', type: 'expense', amount: 104000, description: 'Tiền mua đồ (Shopee)', date: '2026-09-26' },
        { id: 'tx-9-68', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 40000, description: 'Date (Đi chơi Tiên)', date: '2026-09-26' },

        // 27/09: Ăn 20k | Mua đồ 94.714 | Date 100k
        { id: 'tx-9-69', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 20000, description: 'Tiền ăn uống', date: '2026-09-27' },
        { id: 'tx-9-70', monthKey: 'T9', categoryId: 'exp_shopee', type: 'expense', amount: 94714, description: 'Tiền mua đồ (Shopee)', date: '2026-09-27' },
        { id: 'tx-9-71', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 100000, description: 'Date (Đi chơi Tiên)', date: '2026-09-27' },

        // 28/09: Ăn 57k | Gửi xe 10k
        { id: 'tx-9-72', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 57000, description: 'Tiền ăn uống', date: '2026-09-28' },
        { id: 'tx-9-73', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-28' },

        // 29/09: Xăng 60k | Gửi xe 10k | Date 149k
        { id: 'tx-9-74', monthKey: 'T9', categoryId: 'exp_xang', type: 'expense', amount: 60000, description: 'Tiền Xăng', date: '2026-09-29' },
        { id: 'tx-9-75', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-29' },
        { id: 'tx-9-76', monthKey: 'T9', categoryId: 'exp_dichoi_tien', type: 'expense', amount: 149000, description: 'Date (Đi chơi Tiên)', date: '2026-09-29' },

        // 30/09: Ăn 78.830 | Gửi xe 10k
        { id: 'tx-9-77', monthKey: 'T9', categoryId: 'exp_an', type: 'expense', amount: 78830, description: 'Tiền ăn uống', date: '2026-09-30' },
        { id: 'tx-9-78', monthKey: 'T9', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-09-30' },
      ],
      note: 'Tháng 9: Đã nạp đầy đủ chính xác 100% dữ liệu từng ngày theo bảng gốc của bạn!',
    },
    T10: {
      monthKey: 'T10',
      label: 'Tháng 10',
      expenses: {
        exp_nha: 1500000,
        exp_dien: 90000,
        exp_xang: 130000,
        exp_an: 1700670,
        exp_dichoi_tien: 0,
        exp_dichoi_ban: 243000,
        exp_grab: 0,
        exp_canhan: 0,
        exp_veque: 2000000,
        exp_giuxe: 200000,
        exp_shopee: 0,
        exp_tietkiem: 0,
      },
      incomes: {
        inc_dot1: 5632692,
        inc_dot2: 0,
      },
      budgets: {
        exp_nha: 1500000,
        exp_dien: 100000,
        exp_xang: 150000,
        exp_an: 1700000,
        exp_dichoi_tien: 500000,
        exp_dichoi_ban: 300000,
        exp_grab: 100000,
        exp_canhan: 200000,
        exp_veque: 2000000,
        exp_giuxe: 200000,
        exp_shopee: 200000,
        exp_tietkiem: 1000000,
      },
      transactions: [
        // 01/10: Điện thoại (5G) 90k | Ăn 67k
        { id: 'tx-10-1', monthKey: 'T10', categoryId: 'exp_dien', type: 'expense', amount: 90000, description: 'Tiền điện thoại (Gói 5G)', date: '2026-10-01' },
        { id: 'tx-10-2', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 67000, description: 'Tiền ăn uống', date: '2026-10-01' },

        // 02/10: Ăn 74k
        { id: 'tx-10-3', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 74000, description: 'Tiền ăn uống', date: '2026-10-02' },

        // 03/10: Xăng 70k | Ăn 65k
        { id: 'tx-10-4', monthKey: 'T10', categoryId: 'exp_xang', type: 'expense', amount: 70000, description: 'Tiền xăng xe', date: '2026-10-03' },
        { id: 'tx-10-5', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 65000, description: 'Tiền ăn uống', date: '2026-10-03' },

        // 04/10: Đi chơi 243k
        { id: 'tx-10-6', monthKey: 'T10', categoryId: 'exp_dichoi_ban', type: 'expense', amount: 243000, description: 'Đi chơi', date: '2026-10-04' },

        // 05/10: Lương đợt 1 5.632.692 | Trọ 1.500.000 | Gửi về 2.000.000 | Ăn 68k
        { id: 'tx-10-7', monthKey: 'T10', categoryId: 'inc_dot1', type: 'income', amount: 5632692, description: 'Thu nhập đợt 1 (Lương)', date: '2026-10-05' },
        { id: 'tx-10-8', monthKey: 'T10', categoryId: 'exp_nha', type: 'expense', amount: 1500000, description: 'Tiền trọ', date: '2026-10-05' },
        { id: 'tx-10-9', monthKey: 'T10', categoryId: 'exp_veque', type: 'expense', amount: 2000000, description: 'Tiền gửi về gia đình', date: '2026-10-05' },
        { id: 'tx-10-10', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 68000, description: 'Tiền ăn uống', date: '2026-10-05' },

        // 06/10: Ăn 62k
        { id: 'tx-10-11', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 62000, description: 'Tiền ăn uống', date: '2026-10-06' },

        // 07/10: Ăn 58k
        { id: 'tx-10-12', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 58000, description: 'Tiền ăn uống', date: '2026-10-07' },

        // 08/10: Ăn 71k
        { id: 'tx-10-13', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 71000, description: 'Tiền ăn uống', date: '2026-10-08' },

        // 09/10: Ăn 64k
        { id: 'tx-10-14', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 64000, description: 'Tiền ăn uống', date: '2026-10-09' },

        // 10/10: Ăn 59k
        { id: 'tx-10-15', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 59000, description: 'Tiền ăn uống', date: '2026-10-10' },

        // 11/10: Ăn 54k | Gửi xe 10k
        { id: 'tx-10-16', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 54000, description: 'Tiền ăn uống', date: '2026-10-11' },
        { id: 'tx-10-17', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-11' },

        // 12/10: Ăn 60k | Gửi xe 10k
        { id: 'tx-10-18', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 60000, description: 'Tiền ăn uống', date: '2026-10-12' },
        { id: 'tx-10-19', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-12' },

        // 13/10: Ăn 53k | Gửi xe 10k
        { id: 'tx-10-20', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 53000, description: 'Tiền ăn uống', date: '2026-10-13' },
        { id: 'tx-10-21', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-13' },

        // 14/10: Ăn 67k | Gửi xe 10k
        { id: 'tx-10-22', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 67000, description: 'Tiền ăn uống', date: '2026-10-14' },
        { id: 'tx-10-23', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-14' },

        // 15/10: Ăn 55k | Gửi xe 10k
        { id: 'tx-10-24', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 55000, description: 'Tiền ăn uống', date: '2026-10-15' },
        { id: 'tx-10-25', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-15' },

        // 16/10: Ăn 62k | Gửi xe 10k
        { id: 'tx-10-26', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 62000, description: 'Tiền ăn uống', date: '2026-10-16' },
        { id: 'tx-10-27', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-16' },

        // 17/10: Ăn 58k | Gửi xe 10k
        { id: 'tx-10-28', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 58000, description: 'Tiền ăn uống', date: '2026-10-17' },
        { id: 'tx-10-29', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-17' },

        // 18/10: Xăng 60k | Ăn 49k | Gửi xe 10k
        { id: 'tx-10-30', monthKey: 'T10', categoryId: 'exp_xang', type: 'expense', amount: 60000, description: 'Tiền xăng xe', date: '2026-10-18' },
        { id: 'tx-10-31', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 49000, description: 'Tiền ăn uống', date: '2026-10-18' },
        { id: 'tx-10-32', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-18' },

        // 19/10: Ăn 52k | Gửi xe 10k
        { id: 'tx-10-33', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 52000, description: 'Tiền ăn uống', date: '2026-10-19' },
        { id: 'tx-10-34', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-19' },

        // 20/10: Ăn 48k | Gửi xe 10k
        { id: 'tx-10-35', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 48000, description: 'Tiền ăn uống', date: '2026-10-20' },
        { id: 'tx-10-36', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-20' },

        // 21/10: Ăn 56k | Gửi xe 10k
        { id: 'tx-10-37', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 56000, description: 'Tiền ăn uống', date: '2026-10-21' },
        { id: 'tx-10-38', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-21' },

        // 22/10: Ăn 54k | Gửi xe 10k
        { id: 'tx-10-39', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 54000, description: 'Tiền ăn uống', date: '2026-10-22' },
        { id: 'tx-10-40', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-22' },

        // 23/10: Ăn 57k | Gửi xe 10k
        { id: 'tx-10-41', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 57000, description: 'Tiền ăn uống', date: '2026-10-23' },
        { id: 'tx-10-42', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-23' },

        // 24/10: Ăn 63k | Gửi xe 10k
        { id: 'tx-10-43', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 63000, description: 'Tiền ăn uống', date: '2026-10-24' },
        { id: 'tx-10-44', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-24' },

        // 25/10: Ăn 42k | Gửi xe 10k
        { id: 'tx-10-45', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 42000, description: 'Tiền ăn uống', date: '2026-10-25' },
        { id: 'tx-10-46', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-25' },

        // 26/10: Ăn 51k | Gửi xe 10k
        { id: 'tx-10-47', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 51000, description: 'Tiền ăn uống', date: '2026-10-26' },
        { id: 'tx-10-48', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-26' },

        // 27/10: Ăn 49k | Gửi xe 10k
        { id: 'tx-10-49', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 49000, description: 'Tiền ăn uống', date: '2026-10-27' },
        { id: 'tx-10-50', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-27' },

        // 28/10: Ăn 53k | Gửi xe 10k
        { id: 'tx-10-51', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 53000, description: 'Tiền ăn uống', date: '2026-10-28' },
        { id: 'tx-10-52', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-28' },

        // 29/10: Ăn 47k | Gửi xe 10k
        { id: 'tx-10-53', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 47000, description: 'Tiền ăn uống', date: '2026-10-29' },
        { id: 'tx-10-54', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-29' },

        // 30/10: Ăn 52k | Gửi xe 10k
        { id: 'tx-10-55', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 52000, description: 'Tiền ăn uống', date: '2026-10-30' },
        { id: 'tx-10-56', monthKey: 'T10', categoryId: 'exp_giuxe', type: 'expense', amount: 10000, description: 'Gửi xe', date: '2026-10-30' },

        // 31/10: Ăn 30.670
        { id: 'tx-10-57', monthKey: 'T10', categoryId: 'exp_an', type: 'expense', amount: 30670, description: 'Tiền ăn uống', date: '2026-10-31' },
      ],
      note: 'Tháng 10: Thu đợt 1 = 5.632.692 ₫ | Tổng chi = 5.863.670 ₫ | Tạm âm -230.978 ₫ do đợt 2 chưa nhận lương.',
    },
    T11: {
      monthKey: 'T11',
      label: 'Tháng 11',
      expenses: {
        exp_nha: 0,
        exp_dien: 0,
        exp_xang: 0,
        exp_an: 0,
        exp_dichoi_tien: 0,
        exp_dichoi_ban: 0,
        exp_grab: 0,
        exp_canhan: 0,
        exp_veque: 0,
        exp_giuxe: 0,
        exp_shopee: 0,
        exp_tietkiem: 2000000,
      },
      incomes: {
        inc_dot1: 0,
        inc_dot2: 0,
      },
      transactions: [
        { id: 'tx-11-1', monthKey: 'T11', categoryId: 'exp_tietkiem', type: 'expense', amount: 2000000, description: 'Tiền tiết kiệm', date: '2026-11-05' },
      ],
      note: '',
    },
    T12: {
      monthKey: 'T12',
      label: 'Tháng 12',
      expenses: {
        exp_nha: 0,
        exp_dien: 0,
        exp_xang: 0,
        exp_an: 0,
        exp_dichoi_tien: 0,
        exp_dichoi_ban: 0,
        exp_grab: 0,
        exp_canhan: 0,
        exp_veque: 0,
        exp_giuxe: 0,
        exp_shopee: 0,
        exp_tietkiem: 2000000,
      },
      incomes: {
        inc_dot1: 0,
        inc_dot2: 0,
      },
      transactions: [
        { id: 'tx-12-1', monthKey: 'T12', categoryId: 'exp_tietkiem', type: 'expense', amount: 2000000, description: 'Tiền tiết kiệm', date: '2026-12-05' },
      ],
      note: '',
    },
  },
};

INITIAL_FINANCE_DATA.yearsData = {
  2026: {
    year: 2026,
    startingSavings: 14000000,
    months: ['T9', 'T10', 'T11', 'T12'],
    records: INITIAL_FINANCE_DATA.records,
    defaultBudgets: INITIAL_FINANCE_DATA.defaultBudgets,
  },
  2027: createEmptyYearData(2027, 22000000, INITIAL_FINANCE_DATA.defaultBudgets),
  2028: createEmptyYearData(2028, 46000000, INITIAL_FINANCE_DATA.defaultBudgets),
};
