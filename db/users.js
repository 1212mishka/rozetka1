import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('phones.db');

export function createUsersTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT
    );
  `);
}

export function registerUser(name, email, password) {
  try {
    const statement = db.prepareSync(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?);'
    );
    statement.executeSync([name, email, password]);
    statement.finalizeSync();
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Користувач з таким email вже існує' };
  }
}

export function loginUser(email, password) {
  const result = db.getAllSync(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password]
  );
  if (result.length > 0) {
    return { success: true, user: result[0] };
  }
  return { success: false, error: 'Невірний email або пароль' };
}

// Получить всех пользователей
export function getUsers() {
  return db.getAllSync('SELECT id, name, email FROM users ORDER BY id DESC;');
}

// Удалить пользователя по ID
export function deleteUser(id) {
  db.execSync(`DELETE FROM users WHERE id = ${id};`);
}