import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('phones.db');

export function createCategoriesTable() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT,
      image TEXT
    );
  `);
}

export function categoryExists(label) {
  const result = db.getAllSync('SELECT id FROM categories WHERE label = ?', [label]);
  return result.length > 0;
}

export function addCategory(c) {
  const statement = db.prepareSync(
    'INSERT INTO categories (label, image) VALUES (?, ?);'
  );
  try {
    statement.executeSync([c.label, c.image]);
  } finally {
    statement.finalizeSync();
  }
}

export function updateCategory(c) {
  const statement = db.prepareSync(
    'UPDATE categories SET image = ? WHERE label = ?;'
  );
  try {
    statement.executeSync([c.image, c.label]);
  } finally {
    statement.finalizeSync();
  }
}

export function getCategories() {
  return db.getAllSync('SELECT * FROM categories');
}