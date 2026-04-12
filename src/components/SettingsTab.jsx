import { useState } from 'react';
import { THEMES, THEME_ORDER } from '../theme.js';
import { tripToShareUrl } from '../tripShare.js';

function ShareButton({ activeTrip, activeThemeId }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!activeTrip?.scheduleSheetId) return;
    const trip = { ...activeTrip, themeId: activeThemeId };
    const url = tripToShareUrl(trip);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        width: '100%', padding: '12px 16px',
        borderRadius: 12, border: 'none', cursor: 'pointer',
        backgroundColor: copied ? 'var(--cl, #dff0db)' : 'var(--cp, #436440)',
        color: copied ? 'var(--cp, #436440)' : '#fff',
        fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.2s',
      }}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          링크 복사됨!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          이 여행 링크 복사
        </>
      )}
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: '#f0f0ee', margin: '0 0 0' }} />;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ padding: '20px 20px 12px' }}>
      <p style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{children}</p>
      {sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{sub}</p>}
    </div>
  );
}

function SheetRow({ label, value, sheetId, gid }) {
  const [copied, setCopied] = useState(false);
  const url = sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit` + (gid ? `#gid=${gid}` : '') : null;

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>{label}</p>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sheetId ? `ID: ...${sheetId.slice(-8)}` + (gid ? ` · GID: ${gid}` : '') : '—'}
        </p>
      </div>
      {url && (
        <button
          onClick={copy}
          style={{ flexShrink: 0, padding: '5px 10px', borderRadius: 8, border: '1px solid #e5e7eb', backgroundColor: copied ? 'var(--cl, #dff0db)' : '#fff', color: copied ? 'var(--cp, #436440)' : '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
        >
          {copied ? '복사됨 ✓' : 'URL 복사'}
        </button>
      )}
    </div>
  );
}

export default function SettingsTab({ activeThemeId, onThemeChange, activeTrip }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8faf8', paddingBottom: 80 }}>

      {/* ── 테마 ── */}
      <div style={{ backgroundColor: '#fff', marginBottom: 8 }}>
        <SectionTitle sub="현재 여행에만 적용돼요">Color Theme</SectionTitle>
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {THEME_ORDER.map(id => {
              const t = THEMES[id];
              const active = activeThemeId === id;
              return (
                <button
                  key={id}
                  onClick={() => onThemeChange(id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    backgroundColor: t.primary,
                    outline: active ? `2px solid ${t.primary}` : '2px solid transparent',
                    outlineOffset: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: active ? `0 3px 10px rgba(${t.primaryRgb},0.45)` : '0 1px 4px rgba(0,0,0,0.12)',
                    transition: 'all 0.15s',
                  }}>
                    {active && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? t.primary : '#9ca3af' }}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 여행 공유 ── */}
      <div style={{ backgroundColor: '#fff', marginBottom: 8 }}>
        <SectionTitle sub="링크를 공유하면 상대방 앱에 이 여행이 자동으로 추가돼요">여행 공유</SectionTitle>
        <div style={{ padding: '0 20px 20px' }}>
          <ShareButton activeTrip={activeTrip} activeThemeId={activeThemeId} />
        </div>
      </div>

      {/* ── 시트 연결 정보 ── */}
      <div style={{ backgroundColor: '#fff', marginBottom: 8 }}>
        <SectionTitle sub="연결된 Google Sheets 정보">시트 연결</SectionTitle>
        <Divider />
        <SheetRow
          label="일정 시트"
          sheetId={activeTrip?.scheduleSheetId}
          gid={activeTrip?.scheduleGid}
        />
        <Divider />
        <SheetRow
          label="경비 시트"
          sheetId={activeTrip?.expenseSheetId}
          gid={activeTrip?.expenseGid}
        />
        <div style={{ padding: '8px 20px 16px' }}>
          <p style={{ fontSize: 11, color: '#c0c8c0', margin: 0, lineHeight: 1.5 }}>
            시트는 공개 설정이어야 앱에서 읽을 수 있어요.<br/>
            변경이 필요하면 드로어(☰)에서 여행 설정을 수정해주세요.
          </p>
        </div>
      </div>

    </div>
  );
}
