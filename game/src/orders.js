// FORNO A LEGNA — the order board: guest tickets pinned above the pass.
// Owns ticket creation, the queue, and each guest's shrinking patience.

import { RECIPES } from './recipes.js';

export const MAX_TICKETS = 4;

export class OrderBoard {
  constructor(rng) {
    this.rng = rng;
    this.tickets = [];
    this.nextId = 1;
  }

  get full() {
    return this.tickets.length >= MAX_TICKETS;
  }

  // Pin a new ticket for a random recipe. Returns the ticket, or null when
  // the board is already full.
  addRandomTicket() {
    if (this.full) return null;
    const recipe = RECIPES[Math.floor(this.rng() * RECIPES.length)];
    return this.addTicket(recipe.id);
  }

  addTicket(recipeId, patienceScale = 1) {
    if (this.full) return null;
    const recipe = RECIPES.find((r) => r.id === recipeId);
    const ticket = {
      id: this.nextId++,
      recipe,
      patienceMax: recipe.patience * patienceScale,
      patienceLeft: recipe.patience * patienceScale,
    };
    this.tickets.push(ticket);
    return ticket;
  }

  // Advance every guest's patience. Returns the tickets that expired this
  // step (already removed from the board).
  update(dt) {
    const expired = [];
    for (const t of this.tickets) t.patienceLeft -= dt;
    for (let i = this.tickets.length - 1; i >= 0; i--) {
      if (this.tickets[i].patienceLeft <= 0) expired.push(this.tickets.splice(i, 1)[0]);
    }
    return expired;
  }

  remove(ticket) {
    const i = this.tickets.indexOf(ticket);
    if (i >= 0) this.tickets.splice(i, 1);
  }

  // The ticket a finished pizza would satisfy, preferring the guest who
  // has waited longest (lowest patience fraction).
  findFor(matchesFn) {
    let best = null;
    for (const t of this.tickets) {
      if (!matchesFn(t.recipe)) continue;
      if (!best || t.patienceLeft / t.patienceMax < best.patienceLeft / best.patienceMax) best = t;
    }
    return best;
  }
}

// Small deterministic PRNG so screenshot scenes are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
