import { THEMES, THEME_ORDER } from '../theme.js';

// 테마별 미니 프리뷰 팔레트
function ThemeSwatch({ theme, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        border: active ? `2px solid ${theme.primary}` : '2px solid transparent',
        borderRadius: '18px',
        padding: '0',
        background: 'none',
        cursor: 'pointer',
        outline: 'none',
        transition: 'transform 0.15s',
        transform: active ? 'scale(1.02)' : 'scale(1)',
        boxShadow: active ? `0 4px 20px rgba(${theme.primaryRgb},0.35)` : '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {/* 미니 폰 프리뷰 */}
      <div style={{ borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff' }}>
        {/* 헤더 */}
        <div style={{
          height: 52,
          background: `linear-gradient(135deg, ${theme.primary}dd, ${theme.mid})`,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '8px 12px',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '8px', marginBottom: 2 }}>2026 · 09.26 — 10.06</div>
          <div style={{ color: '#fff', fontSize: '11px', fontWeight: 700, fontFamily: "'Noto Serif KR',serif" }}>이탈리아 · 스위스</div>
        </div>

        {/* Trip at a glance 미니 */}
        <div style={{ padding: '8px 10px', backgroundColor: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
            {[['📅','11일'],['🌐','2개국']].map(([icon, val]) => (
              <div key={val} style={{ backgroundColor: theme.cellBg, borderRadius: 8, padding: '5px 7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: theme.iconBg, color: theme.primary, fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#1f2937', fontFamily: "'Noto Serif KR',serif" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* 날씨 카드 미니 */}
          <div style={{ backgroundColor: theme.primary, borderRadius: 10, padding: '7px 10px', marginBottom: 6 }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '7px', marginBottom: 3 }}>Destination Weather</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>22°C</div>
              <div style={{ fontSize: 16 }}>⛅</div>
            </div>
          </div>

          {/* Itinerary 미니 */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 28, height: 30, borderRadius: 9, backgroundColor: theme.primary, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 5, fontWeight: 700 }}>SEP</div>
              <div style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>26</div>
            </div>
            <div style={{ paddingTop: 3 }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: theme.primary, marginBottom: 2 }}>인천 → 로마</div>
              <div style={{ fontSize: 7, color: '#9ca3af' }}>• 이동일</div>
            </div>
          </div>
        </div>
      </div>

      {/* 테마 이름 + 선택 표시 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 12px' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{theme.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: "'Noto Serif KR',serif" }}>{theme.name}</span>
          </div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{theme.desc}</div>
        </div>
        {active && (
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            backgroundColor: theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}

export default function SettingsTab({ activeThemeId, onThemeChange }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8faf8', paddingBottom: 80 }}>
      {/* 섹션 헤더 */}
      <div style={{ padding: '20px 20px 12px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0ee' }}>
        <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Color Theme</p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>선택한 테마가 앱 전체에 적용됩니다</p>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {THEME_ORDER.map(id => (
            <ThemeSwatch
              key={id}
              theme={THEMES[id]}
              active={activeThemeId === id}
              onClick={() => onThemeChange(id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
