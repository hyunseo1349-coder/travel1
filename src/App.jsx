import { useState } from 'react';
import DailyScheduleTab from './components/DailyScheduleTab.jsx';
import DetailPage from './components/DetailPage.jsx';
import BottomNav from './components/BottomNav.jsx';

// ─── 앱 상단 바 ──────────────────────────────────────────────────────────────
function AppBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 20px 12px', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: 28, height: 28, backgroundColor: '#436440', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2C8 2 5 6 5 10c0 5.25 7 12 7 12s7-6.75 7-12c0-4-3-8-7-8zm0 10.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
          </svg>
        </span>
        <span style={{ fontFamily: "'Noto Serif KR','Noto Serif',Georgia,serif", fontSize: '16px', fontWeight: 700, color: '#1a2e1a', letterSpacing: '-0.01em' }}>
          Daily Schedule
        </span>
      </div>
      <button style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#f2f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: '#436440' }} aria-label="설정">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  );
}

function PlaceholderTab({ label, icon }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
      <div style={{ width: 60, height: 60, backgroundColor: '#f2f6f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-700">{label} 탭</p>
        <p className="text-sm text-gray-400 mt-1">곧 출시 예정이에요</p>
      </div>
    </div>
  );
}

// ─── 루트 앱 ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab,   setActiveTab]   = useState('schedule');
  const [detailItem,  setDetailItem]  = useState(null);   // null = 목록, item = 상세 페이지
  const [detailVisible, setDetailVisible] = useState(false);

  // 상세 페이지 열기 (슬라이드 인)
  const openDetail = (item) => {
    setDetailItem(item);
    // 다음 프레임에 visible=true로 → CSS transition 트리거
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailVisible(true)));
  };

  // 상세 페이지 닫기 (슬라이드 아웃)
  const closeDetail = () => {
    setDetailVisible(false);
    setTimeout(() => setDetailItem(null), 280); // transition 완료 후 언마운트
  };

  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 480;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#f0f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: '390px',
        height: '100dvh', maxHeight: '844px',
        backgroundColor: '#fff', position: 'relative',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 0 60px rgba(67,100,64,0.15)',
        borderRadius: isDesktop ? '40px' : '0',
      }}>
        {/* 앱 바 */}
        <AppBar />
        <div style={{ height: 1, backgroundColor: '#f0f0ee', flexShrink: 0 }} />

        {/* 탭 콘텐츠 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#fafaf8' }}>
          {activeTab === 'schedule' && (
            <DailyScheduleTab onSelectItem={openDetail} />
          )}
          {activeTab === 'map' && (
            <PlaceholderTab label="지도" icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#436440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
            } />
          )}
          {activeTab === 'budget' && (
            <PlaceholderTab label="예산" icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#436440" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            } />
          )}
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />

        {/* ── 상세 페이지 (슬라이드 오버레이) ── */}
        {detailItem && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#fafaf8',
            display: 'flex', flexDirection: 'column',
            transform: detailVisible ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 100,
          }}>
            <DetailPage item={detailItem} onBack={closeDetail} />
          </div>
        )}
      </div>
    </div>
  );
}
