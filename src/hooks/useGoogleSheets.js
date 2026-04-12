import { useState, useEffect } from 'react';

const DEFAULT_SHEET_ID = '1H9zxfIaLDS6wekwsBKgrgK2uKKSdDC1X9bgug85g7oI';
const DEFAULT_GID      = '622483222';

function buildCsvUrl(sheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') { field += '"'; i++; } else inQuotes = !inQuotes;
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

// ─── 달력 날짜 파싱 + 요일 계산 ─────────────────────────────────────────────
const KO_DAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'];

// 연도 없을 때 현재/내년 추론 (60일 이상 지난 날짜면 내년으로)
function inferYear(month, day) {
  const now  = new Date();
  const year = now.getFullYear();
  const diff = (new Date(year, month - 1, day) - now) / 86400000;
  return diff < -60 ? year + 1 : year;
}

export function parseCalendarDate(raw) {
  if (!raw) return null;
  let m;

  // YYYY-MM-DD 또는 YYYY/MM/DD
  m = raw.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m.map(Number);
    return { year: y, month: mo, day: d, dayOfWeek: KO_DAY_SHORT[new Date(y, mo - 1, d).getDay()] };
  }
  // M/D/YYYY 또는 MM/DD/YYYY (Google Sheets 미국 형식)
  m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mo, d, y] = m.map(Number);
    return { year: y, month: mo, day: d, dayOfWeek: KO_DAY_SHORT[new Date(y, mo - 1, d).getDay()] };
  }
  // N월 M일
  m = raw.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (m) {
    const [, mo, d] = m.map(Number);
    const y = inferYear(mo, d);
    return { year: y, month: mo, day: d, dayOfWeek: KO_DAY_SHORT[new Date(y, mo - 1, d).getDay()] };
  }
  // MM/DD 또는 M/D
  m = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    const [, mo, d] = m.map(Number);
    const y = inferYear(mo, d);
    return { year: y, month: mo, day: d, dayOfWeek: KO_DAY_SHORT[new Date(y, mo - 1, d).getDay()] };
  }
  return null;
}

function extractDayName(raw) {
  if (!raw) return '';
  for (const d of ['월', '화', '수', '목', '금', '토', '일']) {
    if (raw.includes(d + '요일') || raw.includes(d)) return d;
  }
  return '';
}

export function findTodayIndex(days) {
  const now = new Date();
  const idx = days.findIndex(d => {
    if (!d.parsedDate) return false;
    const { year, month, day } = d.parsedDate;
    return (!year || year === now.getFullYear())
      && month === now.getMonth() + 1
      && day  === now.getDate();
  });
  return idx >= 0 ? idx : 0;
}

function findColIndex(headers, candidates) {
  for (const cand of candidates) {
    const idx = headers.findIndex(h =>
      h.replace(/\s/g, '').toLowerCase().includes(cand.toLowerCase())
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

// ─── 상세 필드 정의 (label, 탐색 키워드, 타입) ──────────────────────────────
// 이 순서는 "폴백 순서"이며 실제 표시는 시트 컬럼 순서를 따름
const DETAIL_FIELD_DEFS = [
  { key: 'content', label: '기본 내용', candidates: ['기본내용','기본 내용','내용','description'], type: 'text' },
  { key: 'detail',  label: '상세 내용', candidates: ['상세내용','상세 내용','상세','detail','세부내용','세부 내용'],             type: 'text' },
  { key: 'tip',     label: '팁',       candidates: ['팁','tip','tips','조언'],                                                  type: 'text' },
  { key: 'link',    label: '참고 링크', candidates: ['참고링크','참고 링크','link','url','링크'],                               type: 'link' },
  { key: 'alt',     label: '대체 일정', candidates: ['대체일정','대체 일정','대안','alternative','alt'],                        type: 'text' },
  { key: 'amount',  label: '금액',     candidates: ['금액','비용','가격','cost','amount','price','요금'],                       type: 'text' },
  { key: 'note',    label: '기록',     candidates: ['기록','메모','노트','note','memo','journal','diary'],                      type: 'text' },
];

// ─── 오프라인 캐시 ────────────────────────────────────────────────────────────
function sheetCacheKey(id, gid) { return `journey-sheet-${id}-${gid}`; }
function loadSheetCache(id, gid) {
  try { return JSON.parse(localStorage.getItem(sheetCacheKey(id, gid))) || null; } catch { return null; }
}
function saveSheetCache(id, gid, data) {
  try { localStorage.setItem(sheetCacheKey(id, gid), JSON.stringify(data)); } catch {}
}

// ─── 메인 훅 ────────────────────────────────────────────────────────────────
export function useGoogleSheets(sheetId = DEFAULT_SHEET_ID, gid = DEFAULT_GID) {
  const [days,      setDays]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [refreshKey,setRefreshKey]= useState(0);

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

        // 기본 컬럼
        const iDate = findColIndex(headers, ['날짜','일자','일차','day','date']);
        const iDow  = findColIndex(headers, ['요일','day of week','dayofweek','weekday']);
        const iTime = findColIndex(headers, ['시간','time']);
        const iSch  = findColIndex(headers, ['일정','일정명','schedule','activity','활동']);
        const iLoc  = findColIndex(headers, ['장소','위치','place','location','venue']);
        const iCity = findColIndex(headers, ['도시','city','cities','지역']);

        // 상세 필드: 컬럼 인덱스를 찾고 시트 순서대로 정렬
        const detailCols = DETAIL_FIELD_DEFS
          .map(def => ({ ...def, colIdx: findColIndex(headers, def.candidates) }))
          .filter(def => def.colIdx >= 0)
          .sort((a, b) => a.colIdx - b.colIdx);  // ← 시트 열 순서 보존

        const get = (row, i) => (i >= 0 ? row[i] || '' : '');

        const items = rows.slice(1).map((row, idx) => {
          // 각 상세 필드를 시트 순서대로 배열에 담음
          const orderedFields = detailCols.map(def => ({
            key:   def.key,
            label: def.label,
            type:  def.type,
            value: get(row, def.colIdx),
          }));

          return {
            id:            idx,
            date:          get(row, iDate),
            dow:           get(row, iDow),   // 요일 열 (토, 일 등)
            time:          get(row, iTime),
            schedule:      get(row, iSch),
            location:      get(row, iLoc),   // 장소 (지도용)
            city:          get(row, iCity),  // 도시 열 (있으면)
            orderedFields, // 시트 열 순서대로 정렬된 필드 목록
            // 개별 접근용 (icon 자동감지 등)
            content: orderedFields.find(f => f.key === 'content')?.value || '',
          };
        }).filter(item => item.schedule || item.time);

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
          // 요일: parsedDate에서 계산된 것 우선, 없으면 raw 문자열에서 추출
          const its      = grouped[key];
          // 요일: 시트 요일 열 → parsedDate 계산값 → raw 문자열 추출 순
          const sheetDow = its[0]?.dow ? extractDayName(its[0].dow) : '';
          const dayShort = sheetDow || parsedDate?.dayOfWeek || extractDayName(key);
          return { key, seqNumber: idx + 1, parsedDate, dayShort, items: its };
        });

        saveSheetCache(sheetId, gid, dayList);
        if (!cancelled) { setDays(dayList); setFromCache(false); }
      } catch (err) {
        if (!cancelled) {
          const cached = loadSheetCache(sheetId, gid);
          if (cached?.length) { setDays(cached); setFromCache(true); }
          else setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSheet();
    return () => { cancelled = true; };
  }, [sheetId, gid, refreshKey]);

  return { days, loading, error, fromCache, refetch: () => setRefreshKey(k => k+1) };
}
