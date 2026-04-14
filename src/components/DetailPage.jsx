import { useState, useRef, useEffect } from 'react';
import { getActivityIcon } from './ActivityIcon.jsx';
import PhotoCropper from './PhotoCropper.jsx';

// ─── 카테고리별 폴백 그라디언트 (Unsplash 실패 시) ─────────────────────────
const FALLBACK_GRADIENTS = {
  dining:   'linear-gradient(135deg,#f6d365 0%,#fda085 100%)',
  temple:   'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
  museum:   'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)',
  tea:      'linear-gradient(135deg,#b2d8b2 0%,#3d9970 100%)',
  shopping: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
  hotel:    'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
  flight:   'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
  train:    'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
  beach:    'linear-gradient(135deg,#30cfd0 0%,#330867 100%)',
  walk:     'linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)',
  nature:   'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)',
  camera:   'linear-gradient(135deg,#f7971e 0%,#ffd200 100%)',
  pin:      'linear-gradient(135deg,#96fbc4 0%,#f9f586 100%)',
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

// ─── 카테고리별 curated Unsplash 사진 ID ──────────────────────────────────────
// source.unsplash.com 은 deprecated → images.unsplash.com 직접 ID 사용
const CATEGORY_PHOTOS = {
  dining:   'photo-1414235077428-338989a2e8c0', // restaurant table
  temple:   'photo-1518998053901-5348d3961a04', // cathedral/temple
  museum:   'photo-1512699355324-f07e3106dae5', // museum hall
  tea:      'photo-1495474472287-4d71bcdd2085', // coffee / cafe
  shopping: 'photo-1441986300917-64674bd600d8', // market street
  hotel:    'photo-1566073771259-6a8506099945', // hotel pool view
  flight:   'photo-1436491865332-7a61a109cc05', // airplane sky
  train:    'photo-1474487548417-781cb6d646a9', // scenic train
  beach:    'photo-1507525428034-b723cf961d3e', // tropical beach
  walk:     'photo-1441974231531-c6227db76b6e', // forest path
  nature:   'photo-1469474968028-56623f02e42e', // mountain lake
  camera:   'photo-1502602898657-3e91760cbb34', // Paris / Eiffel
  pin:      'photo-1476514525535-07fb3b4ae5f1', // travel cityscape
};

// ─── localStorage: 사진 ──────────────────────────────────────────────────────
const PHOTO_KEY = 'journey-photos';
function loadPhoto(id)          { try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}')[id] || null; } catch { return null; } }
function savePhoto(id, dataUrl) { try { const m = JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}'); m[id] = dataUrl; localStorage.setItem(PHOTO_KEY, JSON.stringify(m)); } catch {} }

// ─── localStorage: 필드 편집 ─────────────────────────────────────────────────
const EDITS_KEY = 'journey-field-edits';
function loadEdits(key)        { try { return JSON.parse(localStorage.getItem(EDITS_KEY) || '{}')[key] || {}; } catch { return {}; } }
function saveEdits(key, edits) { try { const all = JSON.parse(localStorage.getItem(EDITS_KEY) || '{}'); all[key] = edits; localStorage.setItem(EDITS_KEY, JSON.stringify(all)); } catch {} }

// (Apps Script URL은 여행별 설정에서 주입 - 하드코딩 제거)

// ─── 상세 필드 아이콘 ─────────────────────────────────────────────────────────
const IcoDoc    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoTip    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoLink   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IcoAlt    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IcoWon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IcoNote   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoPencil = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;

const FIELD_ICONS = { content: IcoDoc, detail: IcoDoc, tip: IcoTip, link: IcoLink, alt: IcoAlt, amount: IcoWon, note: IcoNote };

// ─── 상세 필드 행 (편집 가능) ─────────────────────────────────────────────────
function FieldRow({ field, editValue, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const [saving,  setSaving]  = useState(false);

  // 로컬 편집값 우선, 없으면 시트 원본값
  const displayValue = (editValue !== undefined && editValue !== '') ? editValue : field.value;
  const Icon = FIELD_ICONS[field.key] || IcoDoc;

  const handleEdit = () => { setDraft(displayValue || ''); setEditing(true); };
  const handleCancel = () => setEditing(false);
  const handleSave = async () => {
    setSaving(true);
    await onSave(field.key, draft);
    setSaving(false);
    setEditing(false);
  };

  // 값 없고 편집 중 아니면 → 흐린 "내용 없음" (채워진 항목 아래 표시됨)
  if (!displayValue && !editing) {
    return (
      <div
        onClick={handleEdit}
        style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', opacity: 0.35 }}
      >
        <div style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: '#f9faf9', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon />
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{field.label} · 내용 없음</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 32, height: 32, borderRadius: '10px', backgroundColor: 'var(--ci, #edf4ec)', color: 'var(--cp, #436440)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editing ? '8px' : '4px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#8faa8d', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            {field.label}
          </p>
          {!editing && (
            <button
              onClick={handleEdit}
              style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'var(--ci, #edf4ec)', border: 'none', color: 'var(--cp, #436440)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              aria-label="편집"
            >
              <IcoPencil />
            </button>
          )}
        </div>

        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px', borderRadius: '10px',
                border: '1.5px solid var(--cp, #436440)', fontSize: '14px', lineHeight: '1.6',
                color: '#1f2937', resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', backgroundColor: '#fafdf9',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancel}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#6b7280', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--cp, #436440)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        ) : (
          field.type === 'link' ? (
            <a
              href={displayValue.startsWith('http') ? displayValue : `https://${displayValue}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '14px', color: 'var(--cp, #436440)', textDecoration: 'underline', wordBreak: 'break-all', lineHeight: '1.5' }}
            >
              {displayValue}
            </a>
          ) : (
            <p style={{ fontSize: '14px', color: '#1f2937', lineHeight: '1.6', wordBreak: 'keep-all', margin: 0, whiteSpace: 'pre-wrap' }}>
              {displayValue}
            </p>
          )
        )}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function DetailPage({ item, onBack, scriptUrl, sheetId, gid }) {
  const category     = getCategory(item.schedule, item.content);
  const fallbackGrad = FALLBACK_GRADIENTS[category] || FALLBACK_GRADIENTS.pin;

  const [customPhoto, setCustomPhoto] = useState(() => loadPhoto(item.id));
  const [cropFile,    setCropFile]    = useState(null);
  const [imgError,    setImgError]    = useState(false);
  const fileInputRef = useRef();

  // 필드 편집: 날짜+일정명을 안정적인 키로 사용
  const editKey = `${item.date || ''}:${item.schedule || ''}`;
  const [fieldEdits, setFieldEdits] = useState(() => loadEdits(editKey));
  // item이 바뀌면 저장된 편집값 재로드
  useEffect(() => { setFieldEdits(loadEdits(editKey)); }, [editKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [syncStatus, setSyncStatus] = useState(null); // null | 'saving' | 'saved'

  const handleSaveField = async (fieldKey, value) => {
    const newEdits = { ...fieldEdits, [fieldKey]: value };
    setFieldEdits(newEdits);
    saveEdits(editKey, newEdits);
    setSyncStatus('saving');
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action:'updateSchedule', sheetId, gid, date:item.date, schedule:item.schedule, fieldKey, value }),
        });
      } catch {}
    }
    setSyncStatus('saved');
    setTimeout(() => setSyncStatus(null), 2000);
  };

  // 카테고리 기반 curated 사진
  const photoId    = CATEGORY_PHOTOS[category] || CATEGORY_PHOTOS.pin;
  const autoPhotoUrl = `https://images.unsplash.com/${photoId}?w=800&h=450&fit=crop&q=80`;

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

  // content 제외한 편집 가능 필드 목록 — 내용 있는 항목 먼저
  const rawNonContent = item.orderedFields?.filter(f => f.key !== 'content') || [];
  const nonContentFields = [
    ...rawNonContent.filter(f => (fieldEdits[f.key] || f.value)),
    ...rawNonContent.filter(f => !(fieldEdits[f.key] || f.value)),
  ];

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
            <div style={{ width: '100%', height: '100%', background: fallbackGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '48px', opacity: 0.6 }}>📍</span>
            </div>
          )}
        </div>

        {/* ── 일정 헤더 ── */}
        <div style={{ backgroundColor: '#fff', padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '15px',
              backgroundColor: 'var(--ci, #edf4ec)', color: 'var(--cp, #436440)',
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
                <p style={{ fontSize: '13px', color: 'var(--cp, #436440)', fontWeight: 600, margin: '6px 0 0' }}>
                  {timeLabel}
                </p>
              )}
              {item.location && (
                <a
                  href={`https://maps.google.com/maps?q=${encodeURIComponent(item.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', marginTop:'6px', marginBottom:'2px', padding:'5px 12px', borderRadius:'999px', backgroundColor:'var(--ci, #edf4ec)', textDecoration:'none', color:'var(--cp, #436440)', fontSize:'12px', fontWeight:500, textAlign:'center' }}
                >
                  📍 {item.location} 지도 열기
                </a>
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div style={{ height: 1, backgroundColor: '#f0f0ee', margin: '16px 0 0' }} />
        </div>

        {/* ── 상세 필드 (편집 가능) ── */}
        <div style={{ backgroundColor: '#fff', padding: '0 20px 32px' }}>
          {nonContentFields.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '14px', paddingTop: '24px', textAlign: 'center' }}>
              추가 정보가 없어요
            </p>
          ) : (
            nonContentFields.map(field => (
              <FieldRow
                key={field.key}
                field={field.key === 'detail' ? { ...field, label: '설명' } : field}
                editValue={fieldEdits[field.key]}
                onSave={handleSaveField}
              />
            ))
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

      {/* 동기화 상태 토스트 */}
      {syncStatus && (
        <div style={{
          position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)',
          backgroundColor:'#1f2937', color:'#fff', borderRadius:'999px',
          padding:'8px 18px', fontSize:'13px', fontWeight:500,
          display:'flex', alignItems:'center', gap:'7px',
          boxShadow:'0 4px 16px rgba(0,0,0,0.18)', zIndex:50,
          whiteSpace:'nowrap',
          animation:'fadeIn 0.15s ease',
        }}>
          {syncStatus === 'saving' ? (
            <>
              <div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite' }} />
              저장 중...
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              저장됨
            </>
          )}
        </div>
      )}
    </>
  );
}
