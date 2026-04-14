import { useState, useEffect } from 'react';
import HomeTab from './components/HomeTab.jsx';
import DailyScheduleTab from './components/DailyScheduleTab.jsx';
import DetailPage from './components/DetailPage.jsx';
import BottomNav from './components/BottomNav.jsx';
import BudgetTab from './components/BudgetTab.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import Drawer, { loadTrips, loadActiveId, saveActiveId, saveTrips } from './components/Drawer.jsx';
import { applyTheme } from './theme.js';
import { parseShareUrl } from './tripShare.js';

// ─── 탭별 헤더 타이틀 ────────────────────────────────────────────────────────
const TAB_TITLES = {
  home:     'Summary',
  schedule: 'Daily Schedule',
  budget:   'Expense',
  settings: 'Settings',
};

// ─── 앱 상단 바 ──────────────────────────────────────────────────────────────
function AppBar({ onMenuClick, activeTab }) {
  const title = TAB_TITLES[activeTab] || 'Daily Schedule';
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '48px 20px 12px', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* 햄버거 */}
        <button
          onClick={onMenuClick}
          style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: 'var(--ci, #edf4ec)', border: 'none', color: 'var(--cp, #436440)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          aria-label="메뉴"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <span style={{ fontFamily: "'Noto Serif KR','Noto Serif',Georgia,serif", fontSize: '16px', fontWeight: 700, color: '#1a2e1a', letterSpacing: '-0.01em' }}>
          {title}
        </span>
      </div>
      <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--cp, #436440)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M12 2C8 2 5 6 5 10c0 5.25 7 12 7 12s7-6.75 7-12c0-4-3-8-7-8zm0 10.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      </div>
    </div>
  );
}

// ─── 루트 앱 ─────────────────────────────────────────────────────────────────
export default function App() {
  const [trips,        setTrips]        = useState(loadTrips);
  const [activeId,     setActiveId]     = useState(() => loadActiveId(loadTrips()));
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [activeTab,    setActiveTab]    = useState('home');
  const [detailItem,   setDetailItem]   = useState(null);
  const [detailVisible,setDetailVisible]= useState(false);

  const activeTrip = trips.find(t => t.id === activeId) || trips[0] || {};
  const themeId = activeTrip.themeId || 'emerald';

  // 여행 전환 또는 테마 변경 시 CSS 변수 적용
  useEffect(() => { applyTheme(themeId); }, [themeId]);

  // URL 공유 링크로 열렸을 때 여행 자동 추가
  useEffect(() => {
    const imported = parseShareUrl();
    if (!imported) return;
    // URL 파라미터 제거 (뒤로가기 등에서 재실행 방지)
    window.history.replaceState({}, '', window.location.pathname);
    setTrips(prev => {
      // 동일 시트 조합이면 중복 추가 안 함
      const exists = prev.find(t =>
        t.scheduleSheetId === imported.scheduleSheetId &&
        t.scheduleGid     === imported.scheduleGid
      );
      if (exists) {
        // 이미 있으면 그 여행으로 전환만
        setActiveId(exists.id);
        saveActiveId(exists.id);
        applyTheme(exists.themeId || 'emerald');
        return prev;
      }
      const updated = [...prev, imported];
      saveTrips(updated);
      setActiveId(imported.id);
      saveActiveId(imported.id);
      applyTheme(imported.themeId);
      return updated;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleThemeChange = (id) => {
    if (!activeTrip.id) return;
    const updated = trips.map(t => t.id === activeTrip.id ? { ...t, themeId: id } : t);
    setTrips(updated);
    saveTrips(updated);
    applyTheme(id);
  };

  const handleSelectTrip = (id) => {
    setActiveId(id);
    saveActiveId(id);
    // 선택한 여행의 테마 적용
    const trip = trips.find(t => t.id === id);
    applyTheme(trip?.themeId || 'emerald');
  };

  const openDetail = (item) => {
    setDetailItem(item);
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailVisible(true)));
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setTimeout(() => setDetailItem(null), 280);
  };

  // 모바일 뒤로가기: 상세 페이지 열릴 때 history 스택 추가
  useEffect(() => {
    if (!detailItem) return;
    history.pushState(null, document.title);
    const handlePop = () => {
      setDetailVisible(false);
      setTimeout(() => setDetailItem(null), 280);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [detailItem]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <AppBar onMenuClick={() => setDrawerOpen(true)} activeTab={activeTab} />
        <div style={{ height: 1, backgroundColor: '#f0f0ee', flexShrink: 0 }} />

        {/* 탭 콘텐츠 — 항상 마운트, visibility로 전환 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#fafaf8', position: 'relative' }}>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', visibility: activeTab==='home' ? 'visible' : 'hidden', pointerEvents: activeTab==='home' ? 'auto' : 'none' }}>
            <HomeTab
              trip={activeTrip}
              scheduleSheetId={activeTrip.scheduleSheetId}
              scheduleGid={activeTrip.scheduleGid}
              expenseSheetId={activeTrip.expenseSheetId}
              expenseGid={activeTrip.expenseGid}
              active={activeTab === 'home'}
            />
          </div>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', visibility: activeTab==='schedule' ? 'visible' : 'hidden', pointerEvents: activeTab==='schedule' ? 'auto' : 'none' }}>
            <DailyScheduleTab
              sheetId={activeTrip.scheduleSheetId}
              gid={activeTrip.scheduleGid}
              onSelectItem={openDetail}
              active={activeTab === 'schedule'}
            />
          </div>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', visibility: activeTab==='budget' ? 'visible' : 'hidden', pointerEvents: activeTab==='budget' ? 'auto' : 'none' }}>
            <BudgetTab
              sheetId={activeTrip.expenseSheetId}
              expenseGid={activeTrip.expenseGid}
              active={activeTab === 'budget'}
            />
          </div>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', visibility: activeTab==='settings' ? 'visible' : 'hidden', pointerEvents: activeTab==='settings' ? 'auto' : 'none', overflowY:'auto' }}>
            <SettingsTab activeThemeId={themeId} onThemeChange={handleThemeChange} activeTrip={activeTrip} />
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />

        {/* ── 드로어 ── */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          trips={trips}
          activeId={activeId}
          onSelect={handleSelectTrip}
          onTripsChange={setTrips}
        />

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
            <DetailPage
              item={detailItem}
              onBack={closeDetail}
              scriptUrl={activeTrip.scriptUrl || ''}
              sheetId={activeTrip.scheduleSheetId || ''}
              gid={activeTrip.scheduleGid || ''}
            />
          </div>
        )}
      </div>
    </div>
  );
}
