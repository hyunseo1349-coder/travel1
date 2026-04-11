// 활동 유형에 따라 SVG 아이콘을 반환하는 컴포넌트

const ICON_SIZE = 20;

function IconDining() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  );
}

function IconTemple() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22h20" />
      <path d="M6 18v-7" />
      <path d="M18 18v-7" />
      <path d="M12 18V9" />
      <path d="M4 11 12 3l8 8" />
      <path d="M9 18h6" />
    </svg>
  );
}

function IconNature() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
      <path d="M12 12C12 7 7 4 7 4s2.5 4 5 8" />
      <path d="M12 12C12 7 17 4 17 4s-2.5 4-5 8" />
    </svg>
  );
}

function IconTea() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

function IconShopping() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconMuseum() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22h18" />
      <path d="M6 18V7" />
      <path d="M10 18V7" />
      <path d="M14 18V7" />
      <path d="M18 18V7" />
      <path d="M3 7h18" />
      <path d="m12 2-9 5h18Z" />
    </svg>
  );
}

function IconHotel() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

function IconFlight() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-2 0-4 0-5.5 1.5L10 9 1.8 6.2l-.8.8L7 12l-2 2H2l-.8.8 2 2 2 2 .8-.8V16l2-2 5 5.2.8-.8z" />
    </svg>
  );
}

function IconTrain() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="16" x="4" y="3" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <path d="m8 19-2 3" />
      <path d="m18 22-2-3" />
      <path d="M8 15h.01" />
      <path d="M16 15h.01" />
    </svg>
  );
}

function IconWalk() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" />
      <path d="m9 20 3-6 3 6" />
      <path d="m6 8 6 2 2-4" />
      <path d="M6 17 4 20" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ─── 키워드 → 아이콘 매핑 ───────────────────────────────────────────────────
const KEYWORD_MAP = [
  { keywords: ['조식', '중식', '석식', '식사', '카페', '레스토랑', '음식', 'breakfast', 'lunch', 'dinner', 'brunch', 'soba', 'kaiseki', 'meal', 'dining', 'restaurant', 'bistro', 'trattoria', 'osteria', 'pizza', 'pasta', 'gelato', '커피'], icon: IconDining },
  { keywords: ['사원', '절', '신사', '성당', '교회', '사찰', 'temple', 'shrine', 'zen', 'cathedral', 'church', 'basilica', 'meditation', '명상'], icon: IconTemple },
  { keywords: ['박물관', '미술관', '갤러리', '전시', 'museum', 'gallery', 'exhibition', 'uffizi', 'louvre'], icon: IconMuseum },
  { keywords: ['차', '다도', 'tea', 'ceremony', '다실'], icon: IconTea },
  { keywords: ['쇼핑', '시장', '마켓', 'shopping', 'market', 'shop'], icon: IconShopping },
  { keywords: ['숙소', '호텔', '료칸', '체크인', '체크아웃', 'hotel', 'inn', 'ryokan', 'check-in', 'check in', 'check out', 'villa', 'accommodation'], icon: IconHotel },
  { keywords: ['공항', '비행', '항공', 'airport', 'flight', 'air'], icon: IconFlight },
  { keywords: ['기차', '열차', '버스', '이동', 'train', 'bus', 'transit', 'rail', 'shinkansen'], icon: IconTrain },
  { keywords: ['산책', '걷기', '하이킹', 'walk', 'hike', 'stroll', 'grove', 'bamboo'], icon: IconWalk },
  { keywords: ['공원', '정원', '숲', '자연', '산', 'garden', 'forest', 'park', 'nature', 'bamboo'], icon: IconNature },
  { keywords: ['사진', '관광', 'photo', 'sightseeing', 'view', 'panorama'], icon: IconCamera },
];

export function getActivityIcon(scheduleName = '', content = '') {
  const text = (scheduleName + ' ' + content).toLowerCase();
  for (const { keywords, icon } of KEYWORD_MAP) {
    if (keywords.some(kw => text.includes(kw))) return icon;
  }
  return IconPin;
}

export default function ActivityIcon({ scheduleName, content, className = '' }) {
  const Icon = getActivityIcon(scheduleName, content);
  return (
    <span className={className}>
      <Icon />
    </span>
  );
}
