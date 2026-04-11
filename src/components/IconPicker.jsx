import { useEffect } from 'react';
import { ICON_CATALOG } from './ActivityIcon.jsx';

export default function IconPicker({ currentName, onSelect, onClose }) {
  // 바깥 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    /* 딤 오버레이 */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      {/* 바텀 시트 */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: '24px 24px 0 0',
          padding: '20px 20px 36px',
          maxHeight: '72vh',
          overflowY: 'auto',
        }}
      >
        {/* 핸들 바 */}
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db', margin: '0 auto 16px' }} />

        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '16px', textAlign: 'center' }}>
          아이콘 선택
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {ICON_CATALOG.map(({ name, label, Component }) => {
            const selected = name === currentName;
            return (
              <button
                key={name}
                onClick={() => { onSelect(name); onClose(); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '6px', padding: '12px 8px', borderRadius: '16px', border: 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  backgroundColor: selected ? '#436440' : '#f2f6f2',
                  color: selected ? '#fff' : '#436440',
                  outline: selected ? '2px solid #436440' : 'none',
                  outlineOffset: '2px',
                }}
              >
                <Component />
                <span style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.2, textAlign: 'center', color: selected ? '#fff' : '#4b5563' }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
