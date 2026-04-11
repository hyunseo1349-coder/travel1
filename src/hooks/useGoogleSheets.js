import { useState, useEffect } from 'react';

// ─── 설정: Google Sheets CSV 내보내기 URL ───────────────────────────────────
// 시트를 '링크가 있는 모든 사용자에게 공개'로 설정해야 합니다.
const DEFAULT_SHEET_ID  = '1H9zxfIaLDS6wekwsBKgrgK2uKKSdDC1X9bgug85g7oI';
const DEFAULT_GID       = '622483222';

function buildCsvUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

// ─── CSV 파서 (따옴표 필드 처리) ────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(field.trim());
      field = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(field.trim());
      if (row.some(c => c)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(c => c)) rows.push(row); }
  return rows;
}

// ─── 날짜 컬럼에서 일차(숫자) 추출 ─────────────────────────────────────────
function extractDayNumber(raw) {
  if (!raw) return null;
  const m = raw.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// ─── 날짜 문자열에서 요일 추출 ──────────────────────────────────────────────
const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
function extractDayName(raw) {
  if (!raw) return '';
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  for (const d of days) {
    if (raw.includes(d)) return d + '요일';
  }
  return raw;
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
      setLoading(true);
      setError(null);
      try {
        const url = buildCsvUrl(sheetId, gid);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const rows = parseCSV(text);
        if (rows.length < 2) throw new Error('시트에 데이터가 없습니다.');

        const headers = rows[0];

        // 컬럼 인덱스 탐색 — 실제 헤더명 우선, fallback으로 유사어 지원
        const iDate     = findColIndex(headers, ['날짜', '일자', '일차', 'day', 'date']);
        const iTime     = findColIndex(headers, ['시간', 'time']);
        const iSchedule = findColIndex(headers, ['일정', '일정명', 'schedule', 'activity', '활동']);
        const iContent  = findColIndex(headers, ['기본내용', '기본 내용', '내용', '장소', '위치', 'location', 'description']);
        const iDetail   = findColIndex(headers, ['상세내용', '상세 내용', '상세', 'detail', '세부내용', '세부 내용']);
        const iTip      = findColIndex(headers, ['팁', 'tip', 'tips', '조언', '참고사항']);
        const iLink     = findColIndex(headers, ['참고링크', '참고 링크', 'link', 'url', '링크', '참고']);
        const iAlt      = findColIndex(headers, ['대체일정', '대체 일정', '대안', 'alternative', 'alt']);
        const iTheme    = findColIndex(headers, ['테마', '테마명', '지역', '도시', 'theme', 'city', 'region']);

        // 데이터 행 파싱
        const items = rows.slice(1).map((row, idx) => ({
          id:       idx,
          date:     iDate     >= 0 ? row[iDate]     : '',
          time:     iTime     >= 0 ? row[iTime]     : '',
          schedule: iSchedule >= 0 ? row[iSchedule] : '',
          content:  iContent  >= 0 ? row[iContent]  : '',
          detail:   iDetail   >= 0 ? row[iDetail]   : '',
          tip:      iTip      >= 0 ? row[iTip]       : '',
          link:     iLink     >= 0 ? row[iLink]      : '',
          alt:      iAlt      >= 0 ? row[iAlt]       : '',
          theme:    iTheme    >= 0 ? row[iTheme]     : '',
          raw:      row,
        })).filter(item => item.schedule || item.time);

        // 날짜별 그룹핑
        const grouped = {};
        const order   = [];
        let lastDate  = '';
        items.forEach(item => {
          const key = item.date || lastDate || '미정';
          if (item.date) lastDate = item.date;
          if (!grouped[key]) { grouped[key] = []; order.push(key); }
          grouped[key].push(item);
        });

        const dayList = order.map((key, idx) => {
          const num  = extractDayNumber(key) || (idx + 1);
          const name = extractDayName(key);
          const items = grouped[key];
          const theme = items.find(i => i.theme)?.theme || '';
          return { key, dayNumber: num, dayName: name, theme, items };
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
