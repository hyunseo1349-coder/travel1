import { useState, useEffect } from 'react';

const DEFAULT_SHEET_ID = '1H9zxfIaLDS6wekwsBKgrgK2uKKSdDC1X9bgug85g7oI';
const DEFAULT_GID      = '622483222';

function buildCsvUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

// ─── CSV 파서 ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(field.trim()); field = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(field.trim());
      if (row.some(c => c)) rows.push(row);
      row = []; field = '';
    } else { field += ch; }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(c => c)) rows.push(row); }
  return rows;
}

// ─── 달력 날짜 파싱 (여러 포맷 지원) ────────────────────────────────────────
// 반환: { year?, month, day } 또는 null
export function parseCalendarDate(raw) {
  if (!raw) return null;
  let m;
  // YYYY-MM-DD 또는 YYYY/MM/DD
  m = raw.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };
  // M/D 또는 MM/DD (연도 없음)
  m = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m) return { month: +m[1], day: +m[2] };
  // N월 M일
  m = raw.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (m) return { month: +m[1], day: +m[2] };
  return null;
}

// ─── 요일 추출 ───────────────────────────────────────────────────────────────
function extractDayName(raw) {
  if (!raw) return '';
  for (const d of ['월', '화', '수', '목', '금', '토', '일']) {
    if (raw.includes(d)) return d + '요일';
  }
  return '';
}

// ─── 오늘 날짜와 일치하는 일차 인덱스 ─────────────────────────────────────
export function findTodayIndex(days) {
  const now   = new Date();
  const today = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  const idx   = days.findIndex(d => {
    if (!d.parsedDate) return false;
    const { year, month, day } = d.parsedDate;
    return (!year || year === today.year) && month === today.month && day === today.day;
  });
  return idx >= 0 ? idx : 0;
}

// ─── 헤더에서 컬럼 인덱스 찾기 ──────────────────────────────────────────────
function findColIndex(headers, candidates) {
  for (const cand of candidates) {
    const idx = headers.findIndex(h =>
      h.replace(/\s/g, '').toLowerCase().includes(cand.toLowerCase())
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

// ─── 메인 훅 ────────────────────────────────────────────────────────────────
export function useGoogleSheets(sheetId = DEFAULT_SHEET_ID, gid = DEFAULT_GID) {
  const [days, setDays]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSheet() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(buildCsvUrl(sheetId, gid));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const rows = parseCSV(text);
        if (rows.length < 2) throw new Error('시트에 데이터가 없습니다.');

        const headers = rows[0];

        // 컬럼 인덱스 탐색 — 실제 헤더명 우선
        const iDate     = findColIndex(headers, ['날짜', '일자', '일차', 'day', 'date']);
        const iTime     = findColIndex(headers, ['시간', 'time']);
        const iSchedule = findColIndex(headers, ['일정', '일정명', 'schedule', 'activity', '활동']);
        const iContent  = findColIndex(headers, ['기본내용', '기본 내용', '내용', '장소', '위치', 'location', 'description']);
        const iDetail   = findColIndex(headers, ['상세내용', '상세 내용', '상세', 'detail', '세부내용', '세부 내용']);
        const iTip      = findColIndex(headers, ['팁', 'tip', 'tips', '조언']);
        const iLink     = findColIndex(headers, ['참고링크', '참고 링크', 'link', 'url', '링크']);
        const iAlt      = findColIndex(headers, ['대체일정', '대체 일정', '대안', 'alternative', 'alt']);
        const iAmount   = findColIndex(headers, ['금액', '비용', '가격', 'cost', 'amount', 'price', '요금']);
        const iNote     = findColIndex(headers, ['기록', '메모', '노트', 'note', 'memo', 'journal', 'diary']);
        const iTheme    = findColIndex(headers, ['테마', '테마명', '지역', '도시', 'theme', 'city', 'region']);

        const get = (row, i) => (i >= 0 ? row[i] || '' : '');
        const items = rows.slice(1).map((row, idx) => ({
          id:       idx,
          date:     get(row, iDate),
          time:     get(row, iTime),
          schedule: get(row, iSchedule),
          content:  get(row, iContent),
          detail:   get(row, iDetail),
          tip:      get(row, iTip),
          link:     get(row, iLink),
          alt:      get(row, iAlt),
          amount:   get(row, iAmount),
          note:     get(row, iNote),
          theme:    get(row, iTheme),
        })).filter(item => item.schedule || item.time);

        // 날짜별 그룹핑
        const grouped = {}, order = [];
        let lastDate = '';
        items.forEach(item => {
          const key = item.date || lastDate || '미정';
          if (item.date) lastDate = item.date;
          if (!grouped[key]) { grouped[key] = []; order.push(key); }
          grouped[key].push(item);
        });

        const dayList = order.map((key, idx) => {
          const parsedDate = parseCalendarDate(key);
          const dayName    = extractDayName(key);
          const its        = grouped[key];
          const theme      = its.find(i => i.theme)?.theme || '';
          return { key, seqNumber: idx + 1, parsedDate, dayName, theme, items: its };
        });

        if (!cancelled) setDays(dayList);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSheet();
    return () => { cancelled = true; };
  }, [sheetId, gid]);

  return { days, loading, error };
}
