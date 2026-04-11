import { useState, useRef, useEffect } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets.js';
import ScheduleItem from './ScheduleItem.jsx';
import SkeletonLoader from './SkeletonLoader.jsx';

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
    <div
      ref={tabRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-3 pt-1"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {days.map((day, idx) => {
        const active = idx === currentIndex;
        return (
          <button
            key={day.key}
            data-active={active}
            onClick={() => onChange(idx)}
            style={{
              scrollSnapAlign: 'start',
              flexShrink: 0,
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: active ? 600 : 400,
              transition: 'all 0.2s',
              backgroundColor: active ? '#436440' : '#f2f6f2',
              color: active ? '#fff' : '#436440',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {day.dayNumber}일차
          </button>
        );
      })}
    </div>
  );
}

// ─── 헤더 (날짜 + 목적지 이름) ──────────────────────────────────────────────
function DayHeader({ day, onPrev, onNext, hasPrev, hasNext }) {
  const labelStyle = {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.12em',
    color: '#436440',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  };

  const dayLabel = [
    day.dayNumber ? `DAY ${String(day.dayNumber).padStart(2, '0')}` : '',
    day.dayName || '',
  ]
    .filter(Boolean)
    .join('  —  ');

  return (
    <div className="px-5 pt-2 pb-3 flex items-start justify-between">
      <div className="flex-1">
        <p style={labelStyle}>{dayLabel || '\u00a0'}</p>
        <h1
          className="mt-1 leading-tight text-gray-900"
          style={{
            fontFamily: "'Noto Serif KR', 'Noto Serif', Georgia, serif",
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          {day.theme || `${day.dayNumber || ''}일차 일정`}
        </h1>
      </div>

      {/* 이전/다음 버튼 */}
      <div className="flex gap-1 mt-2 ml-3">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: hasPrev ? '#f2f6f2' : 'transparent',
            color: hasPrev ? '#436440' : '#d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasPrev ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
          aria-label="이전 날"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: hasNext ? '#f2f6f2' : 'transparent',
            color: hasNext ? '#436440' : '#d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: hasNext ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
          aria-label="다음 날"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── 에러 상태 ───────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, backgroundColor: '#f2f6f2' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#436440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-800 mb-1">데이터를 불러올 수 없어요</p>
        <p className="text-sm text-gray-500">{message}</p>
        <p className="text-xs text-gray-400 mt-1">시트가 '공개' 상태인지 확인해 주세요.</p>
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: '10px 24px',
          borderRadius: '999px',
          backgroundColor: '#436440',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        다시 시도
      </button>
    </div>
  );
}

// ─── 빈 일정 상태 ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, backgroundColor: '#f2f6f2' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#436440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-700 mb-1">이 날의 일정이 없어요</p>
        <p className="text-sm text-gray-400">시트에 일정을 추가해 보세요.</p>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function DailyScheduleTab({ sheetId, gid }) {
  const { days, loading, error } = useGoogleSheets(sheetId, gid);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const scrollRef = useRef(null);

  // 날짜 변경 시 스크롤 리셋
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentIndex]);

  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex(i => Math.min(days.length - 1, i + 1));

  // 로딩 중
  if (loading) return <SkeletonLoader />;

  // 에러
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => { setRetryKey(k => k + 1); window.location.reload(); }}
      />
    );
  }

  // 데이터 없음
  if (!days.length) return <EmptyState />;

  const safeIndex = Math.min(currentIndex, days.length - 1);
  const day = days[safeIndex];

  return (
    <>
      {/* 일차 탭 바 */}
      <DayTabBar days={days} currentIndex={safeIndex} onChange={setCurrentIndex} />

      {/* 헤더 */}
      <DayHeader
        day={day}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={safeIndex > 0}
        hasNext={safeIndex < days.length - 1}
      />

      {/* 타임라인 스크롤 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-28"
        style={{ overscrollBehavior: 'contain' }}
      >
        {day.items.length === 0 ? (
          <EmptyState />
        ) : (
          day.items.map((item, idx) => (
            <ScheduleItem
              key={item.id}
              item={item}
              index={idx}
              isLast={idx === day.items.length - 1}
            />
          ))
        )}

        {/* 하단 여백 표시 */}
        <div className="flex items-center gap-3 mt-2 px-1 opacity-40">
          <div className="flex-1 h-px bg-gray-200" />
          <p className="text-xs text-gray-400 whitespace-nowrap">총 {day.items.length}개 일정</p>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      </div>
    </>
  );
}
