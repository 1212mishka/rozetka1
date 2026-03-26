import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('phones.db');

export function createWishlistTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'phone',
      name TEXT,
      price INTEGER,
      old_price INTEGER,
      image TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id, product_type)
    );
  `);
}

export function addToWishlist(userId, product, productType = 'phone') {
  if (!userId) return { success: false, error: 'Не авторизований' };
  try {
    const stmt = db.prepareSync(
      'INSERT OR IGNORE INTO wishlist (user_id, product_id, product_type, name, price, old_price, image) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.executeSync([userId, product.id, productType, product.name, product.price, product.old_price ?? null, product.image]);
    stmt.finalizeSync();
    return { success: true };
  } catch (e) {
    console.error('addToWishlist error:', e);
    return { success: false, error: e.message };
  }
}

export function removeFromWishlist(userId, productId, productType = 'phone') {
  if (!userId) return;
  const stmt = db.prepareSync(
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ? AND product_type = ?'
  );
  stmt.executeSync([userId, productId, productType]);
  stmt.finalizeSync();
}

export function isInWishlist(userId, productId, productType = 'phone') {
  if (!userId) return false;
  const result = db.getAllSync(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ? AND product_type = ?',
    [userId, productId, productType]
  );
  return result.length > 0;
}

export function getWishlistItems(userId) {
  if (!userId) return [];
  return db.getAllSync(
    'SELECT * FROM wishlist WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
}