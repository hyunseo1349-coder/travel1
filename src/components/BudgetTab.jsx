import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useExpenseSheet, normalizeCategory, localDateStr, countryTimezone } from '../hooks/useExpenseSheet.js';

// ─── 카테고리 메타 ────────────────────────────────────────────────────────────
const CAT = {
  '식비':  { color: '#e07560', bg: '#fdf2ef' },
  '숙박':  { color: '#436440', bg: '#f2f6f2' },
  '교통':  { color: '#5b7fa6', bg: '#eff4fa' },
  '쇼핑':  { color: '#c4963a', bg: '#fdf7ed' },
  '관광':  { color: '#8b5cf6', bg: '#f5f3ff' },
  '기타':  { color: '#9ca3af', bg: '#f3f4f6' },
};
const CAT_KEYS = Object.keys(CAT);

// ─── 아이콘 (SVG) ─────────────────────────────────────────────────────────────
const icons = {
  '식비':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  '숙박':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  '교통':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  '쇼핑':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  '관광':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  '기타':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// ─── 숫자 포맷 ────────────────────────────────────────────────────────────────
const fmtKRW   = n => '₩' + Math.round(n).toLocaleString('ko-KR');
const CUR_SYM  = { KRW:'₩', USD:'$', EUR:'€', CHF:'CHF ', JPY:'¥', GBP:'£' };
const fmtLocal = (amount, currency) =>
  (CUR_SYM[currency] || currency + ' ') + amount.toLocaleString('ko-KR', { maximumFractionDigits: 2 });

// ─── 날짜 헤더 포맷 ───────────────────────────────────────────────────────────
const KO_DOW = ['일','월','화','수','목','금','토'];
function fmtDateHeader(dateStr) {
  if (!dateStr) return '날짜 미정';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${KO_DOW[d.getDay()]})`;
}

// ─── 날짜별 그룹핑 ────────────────────────────────────────────────────────────
function groupByDate(expenses) {
  const map = {}, order = [];
  expenses.forEach(e => {
    const key = e.date || '미정';
    if (!map[key]) { map[key] = { date: key, country: e.country, items: [], total: 0 }; order.push(key); }
    map[key].items.push(e);
    map[key].total += e.amountKRW;
  });
  order.sort((a, b) => b.localeCompare(a)); // 최신순
  return order.map(k => map[k]);
}

// ─── 오늘 지출 계산 (국가별 현지 날짜 기준) ───────────────────────────────────
function todaySpend(expenses) {
  return expenses
    .filter(e => e.date === localDateStr(e.country))
    .reduce((s, e) => s + e.amountKRW, 0);
}

// ─── 로딩 스켈레톤 ────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[120, 80, 200, 140, 140].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: '16px', backgroundColor: '#f0f0ee', animation: 'shimmer 1.4s infinite' }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}

// ─── 에러 상태 ────────────────────────────────────────────────────────────────
function ErrorState({ message }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 32px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f2f6f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#436440' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p style={{ fontWeight: 700, color: '#111827', margin: 0 }}>데이터를 불러올 수 없어요</p>
      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{message}</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: '999px', backgroundColor: '#436440', color: '#fff', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
        다시 시도
      </button>
    </div>
  );
}

// ─── 카테고리 도넛 차트 ───────────────────────────────────────────────────────
function CategoryChart({ expenses }) {
  const data = useMemo(() => {
    const totals = {};
    expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amountKRW; });
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([cat, value]) => ({ name: cat, value, color: CAT[cat]?.color || '#9ca3af' }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '20px', margin: '0 16px', boxShadow: '0 2px 12px rgba(67,100,64,0.07)' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>카테고리별 지출</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ flex: '0 0 130px', height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={v => [fmtKRW(v), '']} separator="" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#374151' }}>{d.name}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>
                {Math.round(d.value / total * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 지출 항목 카드 ───────────────────────────────────────────────────────────
function ExpenseCard({ expense }) {
  const [open, setOpen] = useState(false);
  const meta = CAT[expense.category] || CAT['기타'];
  const isForeign = expense.currency !== 'KRW';

  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '14px 16px', boxShadow: '0 1px 6px rgba(67,100,64,0.06)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 카테고리 아이콘 */}
        <div style={{ width: 38, height: 38, borderRadius: '12px', backgroundColor: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icons[expense.category] || icons['기타']}
        </div>

        {/* 항목명 + 카테고리 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {expense.item || '—'}
          </p>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
            {expense.categoryRaw || expense.category}{expense.country ? ` · ${expense.country}` : ''}
          </p>
        </div>

        {/* 금액 */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {isForeign ? (
            <>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>
                {fmtLocal(expense.amount, expense.currency)}
              </p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
                {fmtKRW(expense.amountKRW)}
              </p>
            </>
          ) : (
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>
              {fmtKRW(expense.amountKRW)}
            </p>
          )}
        </div>
      </div>

      {/* 상세 정보 (확장) */}
      {open && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {expense.method && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#9ca3af' }}>결제 수단</span>
              <span style={{ color: '#374151', fontWeight: 500 }}>{expense.method}</span>
            </div>
          )}
          {isForeign && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#9ca3af' }}>적용 환율</span>
              <span style={{ color: '#374151', fontWeight: 500 }}>
                1{expense.currency} = {expense.rate.toLocaleString('ko-KR')}원
              </span>
            </div>
          )}
          {expense.note && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ color: '#9ca3af', flexShrink: 0 }}>메모</span>
              <span style={{ color: '#374151', textAlign: 'right' }}>{expense.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 날짜 그룹 ────────────────────────────────────────────────────────────────
function DateGroup({ group }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 2px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#436440', letterSpacing: '0.05em', margin: 0 }}>
          {fmtDateHeader(group.date)}{group.country ? ` · ${group.country}` : ''}
        </p>
        <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', margin: 0 }}>
          {fmtKRW(group.total)}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {group.items.map(e => <ExpenseCard key={e.id} expense={e} />)}
      </div>
    </div>
  );
}

// ─── 필터 칩 ─────────────────────────────────────────────────────────────────
function FilterChips({ selected, onChange, expenses }) {
  const counts = useMemo(() => {
    const c = { ALL: expenses.length };
    expenses.forEach(e => { c[e.category] = (c[e.category] || 0) + 1; });
    return c;
  }, [expenses]);

  const chips = [{ key: 'ALL', label: '전체' }, ...CAT_KEYS.map(k => ({ key: k, label: k }))];

  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
      {chips.filter(c => c.key === 'ALL' || counts[c.key]).map(c => {
        const active = selected === c.key;
        return (
          <button key={c.key} onClick={() => onChange(c.key)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: '999px', fontSize: '12px',
            fontWeight: active ? 600 : 400, border: 'none', cursor: 'pointer',
            backgroundColor: active ? (CAT[c.key]?.color || '#436440') : '#f2f6f2',
            color: active ? '#fff' : '#436440', transition: 'all 0.15s',
          }}>
            {c.label}{counts[c.key] ? ` ${counts[c.key]}` : ''}
          </button>
        );
      })}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function BudgetTab() {
  const { expenses, rates, loading, error } = useExpenseSheet();
  const [catFilter, setCatFilter] = useState('ALL');

  const filtered = useMemo(() =>
    catFilter === 'ALL' ? expenses : expenses.filter(e => e.category === catFilter),
    [expenses, catFilter]
  );

  const totalKRW  = useMemo(() => filtered.reduce((s, e) => s + e.amountKRW, 0), [filtered]);
  const todayKRW  = useMemo(() => todaySpend(expenses), [expenses]);
  const groups    = useMemo(() => groupByDate(filtered), [filtered]);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fafaf8' }} className="scrollbar-hide">

      {/* ── 총 지출 카드 ── */}
      <div style={{ margin: '16px 16px 12px', borderRadius: '24px', background: 'linear-gradient(135deg,#436440 0%,#2d4a2a 100%)', padding: '24px', color: '#fff' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', opacity: 0.75, margin: '0 0 6px', textTransform: 'uppercase' }}>총 지출</p>
        <p style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 20px', letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif" }}>
          {fmtKRW(totalKRW)}
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '12px' }}>
            <p style={{ fontSize: '10px', opacity: 0.7, margin: '0 0 4px', letterSpacing: '0.08em' }}>오늘 지출</p>
            <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{fmtKRW(todayKRW)}</p>
          </div>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '14px', padding: '12px' }}>
            <p style={{ fontSize: '10px', opacity: 0.7, margin: '0 0 4px', letterSpacing: '0.08em' }}>총 항목</p>
            <p style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{expenses.length}건</p>
          </div>
        </div>
      </div>

      {/* ── 카테고리 필터 ── */}
      <FilterChips selected={catFilter} onChange={setCatFilter} expenses={expenses} />

      {/* ── 도넛 차트 ── */}
      <div style={{ margin: '12px 0' }}>
        <CategoryChart expenses={filtered} />
      </div>

      {/* ── 지출 목록 ── */}
      <div style={{ padding: '4px 16px 100px' }}>
        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: '14px' }}>
            내역이 없어요
          </div>
        ) : (
          groups.map(g => <DateGroup key={g.date} group={g} />)
        )}
      </div>
    </div>
  );
}
