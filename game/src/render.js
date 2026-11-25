// FORNO A LEGNA — every pixel of the kitchen is drawn here with canvas
// code (no image assets). Also owns the screen LAYOUT rectangles that the
// input module hit-tests against, so drawing and clicking never drift.

import { INGREDIENTS, INGREDIENT_BY_ID } from './recipes.js';
import { PERFECT_FROM, PERFECT_TO, BURNT_FROM } from './stations.js';

export const W = 1280;
export const H = 800;

export const LAYOUT = {
  board: { x: 14, y: 66, w: 400, h: 252 },
  ticketH: 60,
  oven: { x: 852, y: 66, w: 414, h: 264 },
  pass: { x: 852, y: 344, w: 414, h: 262 },
  passSlot: { w: 128, h: 118 },
  assembly: { x: 434, y: 330, w: 398, h: 276 },
  plate: { x: 633, y: 452, r: 102 },
  trash: { x: 756, y: 556, w: 64, h: 38 },
  binsY: 622,
  bin: { w: 121, h: 150, gap: 4, x0: 14 },
};

export function binRect(i) {
  return { x: LAYOUT.bin.x0 + i * (LAYOUT.bin.w + LAYOUT.bin.gap), y: LAYOUT.binsY, w: LAYOUT.bin.w, h: LAYOUT.bin.h };
}

export function ticketRect(i) {
  const b = LAYOUT.board;
  return { x: b.x + 8, y: b.y + 34 + i * (LAYOUT.ticketH + 2), w: b.w - 16, h: LAYOUT.ticketH };
}

export function passSlotRect(i) {
  const p = LAYOUT.pass;
  return { x: p.x + 12 + (i % 3) * (LAYOUT.passSlot.w + 6), y: p.y + 40 + Math.floor(i / 3) * (LAYOUT.passSlot.h + 8), w: LAYOUT.passSlot.w, h: LAYOUT.passSlot.h };
}

// --- small helpers -------------------------------------------------------

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, size, color, align = 'left', bold = false) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700 ' : ''}${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// Deterministic scatter so toppings sit in the same place every frame.
function scatter(seed, n) {
  const pts = [];
  let a = seed * 7919 + 13;
  for (let i = 0; i < n; i++) {
    a = (a * 48271) % 2147483647;
    const ang = (a / 2147483647) * Math.PI * 2;
    a = (a * 48271) % 2147483647;
    const rad = 0.25 + (a / 2147483647) * 0.6;
    pts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
  }
  return pts;
}

// --- pizza ----------------------------------------------------------------

// Draw one pizza. `quality` is null while raw (on the board / in the oven
// before it colours) or 'pale' | 'perfect' | 'dark' | 'burnt' once baked.
export function drawPizza(ctx, x, y, r, ingredients, quality) {
  const baked = quality !== null && quality !== undefined;
  const crust = quality === 'burnt' ? '#2b1c11' : quality === 'dark' ? '#a5662a' : quality === 'perfect' ? '#c98a3d' : '#e8c887';
  // plate shadow + crust ring
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.12, r * 1.04, r * 1.0, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = crust;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  if (!ingredients.includes('dough')) return;
  ctx.fillStyle = quality === 'burnt' ? '#4a3421' : '#f4e3b2';
  ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, Math.PI * 2); ctx.fill();

  ingredients.forEach((id, idx) => {
    if (id === 'dough') return;
    const ing = INGREDIENT_BY_ID[id];
    const pts = scatter(idx + 1, id === 'sauce' || id === 'mozzarella' ? 1 : 6);
    if (ing.kind === 'spread') {
      ctx.fillStyle = quality === 'burnt' ? '#571f14' : ing.color;
      ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();
    } else if (ing.kind === 'cheese') {
      ctx.fillStyle = quality === 'burnt' ? '#6e5836' : ing.color;
      for (const [px, py] of scatter(99, 7)) {
        ctx.beginPath(); ctx.ellipse(x + px * r * 0.62, y + py * r * 0.62, r * 0.2, r * 0.13, px * 2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ing.kind === 'disc') {
      ctx.fillStyle = ing.color;
      for (const [px, py] of pts) { ctx.beginPath(); ctx.arc(x + px * r * 0.7, y + py * r * 0.7, r * 0.13, 0, Math.PI * 2); ctx.fill(); }
    } else if (ing.kind === 'leaf') {
      ctx.fillStyle = quality === 'burnt' ? '#24301a' : ing.color;
      for (const [px, py] of pts.slice(0, 5)) {
        ctx.beginPath(); ctx.ellipse(x + px * r * 0.7, y + py * r * 0.7, r * 0.11, r * 0.05, px * 3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (ing.kind === 'slice') {
      ctx.fillStyle = ing.color; ctx.strokeStyle = '#8d7454'; ctx.lineWidth = 1.5;
      for (const [px, py] of pts.slice(0, 5)) {
        ctx.beginPath(); ctx.ellipse(x + px * r * 0.7, y + py * r * 0.7, r * 0.1, r * 0.06, px * 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else if (ing.kind === 'strip') {
      ctx.fillStyle = ing.color;
      for (const [px, py] of pts.slice(0, 5)) {
        ctx.save(); ctx.translate(x + px * r * 0.68, y + py * r * 0.68); ctx.rotate(px * 2.4);
        ctx.fillRect(-r * 0.13, -r * 0.045, r * 0.26, r * 0.09); ctx.restore();
      }
    } else if (ing.kind === 'ring') {
      ctx.strokeStyle = ing.color; ctx.lineWidth = r * 0.045;
      for (const [px, py] of pts.slice(0, 5)) {
        ctx.beginPath(); ctx.arc(x + px * r * 0.68, y + py * r * 0.68, r * 0.085, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (ing.kind === 'drizzle') {
      ctx.strokeStyle = ing.color; ctx.lineWidth = r * 0.03;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, ang = t * Math.PI * 5, rad = r * 0.66 * (0.35 + 0.6 * t);
        const px = x + Math.cos(ang) * rad, py = y + Math.sin(ang) * rad;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  });
  if (baked && quality !== 'burnt') {
    // leopard spotting on a well-fired crust
    ctx.fillStyle = 'rgba(90,50,16,0.55)';
    for (const [px, py] of scatter(7, 8)) {
      ctx.beginPath(); ctx.arc(x + px * r * 0.97, y + py * r * 0.97, r * 0.045, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// --- scene pieces --------------------------------------------------------

function drawHud(ctx, s) {
  ctx.fillStyle = '#17100b';
  ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = '#c96f3b';
  ctx.fillRect(0, 54, W, 3);
  text(ctx, 'FORNO A LEGNA', 18, 28, 24, '#f3d9a4', 'left', true);
  const mm = String(Math.floor(Math.max(0, s.shiftLeft) / 60)).padStart(2, '0');
  const ss = String(Math.floor(Math.max(0, s.shiftLeft) % 60)).padStart(2, '0');
  text(ctx, `SHIFT ${mm}:${ss}`, 660, 28, 30, s.shiftLeft <= 30 ? '#ff7a5c' : '#ffe9bd', 'center', true);
  text(ctx, `COINS ${s.coins}`, 1010, 28, 24, '#ffd968', 'right', true);
  text(ctx, `STRIKES ${'✕'.repeat(s.strikes)}${'·'.repeat(Math.max(0, 3 - s.strikes))}`, 1258, 28, 20, '#ff9a86', 'right', true);
  if (s.message) text(ctx, s.message, 330, 28, 19, '#ffe9bd', 'left', true);
}

function drawBoard(ctx, s) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#3a2417';
  rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
  ctx.strokeStyle = '#c96f3b'; ctx.lineWidth = 2; rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.stroke();
  text(ctx, 'ORDER BOARD — guest tickets', b.x + 12, b.y + 17, 16, '#f3d9a4', 'left', true);
  if (s.board.tickets.length === 0) text(ctx, 'no guests yet…', b.x + 12, b.y + 60, 15, '#cbb59a');
  s.board.tickets.forEach((t, i) => {
    const r = ticketRect(i);
    ctx.fillStyle = '#f7ecd2';
    rr(ctx, r.x, r.y, r.w, r.h, 5); ctx.fill();
    text(ctx, `#${t.id} ${t.recipe.name}`, r.x + 10, r.y + 15, 16, '#33241a', 'left', true);
    text(ctx, `${t.recipe.price}c`, r.x + r.w - 10, r.y + 15, 15, '#8a5a1d', 'right', true);
    text(ctx, t.recipe.ingredients.map((id) => INGREDIENT_BY_ID[id].short).join(' · '), r.x + 10, r.y + 35, 12.5, '#5c4630');
    const frac = Math.max(0, t.patienceLeft / t.patienceMax);
    ctx.fillStyle = '#d8c9a8'; ctx.fillRect(r.x + 10, r.y + r.h - 11, r.w - 20, 6);
    ctx.fillStyle = frac < 0.3 ? '#c63a24' : frac < 0.6 ? '#d98a2b' : '#5d8a3c';
    ctx.fillRect(r.x + 10, r.y + r.h - 11, (r.w - 20) * frac, 6);
  });
}

function drawOven(ctx, s) {
  const o = LAYOUT.oven;
  // brick dome
  ctx.fillStyle = '#5a3220';
  rr(ctx, o.x, o.y, o.w, o.h, 10); ctx.fill();
  ctx.strokeStyle = '#2b1a10'; ctx.lineWidth = 2;
  for (let row = 0; row < 6; row++) {
    ctx.beginPath(); ctx.moveTo(o.x + 6, o.y + 40 + row * 36); ctx.lineTo(o.x + o.w - 6, o.y + 40 + row * 36); ctx.stroke();
  }
  text(ctx, 'WOOD-FIRED OVEN · 450°C', o.x + o.w / 2, o.y + 20, 17, '#ffd9a0', 'center', true);
  // mouth
  const mx = o.x + o.w / 2, my = o.y + 128;
  ctx.fillStyle = '#120b06';
  ctx.beginPath(); ctx.arc(mx, my + 26, 84, Math.PI, 0); ctx.fill();
  ctx.fillRect(mx - 84, my + 26, 168, 42);
  // fire
  const flick = s.shot ? 0.5 : 0.5 + Math.sin(s.time * 9) * 0.16;
  ctx.fillStyle = '#e25822';
  ctx.beginPath(); ctx.ellipse(mx, my + 58, 66, 16 + flick * 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f6a821';
  ctx.beginPath(); ctx.ellipse(mx, my + 56, 40, 10 + flick * 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2412';
  ctx.fillRect(mx - 70, my + 62, 140, 8);
  if (s.oven.busy) drawPizza(ctx, mx, my + 18, 52, s.oven.pizza.ingredients, s.oven.progress > 0.25 ? 'pale' : null);
  // crust meter
  const mw = o.w - 48, mx0 = o.x + 24, myy = o.y + o.h - 34;
  text(ctx, 'CRUST METER — click oven to pull out in the gold', o.x + o.w / 2, myy - 16, 13.5, '#f3d9a4', 'center');
  ctx.fillStyle = '#8a97a5'; ctx.fillRect(mx0, myy, mw * (PERFECT_FROM / 1.5), 12);
  ctx.fillStyle = '#e9b949'; ctx.fillRect(mx0 + mw * (PERFECT_FROM / 1.5), myy, mw * ((PERFECT_TO - PERFECT_FROM) / 1.5), 12);
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(mx0 + mw * (PERFECT_TO / 1.5), myy, mw * ((BURNT_FROM - PERFECT_TO) / 1.5), 12);
  ctx.fillStyle = '#40200f'; ctx.fillRect(mx0 + mw * (BURNT_FROM / 1.5), myy, mw * (1 - BURNT_FROM / 1.5), 12);
  if (s.oven.busy) {
    const nx = mx0 + mw * Math.min(1, s.oven.progress / 1.5);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(nx, myy - 5); ctx.lineTo(nx - 5, myy - 13); ctx.lineTo(nx + 5, myy - 13); ctx.fill();
    text(ctx, s.oven.quality.toUpperCase(), mx, myy + 22, 14, s.oven.quality === 'perfect' ? '#ffd968' : '#f3d9a4', 'center', true);
  }
}

function drawAssembly(ctx, s) {
  const a = LAYOUT.assembly;
  ctx.fillStyle = '#2e2015';
  rr(ctx, a.x, a.y, a.w, a.h, 8); ctx.fill();
  ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 2; rr(ctx, a.x, a.y, a.w, a.h, 8); ctx.stroke();
  text(ctx, 'ASSEMBLY BOARD — build the pizza, then click the OVEN', a.x + a.w / 2, a.y + 18, 14.5, '#f3d9a4', 'center', true);
  // wooden board + plate
  ctx.fillStyle = '#9a6a38';
  ctx.beginPath(); ctx.ellipse(LAYOUT.plate.x, LAYOUT.plate.y + 8, 128, 118, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e9e2d2';
  ctx.beginPath(); ctx.arc(LAYOUT.plate.x, LAYOUT.plate.y, 112, 0, Math.PI * 2); ctx.fill();
  if (s.plate.empty) {
    text(ctx, 'click DOUGH', LAYOUT.plate.x, LAYOUT.plate.y - 8, 16, '#8a7a5f', 'center', true);
    text(ctx, 'to start a pizza', LAYOUT.plate.x, LAYOUT.plate.y + 14, 13, '#8a7a5f', 'center');
  } else {
    drawPizza(ctx, LAYOUT.plate.x, LAYOUT.plate.y, 100, s.plate.ingredients, null);
  }
  const chips = s.plate.ingredients.map((id) => INGREDIENT_BY_ID[id].short).join(' · ');
  if (chips) text(ctx, chips, LAYOUT.plate.x, a.y + a.h - 16, 13, '#ffe9bd', 'center');
  // trash button
  const t = LAYOUT.trash;
  ctx.fillStyle = '#7a2d1d'; rr(ctx, t.x, t.y, t.w, t.h, 6); ctx.fill();
  text(ctx, 'BIN IT', t.x + t.w / 2, t.y + t.h / 2, 13, '#ffe9bd', 'center', true);
}

function drawPass(ctx, s) {
  const p = LAYOUT.pass;
  ctx.fillStyle = '#33241a';
  rr(ctx, p.x, p.y, p.w, p.h, 8); ctx.fill();
  ctx.strokeStyle = '#c96f3b'; ctx.lineWidth = 2; rr(ctx, p.x, p.y, p.w, p.h, 8); ctx.stroke();
  text(ctx, 'THE PASS — click a pizza, then its ticket to serve', p.x + 12, p.y + 18, 14.5, '#f3d9a4', 'left', true);
  if (s.pass.length === 0) text(ctx, 'no pizzas waiting', p.x + 12, p.y + 58, 14, '#cbb59a');
  s.pass.forEach((pz, i) => {
    const r = passSlotRect(i);
    if (i === s.selectedPass) { ctx.strokeStyle = '#ffd968'; ctx.lineWidth = 3; rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 8); ctx.stroke(); }
    drawPizza(ctx, r.x + r.w / 2, r.y + 52, 44, pz.ingredients, pz.quality);
    text(ctx, pz.quality.toUpperCase(), r.x + r.w / 2, r.y + r.h - 10, 12.5, pz.quality === 'burnt' ? '#ff7a5c' : '#ffe9bd', 'center', true);
  });
}

function drawBins(ctx, s) {
  text(ctx, 'COUNTER — click an ingredient (or press 1–0) to add it to the board', 14, LAYOUT.binsY - 8, 14, '#cbb59a');
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    ctx.fillStyle = '#402b1a'; rr(ctx, r.x, r.y, r.w, r.h, 7); ctx.fill();
    ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 1.5; rr(ctx, r.x, r.y, r.w, r.h, 7); ctx.stroke();
    // the ingredient itself, drawn as it lands on a pizza
    drawPizza(ctx, r.x + r.w / 2, r.y + 52, 34, ['dough', ing.id], null);
    if (ing.id === 'dough') { ctx.fillStyle = ing.color; ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + 52, 30, 0, Math.PI * 2); ctx.fill(); }
    text(ctx, ing.short, r.x + r.w / 2, r.y + 104, 14.5, '#ffe9bd', 'center', true);
    text(ctx, `${(i + 1) % 10}`, r.x + r.w / 2, r.y + 128, 12, '#a98f68', 'center');
    if (s.plate.ingredients.includes(ing.id)) {
      ctx.strokeStyle = '#ffd968'; ctx.lineWidth = 2.5; rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 6); ctx.stroke();
    }
  });
}

function drawBanner(ctx, title, sub) {
  ctx.fillStyle = 'rgba(16,9,5,0.82)';
  ctx.fillRect(0, 330, W, 128);
  ctx.fillStyle = '#c96f3b'; ctx.fillRect(0, 330, W, 3); ctx.fillRect(0, 455, W, 3);
  text(ctx, title, W / 2, 380, 54, '#ffd968', 'center', true);
  text(ctx, sub, W / 2, 428, 21, '#ffe9bd', 'center');
}

// --- whole scene -----------------------------------------------------------

export function drawScene(ctx, s) {
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 0, W, H);
  // tiled floor strip behind the counter
  ctx.fillStyle = '#2c1e13';
  ctx.fillRect(0, 606, W, 194);
  drawHud(ctx, s);
  drawBoard(ctx, s);
  drawOven(ctx, s);
  drawAssembly(ctx, s);
  drawPass(ctx, s);
  drawBins(ctx, s);
  if (s.shot === 'cover') drawBanner(ctx, 'FORNO A LEGNA', 'Neapolitan pizza from a roaring wood fire — stretch, top, fire, serve!');
  if (s.shot === 'rush') drawBanner(ctx, 'RUSH HOUR!', 'Four tables deep and the fire is hungry — keep the crust gold!');
  if (s.shot === 'serve') drawBanner(ctx, 'READY TO SERVE', 'A perfect Margherita leaves the pass — coins and a happy guest!');
  if (s.over) drawBanner(ctx, 'SHIFT OVER', `You earned ${s.coins} coins — press R to fire the oven again`);
}
