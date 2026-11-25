// FORNO A LEGNA — menu data: ingredients on the counter and the Neapolitan
// pizza recipes the kitchen serves. Pure data, no logic.

// Every ingredient a pizzaiolo can grab from the counter bins, in bin order.
// `kind` tells the renderer how to draw it on a pizza; `prep` is the short
// verb shown in the bin label.
export const INGREDIENTS = [
  { id: 'dough',     name: 'Dough',     short: 'DOUGH', kind: 'base',    color: '#f2dfae' },
  { id: 'sauce',     name: 'Tomato',    short: 'SAUCE', kind: 'spread',  color: '#c63a24' },
  { id: 'mozzarella',name: 'Mozzarella',short: 'MOZZA', kind: 'cheese',  color: '#fdf6da' },
  { id: 'basil',     name: 'Basil',     short: 'BASIL', kind: 'leaf',    color: '#3f7d2c' },
  { id: 'pepperoni', name: 'Pepperoni', short: 'PEPPE', kind: 'disc',    color: '#a52a20' },
  { id: 'mushroom',  name: 'Mushroom',  short: 'FUNGI', kind: 'slice',   color: '#cbb59a' },
  { id: 'ham',       name: 'Ham',       short: 'HAM',   kind: 'strip',   color: '#e58aa0' },
  { id: 'peppers',   name: 'Peppers',   short: 'PEPER', kind: 'ring',    color: '#4d9b47' },
  { id: 'onion',     name: 'Onion',     short: 'ONION', kind: 'ring',    color: '#d9c6e8' },
  { id: 'oil',       name: 'Olive Oil', short: 'OIL',   kind: 'drizzle', color: '#d9a92b' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// The menu. `ingredients` is the exact set a ticket demands (dough first,
// the rest in the order the pizzaiolo should lay them). `patience` is how
// many seconds the guest waits before walking out. `price` is base coins.
export const RECIPES = [
  { id: 'margherita',  name: 'Margherita',  ingredients: ['dough', 'sauce', 'mozzarella', 'basil'],              price: 12, patience: 58 },
  { id: 'napoletana',  name: 'Napoletana',  ingredients: ['dough', 'sauce', 'mozzarella', 'basil', 'oil'],       price: 14, patience: 62 },
  { id: 'diavola',     name: 'Diavola',     ingredients: ['dough', 'sauce', 'mozzarella', 'pepperoni', 'onion'], price: 16, patience: 66 },
  { id: 'funghi',      name: 'Funghi',      ingredients: ['dough', 'sauce', 'mozzarella', 'mushroom', 'ham'],    price: 16, patience: 66 },
  { id: 'capricciosa', name: 'Capricciosa', ingredients: ['dough', 'sauce', 'mozzarella', 'ham', 'mushroom', 'peppers'], price: 19, patience: 74 },
  { id: 'prosciutto',  name: 'Prosciutto',  ingredients: ['dough', 'sauce', 'mozzarella', 'ham', 'basil'],       price: 17, patience: 68 },
  { id: 'ortolana',    name: 'Ortolana',    ingredients: ['dough', 'sauce', 'mozzarella', 'peppers', 'onion', 'oil'], price: 18, patience: 72 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// True when a built pizza (list of ingredient ids) is exactly a recipe.
export function matchesRecipe(ingredientIds, recipe) {
  if (ingredientIds.length !== recipe.ingredients.length) return false;
  const sorted = [...ingredientIds].sort();
  const want = [...recipe.ingredients].sort();
  return sorted.every((id, i) => id === want[i]);
}
