import { useState } from 'react';
import { getActivityIcon, getIconByName } from './ActivityIcon.jsx';
import IconPicker from './IconPicker.jsx';

// ─── localStorage 아이콘 오버라이드 ─────────────────────────────────────────
const STORAGE_KEY = 'journey-icon-overrides';
function loadOverride(id)           { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')[id] || null; } catch { return null; } }
function saveOverride(id, iconName) { try { const m = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); m[id] = iconName; localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch {} }

// ─── 시간 표시 (범위이면 2줄) ────────────────────────────────────────────────
function TimeCell({ time }) {
  if (!time) return <div style={{ width: 48, flexShrink: 0 }} />;
  const parts = time.split(/[-~]/).map(t => t.trim()).filter(Boolean);
  return (
    <div style={{ width: 48, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '16px' }}>
      {parts.length >= 2 ? (
        <>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#436440', lineHeight: 1.3, textAlign: 'right' }}>{parts[0]}</span>
          <span style={{ fontSize: '9px', color: '#8faa8d', lineHeight: 1 }}>↓</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#436440', lineHeight: 1.3, textAlign: 'right' }}>{parts[parts.length - 1]}</span>
        </>
      ) : (
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#436440', lineHeight: 1.3, textAlign: 'right' }}>{parts[0]}</span>
      )}
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────────────────────
export default function ScheduleItem({ item, index, isLast, onSelect }) {
  const [showPicker,   setShowPicker]   = useState(false);
  const [iconOverride, setIconOverride] = useState(() => loadOverride(item.id));

  const hasContent     = item.content && item.content.trim();
  const IconComponent  = iconOverride ? getIconByName(iconOverride) : getActivityIcon(item.schedule, item.content);

  const handleSelectIcon = (name) => { saveOverride(item.id, name); setIconOverride(name); };

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

        {/* 오른쪽: 카드 */}
        <div style={{ flex: 1, minWidth: 0, paddingBottom: '12px' }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '18px',
            boxShadow: '0 2px 12px rgba(67,100,64,0.07)', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>

              {/* 아이콘 원 — 탭하면 피커 (뱃지 없음) */}
              <div
                onClick={e => { e.stopPropagation(); setShowPicker(true); }}
                style={{
                  flexShrink: 0, width: 42, height: 42, borderRadius: '13px',
                  backgroundColor: '#f2f6f2', color: '#436440',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <IconComponent />
              </div>

              {/* 텍스트 — 클릭 시 상세 페이지 이동 */}
              <button
                onClick={() => onSelect(item)}
                style={{
                  flex: 1, minWidth: 0, textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <p style={{
                  fontSize: '13px', fontWeight: 600, color: '#111827',
                  lineHeight: '1.4', wordBreak: 'keep-all', whiteSpace: 'normal', margin: 0,
                }}>
                  {item.schedule || '일정'}
                </p>
                {hasContent && (
                  <p style={{
                    fontSize: '11px', marginTop: '2px', color: '#94a3a4',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0',
                  }}>
                    {item.content}
                  </p>
                )}
              </button>

              {/* 화살표 (상세 이동 힌트) */}
              <div style={{ flexShrink: 0, color: '#c2d5c1' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPicker && (
        <IconPicker currentName={iconOverride} onSelect={handleSelectIcon} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}
