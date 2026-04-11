import ActivityIcon from './ActivityIcon.jsx';

export default function ScheduleItem({ item, index, isLast }) {
  const hasContent = item.content && item.content.trim();

  return (
    <div
      className="flex gap-4 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* 왼쪽: 시간 + 타임라인 선 */}
      <div className="flex flex-col items-center" style={{ minWidth: '52px' }}>
        <span
          className="text-xs font-semibold tracking-wide tabular-nums leading-none pt-4"
          style={{ color: '#436440', fontVariantNumeric: 'tabular-nums' }}
        >
          {item.time || ''}
        </span>
        {/* 연결선 */}
        {!isLast && (
          <div
            className="flex-1 w-px mt-2"
            style={{ backgroundColor: '#c2d5c1', minHeight: '24px' }}
          />
        )}
      </div>

      {/* 오른쪽: 카드 */}
      <div className="flex-1 pb-4">
        <div
          className="bg-white rounded-3xl px-4 py-4 flex items-center gap-3 shadow-card transition-shadow duration-200 hover:shadow-card-hover cursor-pointer"
          style={{ borderRadius: '20px' }}
        >
          {/* 아이콘 원 */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-2xl"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#f2f6f2',
              color: '#436440',
            }}
          >
            <ActivityIcon scheduleName={item.schedule} content={item.content} />
          </div>

          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold leading-snug text-gray-900 line-clamp-2"
              style={{ fontFamily: "'Inter', 'Pretendard', sans-serif" }}
            >
              {item.schedule || '일정'}
            </p>
            {hasContent && (
              <p
                className="text-xs mt-0.5 uppercase tracking-widest truncate"
                style={{ color: '#94a3a4', letterSpacing: '0.06em' }}
              >
                {item.content}
              </p>
            )}
          </div>

          {/* 화살표 */}
          <div className="flex-shrink-0 ml-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c2d5c1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
