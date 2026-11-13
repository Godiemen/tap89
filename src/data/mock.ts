import { Category, Customer, Driver, Product, Promo, Store } from '../lib/types';

// ---------- Stores ----------

export const STORES: Store[] = [
  { id: 's1', name: 'The Whiskey Barrel', emoji: '🥃', categories: ['spirits', 'wine'], rating: 4.8, ratingCount: 1240, deliveryTimeMin: 15, deliveryTimeMax: 30, deliveryFee: 2.99, minOrder: 15, distanceKm: 1.2, address: '88 Bourbon Ave', open: true, approved: true, featured: true, promo: 'Free delivery', pos: { x: 24, y: 30 }, busyLevel: 1 },
  { id: 's2', name: 'Vino & Vine', emoji: '🍷', categories: ['wine'], rating: 4.9, ratingCount: 860, deliveryTimeMin: 20, deliveryTimeMax: 35, deliveryFee: 3.49, minOrder: 20, distanceKm: 2.1, address: '14 Merlot Lane', open: true, approved: true, featured: true, pos: { x: 68, y: 22 }, busyLevel: 0 },
  { id: 's3', name: 'Hops & Crafts Beer Co.', emoji: '🍺', categories: ['beer', 'snacks'], rating: 4.6, ratingCount: 2100, deliveryTimeMin: 10, deliveryTimeMax: 25, deliveryFee: 1.99, minOrder: 10, distanceKm: 0.8, address: '301 IPA Blvd', open: true, approved: true, promo: '20% off beer', pos: { x: 42, y: 55 }, busyLevel: 2 },
  { id: 's4', name: 'Liquor Express 24/7', emoji: '🏪', categories: ['beer', 'wine', 'spirits', 'mixers', 'snacks', 'extras'], rating: 4.3, ratingCount: 3400, deliveryTimeMin: 15, deliveryTimeMax: 40, deliveryFee: 4.99, minOrder: 12, distanceKm: 3.4, address: '7 Midnight Rd', open: true, approved: true, pos: { x: 80, y: 60 }, busyLevel: 1 },
  { id: 's5', name: 'Tequila Sunrise Shop', emoji: '🌵', categories: ['spirits', 'mixers'], rating: 4.7, ratingCount: 540, deliveryTimeMin: 25, deliveryTimeMax: 40, deliveryFee: 3.99, minOrder: 18, distanceKm: 2.8, address: '55 Agave St', open: true, approved: true, pos: { x: 15, y: 72 }, busyLevel: 0 },
  { id: 's6', name: 'Craft Cellar', emoji: '🍾', categories: ['wine', 'spirits'], rating: 4.9, ratingCount: 420, deliveryTimeMin: 30, deliveryTimeMax: 45, deliveryFee: 5.99, minOrder: 30, distanceKm: 4.2, address: '9 Champagne Ct', open: true, approved: true, featured: true, promo: 'Free gift wrap', pos: { x: 55, y: 80 }, busyLevel: 0 },
  { id: 's7', name: 'QuickSix Bottle Shop', emoji: '🧃', categories: ['beer', 'mixers', 'snacks', 'extras'], rating: 4.1, ratingCount: 1780, deliveryTimeMin: 10, deliveryTimeMax: 20, deliveryFee: 0.99, minOrder: 8, distanceKm: 0.5, address: '120 Corner St', open: true, approved: true, pos: { x: 35, y: 15 }, busyLevel: 1 },
  { id: 's8', name: 'Rum Runner Depot', emoji: '🏴‍☠️', categories: ['spirits', 'mixers'], rating: 4.5, ratingCount: 390, deliveryTimeMin: 20, deliveryTimeMax: 35, deliveryFee: 2.49, minOrder: 15, distanceKm: 2.0, address: '77 Pirate Way', open: false, approved: true, pos: { x: 88, y: 40 }, busyLevel: 0 },
  { id: 's9', name: 'Gin & Juice Emporium', emoji: '🍸', categories: ['spirits', 'mixers', 'extras'], rating: 4.7, ratingCount: 650, deliveryTimeMin: 15, deliveryTimeMax: 30, deliveryFee: 2.99, minOrder: 20, distanceKm: 1.6, address: '33 Juniper Ave', open: true, approved: true, pos: { x: 60, y: 42 }, busyLevel: 1 },
  { id: 's10', name: 'BoxWine Bonanza', emoji: '📦', categories: ['wine', 'snacks'], rating: 4.2, ratingCount: 230, deliveryTimeMin: 25, deliveryTimeMax: 45, deliveryFee: 1.49, minOrder: 10, distanceKm: 3.9, address: '210 Cardboard Dr', open: true, approved: false, pos: { x: 8, y: 48 }, busyLevel: 0 },
];

// ---------- Products ----------

type P = Omit<Product, 'id' | 'storeId' | 'available'> & { price: number };

const beer: P[] = [
  { name: 'IPA 6-Pack', brand: 'Hazy Trails', category: 'beer', size: '6 × 355ml', abv: 6.5, price: 12.99, image: '🍺', description: 'Citrus-forward hazy IPA with notes of mango and pine.', tags: ['craft', 'ipa', 'local'], popular: true },
  { name: 'Lager 12-Pack', brand: 'Goldfield', category: 'beer', size: '12 × 330ml', abv: 4.8, price: 16.99, image: '🍺', description: 'Crisp, clean lager. The crowd-pleaser.', tags: ['lager', 'party'] },
  { name: 'Stout 4-Pack', brand: 'Midnight Malt', category: 'beer', size: '4 × 440ml', abv: 7.2, price: 11.49, image: '🍺', description: 'Rich roasted stout with coffee and dark chocolate.', tags: ['stout', 'dark'] },
  { name: 'Sour Variety Pack', brand: 'Pucker Up', category: 'beer', size: '8 × 355ml', abv: 5.0, price: 19.99, image: '🍺', description: 'Rotating fruity sours: raspberry, yuzu, passionfruit.', tags: ['sour', 'variety'], popular: true },
  { name: 'Wheat Beer 6-Pack', brand: 'Sunfield', category: 'beer', size: '6 × 330ml', abv: 5.2, price: 10.99, image: '🍺', description: 'Light and refreshing Belgian-style witbier.', tags: ['wheat'] },
  { name: 'Non-Alc Lager 6-Pack', brand: 'ZeroProof', category: 'beer', size: '6 × 330ml', abv: 0.0, price: 9.99, image: '🍺', description: 'All the taste, none of the buzz.', tags: ['non-alcoholic'] },
];

const wine: P[] = [
  { name: 'Cabernet Sauvignon', brand: 'Red Ridge', category: 'wine', size: '750ml', abv: 13.5, price: 18.99, image: '🍷', description: 'Bold Napa-style cab with blackberry and oak.', tags: ['red', 'dry'], popular: true },
  { name: 'Pinot Grigio', brand: 'Costa Verde', category: 'wine', size: '750ml', abv: 12.0, price: 14.99, image: '🥂', description: 'Crisp Italian-style white with green apple and citrus.', tags: ['white', 'dry'] },
  { name: 'Rosé', brand: 'Provence Pale', category: 'wine', size: '750ml', abv: 12.5, price: 16.99, image: '🍷', description: 'Dry Provence rosé — strawberry, peach, sunshine.', tags: ['rosé'], popular: true },
  { name: 'Prosecco', brand: 'Bolla Festa', category: 'wine', size: '750ml', abv: 11.0, price: 15.99, image: '🍾', description: 'Bubbly and festive. Pear, white flowers, celebration.', tags: ['sparkling', 'bubbly'] },
  { name: 'Malbec', brand: 'Andes Alto', category: 'wine', size: '750ml', abv: 13.8, price: 17.49, image: '🍷', description: 'Argentinian malbec — plum, violet, soft tannins.', tags: ['red'] },
  { name: 'Champagne Brut', brand: 'Maison Doré', category: 'wine', size: '750ml', abv: 12.0, price: 49.99, image: '🍾', description: 'Real-deal brut champagne for real-deal occasions.', tags: ['sparkling', 'premium'] },
  { name: 'Sauvignon Blanc', brand: 'Kiwi Coast', category: 'wine', size: '750ml', abv: 12.5, price: 13.99, image: '🥂', description: 'Marlborough-style sav blanc — grassy, tropical, zippy.', tags: ['white'] },
];

const spirits: P[] = [
  { name: 'Bourbon Whiskey', brand: 'Oak & Ember', category: 'spirits', size: '750ml', abv: 45, price: 34.99, image: '🥃', description: 'Small-batch bourbon — vanilla, caramel, charred oak.', tags: ['whiskey', 'bourbon'], popular: true },
  { name: 'London Dry Gin', brand: 'Juniper & Sons', category: 'spirits', size: '750ml', abv: 40, price: 27.99, image: '🍸', description: 'Classic juniper-led gin, born for G&Ts.', tags: ['gin'] },
  { name: 'Reposado Tequila', brand: 'Agave Alta', category: 'spirits', size: '750ml', abv: 40, price: 39.99, image: '🌵', description: '8 months in oak — smooth agave with a warm finish.', tags: ['tequila'], popular: true },
  { name: 'Vodka', brand: 'Glacier Pure', category: 'spirits', size: '1L', abv: 40, price: 24.99, image: '🧊', description: 'Six-times distilled, glacier-water smooth.', tags: ['vodka'] },
  { name: 'Spiced Rum', brand: 'Captain Tide', category: 'spirits', size: '750ml', abv: 35, price: 22.99, image: '🏴‍☠️', description: 'Caribbean rum with vanilla, cinnamon, and mischief.', tags: ['rum'] },
  { name: 'Single Malt Scotch', brand: 'Highland Mist 12', category: 'spirits', size: '700ml', abv: 43, price: 59.99, image: '🥃', description: '12-year Speyside — honey, orchard fruit, gentle smoke.', tags: ['whiskey', 'scotch', 'premium'] },
  { name: 'Coffee Liqueur', brand: 'Nero Notte', category: 'spirits', size: '700ml', abv: 20, price: 21.99, image: '☕', description: 'Espresso martinis, solved.', tags: ['liqueur'] },
  { name: 'Aperitivo Bitter', brand: 'Arancia', category: 'spirits', size: '700ml', abv: 11, price: 19.99, image: '🍊', description: 'Spritz o\'clock. Bitter orange aperitivo.', tags: ['aperitif', 'spritz'] },
];

const mixers: P[] = [
  { name: 'Tonic Water 4-Pack', brand: 'Fever Pitch', category: 'mixers', size: '4 × 200ml', price: 6.99, image: '🫧', description: 'Premium Indian tonic with quinine bite.', tags: ['tonic', 'mixer'] },
  { name: 'Ginger Beer 6-Pack', brand: 'Mule Kick', category: 'mixers', size: '6 × 330ml', price: 8.99, image: '🫚', description: 'Spicy ginger beer for proper mules.', tags: ['ginger', 'mixer'], popular: true },
  { name: 'Cola 2L', brand: 'Classic Fizz', category: 'mixers', size: '2L', price: 3.49, image: '🥤', description: 'The universal mixer.', tags: ['cola'] },
  { name: 'Fresh Lime Juice', brand: 'Squeeze', category: 'mixers', size: '500ml', price: 4.99, image: '🍋', description: 'Cold-pressed lime juice for margaritas.', tags: ['citrus'] },
  { name: 'Margarita Mix', brand: 'Rim Salt Co.', category: 'mixers', size: '1L', price: 7.99, image: '🍹', description: 'Just add tequila. Salt rim included on the label.', tags: ['margarita'] },
  { name: 'Club Soda 8-Pack', brand: 'Bubble Up', category: 'mixers', size: '8 × 355ml', price: 5.99, image: '💧', description: 'Zero-calorie sparkle.', tags: ['soda'] },
];

const snacks: P[] = [
  { name: 'Salted Peanuts', brand: 'Bar Bowl', category: 'snacks', size: '300g', price: 4.49, image: '🥜', description: 'Classic bar snack, perfectly salted.', tags: ['nuts'] },
  { name: 'Tortilla Chips + Salsa', brand: 'Dip Duo', category: 'snacks', size: '400g + 300ml', price: 7.99, image: '🌮', description: 'Party in a bag (and a jar).', tags: ['chips', 'salsa'], popular: true },
  { name: 'Pretzel Mix', brand: 'Twisted', category: 'snacks', size: '250g', price: 3.99, image: '🥨', description: 'Beer\'s best friend.', tags: ['pretzel'] },
  { name: 'Dark Chocolate Bar', brand: 'Cacao Noir', category: 'snacks', size: '100g', price: 4.99, image: '🍫', description: '70% dark — pairs with red wine beautifully.', tags: ['chocolate'] },
];

const extras: P[] = [
  { name: 'Ice Bag 5kg', brand: 'Chill Co.', category: 'extras', size: '5kg', price: 4.99, image: '🧊', description: 'Party-grade ice, delivered cold.', tags: ['ice'], popular: true },
  { name: 'Cocktail Shaker Set', brand: 'Home Bar', category: 'extras', size: '3-piece', price: 24.99, image: '🍸', description: 'Shaker, jigger, strainer — instant bartender.', tags: ['tools'] },
  { name: 'Solo Cups 50-Pack', brand: 'Party Basics', category: 'extras', size: '50 cups', price: 6.99, image: '🥤', description: 'You know what these are for.', tags: ['cups', 'party'] },
  { name: 'Bottle Opener', brand: 'Pop', category: 'extras', size: '1 unit', price: 3.99, image: '🔑', description: 'Emergency essential.', tags: ['tools'] },
];

const STORE_PRODUCTS: Record<string, P[]> = {
  s1: [...spirits, ...wine.slice(0, 4), ...mixers.slice(0, 2), ...extras.slice(0, 1)],
  s2: [...wine, ...mixers.slice(0, 1), ...snacks.slice(3, 4)],
  s3: [...beer, ...snacks, ...extras.slice(2, 4)],
  s4: [...beer, ...wine, ...spirits, ...mixers, ...snacks, ...extras],
  s5: [...spirits.slice(2, 3), ...spirits.slice(4, 5), ...spirits.slice(7, 8), ...mixers],
  s6: [...wine, ...spirits.slice(0, 1), ...spirits.slice(5, 6), ...extras.slice(0, 2)],
  s7: [...beer, ...mixers, ...snacks, ...extras],
  s8: [...spirits.slice(4, 5), ...spirits.slice(6, 7), ...mixers.slice(1, 3)],
  s9: [...spirits.slice(1, 2), ...spirits.slice(6, 8), ...mixers.slice(0, 4), ...extras],
  s10: [...wine.slice(2, 5), ...snacks],
};

export const PRODUCTS: Product[] = Object.entries(STORE_PRODUCTS).flatMap(
  ([storeId, list]) =>
    list.map((p, i) => ({
      ...p,
      id: `${storeId}-p${i}`,
      storeId,
      available: Math.random() > 0.06,
    }))
);

// ---------- Drivers ----------

export const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Marcus Chen', vehicle: 'Toyota Corolla', plate: 'SDX-4821', rating: 4.9, trips: 3120, online: true, verified: true, pos: { x: 30, y: 40 }, avatarColor: '#06C167' },
  { id: 'd2', name: 'Aisha Bello', vehicle: 'Honda Civic', plate: 'SDX-1193', rating: 4.8, trips: 2210, online: true, verified: true, pos: { x: 62, y: 35 }, avatarColor: '#735BF2' },
  { id: 'd3', name: 'Diego Ramirez', vehicle: 'Ford Focus', plate: 'SDX-7754', rating: 4.7, trips: 1840, online: true, verified: true, pos: { x: 48, y: 68 }, avatarColor: '#F5A623' },
  { id: 'd4', name: 'Emma Kowalski', vehicle: 'Vespa Sprint', plate: 'SDX-3302', rating: 4.9, trips: 950, online: true, verified: true, pos: { x: 74, y: 52 }, avatarColor: '#E23744' },
  { id: 'd5', name: 'Liam O\'Brien', vehicle: 'Mazda 3', plate: 'SDX-9012', rating: 4.6, trips: 2670, online: false, verified: true, pos: { x: 20, y: 60 }, avatarColor: '#276EF1' },
  { id: 'd6', name: 'Priya Nair', vehicle: 'Hyundai i30', plate: 'SDX-5567', rating: 4.8, trips: 1430, online: true, verified: false, pos: { x: 40, y: 25 }, avatarColor: '#0E9FBA' },
];

// ---------- Customers ----------

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Jordan Blake', email: 'jordan.b@mail.com', phone: '+1 555-0132', ageVerified: true, orders: 34, spent: 1240.5, joined: '2024-02-11', status: 'active' },
  { id: 'c2', name: 'Sam Whitfield', email: 'sam.w@mail.com', phone: '+1 555-0117', ageVerified: true, orders: 18, spent: 640.2, joined: '2024-06-03', status: 'active' },
  { id: 'c3', name: 'Riley Torres', email: 'riley.t@mail.com', phone: '+1 555-0189', ageVerified: true, orders: 52, spent: 2980.0, joined: '2023-11-20', status: 'active' },
  { id: 'c4', name: 'Casey Nguyen', email: 'casey.n@mail.com', phone: '+1 555-0145', ageVerified: false, orders: 2, spent: 58.4, joined: '2026-10-01', status: 'active' },
  { id: 'c5', name: 'Morgan Hale', email: 'morgan.h@mail.com', phone: '+1 555-0170', ageVerified: true, orders: 9, spent: 312.75, joined: '2025-04-15', status: 'suspended' },
];

// ---------- Promos ----------

export const PROMOS: Promo[] = [
  { code: 'FIRSTSIP', description: '25% off your first order', type: 'percent', value: 25, minSubtotal: 20, active: true, uses: 418 },
  { code: 'FREEDEL', description: 'Free delivery on orders R30+', type: 'free_delivery', value: 0, minSubtotal: 30, active: true, uses: 1204 },
  { code: 'FRIDAY5', description: 'R5 off Friday nights', type: 'flat', value: 5, minSubtotal: 25, active: true, uses: 233 },
  { code: 'WINE10', description: '10% off all wine', type: 'percent', value: 10, minSubtotal: 0, active: false, uses: 89 },
];

// ---------- Misc ----------

export const CATEGORIES: { key: Category | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'beer', label: 'Beer', emoji: '🍺' },
  { key: 'wine', label: 'Wine', emoji: '🍷' },
  { key: 'spirits', label: 'Spirits', emoji: '🥃' },
  { key: 'mixers', label: 'Mixers', emoji: '🫧' },
  { key: 'snacks', label: 'Snacks', emoji: '🥜' },
  { key: 'extras', label: 'Extras', emoji: '🧊' },
];

export const USER_POS = { x: 50, y: 50 };
export const USER_ADDRESS = '742 Evergreen Terrace, Apt 4B';

export const FAKE_NAMES = [
  'Alex Morgan', 'Jamie Fox', 'Taylor Reed', 'Drew Kim', 'Robin Lane',
  'Quinn Park', 'Avery Stone', 'Charlie Day', 'Skyler Wu', 'Peyton Cole',
];

export const FAKE_STREETS = [
  '12 Maple Grove', '88 Sunset Blvd', '204 Birchwood Dr', '17 Harbor View',
  '301 Elm Circle', '56 Canyon Rd', '910 Lakeside Way', '44 Rosewood Ct',
];
