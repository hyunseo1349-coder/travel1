// 하단 네비게이션 바

function IconSchedule() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" />
      <line x1="12" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" />
      <line x1="12" y1="18" x2="16" y2="18" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function IconBudget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
      <path d="M12 14h.01" strokeWidth="3" />
    </svg>
  );
}

const TABS = [
  { id: 'schedule', label: '일정', Icon: IconSchedule },
  { id: 'map',      label: '지도', Icon: IconMap },
  { id: 'budget',   label: '예산', Icon: IconBudget },
];

export default function BottomNav({ activeTab = 'schedule', onChange }) {
  return (
    <div
      className="safe-bottom"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0ee',
        boxShadow: '0 -4px 20px rgba(67,100,64,0.06)',
        zIndex: 50,
      }}
    >
      <div className="flex items-center justify-around px-4 py-2">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onChange?.(id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              aria-label={label}
            >
              {active ? (
                /* 활성 탭: 그린 필 배경 */
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: '#436440',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <Icon />
                  {label}
                </span>
              ) : (
                <>
                  <span style={{ color: '#b0bab0' }}>
                    <Icon />
                  </span>
                  <span style={{ fontSize: '10px', color: '#b0bab0', fontWeight: 500 }}>
                    {label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
