import { useState, useRef } from 'react';
import { getActivityIcon, getIconByName, ICON_CATALOG } from './ActivityIcon.jsx';
import PhotoCropper from './PhotoCropper.jsx';

// ─── 카테고리별 그라디언트 + picsum 시드 ────────────────────────────────────
const CATEGORY_META = {
  dining:   { gradient: 'linear-gradient(135deg,#f6d365 0%,#fda085 100%)', seed: 'food-restaurant-meal' },
  temple:   { gradient: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', seed: 'temple-shrine-asia'   },
  museum:   { gradient: 'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)', seed: 'museum-art-gallery'   },
  tea:      { gradient: 'linear-gradient(135deg,#b2d8b2 0%,#3d9970 100%)', seed: 'cafe-tea-coffee'      },
  shopping: { gradient: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)', seed: 'market-shopping'      },
  hotel:    { gradient: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)', seed: 'hotel-interior'       },
  flight:   { gradient: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)', seed: 'airport-airplane'     },
  train:    { gradient: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)', seed: 'train-railway-travel' },
  beach:    { gradient: 'linear-gradient(135deg,#30cfd0 0%,#330867 100%)', seed: 'beach-ocean-sea'      },
  walk:     { gradient: 'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)', seed: 'street-walk-city'     },
  nature:   { gradient: 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)', seed: 'forest-nature-green'  },
  camera:   { gradient: 'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)', seed: 'landmark-sightseeing' },
  pin:      { gradient: 'linear-gradient(135deg,#96fbc4 0%,#f9f586 100%)', seed: 'travel-destination'   },
};

function getCategory(scheduleName, content) {
  const text = (scheduleName + ' ' + content).toLowerCase();
  if (['조식','중식','석식','식사','카페','레스토랑','breakfast','lunch','dinner','meal','dining','pizza','pasta','soba','kaiseki'].some(k => text.includes(k))) return 'dining';
  if (['사원','절','신사','성당','교회','temple','shrine','zen','cathedral','church','meditation'].some(k => text.includes(k))) return 'temple';
  if (['박물관','미술관','갤러리','museum','gallery','exhibition'].some(k => text.includes(k))) return 'museum';
  if (['차','다도','tea','ceremony'].some(k => text.includes(k))) return 'tea';
  if (['쇼핑','시장','마켓','shopping','market'].some(k => text.includes(k))) return 'shopping';
  if (['숙소','호텔','료칸','체크인','hotel','inn','ryokan'].some(k => text.includes(k))) return 'hotel';
  if (['공항','비행','항공','airport','flight'].some(k => text.includes(k))) return 'flight';
  if (['기차','열차','버스','train','bus'].some(k => text.includes(k))) return 'train';
  if (['해변','해수욕','beach','coast'].some(k => text.includes(k))) return 'beach';
  if (['산책','걷기','하이킹','walk','hike','bamboo','grove'].some(k => text.includes(k))) return 'walk';
  if (['공원','정원','숲','자연','mountain','forest','nature'].some(k => text.includes(k))) return 'nature';
  if (['사진','관광','photo','sightseeing'].some(k => text.includes(k))) return 'camera';
  return 'pin';
}

// localStorage 키 (사진 저장)
const PHOTO_KEY = 'journey-photos';
function loadPhoto(id)         { try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}')[id] || null; } catch { return null; } }
function savePhoto(id, dataUrl){ try { const m = JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}'); m[id] = dataUrl; localStorage.setItem(PHOTO_KEY, JSON.stringify(m)); } catch {} }

// ─── 상세 필드 행 ────────────────────────────────────────────────────────────
const IcoDoc  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoTip  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcoAlt  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcoWon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoNote = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;

const FIELD_ICONS = { content: IcoDoc, detail: IcoDoc, tip: IcoTip, link: IcoLink, alt: IcoAlt, amount: IcoWon, note: IcoNote };

function FieldRow({ field }) {
  if (!field.value) return null;
  const Icon = FIELD_ICONS[field.key] || IcoDoc;
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: '#f2f6f2', color: '#436440', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#8faa8d', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
          {field.label}
        </p>
        {field.type === 'link' ? (
          <a href={field.value.startsWith('http') ? field.value : `https://${field.value}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '14px', color: '#436440', textDecoration: 'underline', wordBreak: 'break-all', lineHeight: '1.5' }}>
            {field.value}
          </a>
        ) : (
          <p style={{ fontSize: '14px', color: '#1f2937', lineHeight: '1.6', wordBreak: 'keep-all', margin: 0, whiteSpace: 'pre-wrap' }}>
            {field.value}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function DetailPage({ item, onBack }) {
  const category  = getCategory(item.schedule, item.content);
  const meta      = CATEGORY_META[category] || CATEGORY_META.pin;

  const [customPhoto,  setCustomPhoto]  = useState(() => loadPhoto(item.id));
  const [cropFile,     setCropFile]     = useState(null);
  const [imgError,     setImgError]     = useState(false);
  const fileInputRef = useRef();

  const autoPhotoUrl = `https://picsum.photos/seed/${meta.seed}/800/450`;

  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (file) setCropFile(file);
    e.target.value = '';
  };

  const handleCropConfirm = (dataUrl) => {
    savePhoto(item.id, dataUrl);
    setCustomPhoto(dataUrl);
    setCropFile(null);
  };

  // 시간 표시
  const timeParts = item.time ? item.time.split(/[-~]/).map(t => t.trim()).filter(Boolean) : [];
  const timeLabel = timeParts.length >= 2 ? `${timeParts[0]} → ${timeParts[timeParts.length - 1]}` : (timeParts[0] || '');

  // orderedFields에서 content 제외 (카드 부제목으로 이미 표시)
  const hasAnyField = item.orderedFields?.some(f => f.value);

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#fafaf8' }} className="scrollbar-hide">

        {/* ── 사진 영역 ── */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
          {/* 뒤로 가기 버튼 */}
          <button
            onClick={onBack}
            style={{
              position: 'absolute', top: 52, left: 16, zIndex: 10,
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.4)', border: 'none',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(4px)',
            }}
            aria-label="뒤로"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* 사진 교체 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 12, right: 12, zIndex: 10,
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '999px',
              backgroundColor: 'rgba(0,0,0,0.45)', border: 'none',
              color: '#fff', fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            사진 교체
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* 실제 사진 */}
          {customPhoto ? (
            <img src={customPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : !imgError ? (
            <img
              src={autoPhotoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            /* 사진 로드 실패 시 그라디언트 */
            <div style={{ width: '100%', height: '100%', background: meta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px', opacity: 0.7 }}>📍</span>
            </div>
          )}
        </div>

        {/* ── 일정 헤더 ── */}
        <div style={{ backgroundColor: '#fff', padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '15px',
              backgroundColor: '#f2f6f2', color: '#436440',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {(() => { const Icon = getActivityIcon(item.schedule, item.content); return <Icon />; })()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontFamily: "'Noto Serif KR','Noto Serif',Georgia,serif",
                fontSize: '20px', fontWeight: 700, color: '#111827',
                lineHeight: 1.35, wordBreak: 'keep-all', margin: 0,
              }}>
                {item.schedule}
              </h2>
              {timeLabel && (
                <p style={{ fontSize: '13px', color: '#436440', fontWeight: 600, margin: '6px 0 0' }}>
                  {timeLabel}
                </p>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, backgroundColor: '#f0f0ee', margin: '16px 0 0' }} />
        </div>

        {/* ── 상세 필드 (시트 열 순서) ── */}
        <div style={{ backgroundColor: '#fff', padding: '0 20px 32px' }}>
          {hasAnyField ? (
            item.orderedFields?.map(field => <FieldRow key={field.key} field={field} />)
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px', paddingTop: '24px', textAlign: 'center' }}>
              추가 정보가 없어요
            </p>
          )}
        </div>
      </div>

      {/* 크롭 모달 */}
      {cropFile && (
        <PhotoCropper
          imageFile={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  );
}
