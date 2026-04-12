import { useState } from 'react';
import { useGoogleSheets, findTodayIndex } from '../hooks/useGoogleSheets.js';
import { useExpenseSheet } from '../hooks/useExpenseSheet.js';

const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// ─── 관광지 필터 (숙박·식사·이동 제외) ──────────────────────────────────────
const SKIP_KW = [
  '호텔','숙소','체크인','체크아웃','조식','중식','석식','식사','레스토랑','카페',
  'breakfast','lunch','dinner','hotel','inn','cafe',
  '공항','이동','출발','도착','기차','버스','택시','탑승','비행','환승',
  'airport','flight','train','bus','transfer',
];
function isTouristSpot(name = '') {
  const t = name.toLowerCase();
  return !SKIP_KW.some(k => t.includes(k));
}

// ─── 날짜 범위 ────────────────────────────────────────────────────────────────
function formatDateRange(days) {
  const f = days[0]?.parsedDate;
  const l = days[days.length - 1]?.parsedDate;
  if (!f) return '';
  const fmt = p => `${String(p.month).padStart(2,'0')}.${String(p.day).padStart(2,'0')}`;
  return l ? `${f.year} · ${fmt(f)} — ${fmt(l)}` : fmt(f);
}

// ─── D-Day 계산 ───────────────────────────────────────────────────────────────
function calcDDay(days) {
  const f = days[0]?.parsedDate;
  if (!f) return null;
  const start = new Date(f.year, f.month - 1, f.day);
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((start - today) / 86400000);
}

// ─── 오늘 여부 ────────────────────────────────────────────────────────────────
function isActualToday(parsedDate) {
  if (!parsedDate) return false;
  const n = new Date();
  return parsedDate.year === n.getFullYear()
    && parsedDate.month === n.getMonth() + 1
    && parsedDate.day   === n.getDate();
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function HeroSection({ days }) {
  const [err, setErr] = useState(false);
  const dateRange = formatDateRange(days);
  const dDay      = calcDDay(days);

  return (
    <div style={{ position: 'relative', height: 210, overflow: 'hidden' }}>
      {!err ? (
        <img
          src="https://source.unsplash.com/featured/800x450?alps,mountains,europe,travel"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setErr(true)}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2d5a27,#436440,#6b9466)' }} />
      )}
      {/* 그라디언트 오버레이 */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)' }} />

      {/* D-Day 뱃지 */}
      {dDay !== null && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          backgroundColor: dDay <= 0 ? '#436440' : 'rgba(255,255,255,0.9)',
          color: dDay <= 0 ? '#fff' : '#436440',
          fontSize: '11px', fontWeight: 700, padding: '4px 11px', borderRadius: '999px',
        }}>
          {dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : `D+${Math.abs(dDay)}`}
        </div>
      )}

      {/* 텍스트 */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        {dateRange && (
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', margin: '0 0 6px', fontFamily: "'Inter',sans-serif" }}>
            {dateRange}
          </p>
        )}
        <h2 style={{
          fontFamily: "'Noto Serif KR','Noto Serif',Georgia,serif",
          fontSize: '24px', fontWeight: 700, color: '#fff',
          margin: 0, lineHeight: 1.25, wordBreak: 'keep-all',
          textShadow: '0 1px 8px rgba(0,0,0,0.3)',
        }}>
          여행 개요
        </h2>
      </div>
    </div>
  );
}

// ─── 여행 요약 ────────────────────────────────────────────────────────────────
function TripSummary({ days, expenses }) {
  const countries = [...new Set(expenses.map(e => e.country).filter(Boolean))];

  const stats = [
    { label: '총 일수', value: `${days.length}일` },
    ...(countries.length > 0 ? [{ label: '방문 국가', value: `${countries.length}개국` }] : []),
  ];

  return (
    <div style={{ backgroundColor: '#fff', padding: '18px 20px' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', margin: '0 0 14px' }}>여행 요약</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ flex: 1, backgroundColor: '#f8faf8', borderRadius: '14px', padding: '14px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#1f2937', margin: '0 0 3px', letterSpacing: '-0.02em' }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 예산 카드 ────────────────────────────────────────────────────────────────
function BudgetCard({ expenses }) {
  const totalSpent = expenses.reduce((s, e) => s + (e.amountKRW || 0), 0);
  const todayStr   = new Date().toLocaleDateString('en-CA');
  const todaySpent = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + (e.amountKRW || 0), 0);

  // 카테고리별 TOP 지출
  const catTotals = {};
  expenses.forEach(e => {
    if (!e.category) return;
    catTotals[e.category] = (catTotals[e.category] || 0) + (e.amountKRW || 0);
  });
  const topCats = Object.entries(catTotals)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 3);

  const CAT_ICON = { 식비:'🍽', 숙박:'🏨', 교통:'🚆', 쇼핑:'🛍', 관광:'🎡', 기타:'📌' };

  return (
    <div style={{ backgroundColor: '#fff', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', margin: 0 }}>예산 현황</p>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#436440" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      </div>

      {/* 메인 수치 */}
      <div style={{ backgroundColor: '#436440', borderRadius: '16px', padding: '18px' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', margin: '0 0 4px' }}>총 지출</p>
        <p style={{ color: '#fff', fontSize: '26px', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
          {totalSpent.toLocaleString()}원
        </p>
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 0 12px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', margin: 0 }}>오늘 지출</p>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
            {todaySpent > 0 ? `${todaySpent.toLocaleString()}원` : '—'}
          </p>
        </div>
      </div>

      {/* 카테고리 TOP */}
      {topCats.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {topCats.map(([cat, amt]) => (
            <div key={cat} style={{ flex: 1, backgroundColor: '#f8faf8', borderRadius: '12px', padding: '10px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', margin: '0 0 2px' }}>{CAT_ICON[cat] || '📌'}</p>
              <p style={{ fontSize: '10px', color: '#6b7280', margin: '0 0 2px' }}>{cat}</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                {amt >= 10000 ? `${(amt/10000).toFixed(0)}만` : `${amt.toLocaleString()}`}원
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 일정 타임라인 (가로 스크롤) ─────────────────────────────────────────────
function DayTimeline({ days, todayIdx }) {
  return (
    <div style={{ backgroundColor: '#fff', padding: '18px 0' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', margin: '0 0 12px', padding: '0 20px' }}>
        일정 타임라인
      </p>
      <div className="scrollbar-hide" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '2px 20px 4px', scrollSnapType: 'x mandatory' }}>
        {days.map((day, idx) => {
          const today  = isActualToday(day.parsedDate);
          const isPast = idx < todayIdx && !today;
          const pd     = day.parsedDate;
          return (
            <div
              key={day.key}
              style={{
                flexShrink: 0, scrollSnapAlign: 'start',
                borderRadius: '14px', padding: '10px 14px', textAlign: 'center',
                minWidth: 62,
                backgroundColor: today ? '#436440' : isPast ? '#f5f5f3' : '#fff',
                color: today ? '#fff' : isPast ? '#b0bab0' : '#1f2937',
                border: today ? 'none' : `1px solid ${isPast ? '#ebebea' : '#eaede9'}`,
              }}
            >
              {pd && (
                <p style={{ fontSize: '9px', color: today ? 'rgba(255,255,255,0.65)' : '#b0bab0', margin: '0 0 3px', fontFamily: "'Inter',sans-serif", letterSpacing: '0.03em' }}>
                  {MONTH_ABBR[pd.month - 1]} {String(pd.day).padStart(2,'0')}
                </p>
              )}
              <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>
                {today ? '오늘' : `Day ${day.seqNumber}`}
              </p>
              {day.dayShort && (
                <p style={{ fontSize: '9px', color: today ? 'rgba(255,255,255,0.65)' : '#b0bab0', margin: '3px 0 0' }}>
                  {day.dayShort}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 오늘의 추천 코스 ─────────────────────────────────────────────────────────
function UpcomingStops({ days, todayIdx }) {
  const spots = [];
  for (let i = todayIdx; i < days.length && spots.length < 5; i++) {
    days[i]?.items
      .filter(item => isTouristSpot(item.schedule))
      .slice(0, 4)
      .forEach(item => {
        if (spots.length < 5) spots.push({ ...item, daySeq: days[i].seqNumber, isToday: isActualToday(days[i].parsedDate) });
      });
  }

  if (spots.length === 0) return null;

  const sectionTitle = spots[0]?.isToday ? '오늘의 추천 코스' : '다가오는 일정';

  return (
    <div style={{ backgroundColor: '#fff', padding: '18px 20px 24px' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1f2937', margin: '0 0 12px' }}>{sectionTitle}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {spots.map((item, idx) => (
          <SpotCard key={`${item.id}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function SpotCard({ item }) {
  const [err, setErr] = useState(false);
  const query    = encodeURIComponent((item.schedule || 'travel landmark').slice(0, 50));
  const photoUrl = `https://source.unsplash.com/featured/120x120?${query}`;

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', backgroundColor: '#f8faf8', borderRadius: '14px' }}>
      {/* 썸네일 */}
      <div style={{ width: 58, height: 58, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#e5e7eb' }}>
        {!err ? (
          <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: '#dff0dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            📍
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
          <span style={{ fontSize: '10px', color: item.isToday ? '#fff' : '#436440', fontWeight: 700, backgroundColor: item.isToday ? '#436440' : '#edf4ec', padding: '2px 8px', borderRadius: '999px' }}>
            {item.isToday ? '오늘' : `${item.daySeq}일차`}
          </span>
        </div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.schedule}
        </p>
        {(item.content || item.location) && (
          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.location || item.content}
          </p>
        )}
      </div>

      {/* 시간 */}
      {item.time && (
        <p style={{ fontSize: '11px', color: '#436440', fontWeight: 600, flexShrink: 0, margin: 0 }}>
          {item.time.split(/[-~]/)[0].trim()}
        </p>
      )}
    </div>
  );
}

// ─── 로딩 스피너 ──────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-spin" style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #f0f0ee', borderTopColor: '#436440' }} />
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function HomeTab() {
  const { days,     loading: dLoading } = useGoogleSheets();
  const { expenses, loading: eLoading } = useExpenseSheet();

  if (dLoading || eLoading) return <Spinner />;

  const todayIdx = days.length > 0 ? findTodayIndex(days) : 0;

  return (
    <div className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f0f2ee' }}>
      <HeroSection days={days} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '80px' }}>
        {days.length > 0    && <TripSummary days={days} expenses={expenses} />}
        {expenses.length > 0 && <BudgetCard expenses={expenses} />}
        {days.length > 0    && <DayTimeline days={days} todayIdx={todayIdx} />}
        {days.length > 0    && <UpcomingStops days={days} todayIdx={todayIdx} />}
      </div>
    </div>
  );
}
