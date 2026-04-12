// 여행 설정을 URL로 인코딩/디코딩

export function tripToShareUrl(trip) {
  const base = window.location.origin + window.location.pathname;
  const p = new URLSearchParams();
  if (trip.level1) p.set('y', trip.level1);
  if (trip.level2) p.set('n', trip.level2);
  p.set('ss', trip.scheduleSheetId || '');
  p.set('sg', trip.scheduleGid     || '');
  // 경비 시트가 일정 시트와 다를 때만 추가
  if (trip.expenseSheetId && trip.expenseSheetId !== trip.scheduleSheetId) {
    p.set('es', trip.expenseSheetId);
  }
  if (trip.expenseGid) p.set('eg', trip.expenseGid);
  if (trip.themeId && trip.themeId !== 'emerald') p.set('t', trip.themeId);
  return `${base}?${p.toString()}`;
}

export function parseShareUrl() {
  const p = new URLSearchParams(window.location.search);
  const ss = p.get('ss');
  if (!ss) return null;
  return {
    id:              `trip-${Date.now()}`,
    level1:          p.get('y')  || new Date().getFullYear().toString(),
    level2:          p.get('n')  || '새 여행',
    scheduleSheetId: ss,
    scheduleGid:     p.get('sg') || '0',
    expenseSheetId:  p.get('es') || ss,
    expenseGid:      p.get('eg') || '',
    themeId:         p.get('t')  || 'emerald',
  };
}
