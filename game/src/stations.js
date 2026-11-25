// FORNO A LEGNA — cooking stations. The wood-fired oven is the heart of
// the kitchen: a pizza goes in raw and the pizzaiolo watches the crust
// meter, pulling it out in the golden window before the fire takes it.

// Seconds a pizza needs in the oven to reach the start of the golden
// window; the crust meter is progress relative to this.
export const BAKE_SECONDS = 6.5;

// Crust quality bands, as oven progress fractions.
//   < PERFECT_FROM  -> pale (servable, no bonus)
//   golden window   -> perfect (bonus coins + tip)
//   > BURNT_FROM    -> burnt (unservable, bin it)
export const PERFECT_FROM = 0.88;
export const PERFECT_TO = 1.12;
export const BURNT_FROM = 1.3;

export function qualityFor(progress) {
  if (progress >= BURNT_FROM) return 'burnt';
  if (progress >= PERFECT_FROM && progress <= PERFECT_TO) return 'perfect';
  if (progress > PERFECT_TO) return 'dark';
  return 'pale';
}

export class Oven {
  constructor() {
    this.pizza = null; // { ingredients: [...ids] } while baking
    this.progress = 0; // 0..~1.5 of BAKE_SECONDS
  }

  get busy() {
    return this.pizza !== null;
  }

  get quality() {
    return this.busy ? qualityFor(this.progress) : null;
  }

  load(ingredients) {
    if (this.busy || !ingredients || ingredients.length === 0) return false;
    this.pizza = { ingredients: [...ingredients] };
    this.progress = 0;
    return true;
  }

  update(dt) {
    if (this.busy) this.progress += dt / BAKE_SECONDS;
  }

  // Pull the pizza out. Returns { ingredients, quality } or null.
  pullOut() {
    if (!this.busy) return null;
    const done = { ingredients: this.pizza.ingredients, quality: this.quality };
    this.pizza = null;
    this.progress = 0;
    return done;
  }
}

// The assembly board: one pizza being built, ingredient by ingredient.
export class AssemblyPlate {
  constructor() {
    this.ingredients = [];
  }

  get empty() {
    return this.ingredients.length === 0;
  }

  get hasDough() {
    return this.ingredients.includes('dough');
  }

  // Dough must go down first; nothing may be added twice.
  add(id) {
    if (this.ingredients.includes(id)) return false;
    if (id !== 'dough' && !this.hasDough) return false;
    this.ingredients.push(id);
    return true;
  }

  clear() {
    this.ingredients = [];
  }

  take() {
    const taken = this.ingredients;
    this.ingredients = [];
    return taken;
  }
}
