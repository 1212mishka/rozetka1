// ─── Модуль работы с корзиной в локальной базе SQLite ────────────────────────
// SQLite — это встроенная база данных прямо на телефоне (не требует интернета).
// Эта база хранит товары корзины даже после закрытия приложения.
//
// Таблица "cart" имеет следующие колонки:
//   id           — уникальный номер строки (автоматически увеличивается)
//   user_id      — id пользователя (чья корзина)
//   product_id   — id товара
//   product_type — тип товара ('phone', 'api' и т.д.)
//   name         — название товара (сохраняем, чтобы показать без повторного запроса)
//   price        — цена товара
//   image        — имя файла изображения
//   quantity     — количество единиц (по умолчанию 1)
//   UNIQUE(user_id, product_id, product_type) — один и тот же товар не может быть
//                                               добавлен дважды (вместо этого увеличивается quantity)

// expo-sqlite — библиотека для работы с SQLite в React Native / Expo
import * as SQLite from 'expo-sqlite';

// Открываем (или создаём если не существует) базу данных в файле 'phones.db'
const db = SQLite.openDatabaseSync('phones.db');

// ─── Создание таблицы корзины ─────────────────────────────────────────────────
// CREATE TABLE IF NOT EXISTS — SQL-команда: "Создай таблицу, если она ещё не существует"
// Вызывается при каждом запуске экранов — безопасно, т.к. IF NOT EXISTS не перезаписывает
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

// ─── Добавить товар в корзину ───────────────────────────────────────────────
// userId      — id текущего пользователя
// product     — объект с полями: id, name, price, image
// productType — тип товара ('api' для товаров с сервера)
//
// Логика:
//   - Если товар уже есть в корзине этого пользователя → увеличиваем quantity на 1
//   - Если товара нет → добавляем новую строку
export function addToCart(userId, product, productType = 'phone') {
  // Защита: если userId не передали — возвращаем ошибку
  if (!userId) {
    console.error('addToCart: userId is undefined!');
    return { success: false, error: 'Пользователь не авторизован' };
  }
  try {
    // Проверяем: есть ли уже этот товар в корзине этого пользователя?
    // getAllSync — синхронный SQL-запрос (ждём ответа сразу)
    // ? — плейсхолдер для значений (защита от SQL-инъекций)
    const existing = db.getAllSync(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND product_type = ?',
      [userId, product.id, productType]
    );

    if (existing.length > 0) {
      // Товар уже есть — увеличиваем количество на 1 вместо дублирования
      // prepareSync — подготовленный SQL-запрос (эффективнее при повторных вызовах)
      const stmt = db.prepareSync(
        'UPDATE cart SET quantity = quantity + 1 WHERE user_id = ? AND product_id = ? AND product_type = ?'
      );
      stmt.executeSync([userId, product.id, productType]);
      stmt.finalizeSync(); // Освобождаем ресурсы после выполнения
    } else {
      // Товара нет — вставляем новую строку в таблицу
      const stmt = db.prepareSync(
        'INSERT INTO cart (user_id, product_id, product_type, name, price, image, offerId) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      stmt.executeSync([userId, product.id, productType, product.name, product.price, product.image, product.offerId || null]);
      stmt.finalizeSync();
    }
    return { success: true };
  } catch (e) {
    console.error('addToCart error:', e);
    return { success: false, error: e.message };
  }
}

// ─── Получить все товары корзины пользователя ────────────────────────────────
// Возвращает массив строк таблицы cart для конкретного userId
// ORDER BY id DESC — новейшие товары показываются первыми
export function getCartItems(userId) {
  if (!userId) {
    console.warn('getCartItems: userId is undefined, returning []');
    return [];
  }
  return db.getAllSync(
    'SELECT * FROM cart WHERE user_id = ? ORDER BY id DESC',
    [userId]
  );
}

// ─── Изменить количество товара ────────────────────────────────────────────
// cartItemId — id строки в таблице cart (не id товара!)
// quantity   — новое количество
// Если quantity <= 0 — удаляем товар полностью
export function updateCartQuantity(cartItemId, quantity) {
  if (quantity <= 0) {
    removeFromCart(cartItemId);
    return;
  }
  const stmt = db.prepareSync('UPDATE cart SET quantity = ? WHERE id = ?');
  stmt.executeSync([quantity, cartItemId]);
  stmt.finalizeSync();
}

// ─── Удалить один товар из корзины ─────────────────────────────────────────
// cartItemId — id строки в таблице cart (уникальный номер записи)
export function removeFromCart(cartItemId) {
  const stmt = db.prepareSync('DELETE FROM cart WHERE id = ?');
  stmt.executeSync([cartItemId]);
  stmt.finalizeSync();
}

// ─── Очистить всю корзину пользователя ─────────────────────────────────────
// Удаляет все товары для конкретного userId
export function clearCart(userId) {
  if (!userId) return;
  const stmt = db.prepareSync('DELETE FROM cart WHERE user_id = ?');
  stmt.executeSync([userId]);
  stmt.finalizeSync();
}

// ─── Получить общее количество товаров в корзине ───────────────────────────
// SUM(quantity) — SQL-функция: суммирует столбец quantity для всех строк
// Возвращает число (например: 5 если есть 3 телефона + 2 ноутбука)
export function getCartCount(userId) {
  if (!userId) return 0;
  const result = db.getAllSync(
    'SELECT SUM(quantity) as total FROM cart WHERE user_id = ?',
    [userId]
  );
  // result[0]?.total — берём первую (и единственную) строку результата, поле total
  // || 0 — если корзина пустая, SUM вернёт null → заменяем на 0
  return result[0]?.total || 0;
}
