// Server-side product list. Prices are taken from HERE (not from the browser),
// so nobody can change a price by editing the website.
// IMPORTANT: ids and prices must match the "products" list in public/script.js.
 const PRODUCTS = [
  { id: 1, name: "Royal Blue & Red Gopi Dress", price: 750 },
  { id: 2, name: "Sunset Pink Gopi Dress", price: 850 },
  { id: 3, name: "Magenta Floral Gopi Dress", price: 550 },
  { id: 4, name: "Green Gopi Dress", price: 600 },
  { id: 5, name: "Golden Yellow Gopi Dress", price: 450 }
];

const DELIVERY_CHARGE = Math.max(0, parseInt(process.env.DELIVERY_CHARGE || "0", 10) || 0);
module.exports = { PRODUCTS, DELIVERY_CHARGE };
