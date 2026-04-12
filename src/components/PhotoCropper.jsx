import { useState, useEffect, useRef } from 'react';

/**
 * 사진 자르기 (팬 + 핀치 줌)
 * - 드래그: 위치 이동
 * - 스크롤 / 핀치: 확대·축소
 * - 확인 시 canvas로 800×450 JPEG 출력
 */
export default function PhotoCropper({ imageFile, onConfirm, onCancel }) {
  const [imgSrc, setImgSrc]   = useState('');
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [scale,  setScale]    = useState(1);
  const drag   = useRef({ active: false, startX: 0, startY: 0, ox: 0, oy: 0 });
  const pinch  = useRef({ active: false, startDist: 0, startScale: 1 });
  const imgRef = useRef();

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target.result);
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // ── 마우스 이벤트 ──
  const onMouseDown = e => {
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = e => {
    if (!drag.current.active) return;
    setOffset({ x: drag.current.ox + e.clientX - drag.current.startX, y: drag.current.oy + e.clientY - drag.current.startY });
  };
  const onMouseUp = () => { drag.current.active = false; };

  const onWheel = e => {
    e.preventDefault();
    setScale(s => Math.max(0.3, Math.min(4, s * (1 - e.deltaY * 0.001))));
  };

  // ── 터치 이벤트 ──
  const onTouchStart = e => {
    if (e.touches.length === 1) {
      drag.current = { active: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY, ox: offset.x, oy: offset.y };
    } else if (e.touches.length === 2) {
      drag.current.active = false;
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinch.current = { active: true, startDist: dist, startScale: scale };
    }
  };
  const onTouchMove = e => {
    e.preventDefault();
    if (e.touches.length === 1 && drag.current.active) {
      setOffset({ x: drag.current.ox + e.touches[0].clientX - drag.current.startX, y: drag.current.oy + e.touches[0].clientY - drag.current.startY });
    } else if (e.touches.length === 2 && pinch.current.active) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setScale(Math.max(0.3, Math.min(4, pinch.current.startScale * (dist / pinch.current.startDist))));
    }
  };
  const onTouchEnd = () => { drag.current.active = false; pinch.current.active = false; };

  // ── 확인: canvas에 렌더링 후 JPEG 출력 ──
  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    canvas.width  = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    if (!img) return;
    // 미리보기 컨테이너 너비 390px, canvas 800px → 동일 16:9 비율
    const containerW = 390;
    const ratio = canvas.width / containerW; // 800/390
    // CSS width:100% 로 이미지가 컨테이너 폭에 맞게 축소되는 배율
    const displayScale = img.naturalWidth ? containerW / img.naturalWidth : 1;
    // 최종 배율: 미리보기 축소 × 사용자 조작 scale × canvas/preview 비율
    const totalScale = displayScale * scale * ratio;
    ctx.save();
    ctx.translate(canvas.width / 2 + offset.x * ratio, canvas.height / 2 + offset.y * ratio);
    ctx.scale(totalScale, totalScale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
    onConfirm(canvas.toDataURL('image/jpeg', 0.92));
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ color: '#fff', fontSize: '13px', marginBottom: '12px', opacity: 0.8 }}>
        드래그로 이동 · 스크롤(핀치)로 크기 조절
      </p>

      {/* 크롭 프레임 */}
      <div
        style={{
          width: '100%', maxWidth: '390px', aspectRatio: '16/9',
          overflow: 'hidden', position: 'relative',
          cursor: 'grab', backgroundColor: '#111',
          borderRadius: '12px',
          touchAction: 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {imgSrc ? (
          <img
            ref={imgRef}
            src={imgSrc}
            draggable={false}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              transformOrigin: 'center center',
              maxWidth: 'none', userSelect: 'none', pointerEvents: 'none',
              width: '100%',
            }}
          />
        ) : (
          <div style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '13px' }}>
            이미지 로딩 중…
          </div>
        )}

        {/* 그리드 가이드 */}
        {imgSrc && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[1, 2].map(i => (
              <div key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${(100 / 3) * i}%`, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            ))}
            {[1, 2].map(i => (
              <div key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(100 / 3) * i}%`, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button onClick={onCancel} style={{
          padding: '12px 28px', borderRadius: '999px', border: '1.5px solid rgba(255,255,255,0.4)',
          backgroundColor: 'transparent', color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
        }}>
          취소
        </button>
        <button onClick={handleConfirm} style={{
          padding: '12px 28px', borderRadius: '999px', border: 'none',
          backgroundColor: '#436440', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>
          적용
        </button>
      </div>
    </div>
  );
}
