import { THEMES, THEME_ORDER } from '../theme.js';

export default function SettingsTab({ activeThemeId, onThemeChange }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fff', paddingBottom: 80 }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Color Theme</p>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 24px' }}>현재 여행에만 적용돼요</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {THEME_ORDER.map(id => {
            const t = THEMES[id];
            const active = activeThemeId === id;
            return (
              <button
                key={id}
                onClick={() => onThemeChange(id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
              >
                {/* 색상 원 */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  backgroundColor: t.primary,
                  border: active ? `3px solid ${t.primary}` : '3px solid transparent',
                  outline: active ? `2px solid ${t.primary}` : '2px solid transparent',
                  outlineOffset: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? `0 4px 16px rgba(${t.primaryRgb},0.45)` : '0 2px 8px rgba(0,0,0,0.12)',
                  transition: 'box-shadow 0.15s, outline 0.15s',
                }}>
                  {active && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                {/* 이름 */}
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? t.primary : '#6b7280' }}>
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
