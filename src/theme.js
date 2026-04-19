export const THEMES = {
  emerald: {
    id: 'emerald', name: 'Emerald', emoji: '🌿',
    desc: '차분한 숲 초록 (기본)',
    primary: '#436440', primaryRgb: '67,100,64',
    light: '#dff0db', mid: '#6b9466',
    cellBg: '#f8faf8', iconBg: '#edf4ec',
  },
  slate: {
    id: 'slate', name: 'Slate', emoji: '🩶',
    desc: '세련된 차콜 그레이',
    primary: '#374151', primaryRgb: '55,65,81',
    light: '#e5e7eb', mid: '#6b7280',
    cellBg: '#f9fafb', iconBg: '#e8eaed',
  },
  saffron: {
    id: 'saffron', name: 'Saffron', emoji: '🌾',
    desc: '따뜻한 사프란 골드',
    primary: '#b07818', primaryRgb: '176,120,24',
    light: '#fdebd0', mid: '#d4a050',
    cellBg: '#fdfaf4', iconBg: '#faecd8',
  },
  coral: {
    id: 'coral', name: 'Coral', emoji: '🪸',
    desc: '생동감 있는 코랄',
    primary: '#b5533c', primaryRgb: '181,83,60',
    light: '#fde8e2', mid: '#d4806a',
    cellBg: '#fdf7f6', iconBg: '#fae5df',
  },
  amethyst: {
    id: 'amethyst', name: 'Amethyst', emoji: '💜',
    desc: '우아한 라벤더 퍼플',
    primary: '#5c4a7a', primaryRgb: '92,74,122',
    light: '#e8e0f5', mid: '#8b7ab0',
    cellBg: '#faf8fd', iconBg: '#ede8f7',
  },
  aegean: {
    id: 'aegean', name: 'Aegean', emoji: '🌊',
    desc: '깊고 시원한 청록',
    primary: '#2c5f6e', primaryRgb: '44,95,110',
    light: '#d6edf2', mid: '#4d8fa0',
    cellBg: '#f4fafc', iconBg: '#e0f0f5',
  },
};

export const THEME_ORDER = ['emerald', 'slate', 'saffron', 'coral', 'amethyst', 'aegean'];
export const THEME_KEY = 'journey-theme';

export function applyTheme(themeId) {
  const t = THEMES[themeId] || THEMES.emerald;
  const r = document.documentElement;
  r.style.setProperty('--cp',     t.primary);
  r.style.setProperty('--cp-rgb', t.primaryRgb);
  r.style.setProperty('--cl',     t.light);
  r.style.setProperty('--cm',     t.mid);
  r.style.setProperty('--cc',     t.cellBg);
  r.style.setProperty('--ci',     t.iconBg);
  localStorage.setItem(THEME_KEY, themeId);
  // 브라우저/PWA 상단 바 색상도 테마에 맞게 동기화
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', t.primary);
}

export function loadThemeId() {
  return localStorage.getItem(THEME_KEY) || 'emerald';
}
