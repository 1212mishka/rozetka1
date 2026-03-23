import * as SQLite from 'expo-sqlite';
 
const db = SQLite.openDatabaseSync('phones.db');
 
// Создаём таблицу корзины (связь user -> много товаров)
export function createCartTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_type TEXT NOT NULL DEFAULT 'phone',
      name TEXT,
      price INTEGER,
      image TEXT,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id, product_type)
    );
  `);
}
 
// Добавить товар в корзину (если уже есть — увеличить quantity)
export function addToCart(userId, product, productType = 'phone') {
  try {
    const existing = db.getAllSync(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND product_type = ?',
      [userId, product.id, productType]
    );
    if (existing.length > 0) {
      db.execSync(
        `UPDATE cart SET quantity = quantity + 1 WHERE user_id = ${userId} AND product_id = ${product.id} AND product_type = '${productType}'`
      );
    } else {
      const stmt = db.prepareSync(
        'INSERT INTO cart (user_id, product_id, product_type, name, price, image) VALUES (?, ?, ?, ?, ?, ?)'
      );
      stmt.executeSync([userId, product.id, productType, product.name, product.price, product.image]);
      stmt.finalizeSync();
    }
    return { success: true };
  } catch (e) {
    console.error('addToCart error:', e);
    return { success: false, error: e.message };
  }
}
 
// Получить корзину пользователя
export function getCartItems(userId) {
  return db.getAllSync(
    'SELECT * FROM cart WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
}
 
// Изменить количество
export function updateCartQuantity(cartItemId, quantity) {
  if (quantity <= 0) {
    removeFromCart(cartItemId);
    return;
  }
  db.execSync(`UPDATE cart SET quantity = ${quantity} WHERE id = ${cartItemId}`);
}
 
// Удалить товар из корзины
export function removeFromCart(cartItemId) {
  db.execSync(`DELETE FROM cart WHERE id = ${cartItemId}`);
}
 
// Очистить корзину пользователя
export function clearCart(userId) {
  db.execSync(`DELETE FROM cart WHERE user_id = ${userId}`);
}
 
// Количество товаров в корзине (для бейджа)
export function getCartCount(userId) {
  const result = db.getAllSync(
    'SELECT SUM(quantity) as total FROM cart WHERE user_id = ?',
    [userId]
  );
  return result[0]?.total || 0;
}
 