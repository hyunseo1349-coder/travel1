import { useState, useEffect } from 'react';
import { getActivityIcon, getIconByName } from './ActivityIcon.jsx';
import IconPicker from './IconPicker.jsx';

// ─── 아이콘 오버라이드 (localStorage) ───────────────────────────────────────
const STORAGE_KEY = 'journey-icon-overrides';
function loadOverride(id) {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[id] || null; } catch { return null; }
}
function saveOverride(id, iconName) {
  try {
    const map = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    map[id] = iconName;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

// ─── 시간 표시 (범위이면 2줄) ────────────────────────────────────────────────
function TimeCell({ time }) {
  if (!time) return <div style={{ width: 48, flexShrink: 0 }} />;

  // "09:00-10:00" / "09:00~10:30" / "09:00 10:00" 등 범위 분리
  const parts = time.split(/[-~]/).map(t => t.trim()).filter(Boolean);

  return (
    <div style={{ width: 48, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '16px' }}>
      {parts.length >= 2 ? (
        <>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#436440', lineHeight: 1.3, textAlign: 'right' }}>{parts[0]}</span>
          <span style={{ fontSize: '9px',  color: '#8faa8d',  lineHeight: 1   }}>↓</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#436440', lineHeight: 1.3, textAlign: 'right' }}>{parts[parts.length - 1]}</span>
        </>
      ) : (
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#436440', lineHeight: 1.3, textAlign: 'right' }}>{parts[0]}</span>
      )}
    </div>
  );
}

// ─── 상세 정보 행 ────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, isLink }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ color: '#8faa8d', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#8faa8d', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '2px' }}>
          {label}
        </span>
        {isLink ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#436440', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {value}
          </a>
        ) : (
          <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.55', wordBreak: 'keep-all', margin: 0 }}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// 아이콘 SVG 모음
const IcoDoc  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoTip  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcoAlt  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcoWon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoNote = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

// ─── 상세 패널 ───────────────────────────────────────────────────────────────
function DetailPanel({ item }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '2px' }}>
      <DetailRow icon={<IcoDoc  />} label="상세 내용" value={item.detail} />
      <DetailRow icon={<IcoTip  />} label="팁"        value={item.tip}    />
      <DetailRow icon={<IcoWon  />} label="금액"      value={item.amount} />
      <DetailRow icon={<IcoNote />} label="기록"      value={item.note}   />
      <DetailRow icon={<IcoLink />} label="참고 링크" value={item.link}   isLink />
      <DetailRow icon={<IcoAlt  />} label="대체 일정" value={item.alt}    />
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────────────────────
export default function ScheduleItem({ item, index, isLast }) {
  const [expanded,    setExpanded]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  const [iconOverride, setIconOverride] = useState(() => loadOverride(item.id));

  const hasContent = item.content && item.content.trim();
  const hasExtra   = item.detail || item.tip || item.link || item.alt || item.amount || item.note;

  // 아이콘 결정: 사용자 선택 > 자동 감지
  const IconComponent = iconOverride
    ? getIconByName(iconOverride)
    : getActivityIcon(item.schedule, item.content);

  const handleSelectIcon = (name) => {
    saveOverride(item.id, name);
    setIconOverride(name);
  };

  return (
    <>
      <div
        className="flex gap-3 animate-slide-up"
        style={{ animationDelay: `${index * 55}ms` }}
      >
        {/* 왼쪽: 시간 + 타임라인 선 — 고정 너비 */}
        <div style={{ width: 48, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <TimeCell time={item.time} />
          {!isLast && (
            <div style={{ flex: 1, width: 1, backgroundColor: '#c2d5c1', marginTop: '6px', minHeight: '16px' }} />
          )}
        </div>

        {/* 오른쪽: 카드 — flex-1로 나머지 너비 채움 */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: '12px' }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '18px',
            boxShadow: expanded ? '0 4px 24px rgba(67,100,64,0.13)' : '0 2px 12px rgba(67,100,64,0.07)',
            transition: 'box-shadow 0.2s',
            overflow: 'hidden',
          }}>
            {/* 카드 헤더 */}
            <button
              onClick={() => hasExtra && setExpanded(e => !e)}
              style={{
                width: '100%', padding: '12px', display: 'flex', alignItems: 'center',
                gap: '10px', background: 'none', border: 'none',
                cursor: hasExtra ? 'pointer' : 'default', textAlign: 'left',
              }}
            >
              {/* 아이콘 원 — 탭하면 피커 열림 */}
              <div
                onClick={e => { e.stopPropagation(); setShowPicker(true); }}
                style={{
                  flexShrink: 0, width: 42, height: 42, borderRadius: '13px',
                  backgroundColor: expanded ? '#436440' : '#f2f6f2',
                  color: expanded ? '#fff' : '#436440',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s, color 0.2s',
                  cursor: 'pointer', position: 'relative',
                }}
              >
                <IconComponent />
                {/* 편집 뱃지 */}
                <span style={{
                  position: 'absolute', bottom: -3, right: -3,
                  width: 14, height: 14, borderRadius: '50%',
                  backgroundColor: '#436440', border: '1.5px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="white" stroke="none">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </span>
              </div>

              {/* 텍스트 — 고정 너비 내에서 줄바꿈 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '13px', fontWeight: 600, color: '#111827',
                  lineHeight: '1.4', wordBreak: 'keep-all', whiteSpace: 'normal',
                  margin: 0,
                }}>
                  {item.schedule || '일정'}
                </p>
                {hasContent && (
                  <p style={{
                    fontSize: '11px', marginTop: '2px', color: '#94a3a4',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    margin: '2px 0 0',
                  }}>
                    {item.content}
                  </p>
                )}
              </div>

              {/* 화살표: 추가 정보 있을 때만 */}
              {hasExtra && (
                <div style={{
                  flexShrink: 0, color: '#436440',
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              )}
            </button>

            {/* 펼쳐지는 상세 패널 — 카드 좌측 가장자리에 맞춤 */}
            {expanded && (
              <div style={{ borderTop: '1px solid #f0f4f0', padding: '12px 14px 14px 14px' }}>
                <DetailPanel item={item} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 아이콘 피커 모달 */}
      {showPicker && (
        <IconPicker
          currentName={iconOverride || null}
          onSelect={handleSelectIcon}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
