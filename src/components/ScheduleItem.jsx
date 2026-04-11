import { useState } from 'react';
import ActivityIcon from './ActivityIcon.jsx';

// ─── 상세 정보 행 ────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, isLink }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 items-start">
      <span style={{ color: '#8faa8d', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <span
          style={{ fontSize: '10px', fontWeight: 600, color: '#8faa8d', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '2px' }}
        >
          {label}
        </span>
        {isLink ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#436440', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            {value}
          </a>
        ) : (
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.55', wordBreak: 'keep-all' }}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 아이콘 SVG (인라인) ─────────────────────────────────────────────────────
const IcoDoc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IcoTip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IcoLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IcoAlt = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

// ─── 상세 패널 ───────────────────────────────────────────────────────────────
function DetailPanel({ item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '4px' }}>
      <DetailRow icon={<IcoDoc />}  label="상세 내용"  value={item.detail} />
      <DetailRow icon={<IcoTip />}  label="팁"        value={item.tip} />
      <DetailRow icon={<IcoLink />} label="참고 링크"  value={item.link} isLink />
      <DetailRow icon={<IcoAlt />}  label="대체 일정"  value={item.alt} />
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────────────────────
export default function ScheduleItem({ item, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = item.content && item.content.trim();
  const hasExtra   = item.detail || item.tip || item.link || item.alt;

  return (
    <div
      className="flex gap-4 animate-slide-up"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* 왼쪽: 시간 + 타임라인 선 */}
      <div className="flex flex-col items-center" style={{ minWidth: '52px' }}>
        <span
          className="text-xs font-semibold tracking-wide tabular-nums leading-none pt-4"
          style={{ color: '#436440' }}
        >
          {item.time || ''}
        </span>
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
          style={{
            backgroundColor: '#fff',
            borderRadius: '20px',
            boxShadow: expanded
              ? '0 4px 24px rgba(67,100,64,0.13)'
              : '0 2px 16px rgba(67,100,64,0.08)',
            transition: 'box-shadow 0.2s',
            overflow: 'hidden',
          }}
        >
          {/* 카드 헤더 (추가 정보 있을 때만 탭 가능) */}
          <button
            onClick={() => hasExtra && setExpanded(e => !e)}
            style={{
              width: '100%',
              padding: '14px 14px 14px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'none',
              border: 'none',
              cursor: hasExtra ? 'pointer' : 'default',
              textAlign: 'left',
            }}
          >
            {/* 아이콘 원 */}
            <div
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: '14px',
                backgroundColor: expanded ? '#436440' : '#f2f6f2',
                color: expanded ? '#fff' : '#436440',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <ActivityIcon scheduleName={item.schedule} content={item.content} />
            </div>

            {/* 텍스트 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#111827',
                  lineHeight: '1.35',
                  wordBreak: 'keep-all',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {item.schedule || '일정'}
              </p>
              {hasContent && (
                <p
                  style={{
                    fontSize: '11px',
                    marginTop: '3px',
                    color: '#94a3a4',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.content}
                </p>
              )}
            </div>

            {/* 화살표: 추가 정보 있을 때만 표시 */}
            {hasExtra && (
              <div
                style={{
                  flexShrink: 0,
                  color: '#436440',
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            )}
          </button>

          {/* 펼쳐지는 상세 패널 */}
          {expanded && (
            <div
              style={{
                borderTop: '1px solid #f0f4f0',
                padding: '14px 14px 14px 70px',
              }}
            >
              <DetailPanel item={item} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
