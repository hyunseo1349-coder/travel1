import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useExpenseSheet, localDateStr } from '../hooks/useExpenseSheet.js';

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

const icons = {
  '식비': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  '숙박': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  '교통': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  '쇼핑': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  '관광': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  '기타': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

// ─── 포맷 ─────────────────────────────────────────────────────────────────────
const fmtKRW   = n => '₩' + Math.round(n).toLocaleString('ko-KR');
const CUR_SYM  = { KRW:'₩', USD:'$', EUR:'€', CHF:'CHF ', JPY:'¥', GBP:'£' };
const fmtLocal = (amount, currency) =>
  (CUR_SYM[currency] || currency + ' ') + Number(amount).toLocaleString('ko-KR', { maximumFractionDigits: 2 });

const KO_DOW = ['일','월','화','수','목','금','토'];
function fmtDateHeader(dateStr) {
  if (!dateStr) return '날짜 미정';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${KO_DOW[d.getDay()]})`;
}

// ─── localStorage: 카테고리 오버라이드 ───────────────────────────────────────
const CAT_OVR_KEY = 'journey-cat-overrides';
function loadCatOverrides()       { try { return JSON.parse(localStorage.getItem(CAT_OVR_KEY) || '{}'); } catch { return {}; } }
function saveCatOverride(id, cat) { try { const m = loadCatOverrides(); m[id] = cat; localStorage.setItem(CAT_OVR_KEY, JSON.stringify(m)); } catch {} }

// ─── localStorage: 수동 입력 항목 ────────────────────────────────────────────
const MANUAL_KEY = 'journey-manual-expenses';
function loadManual()      { try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '[]'); } catch { return []; } }
function saveManual(arr)   { try { localStorage.setItem(MANUAL_KEY, JSON.stringify(arr)); } catch {} }

// ─── 날짜 그룹핑 ─────────────────────────────────────────────────────────────
function groupByDate(expenses) {
  const map = {}, order = [];
  expenses.forEach(e => {
    const key = e.date || '미정';
    if (!map[key]) { map[key] = { date: key, country: e.country, items: [], total: 0 }; order.push(key); }
    map[key].items.push(e);
    map[key].total += e.amountKRW;
  });
  order.sort((a, b) => b.localeCompare(a));
  return order.map(k => map[k]);
}

function todaySpend(expenses) {
  return expenses.filter(e => e.date === localDateStr(e.country)).reduce((s, e) => s + e.amountKRW, 0);
}

// ─── 카테고리 피커 모달 ───────────────────────────────────────────────────────
function CategoryPicker({ current, onSelect, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ backgroundColor:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 20px 36px', boxShadow:'0 -8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ width:36, height:4, borderRadius:2, backgroundColor:'#e5e7eb', margin:'0 auto 20px' }} />
        <p style={{ fontSize:'13px', fontWeight:700, color:'#111827', margin:'0 0 16px' }}>카테고리 선택</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
          {CAT_KEYS.map(cat => {
            const meta = CAT[cat];
            const active = cat === current;
            return (
              <button key={cat} onClick={() => { onSelect(cat); onClose(); }} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
                padding:'14px 8px', borderRadius:'16px', border:'none', cursor:'pointer',
                backgroundColor: active ? meta.color : meta.bg,
                color: active ? '#fff' : meta.color, transition:'all 0.15s',
              }}>
                {icons[cat]}
                <span style={{ fontSize:'12px', fontWeight:600 }}>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 수동 추가 모달 ───────────────────────────────────────────────────────────
const CURRENCIES = ['KRW','EUR','USD','CHF','JPY'];
const DEFAULT_RATES = { KRW:1, EUR:1500, USD:1380, CHF:1550, JPY:9.5 };

function AddExpenseModal({ rates, onAdd, onClose }) {
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({
    date: today, country:'', item:'', category:'기타',
    currency:'KRW', amount:'', krwOverride:'', note:'', method:'',
  });
  const [showCatPicker, setShowCatPicker] = useState(false);

  // 항목명 입력 시 카테고리 자동 감지
  const handleItem = (val) => {
    const autoCat = (() => {
      const t = val.toLowerCase();
      if (['식비','음식','식사','카페','커피','레스토랑','lunch','dinner','breakfast','food','dining','cafe'].some(k=>t.includes(k))) return '식비';
      if (['숙박','호텔','숙소','hotel','accommodation','stay'].some(k=>t.includes(k))) return '숙박';
      if (['교통','기차','버스','택시','지하철','비행','항공','transport','train','bus','taxi','flight'].some(k=>t.includes(k))) return '교통';
      if (['쇼핑','구매','shopping','market'].some(k=>t.includes(k))) return '쇼핑';
      if (['관광','입장','투어','박물관','museum','tour'].some(k=>t.includes(k))) return '관광';
      return form.category;
    })();
    setForm(f => ({ ...f, item: val, category: autoCat }));
  };

  // 통화 변경 시 원화 오버라이드 초기화
  const handleCurrency = (cur) => setForm(f => ({ ...f, currency: cur, krwOverride: '' }));

  const autoKRW = form.currency === 'KRW'
    ? Number(form.amount) || 0
    : Math.round((Number(form.amount) || 0) * (rates[form.currency] || DEFAULT_RATES[form.currency] || 1));

  const amountKRW = form.krwOverride !== '' ? Number(form.krwOverride) : autoKRW;

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJnBj1Yj1hD-fMGmjQF-RpBLygL9RczdMMS4olLP97yYyQrfY6PObiwtgr-8bTyv25pQ/exec';

  const handleSubmit = async () => {
    if (!form.item || !form.amount) return;
    const rate = rates[form.currency] || DEFAULT_RATES[form.currency] || 1;
    const entry = {
      id: `manual-${Date.now()}`,
      date: form.date, country: form.country,
      item: form.item, category: form.category, categoryRaw: '',
      currency: form.currency, amount: Number(form.amount),
      rate, amountKRW, method: form.method, note: form.note,
      isManual: true,
    };
    const updated = [entry, ...loadManual()];
    saveManual(updated);
    onAdd(entry);
    onClose();
    // 구글 시트 자동 반영 (백그라운드)
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date, country: form.country, item: form.item,
          category: form.category, currency: form.currency,
          amount: Number(form.amount), rate, amountKRW,
          method: form.method, note: form.note,
        }),
      });
    } catch { /* 시트 전송 실패해도 앱은 정상 동작 */ }
  };

  const inp = (label, key, type='text', placeholder='') => (
    <div style={{ marginBottom:'12px' }}>
      <p style={{ fontSize:'11px', fontWeight:600, color:'#8faa8d', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
      <input type={type} value={form[key]} placeholder={placeholder}
        onChange={e => key==='item' ? handleItem(e.target.value) : setForm(f=>({...f,[key]:e.target.value}))}
        style={{ width:'100%', padding:'10px 12px', borderRadius:'12px', border:'1.5px solid #e5e7eb', fontSize:'14px', color:'#111827', outline:'none', boxSizing:'border-box', backgroundColor:'#fafaf8' }}
      />
    </div>
  );

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, backgroundColor:'rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{ backgroundColor:'#fff', borderRadius:'24px 24px 0 0', padding:'20px 20px 40px', maxHeight:'90dvh', overflowY:'auto' }}>
        <div style={{ width:36, height:4, borderRadius:2, backgroundColor:'#e5e7eb', margin:'0 auto 16px' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <p style={{ fontSize:'16px', fontWeight:700, color:'#111827', margin:0 }}>지출 추가</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:'20px', lineHeight:1 }}>✕</button>
        </div>

        {inp('날짜','date','date')}
        {inp('국가','country','text','예: 이탈리아')}
        {inp('항목명','item','text','예: 레스토랑 점심')}

        {/* 카테고리 */}
        <div style={{ marginBottom:'12px' }}>
          <p style={{ fontSize:'11px', fontWeight:600, color:'#8faa8d', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.08em' }}>카테고리</p>
          <button onClick={()=>setShowCatPicker(true)} style={{
            display:'flex', alignItems:'center', gap:'8px', width:'100%',
            padding:'10px 12px', borderRadius:'12px', border:'1.5px solid #e5e7eb',
            fontSize:'14px', color:'#111827', background:'#fafaf8', cursor:'pointer', textAlign:'left',
          }}>
            <span style={{ color: CAT[form.category]?.color }}>{icons[form.category]}</span>
            {form.category}
          </button>
        </div>

        {/* 통화 + 금액 */}
        <div style={{ marginBottom:'12px' }}>
          <p style={{ fontSize:'11px', fontWeight:600, color:'#8faa8d', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.08em' }}>통화 · 현지 금액</p>
          <div style={{ display:'flex', gap:'8px' }}>
            <select value={form.currency} onChange={e=>handleCurrency(e.target.value)}
              style={{ padding:'10px 8px', borderRadius:'12px', border:'1.5px solid #e5e7eb', fontSize:'14px', color:'#111827', background:'#fafaf8', cursor:'pointer' }}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" value={form.amount} placeholder="0"
              onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
              style={{ flex:1, padding:'10px 12px', borderRadius:'12px', border:'1.5px solid #e5e7eb', fontSize:'14px', color:'#111827', outline:'none', background:'#fafaf8' }}
            />
          </div>
        </div>

        {/* 원화 환산 금액 (외화일 때만) */}
        {form.currency !== 'KRW' && (
          <div style={{ marginBottom:'12px' }}>
            <p style={{ fontSize:'11px', fontWeight:600, color:'#8faa8d', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.08em' }}>원화 환산 금액</p>
            <input type="number" value={form.krwOverride !== '' ? form.krwOverride : (autoKRW || '')}
              placeholder={autoKRW ? String(autoKRW) : '자동 계산'}
              onChange={e => setForm(f=>({...f, krwOverride: e.target.value}))}
              style={{ width:'100%', padding:'10px 12px', borderRadius:'12px', border:'1.5px solid #e5e7eb', fontSize:'14px', color:'#111827', outline:'none', boxSizing:'border-box', background:'#fafaf8' }}
            />
            {form.krwOverride === '' && autoKRW > 0 && (
              <p style={{ fontSize:'11px', color:'#9ca3af', margin:'4px 0 0' }}>환율 자동 적용: {fmtKRW(autoKRW)}</p>
            )}
          </div>
        )}

        {inp('결제 수단','method','text','예: 신한카드')}
        {inp('메모','note','text','')}

        <button onClick={handleSubmit} disabled={!form.item || !form.amount} style={{
          width:'100%', padding:'14px', borderRadius:'16px', border:'none',
          backgroundColor: form.item && form.amount ? '#436440' : '#d1d5db',
          color:'#fff', fontSize:'15px', fontWeight:700, cursor: form.item && form.amount ? 'pointer' : 'default',
          marginTop:'4px',
        }}>
          추가하기
        </button>
      </div>

      {showCatPicker && (
        <CategoryPicker current={form.category}
          onSelect={cat => setForm(f=>({...f,category:cat}))}
          onClose={() => setShowCatPicker(false)} />
      )}
    </div>
  );
}

// ─── 지출 카드 ────────────────────────────────────────────────────────────────
function ExpenseCard({ expense, catOverrides, onCatChange }) {
  const [open, setOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const cat  = catOverrides[expense.id] || expense.category;
  const meta = CAT[cat] || CAT['기타'];
  const isForeign = expense.currency !== 'KRW';

  const handleCatSelect = (newCat) => {
    saveCatOverride(expense.id, newCat);
    onCatChange(expense.id, newCat);
  };

  return (
    <>
      <div onClick={() => setOpen(o => !o)}
        style={{ backgroundColor:'#fff', borderRadius:'16px', padding:'12px 14px', boxShadow:'0 1px 6px rgba(67,100,64,0.06)', cursor:'pointer' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {/* 아이콘 — 탭하면 카테고리 피커 */}
          <div onClick={e => { e.stopPropagation(); setShowPicker(true); }}
            style={{ width:38, height:38, borderRadius:'12px', backgroundColor:meta.bg, color:meta.color,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
            {icons[cat] || icons['기타']}
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'14px', fontWeight:600, color:'#111827', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {expense.item || '—'}
            </p>
            <p style={{ fontSize:'11px', color:'#9ca3af', margin:'2px 0 0' }}>
              {cat}{expense.country ? ` · ${expense.country}` : ''}
              {expense.isManual ? ' · 직접 입력' : ''}
            </p>
          </div>

          <div style={{ textAlign:'right', flexShrink:0 }}>
            {isForeign ? (
              <>
                <p style={{ fontSize:'14px', fontWeight:700, color:'#111827', margin:0 }}>{fmtLocal(expense.amount, expense.currency)}</p>
                <p style={{ fontSize:'11px', color:'#9ca3af', margin:'2px 0 0' }}>{fmtKRW(expense.amountKRW)}</p>
              </>
            ) : (
              <p style={{ fontSize:'14px', fontWeight:700, color:'#111827', margin:0 }}>{fmtKRW(expense.amountKRW)}</p>
            )}
          </div>
        </div>

        {open && (
          <div style={{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:'5px' }}>
            {expense.method && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                <span style={{ color:'#9ca3af' }}>결제 수단</span>
                <span style={{ color:'#374151', fontWeight:500 }}>{expense.method}</span>
              </div>
            )}
            {isForeign && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                <span style={{ color:'#9ca3af' }}>적용 환율</span>
                <span style={{ color:'#374151', fontWeight:500 }}>1{expense.currency} = {Number(expense.rate).toLocaleString('ko-KR')}원</span>
              </div>
            )}
            {expense.note && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', gap:'16px' }}>
                <span style={{ color:'#9ca3af', flexShrink:0 }}>메모</span>
                <span style={{ color:'#374151', textAlign:'right' }}>{expense.note}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {showPicker && (
        <CategoryPicker current={cat} onSelect={handleCatSelect} onClose={() => setShowPicker(false)} />
      )}
    </>
  );
}

// ─── 날짜 그룹 ────────────────────────────────────────────────────────────────
function DateGroup({ group, catOverrides, onCatChange }) {
  return (
    <div style={{ marginBottom:'20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', padding:'0 2px' }}>
        <p style={{ fontSize:'11px', fontWeight:700, color:'#436440', margin:0 }}>
          {fmtDateHeader(group.date)}{group.country ? ` · ${group.country}` : ''}
        </p>
        <p style={{ fontSize:'11px', fontWeight:600, color:'#6b7280', margin:0 }}>{fmtKRW(group.total)}</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        {group.items.map(e => (
          <ExpenseCard key={e.id} expense={e} catOverrides={catOverrides} onCatChange={onCatChange} />
        ))}
      </div>
    </div>
  );
}

// ─── 필터 칩 ─────────────────────────────────────────────────────────────────
function FilterChips({ selected, onChange, expenses, catOverrides }) {
  const counts = useMemo(() => {
    const c = { ALL: expenses.length };
    expenses.forEach(e => {
      const cat = catOverrides[e.id] || e.category;
      c[cat] = (c[cat] || 0) + 1;
    });
    return c;
  }, [expenses, catOverrides]);

  return (
    <div style={{ display:'flex', gap:'6px', overflowX:'auto', padding:'0 16px 4px', scrollbarWidth:'none' }}>
      {[{ key:'ALL', label:'전체' }, ...CAT_KEYS.map(k=>({ key:k, label:k }))]
        .filter(c => c.key==='ALL' || counts[c.key])
        .map(c => {
          const active = selected === c.key;
          return (
            <button key={c.key} onClick={() => onChange(c.key)} style={{
              flexShrink:0, padding:'6px 14px', borderRadius:'999px', fontSize:'12px',
              fontWeight: active ? 600 : 400, border:'none', cursor:'pointer',
              backgroundColor: active ? (CAT[c.key]?.color || '#436440') : '#f2f6f2',
              color: active ? '#fff' : '#436440', transition:'all 0.15s',
            }}>
              {c.label}{counts[c.key] ? ` ${counts[c.key]}` : ''}
            </button>
          );
        })}
    </div>
  );
}

// ─── 도넛 차트 ────────────────────────────────────────────────────────────────
function CategoryChart({ expenses, catOverrides }) {
  const data = useMemo(() => {
    const totals = {};
    expenses.forEach(e => {
      const cat = catOverrides[e.id] || e.category;
      totals[cat] = (totals[cat] || 0) + e.amountKRW;
    });
    return Object.entries(totals).filter(([,v])=>v>0)
      .map(([cat,value]) => ({ name:cat, value, color: CAT[cat]?.color||'#9ca3af' }))
      .sort((a,b) => b.value - a.value);
  }, [expenses, catOverrides]);

  const total = data.reduce((s,d) => s+d.value, 0);
  if (!total) return null;

  return (
    <div style={{ backgroundColor:'#fff', borderRadius:'20px', padding:'14px 16px', margin:'0 16px', boxShadow:'0 2px 12px rgba(67,100,64,0.07)' }}>
      <p style={{ fontSize:'12px', fontWeight:700, color:'#111827', margin:'0 0 10px' }}>카테고리별 지출</p>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ flex:'0 0 100px', height:100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={46}
                dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {data.map((d,i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={v=>[fmtKRW(v),'']} separator="" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
          {data.map(d => (
            <div key={d.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <span style={{ width:7, height:7, borderRadius:'50%', backgroundColor:d.color, flexShrink:0 }} />
                <span style={{ fontSize:'11px', color:'#374151' }}>{d.name}</span>
              </div>
              <span style={{ fontSize:'11px', fontWeight:600, color:'#111827' }}>
                {Math.round(d.value/total*100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 스켈레톤 / 에러 ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
      {[80,160,60,140,120].map((h,i) => (
        <div key={i} style={{ height:h, borderRadius:'16px', backgroundColor:'#f0f0ee', animation:'shimmer 1.4s infinite' }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
function ErrorState({ message }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:'0 32px', textAlign:'center' }}>
      <p style={{ fontWeight:700, color:'#111827', margin:0 }}>데이터를 불러올 수 없어요</p>
      <p style={{ fontSize:'13px', color:'#6b7280', margin:0 }}>{message}</p>
      <button onClick={() => window.location.reload()} style={{ padding:'10px 24px', borderRadius:'999px', backgroundColor:'#436440', color:'#fff', fontSize:'14px', fontWeight:600, border:'none', cursor:'pointer' }}>다시 시도</button>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function BudgetTab() {
  const { expenses, rates, loading, error } = useExpenseSheet();
  const [manualList,   setManualList]   = useState(loadManual);
  const [catOverrides, setCatOverrides] = useState(loadCatOverrides);
  const [catFilter,    setCatFilter]    = useState('ALL');
  const [showAdd,      setShowAdd]      = useState(false);

  // 시트 + 수동 합산 (금액 있는 것만)
  const allExpenses = useMemo(() =>
    [...expenses, ...manualList].filter(e => e.amountKRW > 0 || e.amount > 0),
    [expenses, manualList]
  );

  const filtered = useMemo(() => {
    if (catFilter === 'ALL') return allExpenses;
    return allExpenses.filter(e => (catOverrides[e.id] || e.category) === catFilter);
  }, [allExpenses, catFilter, catOverrides]);

  const totalKRW = useMemo(() => allExpenses.reduce((s,e) => s+e.amountKRW, 0), [allExpenses]);
  const todayKRW = useMemo(() => todaySpend(allExpenses), [allExpenses]);
  const groups   = useMemo(() => groupByDate(filtered), [filtered]);

  const handleCatChange = (id, cat) => setCatOverrides(prev => ({ ...prev, [id]: cat }));
  const handleAdd = (entry) => setManualList(prev => [entry, ...prev]);

  if (loading) return <Skeleton />;
  if (error)   return <ErrorState message={error} />;

  return (
    <div style={{ flex:1, overflowY:'auto', backgroundColor:'#fafaf8' }} className="scrollbar-hide">

      {/* ── 상단 요약 카드 ── */}
      <div style={{ margin:'14px 16px 10px', display:'flex', gap:'10px' }}>
        <div style={{ flex:1, borderRadius:'18px', backgroundColor:'#436440', padding:'14px 16px' }}>
          <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', color:'rgba(255,255,255,0.7)', margin:'0 0 4px', textTransform:'uppercase' }}>총 지출</p>
          <p style={{ fontSize:'20px', fontWeight:800, margin:0, color:'#fff', letterSpacing:'-0.02em', lineHeight:1.2 }}>
            {fmtKRW(totalKRW)}
          </p>
          <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.55)', margin:'4px 0 0' }}>{allExpenses.length}건</p>
        </div>
        <div style={{ flex:1, borderRadius:'18px', backgroundColor:'#fff', padding:'14px 16px', boxShadow:'0 2px 10px rgba(67,100,64,0.07)' }}>
          <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', color:'#8faa8d', margin:'0 0 4px', textTransform:'uppercase' }}>오늘 지출</p>
          <p style={{ fontSize:'20px', fontWeight:800, margin:0, color:'#111827', letterSpacing:'-0.02em', lineHeight:1.2 }}>
            {fmtKRW(todayKRW)}
          </p>
          <p style={{ fontSize:'10px', color:'#9ca3af', margin:'4px 0 0' }}>현지 시간 기준</p>
        </div>
      </div>

      {/* ── 도넛 차트 ── */}
      <div style={{ margin:'0 0 10px' }}>
        <CategoryChart expenses={allExpenses} catOverrides={catOverrides} />
      </div>

      {/* ── 카테고리 필터 ── */}
      <FilterChips selected={catFilter} onChange={setCatFilter} expenses={allExpenses} catOverrides={catOverrides} />

      {/* ── 목록 헤더 ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 4px' }}>
        <p style={{ fontSize:'13px', fontWeight:700, color:'#111827', margin:0 }}>내역</p>
        <button onClick={() => setShowAdd(true)} style={{
          display:'flex', alignItems:'center', gap:'4px', padding:'6px 12px',
          borderRadius:'999px', backgroundColor:'#436440', color:'#fff',
          border:'none', cursor:'pointer', fontSize:'12px', fontWeight:600,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          추가
        </button>
      </div>

      {/* ── 지출 목록 ── */}
      <div style={{ padding:'4px 16px 100px' }}>
        {groups.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#9ca3af', fontSize:'14px' }}>내역이 없어요</div>
        ) : (
          groups.map(g => <DateGroup key={g.date} group={g} catOverrides={catOverrides} onCatChange={handleCatChange} />)
        )}
      </div>

      {/* ── 수동 추가 모달 ── */}
      {showAdd && <AddExpenseModal rates={rates} onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
