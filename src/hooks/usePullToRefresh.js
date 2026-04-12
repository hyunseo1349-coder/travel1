import { useState, useRef, useEffect, useCallback } from 'react';

const THRESHOLD = 60; // 새로고침 트리거 거리 (px)

export function usePullToRefresh(onRefresh) {
  const ref        = useRef(null);
  const startY     = useRef(0);
  const distRef    = useRef(0);
  const isPulling  = useRef(false);
  const [pullDist,   setPullDist]   = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = useCallback(async () => {
    setRefreshing(true);
    setPullDist(0);
    try { await Promise.resolve(onRefresh()); } catch {}
    setTimeout(() => setRefreshing(false), 700);
  }, [onRefresh]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = e => {
      if (el.scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = false;
      }
    };

    const onTouchMove = e => {
      if (!startY.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && el.scrollTop <= 0) {
        isPulling.current = true;
        const d = Math.min(dy * 0.45, THRESHOLD + 24);
        distRef.current = d;
        setPullDist(d);
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (isPulling.current && distRef.current >= THRESHOLD) {
        doRefresh();
      } else {
        setPullDist(0);
      }
      startY.current = 0;
      distRef.current = 0;
      isPulling.current = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [doRefresh]);

  return { ref, pullDist, refreshing };
}

// 공통 인디케이터 스타일 계산
export function pullIndicatorStyle(pullDist, refreshing) {
  const progress = Math.min(pullDist / 60, 1);
  return {
    height: refreshing ? 44 : pullDist,
    opacity: refreshing ? 1 : progress,
    rotate: refreshing ? undefined : `${progress * 300}deg`,
    spin: refreshing,
  };
}
