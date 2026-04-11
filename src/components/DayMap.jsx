import { useEffect, useRef, useState } from 'react';

// ─── Nominatim 지오코딩 캐시 ─────────────────────────────────────────────────
const GEO_KEY = 'journey-geocache';
function loadCache()           { try { return JSON.parse(localStorage.getItem(GEO_KEY) || '{}'); } catch { return {}; } }
function saveCache(cache)      { try { localStorage.setItem(GEO_KEY, JSON.stringify(cache)); } catch {} }

// 1초 딜레이 (Nominatim 이용 약관: max 1 req/sec)
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function geocode(query) {
  const cache = loadCache();
  const key   = query.toLowerCase().trim();
  if (cache[key]) return cache[key];                  // 캐시 히트

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'Accept-Language': 'ko,en' } }
    );
    const data = await res.json();
    if (data.length) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      cache[key] = result;
      saveCache(cache);
      return result;
    }
  } catch {}
  return null;
}

// 위치 추출: 장소 컬럼 우선, 없으면 null (빈칸이면 건너뜀)
function extractLocation(item) {
  return (item.location || '').trim() || null;
}

// Google Maps Directions URL 생성
function buildGoogleMapsUrl(waypoints) {
  if (!waypoints.length) return null;
  if (waypoints.length === 1) {
    const { lat, lng, label } = waypoints[0];
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}&query=${lat},${lng}`;
  }
  const origin      = encodeURIComponent(`${waypoints[0].lat},${waypoints[0].lng}`);
  const destination = encodeURIComponent(`${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`);
  const middle      = waypoints.slice(1, -1)
    .map(w => `${w.lat},${w.lng}`)
    .join('|');
  const waypointParam = middle ? `&waypoints=${encodeURIComponent(middle)}` : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointParam}&travelmode=walking`;
}

// ─── 지도 컴포넌트 ───────────────────────────────────────────────────────────
export default function DayMap({ items }) {
  const mapRef      = useRef(null);   // div element
  const leafletRef  = useRef(null);   // Leaflet map instance
  const [waypoints, setWaypoints]   = useState([]);
  const [geocoding, setGeocoding]   = useState(false);
  const [noLocations, setNoLocations] = useState(false);

  // 지오코딩
  useEffect(() => {
    if (!items || items.length === 0) return;
    let cancelled = false;

    async function run() {
      setGeocoding(true);
      setWaypoints([]);
      setNoLocations(false);

      const results = [];
      let requestMade = false;
      for (let i = 0; i < items.length; i++) {
        if (cancelled) return;
        const item  = items[i];
        const query = extractLocation(item);
        if (!query) continue;   // 장소 빈칸이면 건너뜀

        if (requestMade) await sleep(1050); // Nominatim rate limit (1 req/sec)
        const coord = await geocode(query);
        requestMade = true;
        if (coord) {
          results.push({ ...coord, label: item.schedule || query, index: results.length });
        }
      }

      if (!cancelled) {
        if (results.length === 0) setNoLocations(true);
        setWaypoints(results);
        setGeocoding(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [items]);

  // Leaflet 지도 생성 / 업데이트
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mapRef.current) return;
    if (waypoints.length === 0) {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
      return;
    }

    // Leaflet CSS 동적 삽입
    if (!document.getElementById('leaflet-css')) {
      const link   = document.createElement('link');
      link.id      = 'leaflet-css';
      link.rel     = 'stylesheet';
      link.href    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then(L => {
      // 기존 지도 제거 후 재생성
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      leafletRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // 번호 마커 생성 (SVG)
      waypoints.forEach((wp, i) => {
        const num  = i + 1;
        const isFirst = i === 0;
        const isLast  = i === waypoints.length - 1;
        const color   = isFirst ? '#436440' : isLast ? '#e06060' : '#436440';
        const opacity = isFirst || isLast ? 1 : 0.75;

        const icon = L.divIcon({
          className: '',
          iconSize:  [28, 28],
          iconAnchor:[14, 14],
          html: `<div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};opacity:${opacity};
            color:#fff;font-size:12px;font-weight:700;
            display:flex;align-items:center;justify-content:center;
            border:2.5px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
            font-family:sans-serif;
          ">${num}</div>`,
        });

        const marker = L.marker([wp.lat, wp.lng], { icon }).addTo(map);
        marker.bindPopup(`<b style="font-size:13px;">${wp.label}</b>`, { maxWidth: 200 });
      });

      // 동선 폴리라인 (점선)
      if (waypoints.length >= 2) {
        L.polyline(waypoints.map(w => [w.lat, w.lng]), {
          color:     '#436440',
          weight:    2.5,
          opacity:   0.7,
          dashArray: '6 6',
        }).addTo(map);
      }

      // 마커 전체 영역에 맞게 줌
      const bounds = L.latLngBounds(waypoints.map(w => [w.lat, w.lng]));
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    });

    return () => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; }
    };
  }, [waypoints]);

  const mapsUrl = buildGoogleMapsUrl(waypoints);

  // ── 렌더 ──
  return (
    <div style={{ margin: '16px 0 0', backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(67,100,64,0.07)' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: '#f2f6f2', color: '#436440', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>오늘의 동선</span>
        </div>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600, color: '#436440',
              backgroundColor: '#f2f6f2', padding: '5px 10px',
              borderRadius: '999px', textDecoration: 'none',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Google Maps
          </a>
        )}
      </div>

      {/* 지도 or 상태 */}
      {geocoding ? (
        <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', backgroundColor: '#f8faf8' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #c2d5c1', borderTopColor: '#436440', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '12px', color: '#8faa8d', margin: 0 }}>위치를 불러오는 중…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : noLocations ? (
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8faf8' }}>
          <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '0 24px' }}>
            위치 정보를 찾을 수 없어요.<br />일정의 기본 내용에 장소명을 입력해 주세요.
          </p>
        </div>
      ) : waypoints.length === 0 ? null : (
        <div ref={mapRef} style={{ height: 260, width: '100%' }} />
      )}

      {/* 경유지 목록 */}
      {waypoints.length > 0 && (
        <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {waypoints.map((wp, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                backgroundColor: i === 0 ? '#436440' : i === waypoints.length - 1 ? '#e06060' : '#8faa8d',
                color: '#fff', fontSize: '10px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: 1.4, wordBreak: 'keep-all' }}>{wp.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
