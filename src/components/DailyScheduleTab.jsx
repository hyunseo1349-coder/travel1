import { useState, useRef, useEffect } from 'react';
import { useGoogleSheets, findTodayIndex } from '../hooks/useGoogleSheets.js';
import ScheduleItem from './ScheduleItem.jsx';
import SkeletonLoader from './SkeletonLoader.jsx';
import DayMap from './DayMap.jsx';

// ─── 날짜 레이블 "SEP 27 - 토" ──────────────────────────────────────────────
const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function buildDayLabel(day) {
  const parts = [];
  if (day.parsedDate) {
    const mon = MONTH_ABBR[(day.parsedDate.month - 1)] || '';
    const d   = String(day.parsedDate.day).padStart(2, '0');
    parts.push(`${mon} ${d}`);
  } else {
    parts.push(`DAY ${String(day.seqNumber).padStart(2, '0')}`);
  }
  // dayShort: 요일 한 글자 (토, 일 등)
  const dow = day.parsedDate?.dayOfWeek || day.dayShort || '';
  if (dow) parts.push(dow);
  return parts.join(' - ');
}

// ─── 일차 탭 바 ─────────────────────────────────────────────────────────────
function DayTabBar({ days, currentIndex, onChange }) {
  const tabRef = useRef(null);

  useEffect(() => {
    if (tabRef.current) {
      const active = tabRef.current.querySelector('[data-active="true"]');
      if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentIndex]);

  if (!days.length) return null;

  return (
    <div ref={tabRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-3 pt-1" style={{ scrollSnapType: 'x mandatory' }}>
      {days.map((day, idx) => {
        const active = idx === currentIndex;
        return (
          <button key={day.key} data-active={active} onClick={() => onChange(idx)} style={{
            scrollSnapAlign: 'start', flexShrink: 0, borderRadius: '999px',
            padding: '6px 16px', fontSize: '12px', fontWeight: active ? 600 : 400,
            transition: 'all 0.2s',
            backgroundColor: active ? '#436440' : '#f2f6f2',
            color: active ? '#fff' : '#436440',
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {day.seqNumber}일차
          </button>
        );
      })}
    </div>
  );
}

// ─── 헤더 ────────────────────────────────────────────────────────────────────
function DayHeader({ day, onPrev, onNext, hasPrev, hasNext }) {
  return (
    <div className="px-5 pt-2 pb-3 flex items-start justify-between">
      <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.12em', color: '#436440', textTransform: 'uppercase', fontFamily: "'Inter',sans-serif", margin: 0 }}>
          {buildDayLabel(day) || '\u00a0'}
        </p>
        <h1 style={{
          fontFamily: "'Noto Serif KR','Noto Serif',Georgia,serif",
          fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em',
          color: '#111827', margin: '4px 0 0', wordBreak: 'keep-all', lineHeight: 1.3,
        }}>
          {day.theme || `${day.seqNumber}일차 일정`}
        </h1>
      </div>
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexShrink: 0 }}>
        {[
          { label: '이전', show: hasPrev, onClick: onPrev, path: 'M15 18l-6-6 6-6' },
          { label: '다음', show: hasNext, onClick: onNext, path: 'M9 18l6-6-6-6'  },
        ].map(({ label, show, onClick, path }) => (
          <button key={label} onClick={onClick} disabled={!show} aria-label={`${label} 날`} style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            backgroundColor: show ? '#f2f6f2' : 'transparent',
            color: show ? '#436440' : '#d1d5db',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: show ? 'pointer' : 'default', transition: 'background 0.15s',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d={path} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 에러 / 빈 상태 ──────────────────────────────────────────────────────────
function ErrorState({ message }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
      <div style={{ width: 60, height: 60, backgroundColor: '#f2f6f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#436440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-800 mb-1">데이터를 불러올 수 없어요</p>
        <p className="text-sm text-gray-500">{message}</p>
        <p className="text-xs text-gray-400 mt-1">시트가 '공개' 상태인지 확인해 주세요.</p>
      </div>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: '999px', backgroundColor: '#436440', color: '#fff', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
        다시 시도
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
      <div style={{ width: 60, height: 60, backgroundColor: '#f2f6f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#436440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-700 mb-1">이 날의 일정이 없어요</p>
        <p className="text-sm text-gray-400">시트에 일정을 추가해 보세요.</p>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function DailyScheduleTab({ sheetId, gid, onSelectItem }) {
  const { days, loading, error } = useGoogleSheets(sheetId, gid);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (days.length > 0) setCurrentIndex(findTodayIndex(days));
  }, [days]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  if (loading) return <SkeletonLoader />;
  if (error)   return <ErrorState message={error} />;
  if (!days.length) return <EmptyState />;

  const safeIndex = Math.min(currentIndex, days.length - 1);
  const day = days[safeIndex];

  return (
    <>
      <DayTabBar days={days} currentIndex={safeIndex} onChange={setCurrentIndex} />
      <DayHeader
        day={day}
        onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex(i => Math.min(days.length - 1, i + 1))}
        hasPrev={safeIndex > 0}
        hasNext={safeIndex < days.length - 1}
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-28" style={{ overscrollBehavior: 'contain' }}>
        {day.items.length === 0 ? <EmptyState /> : (
          day.items.map((item, idx) => (
            <ScheduleItem
              key={item.id}
              item={item}
              index={idx}
              isLast={idx === day.items.length - 1}
              onSelect={onSelectItem}
            />
          ))
        )}
        <div className="flex items-center gap-3 mt-2 px-1 opacity-40">
          <div className="flex-1 h-px bg-gray-200" />
          <p className="text-xs text-gray-400 whitespace-nowrap">총 {day.items.length}개 일정</p>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 오늘의 동선 지도 */}
        <DayMap items={day.items} />
      </div>
    </>
  );
}
