// FORNO A LEGNA — player input: mouse clicks on the bins, oven, pass and
// tickets, plus the keyboard shortcuts. Translates raw events into game
// actions supplied by main.js; knows nothing about scoring.

import { LAYOUT, binRect, ticketRect, passSlotRect } from './render.js';
import { INGREDIENTS } from './recipes.js';

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function attachInput(canvas, actions) {
  function pos(ev) {
    const rect = canvas.getBoundingClientRect();
    return [
      (ev.clientX - rect.left) * (canvas.width / rect.width),
      (ev.clientY - rect.top) * (canvas.height / rect.height),
    ];
  }

  canvas.addEventListener('click', (ev) => {
    const [x, y] = pos(ev);
    for (let i = 0; i < INGREDIENTS.length; i++) {
      if (inside(x, y, binRect(i))) return actions.addIngredient(INGREDIENTS[i].id);
    }
    if (inside(x, y, LAYOUT.oven)) return actions.clickOven();
    if (inside(x, y, LAYOUT.trash)) return actions.trashPlate();
    const passCount = actions.passCount();
    for (let i = 0; i < passCount; i++) {
      if (inside(x, y, passSlotRect(i))) return actions.clickPass(i);
    }
    const ticketCount = actions.ticketCount();
    for (let i = 0; i < ticketCount; i++) {
      if (inside(x, y, ticketRect(i))) return actions.clickTicket(i);
    }
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.key >= '0' && ev.key <= '9') {
      const idx = (Number(ev.key) + 9) % 10;
      if (INGREDIENTS[idx]) actions.addIngredient(INGREDIENTS[idx].id);
    } else if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault();
      actions.serveKey();
    } else if (ev.key === 'Backspace' || ev.key === 'Delete') {
      ev.preventDefault();
      actions.trashPlate();
    } else if (ev.key === 'o' || ev.key === 'O') {
      actions.clickOven();
    } else if (ev.key === 'r' || ev.key === 'R') {
      actions.restart();
    }
  });
}
