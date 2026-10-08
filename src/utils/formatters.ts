export function formatVND(amount: number | undefined | null, includeCurrency = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeCurrency ? '0 ₫' : '0';
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('vi-VN');
  return includeCurrency ? `${formatted} ₫` : formatted;
}

export function formatCompactVND(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ₫';
  }
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}k`;
  }
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

export function parseMoneyInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  let str = String(value).trim();
  if (!str) return 0;

  // Check negative representation: -100 or (100)
  const isNegative = str.startsWith('-') || (str.startsWith('(') && str.endsWith(')'));
  str = str.replace(/[()]/g, '').trim();

  const lower = str.toLowerCase();

  // Shorthands: 2.5tr, 2,5tr, 2m, 2 triệu
  if (lower.endsWith('tr') || lower.endsWith('m') || lower.endsWith('triệu')) {
    const numPart = lower.replace(/(tr|m|triệu)/g, '').trim().replace(/,/g, '.');
    const n = parseFloat(numPart);
    return isNaN(n) ? 0 : (isNegative ? -1 : 1) * Math.round(n * 1_000_000);
  }

  // Shorthands: 500k, 50k, 50 nghìn
  if (lower.endsWith('k') || lower.endsWith('nghìn') || lower.endsWith('ngàn')) {
    const numPart = lower.replace(/(k|nghìn|ngàn)/g, '').trim().replace(/,/g, '.');
    const n = parseFloat(numPart);
    return isNaN(n) ? 0 : (isNegative ? -1 : 1) * Math.round(n * 1_000);
  }

  // Strip anything that is not digit, dot, comma, or minus
  str = str.replace(/[^0-9.,-]/g, '');
  if (!str || str === '-') return 0;

  const dotCount = (str.match(/\./g) || []).length;
  const commaCount = (str.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount > 0) {
    // Mixed: e.g. 2.750.000,50 or 2,750,000.50
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Dot is thousands, comma is decimal: 2.750.000,50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Comma is thousands, dot is decimal: 2,750,000.50
      str = str.replace(/,/g, '');
    }
  } else if (dotCount > 1) {
    // Multiple dots: 2.750.000 -> Vietnamese thousands separators
    str = str.replace(/\./g, '');
  } else if (commaCount > 1) {
    // Multiple commas: 2,750,000 -> English thousands separators
    str = str.replace(/,/g, '');
  } else if (dotCount === 1) {
    // Exactly 1 dot.
    // If followed by 3 digits at the end: e.g. "122.500", "762.000", "15.494", "230.978", "2.750"
    // In VND, this is a thousands separator!
    if (/\.\d{3}$/.test(str)) {
      str = str.replace(/\./g, '');
    }
  } else if (commaCount === 1) {
    // Exactly 1 comma: e.g. "122,500"
    if (/,\d{3}$/.test(str)) {
      str = str.replace(/,/g, '');
    } else {
      // e.g. "2,5"
      str = str.replace(',', '.');
    }
  }

  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  const res = Math.round(parsed);
  return isNegative && res > 0 ? -res : res;
}

export function formatPercentChange(current: number, previous: number): {
  percent: number;
  formatted: string;
  isPositive: boolean;
  isNeutral: boolean;
} {
  if (!previous || previous === 0) {
    if (current > 0) {
      return { percent: 100, formatted: '+100%', isPositive: true, isNeutral: false };
    }
    return { percent: 0, formatted: '0%', isPositive: false, isNeutral: true };
  }

  const diff = current - previous;
  const pct = (diff / Math.abs(previous)) * 100;
  const rounded = Math.round(pct * 10) / 10;

  if (Math.abs(rounded) < 0.1) {
    return { percent: 0, formatted: '0%', isPositive: false, isNeutral: true };
  }

  const sign = rounded > 0 ? '+' : '';
  return {
    percent: rounded,
    formatted: `${sign}${rounded.toFixed(1)}%`,
    isPositive: rounded > 0,
    isNeutral: false,
  };
}

export function getMonthDisplay(key: string): string {
  if (key.startsWith('T') && !isNaN(Number(key.slice(1)))) {
    return `Tháng ${key.slice(1)}`;
  }
  return key;
}
