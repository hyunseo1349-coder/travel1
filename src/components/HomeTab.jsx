import { useState, useRef, useEffect } from 'react';
import { useGoogleSheets, findTodayIndex } from '../hooks/useGoogleSheets.js';
import { useExpenseSheet } from '../hooks/useExpenseSheet.js';
import PhotoCropper from './PhotoCropper.jsx';

// ─── 관광지 필터 ──────────────────────────────────────────────────────────────
const SKIP_KW = [
  '호텔','숙소','체크인','체크아웃','조식','중식','석식','식사','레스토랑','카페',
  'breakfast','lunch','dinner','hotel','inn','cafe',
  '공항','이동','출발','도착','기차','버스','택시','탑승','비행','환승','기내',
  'airport','flight','train','bus','transfer','check-in','check-out',
];
function isTouristSpot(name = '') {
  const t = name.toLowerCase();
  return !SKIP_KW.some(k => t.includes(k));
}

// ─── 날짜 포맷 ────────────────────────────────────────────────────────────────
function fmtRange(days) {
  const f = days[0]?.parsedDate;
  const l = days[days.length - 1]?.parsedDate;
  if (!f) return '';
  const p = d => `${String(d.month).padStart(2,'0')}.${String(d.day).padStart(2,'0')}`;
  return l ? `${f.year} · ${p(f)} — ${p(l)}` : p(f);
}
function calcDDay(days) {
  const f = days[0]?.parsedDate;
  if (!f) return null;
  const s = new Date(f.year, f.month - 1, f.day);
  const t = new Date(); t.setHours(0,0,0,0);
  return Math.ceil((s - t) / 86400000);
}
function isActualToday(pd) {
  if (!pd) return false;
  const n = new Date();
  return pd.year === n.getFullYear() && pd.month === n.getMonth()+1 && pd.day === n.getDate();
}

// ─── 경로 추출 ────────────────────────────────────────────────────────────────
function extractRoute(items) {
  const ri = items.find(i => i.schedule.includes('→'));
  if (ri) return ri.schedule.replace(/\([A-Z]{2,3}\)/g,'').replace(/\s+/g,' ').trim().slice(0,35);
  const locs = [...new Set(items.map(i => i.location).filter(Boolean))];
  if (locs.length > 0) return locs[0].split(/[,·]/)[0].trim().slice(0,20);
  return '';
}

// ─── localStorage: 사진 / 날씨 도시 ─────────────────────────────────────────
const HERO_KEY    = 'journey-hero';
const WX_CITY_KEY = 'journey-wx-city';
const GEO_CACHE   = 'journey-geo-cache';
const WX_CACHE    = 'journey-wx-cache';

function loadHero(id)           { try { return JSON.parse(localStorage.getItem(HERO_KEY)||'{}')[id]||null; } catch { return null; } }
function saveHero(id, url)      { try { const m=JSON.parse(localStorage.getItem(HERO_KEY)||'{}'); m[id]=url; localStorage.setItem(HERO_KEY,JSON.stringify(m)); } catch {} }
function loadWxCity(id)         { try { return JSON.parse(localStorage.getItem(WX_CITY_KEY)||'{}')[id]||''; } catch { return ''; } }
function saveWxCity(id, city)   { try { const m=JSON.parse(localStorage.getItem(WX_CITY_KEY)||'{}'); m[id]=city; localStorage.setItem(WX_CITY_KEY,JSON.stringify(m)); } catch {} }
function getGeoCache(city)      { try { const c=JSON.parse(localStorage.getItem(GEO_CACHE)||'{}'); return c[city]||null; } catch { return null; } }
function setGeoCache(city, d)   { try { const c=JSON.parse(localStorage.getItem(GEO_CACHE)||'{}'); c[city]=d; localStorage.setItem(GEO_CACHE,JSON.stringify(c)); } catch {} }
function getWxCache(city)       { try { const c=JSON.parse(localStorage.getItem(WX_CACHE)||'{}'); const e=c[city]; if(e&&Date.now()-e.ts<30*60*1000) return e.data; } catch {} return null; }
function setWxCache(city, d)    { try { const c=JSON.parse(localStorage.getItem(WX_CACHE)||'{}'); c[city]={ts:Date.now(),data:d}; localStorage.setItem(WX_CACHE,JSON.stringify(c)); } catch {} }

// ─── 날씨 유틸 ────────────────────────────────────────────────────────────────
function wmoDesc(code) {
  if (code===0) return '맑음';
  if (code<=2)  return '대체로 맑음';
  if (code===3) return '흐림';
  if (code<=48) return '안개';
  if (code<=55) return '이슬비';
  if (code<=65) return '비';
  if (code<=75) return '눈';
  if (code<=82) return '소나기';
  return '뇌우';
}
function wmoIcon(code) {
  if (code===0) return '☀️';
  if (code<=2)  return '🌤';
  if (code===3) return '☁️';
  if (code<=48) return '🌫';
  if (code<=55) return '🌦';
  if (code<=65) return '🌧';
  if (code<=75) return '❄️';
  if (code<=82) return '🌦';
  return '⛈';
}

const KO_DAY = ['일','월','화','수','목','금','토'];

async function geocode(city) {
  const cached = getGeoCache(city);
  if (cached) return cached;
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  const data = await res.json();
  if (!data.results?.length) return null;
  const r = data.results[0];
  const result = { lat: r.latitude, lon: r.longitude, name: r.name };
  setGeoCache(city, result);
  return result;
}

function useWeather(city) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!city?.trim()) return;
    const cached = getWxCache(city);
    if (cached) { setData(cached); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const geo = await geocode(city);
        if (!geo) return;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=5`);
        const wx = await res.json();
        const result = {
          cityName: geo.name,
          temp: Math.round(wx.current.temperature_2m),
          code: wx.current.weather_code,
          daily: wx.daily.time.slice(0,4).map((t,i) => ({
            day: KO_DAY[new Date(t).getDay()],
            temp: Math.round(wx.daily.temperature_2m_max[i]),
            code: wx.daily.weather_code[i],
          })),
        };
        setWxCache(city, result);
        if (!cancelled) setData(result);
      } catch {} finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [city]);
  return { data, loading };
}

function detectWeatherCity(days, todayIdx) {
  for (let i = todayIdx; i >= Math.max(0, todayIdx-1); i--) {
    const day = days[i];
    if (!day) continue;
    const route = extractRoute(day.items);
    if (route.includes('→')) {
      const dest = route.split('→')[1].trim().replace(/\([A-Z]+\)/g,'').trim().split(/\s+/)[0];
      if (dest) return dest;
    }
    const loc = day.items.map(it => it.location).filter(Boolean)[0];
    if (loc) return loc.split(/[,·]/)[0].trim();
  }
  return '';
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
// 알프스 직접 Unsplash 사진 (fallback: picsum seed)
const ALPS_PHOTO = 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=450&fit=crop&q=80';

function HeroSection({ trip, days, tripId }) {
  const [cropFile,  setCropFile]  = useState(null);
  const [heroPhoto, setHeroPhoto] = useState(() => loadHero(tripId));
  const [imgErr,    setImgErr]    = useState(false);
  const [imgErr2,   setImgErr2]   = useState(false);
  const fileRef = useRef();

  const dDay      = calcDDay(days);
  const dateRange = fmtRange(days);
  const title     = trip?.level2 || trip?.level1 || '여행 개요';
  const seed      = encodeURIComponent(trip?.level2 || trip?.level1 || 'travel');

  const handleFile = e => { const f=e.target.files?.[0]; if(f) setCropFile(f); e.target.value=''; };
  const handleCrop = dataUrl => { saveHero(tripId,dataUrl); setHeroPhoto(dataUrl); setCropFile(null); setImgErr(false); setImgErr2(false); };

  const srcMain   = heroPhoto || (!imgErr ? ALPS_PHOTO : null);
  const srcFallbk = `https://picsum.photos/seed/${seed}/800/450`;

  return (
    <>
      <div style={{ position:'relative', height:220, overflow:'hidden', flexShrink:0 }}>
        {heroPhoto ? (
          <img src={heroPhoto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : !imgErr ? (
          <img src={ALPS_PHOTO} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setImgErr(true)} />
        ) : !imgErr2 ? (
          <img src={srcFallbk} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setImgErr2(true)} />
        ) : (
          <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#2d5a27,#436440,#6b9466)' }} />
        )}

        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }} />

        {dDay !== null && (
          <div style={{ position:'absolute', top:14, right:14, backgroundColor: dDay<=0?'#436440':'rgba(255,255,255,0.92)', color: dDay<=0?'#fff':'#436440', fontSize:'11px', fontWeight:800, padding:'4px 12px', borderRadius:'999px' }}>
            {dDay>0 ? `D-${dDay}` : dDay===0 ? 'D-Day' : `D+${Math.abs(dDay)}`}
          </div>
        )}

        <button onClick={() => fileRef.current?.click()} style={{ position:'absolute', bottom:60, right:14, display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'999px', backgroundColor:'rgba(0,0,0,0.38)', border:'none', color:'#fff', fontSize:'11px', cursor:'pointer', backdropFilter:'blur(4px)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          사진 변경
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />

        <div style={{ position:'absolute', bottom:20, left:20, right:20 }}>
          {dateRange && <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'11px', margin:'0 0 5px', fontFamily:"'Inter',sans-serif" }}>{dateRange}</p>}
          <h2 style={{ fontFamily:"'Noto Serif KR','Noto Serif',Georgia,serif", fontSize:'24px', fontWeight:700, color:'#fff', margin:0, lineHeight:1.25, wordBreak:'keep-all', textShadow:'0 1px 10px rgba(0,0,0,0.35)' }}>
            {title}
          </h2>
        </div>
      </div>
      {cropFile && <PhotoCropper imageFile={cropFile} onConfirm={handleCrop} onCancel={() => setCropFile(null)} />}
    </>
  );
}

// ─── Trip at a Glance (2×2 카드) ─────────────────────────────────────────────
const IcoCal     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoGlobe   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IcoWallet  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><path d="M12 14h.01" strokeWidth="3"/></svg>;
const IcoReceipt = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="11" y2="15"/></svg>;

// 한국 관련 국가/도시 제외 키워드
const KR_EXCLUDE = ['한국','korea','kr','대한민국','south korea','인천','서울','부산','대구','광주','대전','울산','수원','제주'];
function isKorea(str = '') {
  const s = str.trim().toLowerCase();
  return KR_EXCLUDE.some(k => s === k || s.includes(k));
}

function TripAtAGlance({ days, expenses }) {
  const totalSpent = expenses.reduce((s,e) => s+(e.amountKRW||0), 0);
  const todayStr   = new Date().toLocaleDateString('en-CA');
  const todaySpent = expenses.filter(e => e.date===todayStr).reduce((s,e) => s+(e.amountKRW||0), 0);

  // 한국 제외 국가·도시 카운트
  const foreignExp  = expenses.filter(e => !isKorea(e.country));
  const countries   = [...new Set(foreignExp.map(e => e.country).filter(Boolean))];
  const cities      = [...new Set(foreignExp.map(e => e.city).filter(Boolean))];

  const fmtM = n => n>=10000000 ? `₩${(n/10000000).toFixed(1)}천만` : n>=1000000 ? `₩${(n/1000000).toFixed(1)}M` : n>=10000 ? `₩${(n/10000).toFixed(0)}만` : `₩${n.toLocaleString()}`;

  // 국가 + 도시 합산 표시 문자열
  const countryLine = countries.length > 0 ? `${countries.length}개국` : '—';
  const cityLine    = cities.length > 0    ? `${cities.length}개 도시` : null;

  const cells = [
    { Icon: IcoCal,     label: 'DURATION',  value: `${days.length}일` },
    { Icon: IcoGlobe,   label: 'COUNTRIES', value: countryLine, sub: cityLine },
    { Icon: IcoWallet,  label: '총 지출',   value: totalSpent > 0 ? fmtM(totalSpent) : '—' },
    { Icon: IcoReceipt, label: '오늘 지출', value: todaySpent > 0 ? fmtM(todaySpent) : '—' },
  ];

  return (
    <div style={{ backgroundColor:'#fff', padding:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
        <p style={{ fontFamily:"'Noto Serif KR',serif", fontSize:'15px', fontWeight:700, color:'#111827', margin:0 }}>Trip at a glance</p>
        <span style={{ fontSize:'10px', fontWeight:700, color:'#436440', letterSpacing:'0.08em' }}>SUMMARY</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
        {cells.map(({ Icon, label, value, sub }) => (
          <div key={label} style={{ backgroundColor:'#f8faf8', borderRadius:'16px', padding:'14px 14px' }}>
            <div style={{ width:32, height:32, borderRadius:'9px', backgroundColor:'#edf4ec', color:'#436440', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'9px' }}>
              <Icon />
            </div>
            <p style={{ fontSize:'9px', fontWeight:700, color:'#9ca3af', letterSpacing:'0.1em', textTransform:'uppercase', margin:'0 0 3px' }}>{label}</p>
            <p style={{ fontSize:'19px', fontWeight:800, color:'#1f2937', margin:0, letterSpacing:'-0.02em', lineHeight:1.15 }}>{value}</p>
            {sub && <p style={{ fontSize:'11px', fontWeight:600, color:'#6b9466', margin:'2px 0 0' }}>{sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 전체 일정 요약 ───────────────────────────────────────────────────────────
function ItinerarySummary({ days }) {
  if (!days.length) return null;

  return (
    <div style={{ backgroundColor:'#fff', padding:'20px' }}>
      <p style={{ fontFamily:"'Noto Serif KR',serif", fontSize:'15px', fontWeight:700, color:'#111827', margin:'0 0 16px' }}>전체 일정 요약</p>

      <div style={{ position:'relative' }}>
        {/* 타임라인 세로선 */}
        <div style={{ position:'absolute', left:30, top:8, bottom:8, width:1, backgroundColor:'#e8ede8' }} />

        <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
          {days.map((day, idx) => {
            const pd    = day.parsedDate;
            const spots = day.items.filter(i => isTouristSpot(i.schedule));
            const route = extractRoute(day.items);
            const today = isActualToday(pd);
            const isPast= pd && (() => { const d=new Date(pd.year,pd.month-1,pd.day); const n=new Date(); n.setHours(0,0,0,0); return d<n; })();

            if (!pd && spots.length===0) return null;

            return (
              <div key={day.key} style={{ display:'flex', gap:'16px', paddingBottom: idx < days.length-1 ? '20px' : 0 }}>
                {/* 날짜 뱃지 */}
                <div style={{ flexShrink:0, width:44, display:'flex', flexDirection:'column', alignItems:'center', zIndex:1 }}>
                  <div style={{
                    width:44, height:44, borderRadius:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    backgroundColor: today ? '#436440' : isPast ? '#f0f0ee' : '#fff',
                    border: today ? 'none' : `1.5px solid ${isPast ? '#e5e7eb' : '#d1d5db'}`,
                    boxShadow: today ? '0 2px 8px rgba(67,100,64,0.3)' : 'none',
                  }}>
                    {pd ? (
                      <>
                        <p style={{ fontSize:'11px', fontWeight:800, color: today?'#fff': isPast?'#9ca3af':'#1f2937', margin:0, lineHeight:1.1 }}>{String(pd.month).padStart(2,'0')}/{String(pd.day).padStart(2,'0')}</p>
                        <p style={{ fontSize:'9px', color: today?'rgba(255,255,255,0.75)': isPast?'#b0bab0':'#9ca3af', margin:0 }}>{day.dayShort}</p>
                      </>
                    ) : (
                      <p style={{ fontSize:'11px', fontWeight:700, color:isPast?'#9ca3af':'#1f2937', margin:0 }}>D{day.seqNumber}</p>
                    )}
                  </div>
                </div>

                {/* 일정 내용 */}
                <div style={{ flex:1, minWidth:0, paddingTop:'10px' }}>
                  {route && (
                    <p style={{ fontSize:'11px', fontWeight:600, color: today?'#436440':'#6b7280', margin:'0 0 5px', display:'flex', alignItems:'center', gap:'4px' }}>
                      {today && <span style={{ width:5, height:5, borderRadius:'50%', backgroundColor:'#436440', flexShrink:0, display:'inline-block' }} />}
                      {route}
                    </p>
                  )}
                  {spots.length > 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
                      {spots.map((item, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'6px' }}>
                          <span style={{ color: today?'#436440':'#c5d6c4', fontSize:'12px', lineHeight:'1.5', flexShrink:0 }}>•</span>
                          <p style={{ fontSize:'13px', color: isPast?'#9ca3af':'#374151', margin:0, lineHeight:'1.5', wordBreak:'keep-all' }}>
                            {item.schedule}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize:'12px', color:'#c5d6c4', margin:0, fontStyle:'italic' }}>이동일</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 날씨 카드 ─────────────────────────────────────────────────────────────────
function WeatherCard({ days, todayIdx, tripId }) {
  const autoCity = days.length > 0 ? detectWeatherCity(days, todayIdx) : '';
  const [city,    setCity]    = useState(() => loadWxCity(tripId) || '');
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  // 자동 감지 도시 반영 (localStorage 미설정 시)
  useEffect(() => {
    if (!loadWxCity(tripId) && autoCity && !city) setCity(autoCity);
  }, [autoCity, tripId]);

  const { data, loading } = useWeather(city);

  const handleSave = () => {
    const c = draft.trim();
    if (c) { setCity(c); saveWxCity(tripId, c); }
    setEditing(false);
  };

  return (
    <div style={{ padding:'0 0 4px' }}>
      <div style={{ backgroundColor:'#436440', borderRadius:'20px', padding:'20px', margin:'0' }}>
        {/* 헤더 */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
          <p style={{ color:'rgba(255,255,255,0.75)', fontSize:'12px', fontWeight:600, margin:0, letterSpacing:'0.05em' }}>Destination Weather</p>
          <button
            onClick={() => { setDraft(city); setEditing(true); }}
            style={{ display:'flex', alignItems:'center', gap:'4px', color:'rgba(255,255,255,0.6)', fontSize:'11px', border:'none', background:'none', cursor:'pointer', padding:'2px 0' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            {city || '도시 설정'}
          </button>
        </div>

        {editing ? (
          <div style={{ display:'flex', gap:'8px' }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSave()}
              autoFocus
              placeholder="도시명 입력 (예: Rome, Zermatt)"
              style={{ flex:1, padding:'9px 12px', borderRadius:'10px', border:'1.5px solid rgba(255,255,255,0.3)', backgroundColor:'rgba(255,255,255,0.15)', color:'#fff', fontSize:'13px', outline:'none', fontFamily:'inherit' }}
            />
            <button onClick={handleSave} style={{ padding:'9px 14px', borderRadius:'10px', border:'none', backgroundColor:'rgba(255,255,255,0.25)', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
              확인
            </button>
          </div>
        ) : !city ? (
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:0 }}>위의 연필 버튼으로 도시를 설정해주세요</p>
        ) : loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div className="animate-spin" style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.2)', borderTopColor:'#fff' }} />
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'13px', margin:0 }}>날씨 불러오는 중...</p>
          </div>
        ) : data ? (
          <>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'4px' }}>
              <div>
                <p style={{ color:'#fff', fontSize:'48px', fontWeight:700, margin:'0 0 2px', letterSpacing:'-0.03em', lineHeight:1 }}>{data.temp}°C</p>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'13px', margin:0 }}>{wmoDesc(data.code)} · {data.cityName}</p>
              </div>
              <span style={{ fontSize:'44px', lineHeight:1, marginTop:'2px' }}>{wmoIcon(data.code)}</span>
            </div>

            <div style={{ height:1, backgroundColor:'rgba(255,255,255,0.18)', margin:'14px 0' }} />

            <div style={{ display:'flex', justifyContent:'space-between' }}>
              {data.daily.map(f => (
                <div key={f.day} style={{ textAlign:'center' }}>
                  <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'11px', margin:'0 0 4px' }}>{f.day}</p>
                  <p style={{ fontSize:'13px', margin:0 }}>{wmoIcon(f.code)}</p>
                  <p style={{ color:'#fff', fontSize:'13px', fontWeight:600, margin:'3px 0 0' }}>{f.temp}°</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:0 }}>날씨 정보를 불러올 수 없어요</p>
        )}
      </div>
    </div>
  );
}

// ─── 로딩 스피너 ──────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="animate-spin" style={{ width:26, height:26, borderRadius:'50%', border:'3px solid #f0f0ee', borderTopColor:'#436440' }} />
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
export default function HomeTab({ trip, scheduleSheetId, scheduleGid, expenseSheetId, expenseGid }) {
  const { days,     loading: dLoad } = useGoogleSheets(scheduleSheetId, scheduleGid);
  const { expenses, loading: eLoad } = useExpenseSheet(expenseSheetId,  expenseGid);

  if (dLoad || eLoad) return <Spinner />;

  const tripId   = trip?.id || 'default';
  const todayIdx = days.length > 0 ? findTodayIndex(days) : 0;

  return (
    <div className="scrollbar-hide" style={{ flex:1, overflowY:'auto', backgroundColor:'#f0f2ee' }}>
      <HeroSection trip={trip} days={days} tripId={tripId} />

      <div style={{ display:'flex', flexDirection:'column', gap:'8px', paddingBottom:'80px' }}>
        <TripAtAGlance days={days} expenses={expenses} />
        {days.length > 0 && <ItinerarySummary days={days} />}
        <div style={{ padding:'0 20px 0' }}>
          <WeatherCard days={days} todayIdx={todayIdx} tripId={tripId} />
        </div>
      </div>
    </div>
  );
}
