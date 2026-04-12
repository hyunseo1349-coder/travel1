import { useState, useEffect } from 'react';

const SHEET_ID   = '1H9zxfIaLDS6wekwsBKgrgK2uKKSdDC1X9bgug85g7oI';
const EXPENSE_GID = '1256137167';

// ─── 국가 → 타임존 매핑 ──────────────────────────────────────────────────────
const COUNTRY_TZ = {
  '한국':'Asia/Seoul','korea':'Asia/Seoul','kr':'Asia/Seoul',
  '이탈리아':'Europe/Rome','italy':'Europe/Rome','it':'Europe/Rome',
  '스위스':'Europe/Zurich','switzerland':'Europe/Zurich','ch':'Europe/Zurich',
  '프랑스':'Europe/Paris','france':'Europe/Paris','fr':'Europe/Paris',
  '독일':'Europe/Berlin','germany':'Europe/Berlin','de':'Europe/Berlin',
  '영국':'Europe/London','uk':'Europe/London','gb':'Europe/London',
  '일본':'Asia/Tokyo','japan':'Asia/Tokyo','jp':'Asia/Tokyo',
  '미국':'America/New_York','usa':'America/New_York','us':'America/New_York',
};
export function countryTimezone(country = '') {
  return COUNTRY_TZ[country.trim().toLowerCase()] || 'Asia/Seoul';
}

// 해당 국가 현지 날짜 → YYYY-MM-DD 문자열
export function localDateStr(country) {
  const tz = countryTimezone(country);
  return new Date().toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
}

// ─── CSV 파서 ─────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"') { if (inQ && n === '"') { field += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) { row.push(field.trim()); field = ''; }
    else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && n === '\n') i++;
      row.push(field.trim()); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

function findCol(headers, cands) {
  for (const c of cands) {
    const i = headers.findIndex(h => h.replace(/\s/g,'').toLowerCase().includes(c.toLowerCase()));
    if (i >= 0) return i;
  }
  return -1;
}

function toNum(s = '') {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ─── 날짜 정규화 (→ YYYY-MM-DD) ──────────────────────────────────────────────
function normalizeDate(raw = '') {
  const s = raw.trim();
  // 이미 YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // M/D/YYYY
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  // YYYY/MM/DD
  m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  // N월M일 (현재 연도 추론)
  m = s.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (m) {
    const yr = new Date().getFullYear();
    return `${yr}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  }
  return s; // fallback: 원본 반환
}

// ─── 카테고리 정규화 ──────────────────────────────────────────────────────────
export function normalizeCategory(raw = '') {
  const c = raw.trim().toLowerCase();
  if (!c) return '기타';
  if (['식비','음식','식사','카페','커피','레스토랑','lunch','dinner','breakfast','food','dining','cafe','restaurant'].some(k=>c.includes(k))) return '식비';
  if (['숙박','호텔','숙소','료칸','체크인','hotel','accommodation','inn','stay'].some(k=>c.includes(k))) return '숙박';
  if (['교통','이동','기차','버스','택시','지하철','비행','항공','transport','train','bus','taxi','flight','transit'].some(k=>c.includes(k))) return '교통';
  if (['쇼핑','구매','shopping','purchase','market'].some(k=>c.includes(k))) return '쇼핑';
  if (['관광','입장','투어','활동','박물관','미술관','sightseeing','tour','museum','activity'].some(k=>c.includes(k))) return '관광';
  return '기타';
}

// ─── 시트에서 환율 영역 추출 ─────────────────────────────────────────────────
const CURRENCY_CODES = ['USD','EUR','CHF','JPY','GBP','AUD','CNY'];
function extractRates(rows) {
  const rates = { KRW: 1 };
  rows.forEach(row => {
    row.forEach((cell, j) => {
      const upper = cell.toUpperCase().trim();
      if (CURRENCY_CODES.includes(upper)) {
        // 오른쪽 셀들에서 숫자 탐색
        for (let k = j + 1; k <= j + 3 && k < row.length; k++) {
          const n = toNum(row[k]);
          if (n > 0) { rates[upper] = n; break; }
        }
      }
    });
  });
  return rates;
}

// ─── 메인 훅 ─────────────────────────────────────────────────────────────────
export function useExpenseSheet(sheetId = SHEET_ID, gid = EXPENSE_GID) {
  const [expenses, setExpenses] = useState([]);
  const [rates,    setRates]    = useState({ KRW:1, USD:1380, EUR:1500, CHF:1550, JPY:9.5 });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const rows = parseCSV(text);
        if (rows.length < 2) throw new Error('데이터가 없어요');

        // 환율 먼저 추출 (전체 셀 스캔)
        const sheetRates = extractRates(rows);

        // 헤더 행 탐색: '날짜' 또는 '항목' 포함 행
        const hIdx = rows.findIndex(r => r.some(c => /날짜|항목|카테고리/.test(c)));
        if (hIdx < 0) throw new Error('헤더를 찾을 수 없어요');
        const headers = rows[hIdx];

        const iDate   = findCol(headers, ['날짜','date']);
        const iCountry= findCol(headers, ['국가','country','나라']);
        const iItem   = findCol(headers, ['항목','내용','item','description']);
        const iCat    = findCol(headers, ['카테고리','category','분류']);
        const iCur    = findCol(headers, ['통화','currency','화폐']);
        const iAmt    = findCol(headers, ['현지금액','현지 금액','금액','amount']);
        const iRate   = findCol(headers, ['환율','rate','exchange']);
        const iKRW    = findCol(headers, ['원화환산','원화 환산','원화금액','원화','krw']);
        const iMethod = findCol(headers, ['결제수단','결제 수단','결제','payment','카드']);
        const iNote   = findCol(headers, ['비고','메모','note','memo','remark']);

        const mergedRates = { ...rates, ...sheetRates };

        const get = (row, i) => (i >= 0 && i < row.length ? row[i] || '' : '');

        const data = rows.slice(hIdx + 1)
          .map((row, idx) => {
            const rawDate = get(row, iDate);
            const item    = get(row, iItem);
            if (!rawDate && !item) return null;

            const currency = (get(row, iCur).toUpperCase() || 'KRW').trim();
            const localAmt = toNum(get(row, iAmt));
            const rowRate  = toNum(get(row, iRate));
            let   krwAmt   = toNum(get(row, iKRW));

            if (!krwAmt && localAmt) {
              const rate = rowRate || mergedRates[currency] || 1;
              krwAmt = currency === 'KRW' ? localAmt : Math.round(localAmt * rate);
            }
            if (currency === 'KRW') krwAmt = localAmt;

            const rawCat = get(row, iCat);
            // 카테고리 비어있으면 항목명으로 자동 분류
            const resolvedCat = rawCat.trim() ? rawCat : item;
            return {
              id:        `exp-${idx}`,
              date:      normalizeDate(rawDate),
              dateRaw:   rawDate,
              country:   get(row, iCountry),
              item,
              category:    normalizeCategory(resolvedCat),
              categoryRaw: rawCat,
              currency,
              amount:    localAmt,
              rate:      rowRate || mergedRates[currency] || 1,
              amountKRW: krwAmt,
              method:    get(row, iMethod),
              note:      get(row, iNote),
            };
          })
          .filter(e => e && (e.item || e.date) && e.amountKRW >= 0);

        if (!cancelled) { setExpenses(data); setRates(mergedRates); }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sheetId, gid]);

  return { expenses, rates, loading, error };
}
