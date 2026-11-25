// FORNO A LEGNA — game loop and kitchen state. A shift in a Neapolitan
// pizzeria: tickets land on the board, the player stretches dough, lays
// toppings, fires the pizza in the wood oven watching the crust meter,
// then serves from the pass before patience runs out. Three walk-outs
// (or the end of the shift clock) end the game.
//
// Screenshot mode: ?shot=cover|rush|serve&seed=N freezes one staged scene
// (no animation) so the contact sheet always shows the full kitchen.

import { OrderBoard, mulberry32 } from './orders.js';
import { Oven, AssemblyPlate } from './stations.js';
import { matchesRecipe } from './recipes.js';
import { drawScene } from './render.js';
import { attachInput } from './input.js';

const SHIFT_SECONDS = 180;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? 7) || 7;

function freshState(rng) {
  return {
    board: new OrderBoard(rng),
    plate: new AssemblyPlate(),
    oven: new Oven(),
    pass: [],            // baked pizzas waiting: { ingredients, quality }
    selectedPass: -1,
    coins: 0,
    strikes: 0,
    shiftLeft: SHIFT_SECONDS,
    shiftTotal: SHIFT_SECONDS,
    spawnIn: 0,          // seconds until the next guest arrives
    elapsed: 0,
    time: 0,
    over: false,
    message: '',
    messageT: 0,
    shot: null,
    rng,
  };
}

let s = freshState(mulberry32(20261125));

function say(msg) {
  s.message = msg;
  s.messageT = 3;
}

// --- actions ---------------------------------------------------------------

function addIngredient(id) {
  if (s.over) return;
  if (!s.plate.add(id)) {
    if (!s.plate.hasDough && id !== 'dough') say('Stretch the dough first!');
    else if (s.plate.ingredients.includes(id)) say('Already on the pizza!');
    return;
  }
}

function clickOven() {
  if (s.over) return;
  if (s.oven.busy) {
    const done = s.oven.pullOut();
    if (s.pass.length >= 6) { say('The pass is full — serve something first!'); s.oven.load(done.ingredients); return; }
    s.pass.push(done);
    say(done.quality === 'perfect' ? 'Perfect leopard crust!' : done.quality === 'burnt' ? 'Burnt! Bin it from the pass.' : 'Out of the oven.');
  } else if (!s.plate.empty) {
    if (s.oven.load(s.plate.take())) say('Into the fire! Watch the crust meter.');
  }
}

function trashPlate() {
  if (s.selectedPass >= 0 && s.pass[s.selectedPass]) {
    s.pass.splice(s.selectedPass, 1);
    s.selectedPass = -1;
    say('Binned.');
  } else if (!s.plate.empty) {
    s.plate.clear();
    say('Board wiped clean.');
  }
}

function servePizza(passIndex, ticket) {
  const pz = s.pass[passIndex];
  if (!pz || !ticket) return;
  if (pz.quality === 'burnt') { say('That one is burnt — bin it!'); return; }
  if (!matchesRecipe(pz.ingredients, ticket.recipe)) { say('That pizza does not match the ticket!'); return; }
  let pay = ticket.recipe.price;
  const frac = ticket.patienceLeft / ticket.patienceMax;
  if (frac > 0.5) pay += 4; else if (frac > 0.25) pay += 2;
  if (pz.quality === 'perfect') pay += 5;
  if (pz.quality === 'dark') pay -= 2;
  s.coins += Math.max(4, pay);
  s.board.remove(ticket);
  s.pass.splice(passIndex, 1);
  s.selectedPass = -1;
  say(`Served ${ticket.recipe.name}! +${Math.max(4, pay)} coins`);
}

function clickPass(i) {
  if (s.over) return;
  s.selectedPass = s.selectedPass === i ? -1 : i;
}

function clickTicket(i) {
  if (s.over) return;
  const ticket = s.board.tickets[i];
  if (!ticket) return;
  if (s.selectedPass >= 0) servePizza(s.selectedPass, ticket);
}

function serveKey() {
  if (s.over) return;
  const idx = s.selectedPass >= 0 ? s.selectedPass : 0;
  const pz = s.pass[idx];
  if (!pz) return;
  const ticket = s.board.findFor((recipe) => matchesRecipe(pz.ingredients, recipe) && pz.quality !== 'burnt');
  if (ticket) servePizza(idx, ticket);
  else say('No ticket matches that pizza.');
}

function restart() {
  if (!s.over) return;
  const keepShot = s.shot;
  s = freshState(mulberry32(20261125));
  s.shot = keepShot;
}

// --- simulation --------------------------------------------------------------

function spawnInterval() {
  // The rush builds: guests arrive faster as the shift wears on.
  const t = 1 - s.shiftLeft / SHIFT_SECONDS;
  return 9 - 5 * t;
}

function step(dt) {
  s.time += dt;
  if (s.over) return;
  s.shiftLeft -= dt;
  s.elapsed += dt;
  if (s.messageT > 0) { s.messageT -= dt; if (s.messageT <= 0) s.message = ''; }

  s.spawnIn -= dt;
  if (s.spawnIn <= 0) {
    if (s.board.addRandomTicket()) s.spawnIn = spawnInterval() * (0.75 + s.rng() * 0.5);
    else s.spawnIn = 1.5;
  }

  const expired = s.board.update(dt);
  for (const t of expired) {
    s.strikes += 1;
    say(`Guest #${t.id} walked out!`);
  }
  const wasQuality = s.oven.busy ? s.oven.quality : null;
  s.oven.update(dt);
  if (s.oven.busy && wasQuality !== 'burnt' && s.oven.quality === 'burnt') {
    say('Smoke! The pizza in the oven just burnt — pull it and bin it!');
  }

  if (s.strikes >= 3 || s.shiftLeft <= 0) {
    s.over = true;
    s.shiftLeft = Math.max(0, s.shiftLeft);
  }
}

// --- staged screenshot scenes -------------------------------------------------

function buildShotScene(kind, shotSeed) {
  const rng = mulberry32(shotSeed);
  s = freshState(rng);
  s.shot = kind;
  s.time = 4.2;
  s.board.addTicket('margherita');
  s.board.addTicket('diavola');
  // mid-assembly pizza on the board: dough, sauce, mozzarella laid
  s.plate.add('dough'); s.plate.add('sauce'); s.plate.add('mozzarella');
  // one pizza already fired, waiting on the pass
  s.pass.push({ ingredients: ['dough', 'sauce', 'mozzarella', 'ham', 'basil'], quality: 'perfect' });
  // one pizza in the oven, crust in the golden window
  s.oven.load(['dough', 'sauce', 'mozzarella', 'pepperoni', 'onion']);
  s.oven.progress = 0.98;

  if (kind === 'cover') {
    s.shiftLeft = 157;
    s.coins = 34;
    s.board.tickets[0].patienceLeft = s.board.tickets[0].patienceMax * 0.8;
    s.board.tickets[1].patienceLeft = s.board.tickets[1].patienceMax * 0.62;
  } else if (kind === 'rush') {
    s.shiftLeft = 43;
    s.coins = 128;
    s.strikes = 1;
    s.board.addTicket('capricciosa');
    s.board.addTicket('funghi');
    const fr = [0.24, 0.45, 0.7, 0.55];
    s.board.tickets.forEach((t, i) => { t.patienceLeft = t.patienceMax * fr[i]; });
    s.pass.push({ ingredients: ['dough', 'sauce', 'mozzarella', 'mushroom', 'ham'], quality: 'pale' });
    s.selectedPass = 0;
  } else if (kind === 'serve') {
    s.shiftLeft = 96;
    s.coins = 86;
    s.board.tickets[0].patienceLeft = s.board.tickets[0].patienceMax * 0.9;
    s.board.tickets[1].patienceLeft = s.board.tickets[1].patienceMax * 0.5;
    s.pass[0] = { ingredients: ['dough', 'sauce', 'mozzarella', 'basil'], quality: 'perfect' };
    s.selectedPass = 0;
    s.message = 'Served Margherita! +21 coins';
  }
  drawScene(ctx, s);
}

// --- boot -----------------------------------------------------------------------

if (shot) {
  buildShotScene(shot, seed);
} else {
  attachInput(canvas, {
    addIngredient,
    clickOven,
    trashPlate,
    clickPass,
    clickTicket,
    serveKey,
    restart,
    passCount: () => s.pass.length,
    ticketCount: () => s.board.tickets.length,
  });
  s.board.addRandomTicket();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    drawScene(ctx, s);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
