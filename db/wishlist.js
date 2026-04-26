// ─── Модуль работы со списком избранного (вишлист) в локальной базе SQLite ─────
// Хранит товары, которые пользователь добавил в "Избранное" (нажал на сердечко).
// Данные хранятся на телефоне — без интернета, мгновенно.
//
// Таблица "wishlist" имеет следующие колонки:
//   id           — уникальный номер строки (автоматически увеличивается)
//   user_id      — id пользователя (чьё избранное)
//   product_id   — id товара
//   product_type — тип товара ('api' для товаров с сервера)
//   name         — название товара
//   price        — текущая цена
//   old_price    — старая цена (если есть скидка)
//   image        — имя файла изображения для отображения
//   UNIQUE(user_id, product_id, product_type) — один и тот же товар не может быть
//                                               в избранном дважды у одного пользователя

import * as SQLite from 'expo-sqlite';

// Открываем ту же базу 'phones.db', где хранятся корзина и пользователи
const db = SQLite.openDatabaseSync('phones.db');

// ─── Создание таблицы избранного ─────────────────────────────────────────────
// Вызов безопасный — IF NOT EXISTS не перезаписывает таблицу если она уже есть
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

// ─── Добавить товар в избранное ──────────────────────────────────────────────
// userId      — id текущего пользователя
// product     — объект: { id, name, price, old_price, image }
// productType — тип ('api', 'phone' и т.д.)
//
// INSERT OR IGNORE — если товар уже есть в избранном (нарушается UNIQUE) — просто игнорируем,
// не выдаём ошибку. То есть повторное нажатие сердечка не дублирует запись.
export function addToWishlist(userId, product, productType = 'phone') {
  if (!userId) return { success: false, error: 'Не авторизован' };
  try {
    const stmt = db.prepareSync(
      'INSERT OR IGNORE INTO wishlist (user_id, product_id, product_type, name, price, old_price, image) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    // product.old_price ?? null — если old_price не передан, сохраняем null
    stmt.executeSync([userId, product.id, productType, product.name, product.price, product.old_price ?? null, product.image]);
    stmt.finalizeSync(); // Обязательно освобождаем подготовленный запрос
    return { success: true };
  } catch (e) {
    console.error('addToWishlist error:', e);
    return { success: false, error: e.message };
  }
}

// ─── Удалить товар из избранного ─────────────────────────────────────────────
// Удаляем по комбинации: userId + productId + productType
// (один и тот же productId может быть у разных типов)
export function removeFromWishlist(userId, productId, productType = 'phone') {
  if (!userId) return;
  const stmt = db.prepareSync(
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ? AND product_type = ?'
  );
  stmt.executeSync([userId, productId, productType]);
  stmt.finalizeSync();
}

// ─── Проверить, есть ли товар в избранном ────────────────────────────────────
// Возвращает true или false
// Используется чтобы решить: показывать заполненное или пустое сердечко
export function isInWishlist(userId, productId, productType = 'phone') {
  if (!userId) return false;
  const result = db.getAllSync(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ? AND product_type = ?',
    [userId, productId, productType]
  );
  // Если найдена хотя бы одна строка — товар есть в избранном
  return result.length > 0;
}

// ─── Получить все товары из списка избранного ─────────────────────────────────
// Возвращает массив строк таблицы wishlist для конкретного userId
// ORDER BY id DESC — недавно добавленные показываются первыми
export function getWishlistItems(userId) {
  if (!userId) return [];
  return db.getAllSync(
    'SELECT * FROM wishlist WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
}
