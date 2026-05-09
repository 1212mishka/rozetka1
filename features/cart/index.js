import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('phones.db');

export function createCartTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'phone',
      name TEXT,
      price REAL,
      image TEXT,
      offerId TEXT,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id, product_type)
    );
  `);
  try { db.execSync('ALTER TABLE cart ADD COLUMN offerId TEXT'); } catch {}
}

export function addToCart(userId, product, productType = 'phone') {
  if (!userId) return { success: false, error: 'Користувач не авторизований' };
  try {
    const existing = db.getAllSync(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND product_type = ?',
      [userId, product.id, productType]
    );
    if (existing.length > 0) {
      const stmt = db.prepareSync(
        'UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ? AND product_type = ?'
      );
      stmt.executeSync([userId, product.id, productType]);
      stmt.finalizeSync();
    } else {
      const stmt = db.prepareSync(
        'INSERT INTO cart (user_id, product_id, product_type, name, price, image, offerId) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.executeSync([userId, product.id, productType, product.name, product.price, product.image, product.offerId || null]);
      stmt.finalizeSync();
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export function getCartItems(userId) {
  if (!userId) return [];
  return db.getAllSync('SELECT * FROM cart WHERE user_id = ? ORDER BY id DESC', [userId]);
}

export function updateCartQuantity(cartItemId, quantity) {
  if (quantity <= 0) { removeFromCart(cartItemId); return; }
  const stmt = db.prepareSync('UPDATE cart SET quantity = ? WHERE id = ?');
  stmt.executeSync([quantity, cartItemId]);
  stmt.finalizeSync();
}

export function removeFromCart(cartItemId) {
  const stmt = db.prepareSync('DELETE FROM cart WHERE id = ?');
  stmt.executeSync([cartItemId]);
  stmt.finalizeSync();
}

export function clearCart(userId) {
  if (!userId) return;
  const stmt = db.prepareSync('DELETE FROM cart WHERE user_id = ?');
  stmt.executeSync([userId]);
  stmt.finalizeSync();
}

export function getCartCount(userId) {
  if (!userId) return 0;
  const result = db.getAllSync('SELECT SUM(quantity) as total FROM cart WHERE user_id = ?', [userId]);
  return result[0]?.total || 0;
}
