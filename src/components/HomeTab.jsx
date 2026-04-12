import { useState, useRef } from 'react';
import { useGoogleSheets, findTodayIndex } from '../hooks/useGoogleSheets.js';
import { useExpenseSheet } from '../hooks/useExpenseSheet.js';
import PhotoCropper from './PhotoCropper.jsx';

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// ─── 관광지 필터 ──────────────────────────────────────────────────────────────
const SKIP_KW = [
  '호텔','숙소','체크인','체크아웃','조식','중식','석식','식사','레스토랑','카페',
  'breakfast','lunch','dinner','hotel','inn','cafe',
  '공항','이동','출발','도착','기차','버스','택시','탑승','비행','환승','탑승구','기내',
  'airport','flight','train','bus','transfer','check-in','check-out',
];
function isTouristSpot(name = '') {
  const t = name.toLowerCase();
  return !SKIP_KW.some(k => t.includes(k));
}

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────
function fmtRange(days) {
  const f = days[0]?.parsedDate;
  const l = days[days.length - 1]?.parsedDate;
  if (!f) return '';
  const p = d => `${String(d.month).padStart(2,'0')}.${String(d.day).padStart(2,'0')}`;
  return l ? `${f.year} · ${p(f)} — ${p(l)}` : p(f);
}

function calcDDay(days) {
  const f = days[0]?.parsedDate;
  if (!f) return null;
  const start = new Date(f.year, f.month - 1, f.day);
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((start - today) / 86400000);
}

function isActualToday(pd) {
  if (!pd) return false;
  const n = new Date();
  return pd.year === n.getFullYear() && pd.month === n.getMonth()+1 && pd.day === n.getDate();
}

// ─── localStorage: 홈 사진 ───────────────────────────────────────────────────
const HERO_KEY = 'journey-hero';
function loadHeroPhoto(tripId) { try { return JSON.parse(localStorage.getItem(HERO_KEY) || '{}')[tripId] || null; } catch { return null; } }
function saveHeroPhoto(tripId, dataUrl) { try { const m = JSON.parse(localStorage.getItem(HERO_KEY) || '{}'); m[tripId] = dataUrl; localStorage.setItem(HERO_KEY, JSON.stringify(m)); } catch {} }

// ─── 일정 요약: 날짜별 경로 추출 ──────────────────────────────────────────────
function extractRoute(items) {
  // "→" 포함 항목 우선
  const ri = items.find(i => i.schedule.includes('→'));
  if (ri) return ri.schedule.replace(/\([A-Z]{2,3}\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  // 장소 컬럼에서 추출
  const locs = [...new Set(items.map(i => i.location).filter(Boolean))];
  if (locs.length > 0) return locs[0].split(/[,·]/)[0].trim().slice(0, 20);
  return '';
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ trip, days, tripId }) {
  const [cropFile, setCropFile] = useState(null);
  const [heroPhoto, setHeroPhoto] = useState(() => loadHeroPhoto(tripId));
  const [imgErr, setImgErr]    = useState(false);
  const fileRef = useRef();

  const dDay     = calcDDay(days);
  const dateRange = fmtRange(days);
  const title    = trip?.level2 || trip?.level1 || '여행 개요';

  // picsum: deterministic seed from trip name
  const seed = encodeURIComponent(trip?.level2 || trip?.level1 || 'travel');
  const defaultPhoto = `https://picsum.photos/seed/${seed}/800/450`;

  const handleFile = e => {
    const f = e.target.files?.[0];
    if (f) setCropFile(f);
    e.target.value = '';
  };
  const handleCrop = (dataUrl) => {
    saveHeroPhoto(tripId, dataUrl);
    setHeroPhoto(dataUrl);
    setCropFile(null);
    setImgErr(false);
  };

  return (
    <>
      <div style={{ position: 'relative', height: 210, overflow: 'hidden', flexShrink: 0 }}>
        {heroPhoto ? (
          <img src={heroPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : !imgErr ? (
          <img src={defaultPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2d5a27,#436440,#6b9466)' }} />
        )}

        {/* 그라디언트 오버레이 */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />

        {/* D-Day 뱃지 */}
        {dDay !== null && (
          <div style={{ position: 'absolute', top: 14, right: 14, backgroundColor: dDay <= 0 ? '#436440' : 'rgba(255,255,255,0.9)', color: dDay <= 0 ? '#fff' : '#436440', fontSize: '11px', fontWeight: 800, padding: '4px 11px', borderRadius: '999px', letterSpacing: '0.02em' }}>
            {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : `D+${Math.abs(dDay)}`}
          </div>
        )}

        {/* 사진 변경 버튼 */}
        <button
          onClick={() => fileRef.current?.click()}
          style={{ position: 'absolute', bottom: 56, right: 14, display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '999px', backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 500, cursor: 'pointer', backdropFilter: 'blur(4px)' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          사진 변경
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        {/* 텍스트 */}
        <div style={{ position: 'absolute', bottom: 18, left: 20, right: 20 }}>
          {dateRange && (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', fontWeight: 500, margin: '0 0 5px', fontFamily: "'Inter',sans-serif" }}>
              {dateRange}
            </p>
          )}
          <h2 style={{ fontFamily: "'Noto Serif KR','Noto Serif',Georgia,serif", fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.25, wordBreak: 'keep-all', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
            {title}
          </h2>
        </div>
      </div>

      {cropFile && <PhotoCropper imageFile={cropFile} onConfirm={handleCrop} onCancel={() => setCropFile(null)} />}
    </>
  );
}

// ─── 컴팩트 요약 바 ───────────────────────────────────────────────────────────
function CompactSummary({ days, expenses }) {
  const totalSpent = expenses.reduce((s, e) => s + (e.amountKRW || 0), 0);
  const todayStr   = new Date().toLocaleDateString('en-CA');
  const todaySpent = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + (e.amountKRW || 0), 0);
  const countries  = [...new Set(expenses.map(e => e.country).filter(Boolean))];

  const stats = [
    { label: '총 일수', value: `${days.length}일` },
    ...(countries.length > 0 ? [{ label: '국가', value: `${countries.length}개국` }] : []),
    { label: '총 지출', value: totalSpent > 0 ? `₩${(totalSpent/10000).toFixed(0)}만` : '—', bold: true },
    ...(todaySpent > 0 ? [{ label: '오늘', value: `₩${(todaySpent/10000).toFixed(0)}만` }] : []),
  ];

  return (
    <div style={{ backgroundColor: '#fff', padding: '14px 20px' }}>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="scrollbar-hide">
        {stats.map(s => (
          <div key={s.label} style={{ flexShrink: 0, backgroundColor: '#f8faf8', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
            <p style={{ fontSize: '15px', fontWeight: 800, color: s.bold ? '#436440' : '#1f2937', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{s.value}</p>
            <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 일정 타임라인 ────────────────────────────────────────────────────────────
function DayTimeline({ days, todayIdx }) {
  return (
    <div style={{ backgroundColor: '#fff', padding: '14px 0' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', margin: '0 0 10px', padding: '0 20px' }}>일정 타임라인</p>
      <div className="scrollbar-hide" style={{ display: 'flex', gap: '7px', overflowX: 'auto', padding: '2px 20px 2px', scrollSnapType: 'x mandatory' }}>
        {days.map((day, idx) => {
          const today  = isActualToday(day.parsedDate);
          const isPast = idx < todayIdx && !today;
          const pd     = day.parsedDate;
          return (
            <div key={day.key} style={{ flexShrink: 0, scrollSnapAlign: 'start', borderRadius: '12px', padding: '8px 12px', textAlign: 'center', minWidth: 54, backgroundColor: today ? '#436440' : isPast ? '#f5f5f3' : '#fff', color: today ? '#fff' : isPast ? '#b0bab0' : '#1f2937', border: today ? 'none' : `1px solid ${isPast ? '#ebebea' : '#eaede9'}` }}>
              {pd && (
                <p style={{ fontSize: '9px', color: today ? 'rgba(255,255,255,0.65)' : '#b0bab0', margin: '0 0 2px', fontFamily: "'Inter',sans-serif" }}>
                  {MONTH_ABBR[pd.month-1]} {String(pd.day).padStart(2,'0')}
                </p>
              )}
              <p style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>
                {today ? '오늘' : `Day ${day.seqNumber}`}
              </p>
              {day.dayShort && (
                <p style={{ fontSize: '9px', color: today ? 'rgba(255,255,255,0.65)' : '#b0bab0', margin: '2px 0 0' }}>{day.dayShort}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 전체 일정 요약 (불렛 포인트) ────────────────────────────────────────────
function ItinerarySummary({ days }) {
  const [expanded, setExpanded] = useState(false);
  const displayDays = expanded ? days : days.slice(0, 4);

  return (
    <div style={{ backgroundColor: '#fff', padding: '16px 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', margin: 0 }}>전체 일정 요약</p>
        {days.length > 4 && (
          <button onClick={() => setExpanded(e => !e)} style={{ fontSize: '11px', color: '#436440', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            {expanded ? '접기' : `전체 보기 (${days.length}일)`}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {displayDays.map((day, idx) => {
          const pd      = day.parsedDate;
          const spots   = day.items.filter(i => isTouristSpot(i.schedule));
          const route   = extractRoute(day.items);
          const today   = isActualToday(pd);

          if (!pd && spots.length === 0) return null;

          return (
            <div key={day.key} style={{ paddingBottom: idx < displayDays.length-1 ? '14px' : 0, marginBottom: idx < displayDays.length-1 ? '14px' : 0, borderBottom: idx < displayDays.length-1 ? '1px solid #f3f4f6' : 'none' }}>
              {/* 날짜 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: today ? '#436440' : '#374151', fontFamily: "'Inter',sans-serif" }}>
                  {pd ? `${pd.month}/${String(pd.day).padStart(2,'0')} (${day.dayShort || ''})` : `Day ${day.seqNumber}`}
                </span>
                {route && (
                  <>
                    <span style={{ color: '#d1d5db', fontSize: '10px' }}>|</span>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>{route}</span>
                  </>
                )}
                {today && <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', backgroundColor: '#436440', padding: '1px 6px', borderRadius: '999px' }}>오늘</span>}
              </div>

              {/* 관광 스팟 불렛 */}
              {spots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {spots.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <span style={{ color: '#c5d6c4', fontSize: '13px', lineHeight: '1.4', flexShrink: 0, marginTop: '1px' }}>•</span>
                      <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.45', wordBreak: 'keep-all' }}>
                        {item.schedule}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#c5d6c4', margin: 0 }}>이동일</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 로딩 ─────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-spin" style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid #f0f0ee', borderTopColor: '#436440' }} />
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
export default function HomeTab({ trip, scheduleSheetId, scheduleGid, expenseSheetId, expenseGid }) {
  const { days,     loading: dLoad } = useGoogleSheets(scheduleSheetId, scheduleGid);
  const { expenses, loading: eLoad } = useExpenseSheet(expenseSheetId,  expenseGid);

  if (dLoad || eLoad) return <Spinner />;

  const tripId   = trip?.id || 'default';
  const todayIdx = days.length > 0 ? findTodayIndex(days) : 0;

  return (
    <div className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f0f2ee' }}>
      <HeroSection trip={trip} days={days} tripId={tripId} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '80px' }}>
        {(days.length > 0 || expenses.length > 0) && (
          <CompactSummary days={days} expenses={expenses} />
        )}
        {days.length > 0 && <DayTimeline days={days} todayIdx={todayIdx} />}
        {days.length > 0 && <ItinerarySummary days={days} />}
      </div>
    </div>
  );
}
