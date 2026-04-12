// node generate-icons.mjs 로 실행 → public/icon-192.png, icon-512.png 생성
// sharp 없이 동작하는 순수 SVG→PNG 변환 (canvas 패키지 필요 없음)
// Vercel 빌드에서는 실행 불필요 – 이미 생성된 PNG를 public에 커밋
import { createCanvas } from 'canvas';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function drawIcon(size) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  const r = size * 0.22; // corner radius

  // 배경 (rounded rect)
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = '#436440';
  ctx.fill();

  // 지도 핀
  const cx = size / 2;
  const cy = size * 0.42;
  const pinR = size * 0.22;

  ctx.beginPath();
  ctx.arc(cx, cy, pinR, Math.PI, 0);
  ctx.bezierCurveTo(cx + pinR, cy, cx + pinR * 0.4, cy + pinR * 1.4, cx, cy + pinR * 1.9);
  ctx.bezierCurveTo(cx - pinR * 0.4, cy + pinR * 1.4, cx - pinR, cy, cx - pinR, cy);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();

  // 핀 안 원
  ctx.beginPath();
  ctx.arc(cx, cy, pinR * 0.38, 0, Math.PI * 2);
  ctx.fillStyle = '#436440';
  ctx.fill();

  return c.toBuffer('image/png');
}

try {
  writeFileSync(resolve(__dirname, 'public/icon-192.png'), drawIcon(192));
  writeFileSync(resolve(__dirname, 'public/icon-512.png'), drawIcon(512));
  console.log('✓ icon-192.png, icon-512.png 생성 완료');
} catch (e) {
  console.error('canvas 패키지가 없습니다. npm install canvas 후 다시 실행하세요.');
  console.error(e.message);
}
