import { useState } from 'react';

// ─── localStorage ─────────────────────────────────────────────────────────────
const TRIPS_KEY       = 'journey-trips';
const ACTIVE_TRIP_KEY = 'journey-active-trip';

export const DEFAULT_TRIPS = [
  {
    id: 'default',
    level1: '2026',
    level2: '이탈리아·스위스',
    scheduleSheetId: '1H9zxfIaLDS6wekwsBKgrgK2uKKSdDC1X9bgug85g7oI',
    scheduleGid:     '622483222',
    expenseSheetId:  '1H9zxfIaLDS6wekwsBKgrgK2uKKSdDC1X9bgug85g7oI',
    expenseGid:      '1256137167',
  },
];

export function loadTrips() {
  try {
    const s = JSON.parse(localStorage.getItem(TRIPS_KEY));
    return s?.length ? s : DEFAULT_TRIPS;
  } catch { return DEFAULT_TRIPS; }
}
export function saveTrips(trips) {
  try { localStorage.setItem(TRIPS_KEY, JSON.stringify(trips)); } catch {}
}
export function loadActiveId(trips) {
  try {
    const id = localStorage.getItem(ACTIVE_TRIP_KEY);
    return trips.find(t => t.id === id) ? id : trips[0]?.id;
  } catch { return trips[0]?.id; }
}
export function saveActiveId(id) {
  try { localStorage.setItem(ACTIVE_TRIP_KEY, id); } catch {}
}

// ─── URL 파서 (Google Sheets URL → sheetId + gid) ────────────────────────────
function parseSheetUrl(url = '') {
  const idM  = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidM = url.match(/[?&#]gid=(\d+)/);
  return { sheetId: idM?.[1] || '', gid: gidM?.[1] || '' };
}

// ─── 여행 추가/수정 폼 ────────────────────────────────────────────────────────
function TripForm({ initial, onSave, onCancel, onDelete }) {
  const [level1,    setLevel1]    = useState(initial?.level1 || '');
  const [level2,    setLevel2]    = useState(initial?.level2 || '');
  const [schedUrl,  setSchedUrl]  = useState('');
  const [expUrl,    setExpUrl]    = useState('');

  const schedHint = initial?.scheduleSheetId
    ? `현재 GID: ${initial.scheduleGid || '(기본값)'}`
    : '';
  const expHint = initial?.expenseSheetId
    ? `현재 GID: ${initial.expenseGid || '(기본값)'}`
    : '';

  const handleSave = () => {
    const s = schedUrl ? parseSheetUrl(schedUrl) : { sheetId: initial?.scheduleSheetId || '', gid: initial?.scheduleGid || '' };
    const x = expUrl   ? parseSheetUrl(expUrl)   : { sheetId: initial?.expenseSheetId  || '', gid: initial?.expenseGid  || '' };
    onSave({
      id:              initial?.id || `trip-${Date.now()}`,
      level1:          level1.trim(),
      level2:          level2.trim(),
      scheduleSheetId: s.sheetId,
      scheduleGid:     s.gid,
      expenseSheetId:  x.sheetId,
      expenseGid:      x.gid,
    });
  };

  const inp = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: '10px',
    border: '1.5px solid #e5e7eb', fontSize: '14px',
    outline: 'none', fontFamily: 'inherit', backgroundColor: '#fff',
  };
  const lbl = {
    fontSize: '11px', fontWeight: 700, color: '#8faa8d',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'block', marginBottom: '5px',
  };

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', backgroundColor: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '85%', overflowY: 'auto' }}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937', margin: 0, textAlign: 'center' }}>
          {initial ? '여행 수정' : '여행 추가'}
        </p>
        <div>
          <label style={lbl}>그룹 이름 (레벨 1)</label>
          <input style={inp} value={level1} onChange={e => setLevel1(e.target.value)} placeholder="예: 2026" />
        </div>
        <div>
          <label style={lbl}>여행 이름 (레벨 2)</label>
          <input style={inp} value={level2} onChange={e => setLevel2(e.target.value)} placeholder="예: 이탈리아·스위스" />
        </div>
        <div>
          <label style={lbl}>일정 시트 URL</label>
          {schedHint && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 5px' }}>{schedHint}</p>}
          <input style={inp} value={schedUrl} onChange={e => setSchedUrl(e.target.value)} placeholder="일정 탭 URL을 주소창에서 복사" />
        </div>
        <div>
          <label style={lbl}>경비 시트 URL</label>
          {expHint && <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 5px' }}>{expHint}</p>}
          <input style={inp} value={expUrl} onChange={e => setExpUrl(e.target.value)} placeholder="경비 탭 URL을 주소창에서 복사" />
        </div>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '-6px 0 0', lineHeight: 1.5 }}>
          구글 시트에서 해당 탭 선택 후 주소창 URL 전체를 붙여넣으면 자동으로 연결돼요.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {onDelete && (
            <button onClick={onDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #fee2e2', backgroundColor: '#fff', color: '#ef4444', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              삭제
            </button>
          )}
          <button onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb', backgroundColor: '#fff', color: '#6b7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            취소
          </button>
          <button onClick={handleSave} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#436440', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 드로어 본체 ──────────────────────────────────────────────────────────────
export default function Drawer({ open, onClose, trips, activeId, onSelect, onTripsChange }) {
  const [editing, setEditing] = useState(null); // null | 'new' | trip

  // Level 1 그룹핑
  const groups = {};
  trips.forEach(t => {
    const k = t.level1 || '기타';
    if (!groups[k]) groups[k] = [];
    groups[k].push(t);
  });

  const handleSave = (data) => {
    const updated = editing === 'new'
      ? [...trips, data]
      : trips.map(t => t.id === data.id ? data : t);
    saveTrips(updated);
    onTripsChange(updated);
    setEditing(null);
  };

  const handleDelete = (id) => {
    const updated = trips.filter(t => t.id !== id);
    saveTrips(updated);
    onTripsChange(updated);
    setEditing(null);
    if (activeId === id && updated.length > 0) onSelect(updated[0].id);
  };

  return (
    <>
      {/* 백드롭 */}
      {open && (
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 200 }} />
      )}

      {/* 패널 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '72%', maxWidth: 270,
        backgroundColor: '#fff', zIndex: 201,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
      }}>
        {/* 헤더 */}
        <div style={{ padding: '52px 20px 14px', borderBottom: '1px solid #f0f0ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'Noto Serif KR',serif", fontSize: '15px', fontWeight: 700, color: '#1a2e1a' }}>내 여행</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', backgroundColor: '#f2f6f2', color: '#436440', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {Object.entries(groups).map(([g, gTrips]) => (
            <div key={g}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '10px 20px 4px', margin: 0 }}>
                {g}
              </p>
              {gTrips.map(trip => {
                const active = trip.id === activeId;
                return (
                  <div key={trip.id} style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                    <button
                      onClick={() => { onSelect(trip.id); onClose(); }}
                      style={{
                        flex: 1, textAlign: 'left', padding: '9px 8px', border: 'none',
                        backgroundColor: active ? '#f0f7f0' : 'transparent',
                        borderRadius: '10px', cursor: 'pointer',
                        color: active ? '#436440' : '#374151',
                        fontSize: '14px', fontWeight: active ? 700 : 400,
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                    >
                      {active && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#436440', flexShrink: 0 }} />}
                      {trip.level2 || trip.level1 || '이름 없는 여행'}
                    </button>
                    <button
                      onClick={() => setEditing(trip)}
                      style={{ width: 26, height: 26, borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#c5d6c4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 여행 추가 */}
        <div style={{ padding: '10px 14px 24px', borderTop: '1px solid #f0f0ee' }}>
          <button
            onClick={() => setEditing('new')}
            style={{ width: '100%', padding: '11px', borderRadius: '12px', border: '1.5px dashed #c5d6c4', backgroundColor: 'transparent', color: '#436440', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            여행 추가
          </button>
        </div>
      </div>

      {/* 폼 */}
      {editing && (
        <TripForm
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onDelete={editing !== 'new' ? () => handleDelete(editing.id) : undefined}
        />
      )}
    </>
  );
}
